/**
 * Service Worker para Notificaciones Push
 * Sistema OLT Antel v2.0
 */

const CACHE_NAME = 'olt-antel-v2-notifications';
const NOTIFICATION_CACHE = 'notification-cache';

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('📱 Service Worker instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/favicon.ico'
            ]);
        })
    );
    
    self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
    console.log('📱 Service Worker activando...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== NOTIFICATION_CACHE) {
                        console.log('🧹 Limpiando cache obsoleto:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    self.clients.claim();
});

// Manejar mensajes push
self.addEventListener('push', (event) => {
    console.log('📨 Push recibido:', event);
    
    let notificationData = {
        title: 'Sistema OLT Antel',
        body: 'Nueva notificación del sistema',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'default',
        data: {}
    };
    
    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = {
                ...notificationData,
                ...payload
            };
        } catch (error) {
            console.error('Error parseando payload push:', error);
            notificationData.body = event.data.text() || notificationData.body;
        }
    }
    
    // Configurar opciones de notificación
    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: notificationData.priority === 'high',
        silent: notificationData.silent || false,
        vibrate: notificationData.vibrate || [200, 100, 200],
        actions: notificationData.actions || [
            {
                action: 'view',
                title: 'Ver Detalles',
                icon: '/favicon.ico'
            },
            {
                action: 'dismiss',
                title: 'Descartar'
            }
        ]
    };
    
    // Agregar imagen si existe
    if (notificationData.image) {
        options.image = notificationData.image;
    }
    
    event.waitUntil(
        // Mostrar notificación
        self.registration.showNotification(notificationData.title, options)
            .then(() => {
                // Guardar en cache para historial
                return caches.open(NOTIFICATION_CACHE).then((cache) => {
                    const notificationRecord = {
                        ...notificationData,
                        timestamp: Date.now(),
                        read: false
                    };
                    
                    return cache.put(
                        new Request(`/notifications/${notificationData.tag || Date.now()}`),
                        new Response(JSON.stringify(notificationRecord))
                    );
                });
            })
            .catch((error) => {
                console.error('Error mostrando notificación:', error);
            })
    );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Click en notificación:', event);
    
    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};
    
    // Cerrar la notificación
    notification.close();
    
    event.waitUntil(
        (async () => {
            // Obtener todos los clientes (ventanas/tabs)
            const clients = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });
            
            // Buscar una ventana existente
            let targetClient = null;
            for (const client of clients) {
                if (client.url.includes(self.location.origin)) {
                    targetClient = client;
                    break;
                }
            }
            
            // Procesar acción
            switch (action) {
                case 'view':
                    if (targetClient) {
                        // Enfocar ventana existente
                        await targetClient.focus();
                        
                        // Enviar mensaje para navegar a la sección específica
                        targetClient.postMessage({
                            type: 'NOTIFICATION_ACTION',
                            action: 'view',
                            data: data
                        });
                    } else {
                        // Abrir nueva ventana
                        await self.clients.openWindow(`/?notification=${data.id || ''}`);
                    }
                    break;
                    
                case 'dismiss':
                    // Marcar como leída en cache
                    await markNotificationAsRead(notification.tag);
                    break;
                    
                default:
                    // Click en el cuerpo de la notificación
                    if (targetClient) {
                        await targetClient.focus();
                        
                        targetClient.postMessage({
                            type: 'NOTIFICATION_CLICK',
                            data: data
                        });
                    } else {
                        await self.clients.openWindow(`/?notification=${data.id || ''}`);
                    }
                    break;
            }
            
            // Marcar como leída
            await markNotificationAsRead(notification.tag);
        })()
    );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
    console.log('❌ Notificación cerrada:', event.notification.tag);
    
    event.waitUntil(
        markNotificationAsRead(event.notification.tag)
    );
});

// Marcar notificación como leída
async function markNotificationAsRead(tag) {
    try {
        const cache = await caches.open(NOTIFICATION_CACHE);
        const request = new Request(`/notifications/${tag}`);
        const response = await cache.match(request);
        
        if (response) {
            const notification = await response.json();
            notification.read = true;
            notification.readAt = Date.now();
            
            await cache.put(request, new Response(JSON.stringify(notification)));
        }
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
    }
}

// Manejar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
    console.log('💬 Mensaje recibido en SW:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SHOW_NOTIFICATION':
            // Mostrar notificación desde la aplicación
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: data.icon || '/favicon.ico',
                tag: data.tag || 'app-notification',
                data: data.data || {}
            });
            break;
            
        case 'GET_NOTIFICATIONS':
            // Obtener historial de notificaciones
            getNotificationHistory().then((notifications) => {
                event.source.postMessage({
                    type: 'NOTIFICATIONS_RESPONSE',
                    notifications: notifications
                });
            });
            break;
            
        case 'CLEAR_NOTIFICATIONS':
            // Limpiar historial de notificaciones
            clearNotificationHistory().then(() => {
                event.source.postMessage({
                    type: 'NOTIFICATIONS_CLEARED'
                });
            });
            break;
    }
});

// Obtener historial de notificaciones
async function getNotificationHistory() {
    try {
        const cache = await caches.open(NOTIFICATION_CACHE);
        const requests = await cache.keys();
        const notifications = [];
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const notification = await response.json();
                notifications.push(notification);
            }
        }
        
        // Ordenar por timestamp descendente
        return notifications.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Error obteniendo historial de notificaciones:', error);
        return [];
    }
}

// Limpiar historial de notificaciones
async function clearNotificationHistory() {
    try {
        await caches.delete(NOTIFICATION_CACHE);
        await caches.open(NOTIFICATION_CACHE); // Recrear cache vacío
        console.log('🧹 Historial de notificaciones limpiado');
    } catch (error) {
        console.error('Error limpiando historial de notificaciones:', error);
    }
}

// Manejar sincronización en background
self.addEventListener('sync', (event) => {
    console.log('🔄 Sync en background:', event.tag);
    
    if (event.tag === 'background-sync-notifications') {
        event.waitUntil(
            syncNotifications()
        );
    }
});

// Sincronizar notificaciones en background
async function syncNotifications() {
    try {
        // Intentar obtener notificaciones pendientes del servidor
        const response = await fetch('/api/notifications/pending');
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.notifications && data.notifications.length > 0) {
                // Mostrar notificaciones pendientes
                for (const notification of data.notifications) {
                    await self.registration.showNotification(notification.title, {
                        body: notification.body,
                        icon: notification.icon || '/favicon.ico',
                        tag: notification.tag || `sync-${Date.now()}`,
                        data: notification.data || {}
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error en sincronización de notificaciones:', error);
    }
}

// Manejar actualizaciones del Service Worker
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Log de instalación exitosa
console.log('📱 Service Worker para notificaciones cargado correctamente');

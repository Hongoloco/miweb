// Service Worker - Notificaciones
// Extensión del Service Worker principal para manejo específico de notificaciones

// Manejar eventos de notificación push
self.addEventListener('push', (event) => {
    console.log('📨 Push notification recibida:', event);
    
    let notificationData = {
        title: 'Notificación del Sistema',
        body: 'Nueva actualización disponible',
        icon: '/icons/notification-icon-192.png',
        badge: '/icons/notification-badge-72.png',
        tag: 'default-notification',
        requireInteraction: false,
        actions: [],
        data: {}
    };
    
    try {
        if (event.data) {
            const pushData = event.data.json();
            notificationData = { ...notificationData, ...pushData };
        }
    } catch (error) {
        console.warn('⚠️ Error parseando datos push:', error);
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            actions: notificationData.actions,
            data: notificationData.data
        })
    );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notificación clickeada:', event.notification);
    
    event.notification.close();
    
    const notificationData = event.notification.data || {};
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Si ya hay una ventana abierta, enfocarla
                for (let client of clientList) {
                    if (client.url.includes(location.origin) && 'focus' in client) {
                        client.postMessage({
                            type: 'notification-click',
                            notification: event.notification,
                            data: notificationData
                        });
                        return client.focus();
                    }
                }
                
                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    const targetUrl = notificationData.url || '/';
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
    console.log('❌ Notificación cerrada:', event.notification);
    
    // Opcional: enviar analytics o limpiar datos
    const notificationData = event.notification.data || {};
    if (notificationData.trackClose) {
        // Enviar evento de cierre al servidor
        fetch('/api/notifications/closed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tag: event.notification.tag,
                timestamp: new Date().toISOString()
            })
        }).catch((error) => {
            console.warn('⚠️ Error reportando cierre de notificación:', error);
        });
    }
});

// Función auxiliar para crear notificaciones del sistema
function createSystemNotification(type, title, message, options = {}) {
    const defaultOptions = {
        icon: '/icons/notification-icon-192.png',
        badge: '/icons/notification-badge-72.png',
        tag: `system-${type}`,
        requireInteraction: type === 'error' || type === 'warning',
        data: {
            type: type,
            timestamp: new Date().toISOString(),
            ...options.data
        }
    };
    
    return self.registration.showNotification(title, {
        body: message,
        ...defaultOptions,
        ...options
    });
}

// Función para enviar mensaje a todas las pestañas abiertas
function broadcastToClients(message) {
    clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
            clientList.forEach((client) => {
                client.postMessage(message);
            });
        });
}

// Manejar mensajes desde el cliente principal
self.addEventListener('message', (event) => {
    console.log('📨 Mensaje recibido en SW:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'show-notification':
                const { title, options } = event.data;
                event.waitUntil(
                    createSystemNotification('custom', title, options.body, options)
                );
                break;
                
            case 'update-badge':
                // Actualizar badge de la aplicación (si es soportado)
                if ('setAppBadge' in navigator) {
                    navigator.setAppBadge(event.data.count || 0);
                }
                break;
                
            case 'clear-badge':
                if ('clearAppBadge' in navigator) {
                    navigator.clearAppBadge();
                }
                break;
                
            default:
                console.log('🔔 Tipo de mensaje no reconocido:', event.data.type);
        }
    }
});

// Función para programar notificaciones recurrentes
function scheduleRecurringNotification(title, body, intervalMinutes) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    setInterval(() => {
        createSystemNotification('scheduled', title, body, {
            tag: 'recurring-notification',
            requireInteraction: false,
            data: {
                scheduled: true,
                interval: intervalMinutes
            }
        });
    }, intervalMs);
}

// Auto-registro de funciones globales para el SW
self.createSystemNotification = createSystemNotification;
self.broadcastToClients = broadcastToClients;
self.scheduleRecurringNotification = scheduleRecurringNotification;

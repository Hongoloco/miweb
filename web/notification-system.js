// Sistema de Notificaciones en Tiempo Real
// Gestión de notificaciones push, SSE y toast

let notificationPermission = 'default';
let serviceWorkerRegistration = null;
let sseEventSource = null;
let isSSEConnected = false;

// Configuración de notificaciones
const NOTIFICATION_CONFIG = {
    icon: '/icons/notification-icon-192.png',
    badge: '/icons/notification-badge-72.png',
    tag: 'sistema-olt-antel',
    renotify: true,
    requireInteraction: false,
    silent: false
};

// Inicializar sistema de notificaciones
async function initNotificationSystem() {
    console.log('🔔 Inicializando sistema de notificaciones...');
    
    try {
        // Registrar Service Worker
        if ('serviceWorker' in navigator) {
            serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('📱 Service Worker registrado:', serviceWorkerRegistration);
        }
        
        // Solicitar permisos de notificación
        if ('Notification' in window) {
            notificationPermission = await Notification.requestPermission();
            console.log('🔔 Permiso de notificaciones:', notificationPermission);
        }
        
        // Conectar SSE para notificaciones en tiempo real
        connectSSE();
        
        // Suscribir a notificaciones push si es posible
        await subscribeToPushNotifications();
        
    } catch (error) {
        console.error('❌ Error inicializando notificaciones:', error);
    }
}

// Conectar a Server-Sent Events
function connectSSE() {
    if (sseEventSource) {
        sseEventSource.close();
    }
    
    try {
        const userId = getCurrentUserId();
        sseEventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
        
        sseEventSource.onopen = () => {
            console.log('📡 Conexión SSE establecida');
            isSSEConnected = true;
            updateConnectionStatus(true);
        };
        
        sseEventSource.onmessage = (event) => {
            try {
                const notification = JSON.parse(event.data);
                handleSSENotification(notification);
            } catch (error) {
                console.error('Error procesando notificación SSE:', error);
            }
        };
        
        sseEventSource.onerror = (error) => {
            console.error('❌ Error en conexión SSE:', error);
            isSSEConnected = false;
            updateConnectionStatus(false);
            
            // Reintentar conexión después de 5 segundos
            setTimeout(() => {
                if (!isSSEConnected) {
                    console.log('🔄 Reintentando conexión SSE...');
                    connectSSE();
                }
            }, 5000);
        };
        
    } catch (error) {
        console.error('❌ Error conectando SSE:', error);
    }
}

// Manejar notificaciones SSE
function handleSSENotification(notification) {
    console.log('📨 Notificación SSE recibida:', notification);
    
    switch (notification.type) {
        case 'connection':
            console.log('✅ Conectado al stream de notificaciones');
            break;
            
        case 'task-update':
            showNotification('📋 Actualización de Tarea', {
                body: `Tarea "${notification.data.titulo}" ha sido ${notification.data.accion}`,
                icon: NOTIFICATION_CONFIG.icon,
                tag: `task-${notification.data.id}`,
                data: notification.data
            });
            
            // También mostrar toast
            mostrarNotificacionToast(
                `Tarea ${notification.data.accion}: ${notification.data.titulo}`, 
                'info', 
                4000
            );
            break;
            
        case 'system-alert':
            showNotification('⚠️ Alerta del Sistema', {
                body: notification.message,
                icon: NOTIFICATION_CONFIG.icon,
                tag: 'system-alert',
                requireInteraction: true,
                data: notification.data
            });
            break;
            
        case 'user-message':
            showNotification('💬 Mensaje', {
                body: notification.message,
                icon: NOTIFICATION_CONFIG.icon,
                tag: `message-${notification.data.id}`,
                data: notification.data
            });
            break;
            
        default:
            console.log('Tipo de notificación no reconocido:', notification.type);
    }
}

// Mostrar notificación del navegador
function showNotification(title, options = {}) {
    if (notificationPermission !== 'granted') {
        console.warn('⚠️ No hay permisos para mostrar notificaciones');
        return;
    }
    
    const defaultOptions = {
        ...NOTIFICATION_CONFIG,
        ...options
    };
    
    try {
        if (serviceWorkerRegistration) {
            // Usar Service Worker para notificaciones
            serviceWorkerRegistration.showNotification(title, defaultOptions);
        } else {
            // Fallback a notificación nativa
            new Notification(title, defaultOptions);
        }
    } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
    }
}

// Suscribirse a notificaciones push
async function subscribeToPushNotifications() {
    if (!serviceWorkerRegistration) {
        console.warn('⚠️ Service Worker no disponible para push notifications');
        return;
    }
    
    try {
        const subscription = await serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(getVapidKey())
        });
        
        // Enviar suscripción al servidor
        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        });
        
        console.log('📱 Suscrito a notificaciones push');
        
    } catch (error) {
        console.warn('⚠️ Error suscribiendo a push notifications:', error);
    }
}

// Obtener clave VAPID (en producción debería ser segura)
function getVapidKey() {
    // Esta es una clave de ejemplo - en producción usar una clave real
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI5_kKSBCiT3U6e8iVbcQ1F4hpCtN2-6-pz4RqKL5GVWFvV1uv_g6FfXSM';
}

// Convertir clave VAPID
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Actualizar estado de conexión en la UI
function updateConnectionStatus(connected) {
    const statusIndicator = document.getElementById('connectionStatus');
    if (statusIndicator) {
        statusIndicator.className = connected ? 'connected' : 'disconnected';
        statusIndicator.title = connected ? 'Conectado' : 'Desconectado';
    }
    
    // Mostrar indicador temporal
    const indicator = document.createElement('div');
    indicator.className = `connection-indicator ${connected ? 'connected' : 'disconnected'}`;
    indicator.textContent = connected ? '🟢 Conectado' : '🔴 Desconectado';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${connected ? '#4caf50' : '#f44336'};
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 12px;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 300);
    }, 2000);
}

// Enviar notificación personalizada
async function sendCustomNotification(type, title, message, data = {}) {
    try {
        const notification = {
            type: type,
            title: title,
            message: message,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        // Si SSE está conectado, enviarlo a través del servidor
        if (isSSEConnected) {
            await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notification)
            });
        } else {
            // Mostrar directamente
            showNotification(title, {
                body: message,
                data: data
            });
        }
        
    } catch (error) {
        console.error('❌ Error enviando notificación:', error);
    }
}

// Limpiar recursos al cerrar
function cleanupNotifications() {
    if (sseEventSource) {
        sseEventSource.close();
        sseEventSource = null;
    }
    isSSEConnected = false;
}

// Funciones de utilidad para toast notifications (mantener compatibilidad)
function mostrarNotificacionToast(mensaje, tipo = 'info', duracion = 3000) {
    if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion(mensaje, tipo, duracion);
    } else {
        console.log(`📱 ${tipo.toUpperCase()}: ${mensaje}`);
    }
}

// Manejar eventos del Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
            console.log('🔔 Notificación clickeada:', event.data);
            
            // Manejar click en notificación
            if (event.data.data && event.data.data.url) {
                window.open(event.data.data.url, '_blank');
            }
        }
    });
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationSystem);
} else {
    initNotificationSystem();
}

// Limpiar al cerrar la página
window.addEventListener('beforeunload', cleanupNotifications);

// Exportar funciones para uso global
window.notificationSystem = {
    showNotification,
    sendCustomNotification,
    connectSSE,
    isConnected: () => isSSEConnected
};

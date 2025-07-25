/**
 * Sistema de Notificaciones Push y en Tiempo Real
 * Gestión integral de notificaciones para el sistema OLT Antel
 */

class NotificationSystem {
    constructor() {
        this.notifications = new Map();
        this.subscribers = new Map();
        this.eventSource = null;
        this.reconnectInterval = 5000;
        this.maxRetries = 5;
        this.retryCount = 0;
        this.isConnected = false;
        
        this.notificationTypes = {
            'info': { icon: '💡', color: '#17a2b8', priority: 1 },
            'success': { icon: '✅', color: '#28a745', priority: 2 },
            'warning': { icon: '⚠️', color: '#ffc107', priority: 3 },
            'error': { icon: '❌', color: '#dc3545', priority: 4 },
            'critical': { icon: '🚨', color: '#721c24', priority: 5 }
        };
        
        this.init();
    }

    // Inicializar el sistema de notificaciones
    async init() {
        console.log('🔔 Inicializando sistema de notificaciones...');
        
        // Verificar soporte para notificaciones del navegador
        if ('Notification' in window) {
            await this.requestNotificationPermission();
        }
        
        // Verificar soporte para Service Worker
        if ('serviceWorker' in navigator) {
            await this.registerServiceWorker();
        }
        
        // Inicializar Server-Sent Events
        this.initializeSSE();
        
        // Crear contenedor de notificaciones
        this.createNotificationContainer();
        
        // Configurar eventos del sistema
        this.setupEventListeners();
        
        console.log('✅ Sistema de notificaciones inicializado');
    }

    // Solicitar permisos para notificaciones del navegador
    async requestNotificationPermission() {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log(`🔔 Permisos de notificación: ${permission}`);
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    // Registrar Service Worker para notificaciones push
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw-notifications.js');
            console.log('📱 Service Worker registrado:', registration);
            
            // Configurar push notifications si está soportado
            if ('PushManager' in window) {
                await this.setupPushNotifications(registration);
            }
            
            return registration;
        } catch (error) {
            console.error('❌ Error registrando Service Worker:', error);
        }
    }

    // Configurar notificaciones push
    async setupPushNotifications(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    'BGKMykS0p6a9Xg4yyUU8LVVu-kcPRNYKfzVcJ3QgZh5-3q0j-8jYJ_L5Z2S8yF0H7Qk6Q5_-F9n2Q6S5k2K8b1'
                )
            });
            
            // Enviar suscripción al servidor
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
            
            console.log('🔄 Suscripción push configurada');
        } catch (error) {
            console.error('❌ Error configurando push notifications:', error);
        }
    }

    // Inicializar Server-Sent Events
    initializeSSE() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        try {
            this.eventSource = new EventSource('/api/notifications/stream');
            
            this.eventSource.onopen = () => {
                console.log('🔗 Conexión SSE establecida');
                this.isConnected = true;
                this.retryCount = 0;
                this.showConnectionStatus(true);
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const notification = JSON.parse(event.data);
                    this.handleIncomingNotification(notification);
                } catch (error) {
                    console.error('❌ Error procesando notificación SSE:', error);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('❌ Error en conexión SSE:', error);
                this.isConnected = false;
                this.showConnectionStatus(false);
                this.handleReconnection();
            };

            // Eventos específicos
            this.eventSource.addEventListener('task-update', (event) => {
                const data = JSON.parse(event.data);
                this.showNotification({
                    type: 'info',
                    title: 'Actualización de Tarea',
                    message: `La tarea "${data.titulo}" ha sido ${data.accion}`,
                    data: data
                });
            });

            this.eventSource.addEventListener('olt-alert', (event) => {
                const data = JSON.parse(event.data);
                this.showNotification({
                    type: data.severity || 'warning',
                    title: 'Alerta de OLT',
                    message: data.message,
                    data: data,
                    persistent: data.severity === 'critical'
                });
            });

            this.eventSource.addEventListener('system-update', (event) => {
                const data = JSON.parse(event.data);
                this.showNotification({
                    type: 'info',
                    title: 'Actualización del Sistema',
                    message: data.message,
                    data: data
                });
            });

        } catch (error) {
            console.error('❌ Error inicializando SSE:', error);
            this.handleReconnection();
        }
    }

    // Manejar reconexión automática
    handleReconnection() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Reintentando conexión SSE (${this.retryCount}/${this.maxRetries})...`);
            
            setTimeout(() => {
                this.initializeSSE();
            }, this.reconnectInterval * this.retryCount);
        } else {
            console.error('❌ Máximo de reintentos alcanzado. Conexión SSE perdida.');
            this.showNotification({
                type: 'error',
                title: 'Conexión Perdida',
                message: 'No se pudo restablecer la conexión en tiempo real. Por favor, recargue la página.',
                persistent: true
            });
        }
    }

    // Crear contenedor de notificaciones en el DOM
    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.innerHTML = `
            <div id="notification-stack" class="notification-stack"></div>
            <div id="connection-status" class="connection-status">
                <span id="connection-indicator" class="connection-indicator"></span>
                <span id="connection-text">Conectado</span>
            </div>
        `;
        
        document.body.appendChild(container);
        this.addNotificationStyles();
    }

    // Agregar estilos CSS para notificaciones
    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification-stack {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            }

            .notification-item {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 16px;
                border-left: 4px solid;
                transform: translateX(100%);
                animation: slideIn 0.3s ease-out forwards;
                position: relative;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .notification-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            }

            .notification-item.removing {
                animation: slideOut 0.3s ease-in forwards;
            }

            .notification-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }

            .notification-icon {
                font-size: 20px;
                margin-right: 12px;
            }

            .notification-title {
                font-weight: 600;
                color: #333;
                flex-grow: 1;
                margin: 0;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }

            .notification-close:hover {
                background: #f0f0f0;
            }

            .notification-message {
                color: #666;
                font-size: 14px;
                line-height: 1.4;
                margin: 0;
            }

            .notification-timestamp {
                font-size: 12px;
                color: #999;
                margin-top: 8px;
            }

            .notification-actions {
                margin-top: 12px;
                display: flex;
                gap: 8px;
            }

            .notification-action {
                background: #007bff;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
            }

            .notification-action:hover {
                background: #0056b3;
            }

            .notification-action.secondary {
                background: #6c757d;
            }

            .notification-action.secondary:hover {
                background: #545b62;
            }

            .connection-status {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 20px;
                padding: 8px 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                z-index: 9999;
                transition: all 0.3s ease;
            }

            .connection-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #28a745;
                animation: pulse 2s infinite;
            }

            .connection-indicator.disconnected {
                background: #dc3545;
                animation: none;
            }

            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            @media (max-width: 768px) {
                .notification-stack {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .connection-status {
                    bottom: 10px;
                    right: 10px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Mostrar notificación
    showNotification(options) {
        const {
            type = 'info',
            title,
            message,
            persistent = false,
            duration = 5000,
            actions = [],
            data = null
        } = options;

        const notificationId = this.generateId();
        const typeConfig = this.notificationTypes[type] || this.notificationTypes.info;
        
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-item';
        notificationElement.style.borderLeftColor = typeConfig.color;
        notificationElement.dataset.notificationId = notificationId;
        
        notificationElement.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${typeConfig.icon}</span>
                <h4 class="notification-title">${title}</h4>
                ${!persistent ? '<button class="notification-close" onclick="notificationSystem.removeNotification(\'' + notificationId + '\')">&times;</button>' : ''}
            </div>
            <p class="notification-message">${message}</p>
            <div class="notification-timestamp">${new Date().toLocaleTimeString()}</div>
            ${actions.length > 0 ? `
                <div class="notification-actions">
                    ${actions.map(action => 
                        `<button class="notification-action ${action.type || ''}" 
                                onclick="${action.callback}('${notificationId}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">
                            ${action.label}
                         </button>`
                    ).join('')}
                </div>
            ` : ''}
        `;

        // Agregar al stack
        const stack = document.getElementById('notification-stack');
        stack.appendChild(notificationElement);

        // Almacenar en mapa
        this.notifications.set(notificationId, {
            element: notificationElement,
            type,
            title,
            message,
            data,
            timestamp: new Date()
        });

        // Auto-remover si no es persistente
        if (!persistent) {
            setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration);
        }

        // Mostrar notificación del navegador si está disponible
        if (Notification.permission === 'granted' && !document.hasFocus()) {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                tag: notificationId
            });
        }

        // Emitir evento personalizado
        this.emit('notification-shown', { id: notificationId, ...options });

        return notificationId;
    }

    // Remover notificación
    removeNotification(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        notification.element.classList.add('removing');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(notificationId);
        }, 300);

        this.emit('notification-removed', { id: notificationId });
    }

    // Limpiar todas las notificaciones
    clearAllNotifications() {
        const stack = document.getElementById('notification-stack');
        stack.innerHTML = '';
        this.notifications.clear();
        
        this.emit('notifications-cleared');
    }

    // Mostrar estado de conexión
    showConnectionStatus(connected) {
        const indicator = document.getElementById('connection-indicator');
        const text = document.getElementById('connection-text');
        
        if (indicator && text) {
            if (connected) {
                indicator.classList.remove('disconnected');
                text.textContent = 'Conectado';
            } else {
                indicator.classList.add('disconnected');
                text.textContent = 'Desconectado';
            }
        }
    }

    // Manejar notificación entrante
    handleIncomingNotification(notification) {
        console.log('📨 Notificación recibida:', notification);
        
        // Aplicar filtros si existen
        if (this.shouldShowNotification(notification)) {
            this.showNotification(notification);
        }
    }

    // Verificar si debe mostrar la notificación
    shouldShowNotification(notification) {
        // Aquí se pueden implementar filtros personalizados
        const userPreferences = this.getUserPreferences();
        
        // Filtrar por tipo
        if (userPreferences.hiddenTypes?.includes(notification.type)) {
            return false;
        }
        
        // Filtrar por prioridad mínima
        const notificationPriority = this.notificationTypes[notification.type]?.priority || 1;
        if (notificationPriority < (userPreferences.minPriority || 1)) {
            return false;
        }
        
        return true;
    }

    // Obtener preferencias del usuario
    getUserPreferences() {
        try {
            return JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
        } catch {
            return {};
        }
    }

    // Configurar preferencias del usuario
    setUserPreferences(preferences) {
        localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
        console.log('⚙️ Preferencias de notificación actualizadas');
    }

    // Sistema de eventos simple
    setupEventListeners() {
        this.eventHandlers = new Map();
    }

    emit(eventName, data) {
        const handlers = this.eventHandlers.get(eventName) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error en handler de ${eventName}:`, error);
            }
        });
    }

    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    off(eventName, handler) {
        const handlers = this.eventHandlers.get(eventName) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    // Utilidades
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Métodos de conveniencia
    success(title, message, options = {}) {
        return this.showNotification({ type: 'success', title, message, ...options });
    }

    error(title, message, options = {}) {
        return this.showNotification({ type: 'error', title, message, persistent: true, ...options });
    }

    warning(title, message, options = {}) {
        return this.showNotification({ type: 'warning', title, message, ...options });
    }

    info(title, message, options = {}) {
        return this.showNotification({ type: 'info', title, message, ...options });
    }

    critical(title, message, options = {}) {
        return this.showNotification({ type: 'critical', title, message, persistent: true, ...options });
    }

    // Cleanup
    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        
        const container = document.getElementById('notification-container');
        if (container) {
            container.remove();
        }
        
        const styles = document.getElementById('notification-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🧹 Sistema de notificaciones limpiado');
    }
}

// Instancia global
window.notificationSystem = new NotificationSystem();

// Funciones de conveniencia globales
window.showNotification = (title, message, type = 'info', options = {}) => {
    return window.notificationSystem.showNotification({ title, message, type, ...options });
};

window.showSuccess = (title, message, options = {}) => {
    return window.notificationSystem.success(title, message, options);
};

window.showError = (title, message, options = {}) => {
    return window.notificationSystem.error(title, message, options);
};

window.showWarning = (title, message, options = {}) => {
    return window.notificationSystem.warning(title, message, options);
};

window.showInfo = (title, message, options = {}) => {
    return window.notificationSystem.info(title, message, options);
};

console.log('🔔 Sistema de notificaciones cargado y listo');

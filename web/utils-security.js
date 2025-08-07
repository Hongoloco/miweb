// 🛡️ FUNCIONES DE UTILIDAD PARA SEGURIDAD Y MEJORAS
// Archivo: web/utils-security.js

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Valida si una fecha es válida
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean} - True si es válida
 */
function isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
}

/**
 * Formatea fecha de manera segura
 * @param {string|Date} date - Fecha a formatear
 * @param {string} fallback - Texto por defecto si fecha inválida
 * @returns {string} - Fecha formateada o fallback
 */
function formatDateSafe(date, fallback = 'Fecha no disponible') {
    if (!date) return fallback;
    
    try {
        const d = new Date(date);
        if (isValidDate(d)) {
            return d.toLocaleDateString();
        }
        return fallback;
    } catch (error) {
        console.warn('Error formateando fecha:', error);
        return fallback;
    }
}

/**
 * Sanitiza string para uso en atributos HTML
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizeForAttribute(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/['"<>&]/g, '');
}

/**
 * Debounce para funciones de búsqueda
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Genera un ID único seguro
 * @returns {string} - ID único
 */
function generateSecureId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Limpia texto para prevenir inyección de scripts
 * @param {string} input - Input del usuario
 * @returns {string} - Input limpio
 */
function sanitizeUserInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remover scripts y elementos peligrosos
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

/**
 * Valida longitud de string de manera segura
 * @param {string} str - String a validar
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 * @returns {boolean} - True si es válido
 */
function validateStringLength(str, min = 0, max = 1000) {
    if (typeof str !== 'string') return false;
    return str.length >= min && str.length <= max;
}

/**
 * Manejo seguro de localStorage
 */
const SafeStorage = {
    set: function(key, value) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            }
        } catch (error) {
            console.warn('Error guardando en localStorage:', error);
        }
        return false;
    },
    
    get: function(key, defaultValue = null) {
        try {
            if (typeof localStorage !== 'undefined') {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            }
        } catch (error) {
            console.warn('Error leyendo de localStorage:', error);
        }
        return defaultValue;
    },
    
    remove: function(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
                return true;
            }
        } catch (error) {
            console.warn('Error removiendo de localStorage:', error);
        }
        return false;
    }
};

/**
 * Logger frontend para errores
 */
const FrontendLogger = {
    error: function(message, error = null, context = {}) {
        const logData = {
            level: 'error',
            message: message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error('Frontend Error:', logData);
        
        // Enviar al servidor si está disponible
        this.sendToServer(logData);
    },
    
    warn: function(message, context = {}) {
        const logData = {
            level: 'warn',
            message: message,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        console.warn('Frontend Warning:', logData);
        this.sendToServer(logData);
    },
    
    sendToServer: function(logData) {
        try {
            fetch('/api/logs/frontend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData),
                credentials: 'include'
            }).catch(err => {
                console.warn('No se pudo enviar log al servidor:', err);
            });
        } catch (error) {
            console.warn('Error enviando log:', error);
        }
    }
};

/**
 * Configurar manejo global de errores
 */
function setupGlobalErrorHandling() {
    // Errores JavaScript no capturados
    window.addEventListener('error', (event) => {
        FrontendLogger.error('JavaScript Error', {
            name: 'JavaScriptError',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });
    
    // Promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
        FrontendLogger.error('Unhandled Promise Rejection', {
            name: 'UnhandledPromiseRejection',
            message: event.reason,
            promise: event.promise
        });
    });
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.SecurityUtils = {
        escapeHtml,
        isValidDate,
        formatDateSafe,
        sanitizeForAttribute,
        debounce,
        isValidEmail,
        generateSecureId,
        sanitizeUserInput,
        validateStringLength,
        SafeStorage,
        FrontendLogger,
        setupGlobalErrorHandling
    };
    
    // Configurar manejo de errores automáticamente
    setupGlobalErrorHandling();
}

// Para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        escapeHtml,
        isValidDate,
        formatDateSafe,
        sanitizeForAttribute,
        debounce,
        isValidEmail,
        generateSecureId,
        sanitizeUserInput,
        validateStringLength,
        SafeStorage,
        FrontendLogger,
        setupGlobalErrorHandling
    };
}

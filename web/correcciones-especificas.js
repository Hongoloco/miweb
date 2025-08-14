// 🔧 CORRECCIONES ESPECÍFICAS RECOMENDADAS
// Archivo: correcciones-especificas.js

/**
 * CORRECCIÓN 1: Función mostrarUsuarios() mejorada con seguridad
 */
function mostrarUsuariosMejorada(usuarios) {
    const container = document.getElementById('users-grid');
    
    if (!container) {
        console.error('❌ Elemento users-grid no encontrado');
        return;
    }
    
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">
                <p>👥 No hay usuarios registrados</p>
                <p style="font-size: 14px;">Cree el primer usuario adicional</p>
            </div>
        `;
        return;
    }

    // Usar funciones de seguridad para sanitizar datos
    container.innerHTML = usuarios.map(usuario => {
        const username = SecurityUtils.escapeHtml(usuario.username);
        const email = SecurityUtils.escapeHtml(usuario.email || 'Sin email');
        const descripcion = SecurityUtils.escapeHtml(usuario.descripcion || 'Sin descripción');
        const fechaCreacion = SecurityUtils.formatDateSafe(usuario.fecha_creacion);
        const ultimoAcceso = SecurityUtils.formatDateSafe(usuario.ultimo_acceso, 'Nunca');
        
        return `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: var(--azul-antel); margin-bottom: 5px;">
                        ${getRolIcon(usuario.rol)} ${username}
                        ${usuario.activo ? '<span style="color: #28a745; margin-left: 8px;" title="Usuario activo">✅</span>' : '<span style="color: #dc3545; margin-left: 8px;" title="Usuario inactivo">❌</span>'}
                    </div>
                    <div style="font-size: 13px; color: #666; margin-bottom: 3px;">
                        📧 ${email} • 🏷️ ${usuario.rol || 'usuario'} • 🆔 ${usuario.id}
                    </div>
                    <div style="font-size: 12px; color: #888;">
                        ${descripcion}
                    </div>
                    <div style="font-size: 11px; color: #999; margin-top: 5px;">
                        📅 Creado: ${fechaCreacion} • 
                        🕐 Último acceso: ${ultimoAcceso}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    <button class="btn btn-secondary" onclick="editarUsuario(${usuario.id})" 
                            style="font-size: 12px; padding: 6px 12px; background: #17a2b8; color: white;"
                            aria-label="Editar usuario ${username}">
                        ✏️ Editar
                    </button>
                    ${usuario.username !== 'alito' ? `
                        <button class="btn btn-danger" onclick="eliminarUsuario(${usuario.id}, '${SecurityUtils.sanitizeForAttribute(usuario.username)}')" 
                                style="font-size: 12px; padding: 6px 12px; background: #dc3545; color: white;"
                                aria-label="Eliminar usuario ${username}">
                            🗑️ Eliminar
                        </button>
                    ` : `
                        <span style="font-size: 11px; color: #999; padding: 6px;" title="Usuario administrador principal protegido">👑 Admin principal</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    console.log('✅ Usuarios mostrados en interfaz:', usuarios.length);
}

/**
 * CORRECCIÓN 2: Búsqueda con debounce
 */
const busquedaConDebounce = SecurityUtils.debounce(function(query) {
    if (query.length < 2) {
        return;
    }
    
    const sanitizedQuery = SecurityUtils.sanitizeUserInput(query);
    buscarComandosDB(sanitizedQuery);
}, 300);

// Aplicar a input de búsqueda
function setupBusquedaMejorada() {
    const searchInput = document.getElementById('busqueda-comandos');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            busquedaConDebounce(this.value);
        });
    }
}

/**
 * CORRECCIÓN 3: Manejo de errores en fetch mejorado
 */
async function fetchConManejadorSeguro(url, options = {}) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { success: true, data };
        
    } catch (error) {
        SecurityUtils.FrontendLogger.error('Error en fetch', error, { url, options });
        
        if (error.name === 'AbortError') {
            throw new Error('La petición tardó demasiado en responder');
        }
        
        throw error;
    }
}

/**
 * CORRECCIÓN 4: Validación de formularios mejorada
 */
function validarFormularioUsuario(formData) {
    const errores = [];
    
    // Validar username
    if (!SecurityUtils.validateStringLength(formData.username, 3, 50)) {
        errores.push('El nombre de usuario debe tener entre 3 y 50 caracteres');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        errores.push('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos');
    }
    
    // Validar email si se proporciona
    if (formData.email && !SecurityUtils.isValidEmail(formData.email)) {
        errores.push('El formato del email no es válido');
    }
    
    // Validar contraseña (si es nueva)
    if (formData.password && !SecurityUtils.validateStringLength(formData.password, 4, 100)) {
        errores.push('La contraseña debe tener entre 4 y 100 caracteres');
    }
    
    // Validar rol
    const rolesValidos = ['admin', 'tecnico', 'usuario'];
    if (!rolesValidos.includes(formData.rol)) {
        errores.push('El rol seleccionado no es válido');
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * CORRECCIÓN 5: Sistema de notificaciones mejorado con rate limiting
 */
class NotificationManager {
    constructor() {
        this.queue = [];
        this.maxNotifications = 5;
        this.isProcessing = false;
    }
    
    mostrar(mensaje, tipo = 'info', duracion = 3000, titulo = '') {
        // Rate limiting: máximo 5 notificaciones en cola
        if (this.queue.length >= this.maxNotifications) {
            console.warn('Demasiadas notificaciones en cola, ignorando nueva notificación');
            return;
        }
        
        const notification = {
            id: SecurityUtils.generateSecureId(),
            mensaje: SecurityUtils.escapeHtml(mensaje),
            tipo: tipo,
            duracion: duracion,
            titulo: SecurityUtils.escapeHtml(titulo),
            timestamp: Date.now()
        };
        
        this.queue.push(notification);
        this.procesarCola();
    }
    
    async procesarCola() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        while (this.queue.length > 0) {
            const notification = this.queue.shift();
            await this.mostrarNotificacion(notification);
        }
        
        this.isProcessing = false;
    }
    
    async mostrarNotificacion(notification) {
        return new Promise((resolve) => {
            // Crear elemento de notificación
            const notifElement = document.createElement('div');
            notifElement.className = `notification notification-${notification.tipo}`;
            notifElement.innerHTML = `
                <div class="notification-content">
                    ${notification.titulo ? `<strong>${notification.titulo}</strong><br>` : ''}
                    ${notification.mensaje}
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
            `;
            
            // Agregar al DOM
            let container = document.getElementById('notifications-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notifications-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                `;
                document.body.appendChild(container);
            }
            
            container.appendChild(notifElement);
            
            // Auto-remover después de la duración
            setTimeout(() => {
                if (notifElement.parentElement) {
                    notifElement.remove();
                }
                resolve();
            }, notification.duracion);
        });
    }
}

// Instancia global del gestor de notificaciones
const notificationManager = new NotificationManager();

/**
 * CORRECCIÓN 6: Wrapper para reemplazar la función original
 */
function mostrarNotificacionMejorada(mensaje, tipo = 'info', duracion = 3000, titulo = '') {
    notificationManager.mostrar(mensaje, tipo, duracion, titulo);
}

/**
 * CORRECCIÓN 7: Sistema de cache simple para mejorar rendimiento
 */
class SimpleCache {
    constructor(maxSize = 50, ttl = 300000) { // 5 minutos por defecto
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    set(key, data) {
        // Si el cache está lleno, remover el elemento más antiguo
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    clear() {
        this.cache.clear();
    }
}

// Cache global para usuarios
const usuariosCache = new SimpleCache(20, 120000); // 2 minutos

/**
 * CORRECCIÓN 8: Función cargarUsuarios con cache
 */
async function cargarUsuariosConCache() {
    console.log('🔄 Cargando usuarios...');
    
    // Verificar cache primero
    const cachedUsers = usuariosCache.get('usuarios');
    if (cachedUsers) {
        console.log('✅ Usuarios cargados desde cache');
        mostrarUsuariosMejorada(cachedUsers);
        return;
    }
    
    try {
        const { data } = await fetchConManejadorSeguro('/api/usuarios');
        
        if (data.success) {
            console.log('✅ Usuarios cargados desde servidor:', data.usuarios.length);
            usuariosCache.set('usuarios', data.usuarios);
            mostrarUsuariosMejorada(data.usuarios);
        } else {
            throw new Error(data.message || 'Error en respuesta');
        }
    } catch (error) {
        console.error('💥 Error cargando usuarios:', error);
        mostrarNotificacionMejorada('Error de conexión al cargar usuarios', 'error');
    }
}

/**
 * INSTRUCCIONES DE IMPLEMENTACIÓN:
 * 
 * 1. Incluir utils-security.js antes que este archivo
 * 2. Reemplazar las funciones originales por estas versiones mejoradas
 * 3. Actualizar todas las llamadas a mostrarNotificacion por mostrarNotificacionMejorada
 * 4. Implementar el CSS para las notificaciones mejoradas
 * 5. Agregar aria-labels a todos los botones para accesibilidad
 */

// Estilos CSS recomendados para las notificaciones
const notificationCSS = `
.notification {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    animation: slideIn 0.3s ease-out;
}

.notification-success {
    border-left: 4px solid #28a745;
    background: #f8fff9;
}

.notification-error {
    border-left: 4px solid #dc3545;
    background: #fff5f5;
}

.notification-warning {
    border-left: 4px solid #ffc107;
    background: #fffbf0;
}

.notification-info {
    border-left: 4px solid #17a2b8;
    background: #f0f9ff;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
    margin-left: 10px;
}

.notification-close:hover {
    color: #666;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Agregar estilos automáticamente
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = notificationCSS;
    document.head.appendChild(style);
}

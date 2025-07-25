// Parche temporal para solucionar la gestión de roles
console.log('🔧 Aplicando parche para gestión de roles...');

// Sobrescribir la función mostrarGestionRoles con el HTML correcto
window.mostrarGestionRoles = function() {
    const formContainer = document.getElementById('user-form-container');
    
    formContainer.innerHTML = `
        <div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin: 0 0 10px 0;">🛡️ Sistema de Roles y Permisos</h4>
                <p style="color: #856404; margin: 0;">
                    Gestiona los roles del sistema y sus permisos. Define qué pueden hacer los usuarios según su rol asignado.
                </p>
            </div>
            
            <!-- Controles principales -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="mostrarFormularioCrearRol()">
                    ➕ Crear Nuevo Rol
                </button>
                <button class="btn btn-secondary" onclick="cargarRoles()">
                    🔄 Recargar Roles
                </button>
                <button class="btn btn-info" onclick="mostrarUsuariosPorRol()">
                    👥 Ver Usuarios por Rol
                </button>
            </div>
            
            <!-- Lista de roles -->
            <div id="roles-container">
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
                    <p>Cargando roles...</p>
                </div>
            </div>
            
            <!-- Modal para crear/editar rol -->
            <div id="modal-rol" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <h3 id="modal-rol-titulo">Nuevo Rol</h3>
                    <form id="form-rol" onsubmit="return false;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre del Rol:</label>
                            <input type="text" id="rol-nombre" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Descripción:</label>
                            <textarea id="rol-descripcion" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;" rows="3"></textarea>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 10px; font-weight: bold;">Permisos:</label>
                            <div id="permisos-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                <!-- Los permisos se cargarán dinámicamente -->
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" class="btn btn-secondary" onclick="cerrarModalRol()">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="guardarRol()">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Cargar roles automáticamente
    cargarRoles();
    
    console.log('✅ Función mostrarGestionRoles corregida y roles cargados');
};

console.log('🎯 Parche aplicado. La gestión de roles ahora funcionará correctamente.');

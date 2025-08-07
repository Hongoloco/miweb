// Script de emergencia para forzar mostrar botones
// Ejecutar en la consola del navegador cuando estés en la página principal

console.log('🔧 Iniciando script de emergencia para botones de eliminar...');

// 1. Verificar si estamos logueados
fetch('/api/usuarios')
.then(response => response.json())
.then(data => {
    if (!data.success) {
        console.log('❌ No logueado, ejecutando login...');
        return fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'alito', password: 'admin123' })
        });
    }
    return { json: () => data };
})
.then(response => response.json())
.then(loginData => {
    console.log('✅ Login verificado, cargando usuarios...');
    return fetch('/api/usuarios');
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log(`✅ ${data.usuarios.length} usuarios obtenidos`);
        
        // 2. Buscar o crear el contenedor de usuarios
        let usersGrid = document.getElementById('users-grid');
        if (!usersGrid) {
            console.log('❌ users-grid no existe, creando uno temporal...');
            usersGrid = document.createElement('div');
            usersGrid.id = 'users-grid';
            usersGrid.style.cssText = 'background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px;';
            document.body.appendChild(usersGrid);
            
            // Agregar título
            const title = document.createElement('h3');
            title.textContent = '👥 Usuarios del Sistema (Generado por Script)';
            title.style.cssText = 'color: #0066cc; margin-bottom: 20px;';
            usersGrid.insertBefore(title, usersGrid.firstChild);
        }
        
        // 3. Función para generar icono de rol
        function getRolIcon(rol) {
            switch(rol) {
                case 'admin':
                case 'administrador': return '👑';
                case 'tecnico': return '🔧';
                default: return '👤';
            }
        }
        
        // 4. Generar HTML de usuarios con botones
        const html = data.usuarios.map(usuario => `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: #0066cc; margin-bottom: 5px;">
                        ${getRolIcon(usuario.rol)} ${usuario.username}
                        <span style="color: #28a745; margin-left: 8px;" title="Usuario activo">✅</span>
                    </div>
                    <div style="font-size: 13px; color: #666; margin-bottom: 3px;">
                        📧 ${usuario.email || 'Sin email'} • 🏷️ ${usuario.rol} • 🆔 ${usuario.id}
                    </div>
                    <div style="font-size: 12px; color: #888;">
                        ${usuario.descripcion || 'Sin descripción'}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    <button onclick="alert('✏️ Editar usuario: ${usuario.username}')" 
                            style="font-size: 12px; padding: 8px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ✏️ Editar
                    </button>
                    ${usuario.username !== 'alito' ? `
                        <button onclick="confirmarEliminacion('${usuario.id}', '${usuario.username}')" 
                                style="font-size: 12px; padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            🗑️ Eliminar
                        </button>
                    ` : `
                        <span style="font-size: 11px; color: #999; padding: 8px; font-style: italic;">👑 Admin principal (protegido)</span>
                    `}
                </div>
            </div>
        `).join('');
        
        // 5. Insertar HTML
        usersGrid.innerHTML = html;
        
        // 6. Crear función de confirmación si no existe
        if (typeof confirmarEliminacion === 'undefined') {
            window.confirmarEliminacion = function(id, username) {
                if (confirm(`¿Está seguro que desea eliminar al usuario "${username}"?\n\nEsta acción no se puede deshacer.`)) {
                    console.log(`🗑️ Eliminando usuario: ${username} (ID: ${id})`);
                    
                    fetch(`/api/usuarios/${id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ eliminadorId: 1 })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(`✅ Usuario "${username}" eliminado correctamente`);
                            location.reload(); // Recargar página
                        } else {
                            alert(`❌ Error eliminando usuario: ${data.message}`);
                        }
                    })
                    .catch(error => {
                        alert(`❌ Error de conexión: ${error.message}`);
                    });
                }
            };
        }
        
        // 7. Contar botones creados
        const botonesEliminar = usersGrid.querySelectorAll('button[onclick*="confirmarEliminacion"]');
        console.log(`✅ Script completado! ${botonesEliminar.length} botones de eliminar creados`);
        console.log('📍 Los botones aparecen en el contenedor users-grid en la página');
        
        // Hacer scroll al contenedor
        usersGrid.scrollIntoView({ behavior: 'smooth' });
        
    } else {
        console.error('❌ Error obteniendo usuarios:', data.message);
    }
})
.catch(error => {
    console.error('❌ Error en script:', error);
});

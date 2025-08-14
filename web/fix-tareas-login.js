// FIX PARA TAREAS DESPUÉS DEL LOGIN
console.log('🔧 Fix de tareas después del login cargado...');

// Interceptar la función de login para asegurar que las tareas se carguen
document.addEventListener('DOMContentLoaded', function() {
    // Sobrescribir la función showTab para manejar mejor las tareas
    const originalShowTab = window.showTab;
    
    window.showTab = function(tabName) {
        console.log('🔄 ShowTab interceptado:', tabName);
        
        // Ejecutar la función original
        if (originalShowTab) {
            originalShowTab(tabName);
        }
        
        // Si es la pestaña de tareas, asegurar que se carguen
        if (tabName === 'tareas') {
            setTimeout(() => {
                const authenticated = sessionStorage.getItem('authenticated') === 'true';
                console.log('🔍 Verificando carga de tareas:', {
                    authenticated,
                    cargarTareasDisponible: typeof cargarTareas === 'function'
                });
                
                if (authenticated && typeof cargarTareas === 'function') {
                    console.log('🚀 Forzando carga de tareas...');
                    cargarTareas()
                        .then(() => console.log('✅ Tareas cargadas exitosamente'))
                        .catch(err => {
                            console.error('❌ Error cargando tareas:', err);
                            // Mostrar mensaje de error al usuario
                            const tareasContainer = document.querySelector('#tareas .seccion-tareas-activas');
                            if (tareasContainer) {
                                tareasContainer.innerHTML = `
                                    <div style="text-align: center; padding: 20px; color: #dc3545;">
                                        <h4>❌ Error al cargar tareas</h4>
                                        <p>Error: ${err.message}</p>
                                        <button onclick="forzarCargaTareas()" class="btn btn-primary">🔄 Reintentar</button>
                                    </div>
                                `;
                            }
                        });
                }
            }, 300);
        }
    };
    
    // También interceptar clicks en la pestaña de tareas directamente
    const tareaTab = document.querySelector('[data-tab="tareas"]');
    if (tareaTab) {
        tareaTab.addEventListener('click', function() {
            console.log('🎯 Click directo en pestaña de tareas');
            setTimeout(() => {
                const authenticated = sessionStorage.getItem('authenticated') === 'true';
                if (authenticated && typeof cargarTareas === 'function') {
                    console.log('🔄 Cargando tareas por click directo...');
                    cargarTareas().catch(console.error);
                }
            }, 100);
        });
    }
});

// Función para verificar estado de autenticación y tareas
function verificarEstadoTareas() {
    console.log('🔍 === ESTADO ACTUAL DE TAREAS ===');
    console.log('🍪 Authenticated:', sessionStorage.getItem('authenticated'));
    console.log('👤 User:', sessionStorage.getItem('user'));
    console.log('📋 cargarTareas disponible:', typeof cargarTareas === 'function');
    console.log('🎯 Pestaña tareas activa:', document.getElementById('tareas')?.classList.contains('active'));
    
    const userJson = sessionStorage.getItem('user');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            console.log('👤 Usuario parseado:', user.username, user.rol);
        } catch (e) {
            console.error('❌ Error parseando usuario');
        }
    }
}

// Función para test de conectividad
async function testConectividadTareas() {
    console.log('🧪 Probando conectividad con API de tareas...');
    
    try {
        const response = await fetch('/api/tareas', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📊 Response data:', data);
        
        if (data.success) {
            console.log('✅ Conectividad OK, tareas encontradas:', data.tareas?.length || 0);
        } else {
            console.log('❌ Error en respuesta:', data.message);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Error de conectividad:', error);
        return { success: false, error: error.message };
    }
}

// Exportar funciones de debugging
window.verificarEstadoTareas = verificarEstadoTareas;
window.testConectividadTareas = testConectividadTareas;

console.log('🔧 Fix de tareas cargado');
console.log('🛠️ Funciones adicionales:');
console.log('- verificarEstadoTareas() - Ver estado actual');
console.log('- testConectividadTareas() - Probar conectividad API');

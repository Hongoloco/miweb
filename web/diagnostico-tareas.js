// DIAGNÓSTICO DEL SISTEMA DE TAREAS
console.log('🔍 === DIAGNÓSTICO SISTEMA DE TAREAS ===');

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🔧 Ejecutando diagnóstico de tareas...');
        
        // Verificar estado de autenticación
        const authenticated = sessionStorage.getItem('authenticated');
        const userJson = sessionStorage.getItem('user');
        console.log('🍪 Authenticated:', authenticated);
        console.log('👤 User data:', userJson);
        
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                console.log('👤 Usuario parseado:', user);
            } catch (e) {
                console.error('❌ Error parseando usuario:', e);
            }
        }
        
        // Verificar si las funciones de tareas existen
        console.log('📋 Funciones disponibles:');
        console.log('- cargarTareas:', typeof cargarTareas);
        console.log('- inicializarTareas:', typeof inicializarTareas);
        console.log('- mostrarTareas:', typeof mostrarTareas);
        console.log('- cargarEstadisticasTareas:', typeof cargarEstadisticasTareas);
        
        // Verificar elementos del DOM
        console.log('🎯 Elementos DOM:');
        const tabTareas = document.querySelector('[data-tab="tareas"]');
        const contentTareas = document.getElementById('tareas');
        console.log('- Tab tareas:', !!tabTareas);
        console.log('- Content tareas:', !!contentTareas);
        
        // Verificar si la pestaña tareas está activa
        if (tabTareas) {
            console.log('- Tab tareas activa:', tabTareas.classList.contains('active'));
        }
        if (contentTareas) {
            console.log('- Content tareas activo:', contentTareas.classList.contains('active'));
        }
        
        // Probar cargar tareas manualmente
        if (authenticated === 'true' && typeof cargarTareas === 'function') {
            console.log('🧪 Probando cargar tareas manualmente...');
            cargarTareas()
                .then(() => console.log('✅ Tareas cargadas correctamente'))
                .catch(err => console.error('❌ Error cargando tareas:', err));
        }
        
    }, 2000);
});

// Función para forzar carga de tareas
function forzarCargaTareas() {
    console.log('🚀 Forzando carga de tareas...');
    
    if (typeof cargarTareas === 'function') {
        cargarTareas()
            .then(() => {
                console.log('✅ Tareas forzadas cargadas');
                alert('Tareas cargadas correctamente');
            })
            .catch(err => {
                console.error('❌ Error:', err);
                alert('Error cargando tareas: ' + err.message);
            });
    } else {
        console.error('❌ Función cargarTareas no disponible');
        alert('Función cargarTareas no disponible');
    }
}

// Función para ir a tareas directamente
function irATareas() {
    console.log('🎯 Yendo a pestaña de tareas...');
    
    if (typeof showTab === 'function') {
        showTab('tareas');
        
        // Forzar carga después de un momento
        setTimeout(() => {
            if (typeof cargarTareas === 'function') {
                cargarTareas().catch(console.error);
            }
        }, 500);
    } else {
        console.error('❌ Función showTab no disponible');
    }
}

// Exportar funciones de diagnóstico
window.forzarCargaTareas = forzarCargaTareas;
window.irATareas = irATareas;

console.log('🔍 Diagnóstico de tareas cargado');
console.log('🛠️ Funciones disponibles:');
console.log('- forzarCargaTareas() - Fuerza la carga de tareas');
console.log('- irATareas() - Va a la pestaña de tareas directamente');

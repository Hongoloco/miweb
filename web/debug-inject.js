// Script para inyectar debug en la página principal
console.log('🔧 INYECTANDO DEBUG EN PÁGINA PRINCIPAL');

// Esperar a que la página cargue
function esperarElementos() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

// Función para interceptar y debuggear cargarOLTs
async function interceptarCargarOLTs() {
    await esperarElementos();
    
    console.log('🎯 Interceptando función cargarOLTs...');
    
    // Guardar la función original
    const cargarOLTsOriginal = window.cargarOLTs;
    
    if (typeof cargarOLTsOriginal !== 'function') {
        console.error('❌ Función cargarOLTs no encontrada en window');
        return;
    }
    
    // Crear versión con debug
    window.cargarOLTs = async function() {
        console.log('🚀 DEBUG: Ejecutando cargarOLTs interceptada...');
        console.log('🚀 DEBUG: Estado de cargandoOLTs:', window.cargandoOLTs);
        
        try {
            const resultado = await cargarOLTsOriginal.call(this);
            console.log('✅ DEBUG: cargarOLTs completada exitosamente');
            return resultado;
        } catch (error) {
            console.error('💥 DEBUG: Error en cargarOLTs:', error);
            throw error;
        }
    };
    
    console.log('✅ Función cargarOLTs interceptada correctamente');
    
    // También interceptar fetch para ver las llamadas
    const fetchOriginal = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('/api/olts')) {
            console.log('🌐 DEBUG: Llamada fetch a:', url);
            console.log('🌐 DEBUG: Argumentos:', args);
        }
        
        try {
            const response = await fetchOriginal.apply(this, args);
            
            if (typeof url === 'string' && url.includes('/api/olts')) {
                console.log('🌐 DEBUG: Response status:', response.status);
                console.log('🌐 DEBUG: Response headers:', [...response.headers.entries()]);
            }
            
            return response;
        } catch (error) {
            if (typeof url === 'string' && url.includes('/api/olts')) {
                console.error('🌐 DEBUG: Error en fetch:', error);
            }
            throw error;
        }
    };
    
    console.log('✅ Función fetch interceptada para debug');
}

// Función para forzar la ejecución de cargarOLTs
function forzarCargarOLTs() {
    console.log('🔧 Forzando ejecución de cargarOLTs...');
    
    if (typeof window.cargarOLTs === 'function') {
        window.cargarOLTs().then(() => {
            console.log('✅ Ejecución forzada completada');
        }).catch((error) => {
            console.error('💥 Error en ejecución forzada:', error);
        });
    } else {
        console.error('❌ Función cargarOLTs no disponible');
    }
}

// Ejecutar interceptación
interceptarCargarOLTs().then(() => {
    console.log('🎯 Debug setup completado');
    
    // Forzar carga después de 2 segundos
    setTimeout(() => {
        console.log('⏰ Ejecutando carga forzada...');
        forzarCargarOLTs();
    }, 2000);
});

// Hacer las funciones disponibles globalmente para testing manual
window.debugOLTs = {
    forzarCargarOLTs: forzarCargarOLTs,
    interceptarCargarOLTs: interceptarCargarOLTs
};

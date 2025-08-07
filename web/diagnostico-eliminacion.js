// DIAGNÓSTICO: Problemas con eliminación de usuarios en el frontend

console.log('🔍 INICIANDO DIAGNÓSTICO DE ELIMINACIÓN DE USUARIOS');
console.log('=' + '='.repeat(50));

function diagnosticarEliminacion() {
    console.log('\n1️⃣ Verificando elementos del DOM...');
    
    // Verificar que existen los elementos necesarios
    const checks = [
        { elemento: 'confirmModal', selector: '#confirmModal' },
        { elemento: 'confirmIcon', selector: '#confirmIcon' },
        { elemento: 'confirmTitle', selector: '#confirmTitle' },
        { elemento: 'confirmMessage', selector: '#confirmMessage' },
        { elemento: 'confirmYes', selector: '#confirmYes' },
        { elemento: 'confirmNo', selector: '#confirmNo' },
        { elemento: 'users-grid', selector: '#users-grid' }
    ];
    
    checks.forEach(check => {
        const elemento = document.querySelector(check.selector);
        console.log(`${elemento ? '✅' : '❌'} ${check.elemento}: ${elemento ? 'Encontrado' : 'NO ENCONTRADO'}`);
    });
    
    console.log('\n2️⃣ Verificando funciones JavaScript...');
    
    const funciones = [
        'mostrarConfirmacion',
        'eliminarUsuario', 
        'cargarUsuarios',
        'mostrarNotificacionToast',
        'mostrarMensajeUsuario'
    ];
    
    funciones.forEach(func => {
        const existe = typeof window[func] === 'function';
        console.log(`${existe ? '✅' : '❌'} ${func}: ${existe ? 'Definida' : 'NO DEFINIDA'}`);
    });
    
    console.log('\n3️⃣ Verificando variable usuarioActual...');
    if (typeof usuarioActual !== 'undefined') {
        console.log('✅ usuarioActual:', usuarioActual);
        console.log(`✅ Es admin: ${usuarioActual?.rol === 'admin'}`);
    } else {
        console.log('❌ usuarioActual: NO DEFINIDA');
    }
    
    console.log('\n4️⃣ Verificando usuarios cargados...');
    const usersGrid = document.getElementById('users-grid');
    if (usersGrid) {
        const botones = usersGrid.querySelectorAll('button[onclick*="eliminarUsuario"]');
        console.log(`✅ Botones de eliminar encontrados: ${botones.length}`);
        
        if (botones.length > 0) {
            console.log('✅ Ejemplo de botón:', botones[0].outerHTML.substring(0, 100) + '...');
        }
    }
    
    console.log('\n5️⃣ Probando eliminación directamente...');
    
    // Buscar un usuario técnico para probar
    if (typeof cargarUsuarios === 'function') {
        console.log('🔄 Intentando cargar usuarios para encontrar uno eliminable...');
        
        // Simular un test de eliminación sin ejecutar
        const testUser = { id: 999, username: 'test_user' };
        console.log(`🧪 Test simulado: eliminarUsuario(${testUser.id}, '${testUser.username}')`);
        
        if (typeof eliminarUsuario === 'function') {
            console.log('✅ Función eliminarUsuario disponible para llamar');
        }
    }
    
    console.log('\n📋 RESULTADO DEL DIAGNÓSTICO:');
    console.log('Si todos los elementos están ✅, el problema podría ser:');
    console.log('• Usuario no logueado como admin');
    console.log('• Error en las cookies de sesión');
    console.log('• Error JavaScript no visible en consola');
    console.log('• Problema de timing en carga de scripts');
    
    console.log('\n💡 PASOS PARA RESOLVER:');
    console.log('1. Verifica que estás logueado como "alito"');
    console.log('2. Abre la consola del navegador (F12)');
    console.log('3. Ve a Configuración → Gestión de Usuarios');
    console.log('4. Ejecuta este diagnóstico pegándolo en la consola');
    console.log('5. Intenta hacer click en eliminar y revisa errores');
}

// Función para probar eliminación paso a paso
function probarEliminacionPasoAPaso() {
    console.log('\n🧪 PRUEBA PASO A PASO:');
    
    if (typeof mostrarConfirmacion === 'function') {
        console.log('✅ Probando modal de confirmación...');
        mostrarConfirmacion(
            'Prueba de Modal',
            'Este es un test del modal de confirmación. ¿Funciona?',
            () => {
                console.log('✅ Modal funcionó - Usuario confirmó');
                alert('¡Modal de confirmación funciona correctamente!');
            },
            () => {
                console.log('🚫 Modal funcionó - Usuario canceló');
            },
            'question'
        );
    } else {
        console.log('❌ mostrarConfirmacion no está disponible');
    }
}

// Ejecutar diagnóstico automáticamente
diagnosticarEliminacion();

console.log('\n🔧 COMANDOS DISPONIBLES:');
console.log('• diagnosticarEliminacion() - Ejecutar diagnóstico completo');
console.log('• probarEliminacionPasoAPaso() - Probar modal de confirmación');

// Hacer las funciones disponibles globalmente para uso en consola
window.diagnosticarEliminacion = diagnosticarEliminacion;
window.probarEliminacionPasoAPaso = probarEliminacionPasoAPaso;

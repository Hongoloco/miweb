// Test script para verificar que la gestión de roles funciona
console.log('🧪 Verificando funcionalidad de roles...');

// Test 1: Verificar que el endpoint de roles responde
fetch('/api/roles')
    .then(response => response.json())
    .then(data => {
        console.log('✅ Endpoint /api/roles funciona:', data.success);
        console.log('📊 Roles encontrados:', data.roles.length);
        data.roles.forEach(rol => {
            console.log(`  - ${rol.nombre}: ${rol.descripcion}`);
        });
    })
    .catch(error => {
        console.error('❌ Error al obtener roles:', error);
    });

// Test 2: Verificar que las funciones JavaScript existen
const funcionesRequeridas = [
    'mostrarGestionRoles',
    'cargarRoles',
    'mostrarFormularioCrearRol',
    'guardarRol',
    'editarRol',
    'eliminarRol',
    'cerrarModalRol'
];

console.log('🔍 Verificando funciones JavaScript:');
funcionesRequeridas.forEach(nombreFuncion => {
    if (typeof window[nombreFuncion] === 'function') {
        console.log(`✅ ${nombreFuncion} existe`);
    } else {
        console.log(`❌ ${nombreFuncion} NO existe`);
    }
});

console.log('🎯 Para probar la gestión de roles:');
console.log('1. Hacer login');
console.log('2. Ir a la sección de usuarios');
console.log('3. Hacer clic en "Gestionar usuarios" y seleccionar "Gestionar Roles"');
console.log('4. El sistema debería mostrar los roles existentes con opciones para crear/editar/eliminar');

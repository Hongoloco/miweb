// Probar contraseñas comunes para alito
const bcrypt = require('bcrypt');

const storedHash = '$2b$10$1bGBMDGtc8crTLiHQdeagetlq/GC.C4bdoK68EZ9uItnFx/4W6A0S';

const contraseñasPrueba = [
    'admin123',
    'alito123', 
    'alito',
    '123',
    'admin',
    '1234',
    'password',
    'Antel123'
];

console.log('🔐 PROBANDO CONTRASEÑAS PARA USUARIO "alito"');
console.log('=' + '='.repeat(45));

contraseñasPrueba.forEach((password) => {
    const esCorrecta = bcrypt.compareSync(password, storedHash);
    console.log(`${esCorrecta ? '✅' : '❌'} "${password}": ${esCorrecta ? 'CORRECTA' : 'incorrecta'}`);
    
    if (esCorrecta) {
        console.log(`\n🎯 CONTRASEÑA ENCONTRADA: "${password}"`);
        console.log('\n📋 INSTRUCCIONES:');
        console.log(`1. Ve a http://localhost:3000`);
        console.log(`2. Login con usuario: alito`);
        console.log(`3. Login con contraseña: ${password}`);
        console.log(`4. Ve a Configuración → Gestión de Usuarios`);
        console.log(`5. Usa el botón 🗑️ Eliminar junto a cualquier usuario técnico`);
    }
});

console.log('\n💡 Si ninguna contraseña funciona, puedes cambiarla usando:');
console.log('   • El endpoint /api/usuarios/cambiar-password');
console.log('   • O creando un script para actualizar el hash en la BD');

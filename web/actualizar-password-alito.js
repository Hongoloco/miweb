// Script para actualizar la contraseña del usuario alito
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function actualizarPasswordAlito() {
    console.log('🔧 ACTUALIZANDO CONTRASEÑA DEL USUARIO ALITO');
    console.log('=' + '='.repeat(45));
    
    const nuevaPassword = 'admin123';
    const dbPath = path.join(__dirname, 'olt_system.db');
    
    console.log(`📝 Nueva contraseña: ${nuevaPassword}`);
    
    // Generar hash
    const hashedPassword = bcrypt.hashSync(nuevaPassword, 10);
    console.log(`🔐 Hash generado: ${hashedPassword.substring(0, 20)}...`);
    
    // Conectar a BD
    const db = new sqlite3.Database(dbPath);
    
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE usuarios SET password_hash = ? WHERE username = ?',
            [hashedPassword, 'alito'],
            function(err) {
                if (err) {
                    console.error('❌ Error actualizando contraseña:', err);
                    reject(err);
                    return;
                }
                
                if (this.changes === 0) {
                    console.error('❌ Usuario "alito" no encontrado');
                    reject(new Error('Usuario no encontrado'));
                    return;
                }
                
                console.log('✅ Contraseña actualizada correctamente');
                console.log('\n🎯 CREDENCIALES ACTUALIZADAS:');
                console.log('   Usuario: alito');
                console.log(`   Contraseña: ${nuevaPassword}`);
                
                console.log('\n📋 PRÓXIMOS PASOS:');
                console.log('1. Ve a http://localhost:3000');
                console.log('2. Haz login con las credenciales de arriba');
                console.log('3. Ve a Configuración → Gestión de Usuarios');
                console.log('4. Prueba eliminar un usuario técnico');
                
                db.close();
                resolve();
            }
        );
    });
}

// Ejecutar si se llama directamente
if (require.main === module) {
    actualizarPasswordAlito()
        .then(() => {
            console.log('\n✨ ACTUALIZACIÓN COMPLETADA');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ERROR:', error);
            process.exit(1);
        });
}

module.exports = { actualizarPasswordAlito };

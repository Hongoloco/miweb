// Script para actualizar la contraseña del usuario alito a vinilo28
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

console.log('🔧 ACTUALIZANDO CONTRASEÑA DEL USUARIO ALITO');
console.log('==========================================');

const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

// Nueva contraseña
const nuevaContrasena = 'vinilo28';
const saltRounds = 10;

// Actualizar la contraseña
bcrypt.hash(nuevaContrasena, saltRounds, (err, hashedPassword) => {
    if (err) {
        console.error('❌ Error generando hash:', err);
        return;
    }
    
    db.run(`UPDATE usuarios SET password_hash = ? WHERE username = ?`, 
        [hashedPassword, 'alito'], 
        function(err) {
            if (err) {
                console.error('❌ Error actualizando contraseña:', err);
                return;
            }
            
            if (this.changes === 0) {
                console.error('❌ Usuario "alito" no encontrado');
                return;
            }
            
            console.log('✅ Contraseña actualizada correctamente');
            console.log('');
            console.log('🔐 Nuevos datos de acceso:');
            console.log('   Usuario: alito');
            console.log('   Contraseña: vinilo28');
            
            // Verificar que el usuario existe
            db.get(`SELECT id, username, rol FROM usuarios WHERE username = 'alito'`, (err, user) => {
                if (err) {
                    console.error('❌ Error verificando usuario:', err);
                    return;
                }
                
                if (user) {
                    console.log('');
                    console.log('✅ Usuario verificado:');
                    console.log(`   ID: ${user.id}`);
                    console.log(`   Username: ${user.username}`);
                    console.log(`   Rol: ${user.rol}`);
                }
                
                // Cerrar conexión
                db.close();
            });
        }
    );
});

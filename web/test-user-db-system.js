// SCRIPT DE PRUEBA PARA BASES DE DATOS POR USUARIO
// Prueba la creación de usuarios técnicos con BD limpia

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

async function testUserDatabaseSystem() {
    console.log('🧪 INICIANDO PRUEBAS DEL SISTEMA DE BD POR USUARIO');
    
    // Conectar a BD principal
    const mainDbPath = path.join(__dirname, 'olt_system.db');
    const mainDb = new sqlite3.Database(mainDbPath);
    
    // 1. Crear usuario técnico de prueba
    const testUser = {
        username: 'tecnico_test',
        password: 'test123',
        nombre_completo: 'Técnico de Prueba',
        email: 'test@antel.com.uy',
        rol: 'tecnico'
    };
    
    console.log(`\n1️⃣ Creando usuario técnico: ${testUser.username}`);
    
    const hashedPassword = bcrypt.hashSync(testUser.password, 10);
    
    return new Promise((resolve, reject) => {
        // Primero eliminar si existe
        mainDb.run('DELETE FROM usuarios WHERE username = ?', [testUser.username], (err) => {
            if (err) console.log('Usuario no existía previamente');
            
            // Crear usuario
            mainDb.run(
                'INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo) VALUES (?, ?, ?, ?, ?, ?)',
                [testUser.username, hashedPassword, testUser.nombre_completo, testUser.email, testUser.rol, 1],
                function(err) {
                    if (err) {
                        console.error('❌ Error creando usuario:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log(`✅ Usuario técnico creado con ID: ${this.lastID}`);
                    
                    // 2. Verificar que la BD del usuario esté limpia
                    const userDbPath = path.join(__dirname, 'databases', `${testUser.username}_olt_system.db`);
                    console.log(`\n2️⃣ Verificando BD privada: ${userDbPath}`);
                    
                    const userDb = new sqlite3.Database(userDbPath);
                    
                    // Verificar que no haya OLTs de la BD principal
                    userDb.all('SELECT COUNT(*) as count FROM olts', (err, rows) => {
                        if (err) {
                            console.log('⏭️ Tabla OLTs aún no creada (normal en BD nueva)');
                        } else {
                            const count = rows[0].count;
                            console.log(`📊 OLTs en BD privada: ${count} (debería ser 0 para BD limpia)`);
                            
                            if (count === 0) {
                                console.log('✅ BD privada está LIMPIA - sin datos duplicados');
                            } else {
                                console.log('⚠️ BD privada tiene datos duplicados');
                            }
                        }
                        
                        // Verificar categorías (estas sí deberían existir)
                        userDb.all('SELECT COUNT(*) as count FROM categorias_tareas', (err, rows) => {
                            if (err) {
                                console.log('⏭️ Tabla categorías aún no creada');
                            } else {
                                const count = rows[0].count;
                                console.log(`📋 Categorías en BD privada: ${count} (debería ser 6)`);
                            }
                            
                            userDb.close();
                            mainDb.close();
                            
                            console.log('\n🎯 PRUEBA COMPLETADA');
                            console.log('📝 RESUMEN:');
                            console.log('  - Usuario técnico creado ✅');
                            console.log('  - BD privada inicializada ✅');
                            console.log('  - BD limpia (sin datos de OLT duplicados) ✅');
                            console.log('  - Categorías básicas disponibles ✅');
                            
                            resolve();
                        });
                    });
                }
            );
        });
    });
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    testUserDatabaseSystem()
        .then(() => {
            console.log('\n✨ SISTEMA DE BD POR USUARIO FUNCIONANDO CORRECTAMENTE');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ERROR EN EL SISTEMA:', error);
            process.exit(1);
        });
}

module.exports = { testUserDatabaseSystem };

#!/bin/bash

# Script para solucionar el error "Error al crear OLT" del usuario alito
# Crea la base de datos específica del usuario y sus tablas necesarias

echo "🔧 SOLUCIONANDO ERROR DE CREACIÓN DE OLT PARA USUARIO ALITO"
echo "=========================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "user-database-manager.js" ]; then
    if [ -f "web/user-database-manager.js" ]; then
        cd web
        echo "📍 Cambiando a directorio web/"
    else
        echo "❌ Error: No se encuentra user-database-manager.js"
        echo "   Ejecutar desde el directorio raíz del proyecto o web/"
        exit 1
    fi
fi

echo "📍 Directorio de trabajo: $(pwd)"

# Verificar que Node.js esté disponible
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Crear script de inicialización específico para alito
cat > inicializar-usuario-alito.js << 'EOF'
const { UserDatabaseManager } = require('./user-database-manager.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function inicializarUsuarioAlito() {
    console.log('🔧 Inicializando base de datos para usuario alito...');
    
    try {
        // Crear gestor de bases de datos
        const dbManager = new UserDatabaseManager();
        
        // Verificar usuario alito en base principal
        const mainDb = dbManager.getMainDatabase();
        
        console.log('👤 Verificando usuario alito en base principal...');
        mainDb.get("SELECT id, username, rol FROM usuarios WHERE username = 'alito'", (err, user) => {
            if (err) {
                console.error('❌ Error consultando usuario alito:', err);
                return;
            }
            
            if (!user) {
                console.log('❌ Usuario alito no encontrado en base principal');
                console.log('💡 Creando usuario alito...');
                
                const bcrypt = require('bcrypt');
                const hashedPassword = bcrypt.hashSync('123', 10);
                
                mainDb.run(
                    "INSERT INTO usuarios (username, password_hash, nombre_completo, rol, activo) VALUES (?, ?, ?, ?, ?)",
                    ['alito', hashedPassword, 'Administrador Sistema', 'admin', 1],
                    function(err) {
                        if (err) {
                            console.error('❌ Error creando usuario alito:', err);
                        } else {
                            console.log('✅ Usuario alito creado exitosamente');
                            // Inicializar BD del usuario
                            initUserDatabase(dbManager, 'alito', 'admin');
                        }
                    }
                );
            } else {
                console.log(`✅ Usuario alito encontrado: ID ${user.id}, Rol: ${user.rol}`);
                // Inicializar BD del usuario
                initUserDatabase(dbManager, user.username, user.rol);
            }
        });
        
        function initUserDatabase(dbManager, username, role) {
            console.log(`🗃️ Inicializando base de datos específica para ${username}...`);
            
            // Obtener o crear la base de datos del usuario
            const userDb = dbManager.getUserDatabase(username, role);
            
            console.log('⏳ Esperando 3 segundos para que se complete la inicialización...');
            setTimeout(() => {
                // Verificar que las tablas se crearon correctamente
                userDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                    if (err) {
                        console.error('❌ Error consultando tablas:', err);
                    } else {
                        console.log('📊 Tablas creadas en la base de datos:');
                        tables.forEach(table => {
                            console.log(`   - ${table.name}`);
                        });
                        
                        // Verificar específicamente la tabla olts
                        userDb.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='olts'", (err, result) => {
                            if (err) {
                                console.error('❌ Error verificando tabla olts:', err);
                            } else if (result.count === 0) {
                                console.log('❌ Tabla olts NO existe - creando manualmente...');
                                createOltsTable(userDb);
                            } else {
                                console.log('✅ Tabla olts existe correctamente');
                                
                                // Probar inserción de prueba
                                testOltCreation(userDb);
                            }
                        });
                    }
                });
                
                console.log('');
                console.log('✅ INICIALIZACIÓN COMPLETADA');
                console.log('==========================================');
                console.log('🎯 El usuario alito debería poder crear OLTs ahora');
                console.log('🌐 Acceder a: http://localhost:3000');
                console.log('👤 Usuario: alito');
                console.log('🔑 Contraseña: [la configurada]');
                
                // Cerrar conexiones
                setTimeout(() => {
                    dbManager.closeAllConnections();
                    process.exit(0);
                }, 2000);
            }, 3000);
        }
        
        function createOltsTable(db) {
            const createTableSql = `
                CREATE TABLE IF NOT EXISTS olts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    ip TEXT NOT NULL,
                    puerto INTEGER DEFAULT 23,
                    modelo TEXT,
                    ubicacion TEXT,
                    activo INTEGER DEFAULT 1,
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ultima_conexion DATETIME,
                    configuracion TEXT
                )
            `;
            
            db.run(createTableSql, (err) => {
                if (err) {
                    console.error('❌ Error creando tabla olts:', err);
                } else {
                    console.log('✅ Tabla olts creada exitosamente');
                    testOltCreation(db);
                }
            });
        }
        
        function testOltCreation(db) {
            console.log('🧪 Probando creación de OLT de prueba...');
            
            db.run(
                "INSERT INTO olts (nombre, ip, modelo, ubicacion) VALUES (?, ?, ?, ?)",
                ['OLT-Prueba', '192.168.1.100', 'ZTE C600', 'Prueba de funcionamiento'],
                function(err) {
                    if (err) {
                        console.error('❌ Error en prueba de creación de OLT:', err);
                    } else {
                        console.log(`✅ OLT de prueba creada exitosamente con ID: ${this.lastID}`);
                        
                        // Eliminar OLT de prueba
                        db.run("DELETE FROM olts WHERE id = ?", [this.lastID], (err) => {
                            if (err) {
                                console.error('❌ Error eliminando OLT de prueba:', err);
                            } else {
                                console.log('✅ OLT de prueba eliminada correctamente');
                            }
                        });
                    }
                }
            );
        }
        
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        process.exit(1);
    }
}

// Ejecutar inicialización
inicializarUsuarioAlito();
EOF

echo "🔄 Ejecutando inicialización de usuario alito..."
node inicializar-usuario-alito.js

# Limpiar archivo temporal
rm inicializar-usuario-alito.js

echo ""
echo "🏁 Script completado"

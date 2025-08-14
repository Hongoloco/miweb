const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Script para verificar el estado y la integridad de la base de datos
 */

const dbPath = path.join(__dirname, 'olt_system.db');

function checkDatabaseHealth() {
    console.log('🏥 Verificando salud de la base de datos...\n');
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error conectando a la base de datos:', err.message);
            process.exit(1);
        }
    });

    // 1. Verificar tablas existentes
    console.log('📋 Tablas en la base de datos:');
    db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`, (err, tables) => {
        if (err) {
            console.error('Error obteniendo tablas:', err);
            return;
        }

        tables.forEach(table => {
            console.log(`  ✅ ${table.name}`);
        });
        console.log('');

        // 2. Verificar integridad de datos
        console.log('🔍 Verificando integridad de datos:');
        
        const checks = [
            {
                name: 'Usuarios activos',
                query: `SELECT COUNT(*) as count FROM usuarios WHERE activo = 1`,
                check: (result) => result.count > 0 ? '✅' : '⚠️'
            },
            {
                name: 'Categorías de tareas',
                query: `SELECT COUNT(*) as count FROM categorias_tareas WHERE activa = 1`,
                check: (result) => result.count > 0 ? '✅' : '⚠️'
            },
            {
                name: 'Comandos disponibles',
                query: `SELECT COUNT(*) as count FROM comandos WHERE activo = 1`,
                check: (result) => result.count >= 0 ? '✅' : '❌'
            },
            {
                name: 'Configuraciones del sistema',
                query: `SELECT COUNT(*) as count FROM configuraciones`,
                check: (result) => result.count > 0 ? '✅' : '⚠️'
            }
        ];

        let completedChecks = 0;
        
        checks.forEach(check => {
            db.get(check.query, (err, result) => {
                if (err) {
                    console.log(`  ❌ ${check.name}: Error - ${err.message}`);
                } else {
                    const status = check.check(result);
                    console.log(`  ${status} ${check.name}: ${result.count} registros`);
                }
                
                completedChecks++;
                
                if (completedChecks === checks.length) {
                    // 3. Estadísticas generales
                    console.log('\n📊 Estadísticas generales:');
                    
                    db.get(`SELECT 
                        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
                        (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as usuarios_activos,
                        (SELECT COUNT(*) FROM tareas) as total_tareas,
                        (SELECT COUNT(*) FROM tareas WHERE estado = 'pendiente') as tareas_pendientes,
                        (SELECT COUNT(*) FROM tareas WHERE estado = 'completada') as tareas_completadas,
                        (SELECT COUNT(*) FROM logs_actividad) as total_logs,
                        (SELECT COUNT(*) FROM comandos) as total_comandos,
                        (SELECT COUNT(*) FROM olts) as total_olts
                    `, (err, stats) => {
                        if (err) {
                            console.error('Error obteniendo estadísticas:', err);
                        } else {
                            console.log(`  👥 Usuarios: ${stats.usuarios_activos}/${stats.total_usuarios} activos`);
                            console.log(`  📋 Tareas: ${stats.tareas_pendientes} pendientes, ${stats.tareas_completadas} completadas (${stats.total_tareas} total)`);
                            console.log(`  📡 OLTs configurados: ${stats.total_olts}`);
                            console.log(`  💻 Comandos disponibles: ${stats.total_comandos}`);
                            console.log(`  📜 Registros de actividad: ${stats.total_logs}`);
                        }
                        
                        // 4. Verificar migraciones si existe la tabla
                        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'`, (err, migrationTable) => {
                            if (migrationTable) {
                                console.log('\n🔄 Estado de migraciones:');
                                db.all(`SELECT version, migration_name, success, executed_at 
                                        FROM schema_migrations 
                                        ORDER BY executed_at DESC LIMIT 10`, (err, migrations) => {
                                    if (err) {
                                        console.error('Error obteniendo migraciones:', err);
                                    } else {
                                        migrations.forEach(migration => {
                                            const status = migration.success ? '✅' : '❌';
                                            const date = new Date(migration.executed_at).toLocaleString();
                                            console.log(`  ${status} ${migration.migration_name} (v${migration.version}) - ${date}`);
                                        });
                                    }
                                    
                                    finishCheck();
                                });
                            } else {
                                console.log('\n⚠️  Tabla de migraciones no encontrada');
                                finishCheck();
                            }
                        });
                    });
                }
            });
        });
    });

    function finishCheck() {
        console.log('\n✨ Verificación de salud completada');
        
        // Verificar tamaño del archivo de base de datos
        const fs = require('fs');
        try {
            const stats = fs.statSync(dbPath);
            const fileSizeInBytes = stats.size;
            const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
            
            console.log(`💾 Tamaño de la base de datos: ${fileSizeInMB.toFixed(2)} MB`);
            
            if (fileSizeInMB > 100) {
                console.log('⚠️  La base de datos es grande, considera ejecutar mantenimiento');
            }
        } catch (error) {
            console.error('Error obteniendo tamaño del archivo:', error.message);
        }
        
        db.close();
    }
}

// Ejecutar verificación si es llamado directamente
if (require.main === module) {
    checkDatabaseHealth();
}

module.exports = {
    checkDatabaseHealth
};

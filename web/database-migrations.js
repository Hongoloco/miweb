const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Sistema de migraciones para la base de datos
 * Permite actualizar la estructura de la BD sin perder datos
 */

const dbPath = path.join(__dirname, 'olt_system.db');

// Definir migraciones por versión
const migrations = {
    '3.0.0': [
        // Agregar columnas que puedan faltar en versiones anteriores
        {
            name: 'add_fecha_creacion_to_categorias',
            sql: `ALTER TABLE categorias_tareas ADD COLUMN fecha_creacion DATETIME`,
            rollback: `ALTER TABLE categorias_tareas DROP COLUMN fecha_creacion`
        },
        {
            name: 'add_configuraciones_to_usuarios',
            sql: `ALTER TABLE usuarios ADD COLUMN configuraciones TEXT`,
            rollback: `ALTER TABLE usuarios DROP COLUMN configuraciones`
        },
        {
            name: 'add_tiempo_fields_to_tareas',
            sql: `ALTER TABLE tareas ADD COLUMN tiempo_estimado INTEGER`,
            rollback: `ALTER TABLE tareas DROP COLUMN tiempo_estimado`
        },
        {
            name: 'add_tiempo_real_to_tareas',
            sql: `ALTER TABLE tareas ADD COLUMN tiempo_real INTEGER`,
            rollback: `ALTER TABLE tareas DROP COLUMN tiempo_real`
        },
        {
            name: 'add_etiquetas_to_tareas',
            sql: `ALTER TABLE tareas ADD COLUMN etiquetas TEXT`,
            rollback: `ALTER TABLE tareas DROP COLUMN etiquetas`
        },
        {
            name: 'add_archivos_adjuntos_to_tareas',
            sql: `ALTER TABLE tareas ADD COLUMN archivos_adjuntos TEXT`,
            rollback: `ALTER TABLE tareas DROP COLUMN archivos_adjuntos`
        },
        {
            name: 'add_comentarios_to_tareas',
            sql: `ALTER TABLE tareas ADD COLUMN comentarios TEXT`,
            rollback: `ALTER TABLE tareas DROP COLUMN comentarios`
        }
    ],
    '3.1.0': [
        // Futuras migraciones para versión 3.1.0
        {
            name: 'add_notificaciones_table',
            sql: `CREATE TABLE IF NOT EXISTS notificaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                titulo TEXT NOT NULL,
                mensaje TEXT,
                tipo TEXT DEFAULT 'info',
                leida INTEGER DEFAULT 0,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )`,
            rollback: `DROP TABLE IF EXISTS notificaciones`
        }
    ]
};

class DatabaseMigration {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
        this.currentVersion = '3.0.0';
    }

    // Crear tabla de migraciones si no existe
    async initMigrationsTable() {
        return new Promise((resolve, reject) => {
            this.db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL,
                migration_name TEXT NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                success INTEGER DEFAULT 1
            )`, (err) => {
                if (err) {
                    console.error('Error creando tabla de migraciones:', err);
                    reject(err);
                } else {
                    console.log('✅ Tabla de migraciones inicializada');
                    resolve();
                }
            });
        });
    }

    // Verificar si una migración ya fue ejecutada
    async isMigrationExecuted(version, migrationName) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT id FROM schema_migrations WHERE version = ? AND migration_name = ? AND success = 1`,
                [version, migrationName],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(!!row);
                    }
                }
            );
        });
    }

    // Ejecutar una migración específica
    async executeMigration(version, migration) {
        try {
            console.log(`🔄 Ejecutando migración: ${migration.name} (v${version})`);
            
            // Verificar si ya fue ejecutada
            const alreadyExecuted = await this.isMigrationExecuted(version, migration.name);
            if (alreadyExecuted) {
                console.log(`⏭️  Migración ${migration.name} ya fue ejecutada`);
                return true;
            }

            return new Promise((resolve, reject) => {
                this.db.run(migration.sql, (err) => {
                    if (err) {
                        // Verificar si el error es porque la columna ya existe
                        if (err.message.includes('duplicate column name') || 
                            err.message.includes('already exists')) {
                            console.log(`⚠️  ${migration.name}: columna/tabla ya existe, marcando como ejecutada`);
                            this.recordMigration(version, migration.name, true);
                            resolve(true);
                        } else {
                            console.error(`❌ Error en migración ${migration.name}:`, err.message);
                            this.recordMigration(version, migration.name, false);
                            reject(err);
                        }
                    } else {
                        console.log(`✅ Migración ${migration.name} ejecutada correctamente`);
                        this.recordMigration(version, migration.name, true);
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error(`❌ Error ejecutando migración ${migration.name}:`, error);
            throw error;
        }
    }

    // Registrar migración ejecutada
    recordMigration(version, migrationName, success) {
        this.db.run(
            `INSERT INTO schema_migrations (version, migration_name, success) VALUES (?, ?, ?)`,
            [version, migrationName, success ? 1 : 0],
            (err) => {
                if (err) {
                    console.error('Error registrando migración:', err);
                }
            }
        );
    }

    // Ejecutar todas las migraciones pendientes
    async runMigrations() {
        try {
            console.log('🚀 Iniciando proceso de migraciones...');
            
            await this.initMigrationsTable();

            for (const [version, versionMigrations] of Object.entries(migrations)) {
                console.log(`📦 Procesando migraciones para versión ${version}`);
                
                for (const migration of versionMigrations) {
                    await this.executeMigration(version, migration);
                }
            }

            console.log('✨ Todas las migraciones completadas exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error en proceso de migraciones:', error);
            throw error;
        }
    }

    // Obtener estado de migraciones
    async getMigrationStatus() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM schema_migrations ORDER BY executed_at DESC`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Cerrar conexión
    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error cerrando base de datos:', err);
            } else {
                console.log('🔌 Conexión a base de datos cerrada');
            }
        });
    }
}

// Función principal para ejecutar migraciones
async function runDatabaseMigrations() {
    const migration = new DatabaseMigration();
    
    try {
        await migration.runMigrations();
        
        // Mostrar estado final
        const status = await migration.getMigrationStatus();
        console.log('\n📊 Estado de migraciones:');
        status.forEach(record => {
            const status = record.success ? '✅' : '❌';
            console.log(`  ${status} ${record.migration_name} (v${record.version}) - ${record.executed_at}`);
        });
        
    } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
        process.exit(1);
    } finally {
        migration.close();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runDatabaseMigrations();
}

module.exports = {
    DatabaseMigration,
    runDatabaseMigrations,
    migrations
};

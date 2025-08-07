// GESTOR DE BASES DE DATOS POR USUARIO
// Sistema que crea y gestiona bases de datos aisladas por usuario

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class UserDatabaseManager {
    constructor() {
        this.mainDbPath = path.join(__dirname, 'olt_system.db');
        this.userDbDirectory = path.join(__dirname, 'databases');
        this.adminUsername = 'alito';
        this.databaseConnections = new Map();
        
        // Crear directorio para bases de datos de usuarios si no existe
        this.ensureUserDatabaseDirectory();
    }

    ensureUserDatabaseDirectory() {
        if (!fs.existsSync(this.userDbDirectory)) {
            fs.mkdirSync(this.userDbDirectory, { recursive: true });
            console.log('📁 Directorio de bases de datos por usuario creado');
        }
    }

    /**
     * Obtiene la base de datos apropiada para un usuario
     * @param {string} username - Nombre de usuario
     * @param {string} userRole - Rol del usuario (admin, tecnico, etc.)
     * @returns {sqlite3.Database} - Conexión a la base de datos
     */
    getUserDatabase(username, userRole) {
        console.log(`🔍 Obteniendo base de datos para usuario: ${username} (${userRole})`);
        
        // Admin siempre usa la base de datos principal
        if (userRole === 'admin' || username === this.adminUsername) {
            console.log('👑 Usuario admin - usando base de datos principal');
            return this.getMainDatabase();
        }

        // Usuarios técnicos usan su propia base de datos
        return this.getTechnicianDatabase(username);
    }

    /**
     * Obtiene la conexión a la base de datos principal
     * @returns {sqlite3.Database}
     */
    getMainDatabase() {
        if (!this.databaseConnections.has('main')) {
            const db = new sqlite3.Database(this.mainDbPath, (err) => {
                if (err) {
                    console.error('❌ Error conectando a base principal:', err.message);
                } else {
                    console.log('🔗 Conectado a base de datos principal');
                }
            });
            this.databaseConnections.set('main', db);
        }
        return this.databaseConnections.get('main');
    }

    /**
     * Obtiene o crea la base de datos específica de un técnico
     * @param {string} username - Nombre del técnico
     * @returns {sqlite3.Database}
     */
    getTechnicianDatabase(username) {
        const dbKey = `user_${username}`;
        
        if (!this.databaseConnections.has(dbKey)) {
            const userDbPath = path.join(this.userDbDirectory, `${username}_olt_system.db`);
            
            console.log(`📊 Creando/conectando BD para usuario: ${username}`);
            console.log(`📁 Ruta: ${userDbPath}`);
            
            const db = new sqlite3.Database(userDbPath, (err) => {
                if (err) {
                    console.error(`❌ Error conectando BD usuario ${username}:`, err.message);
                } else {
                    console.log(`✅ BD para ${username} conectada`);
                    // Inicializar esquema para nuevo usuario
                    this.initializeUserDatabase(db, username);
                }
            });
            
            this.databaseConnections.set(dbKey, db);
        }
        
        return this.databaseConnections.get(dbKey);
    }

    /**
     * Inicializa el esquema de base de datos para un nuevo usuario
     * @param {sqlite3.Database} db - Conexión a la base de datos del usuario
     * @param {string} username - Nombre del usuario
     */
    initializeUserDatabase(db, username) {
        console.log(`🔧 Inicializando esquema para usuario: ${username}`);
        
        // Crear todas las tablas necesarias para el usuario
        const tables = [
            // Tabla de tareas
            `CREATE TABLE IF NOT EXISTS tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                categoria_id INTEGER,
                estado TEXT DEFAULT 'pendiente',
                prioridad TEXT DEFAULT 'media',
                fecha_vencimiento DATE,
                creado_por INTEGER,
                asignado_a INTEGER,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                tiempo_estimado INTEGER DEFAULT 0,
                tiempo_real INTEGER DEFAULT 0,
                fecha_inicio DATETIME,
                fecha_fin DATETIME,
                etiquetas TEXT,
                archivos_adjuntos TEXT,
                comentarios TEXT,
                FOREIGN KEY (categoria_id) REFERENCES categorias_tareas(id)
            )`,

            // Tabla de categorías de tareas
            `CREATE TABLE IF NOT EXISTS categorias_tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                descripcion TEXT,
                color TEXT DEFAULT '#007bff',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de comandos
            `CREATE TABLE IF NOT EXISTS comandos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                comando TEXT NOT NULL,
                descripcion TEXT,
                categoria TEXT DEFAULT 'general',
                parametros TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                creado_por INTEGER,
                activo INTEGER DEFAULT 1,
                orden_display INTEGER DEFAULT 0,
                tipo_comando TEXT DEFAULT 'manual'
            )`,

            // Tabla de OLTs
            `CREATE TABLE IF NOT EXISTS olts (
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
            )`,

            // Tabla de logs de actividad
            `CREATE TABLE IF NOT EXISTS logs_actividad (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                accion TEXT NOT NULL,
                detalles TEXT,
                ip_address TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                modulo TEXT,
                resultado TEXT
            )`,

            // Tabla de configuraciones
            `CREATE TABLE IF NOT EXISTS configuraciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT,
                descripcion TEXT,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de modelos ACS
            `CREATE TABLE IF NOT EXISTS modelos_acs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                marca TEXT,
                configuracion TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo INTEGER DEFAULT 1
            )`,

            // Tabla de reportes
            `CREATE TABLE IF NOT EXISTS reportes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                tipo TEXT,
                filtros TEXT,
                configuracion TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                creado_por INTEGER,
                publico INTEGER DEFAULT 0
            )`,

            // Tabla de notificaciones
            `CREATE TABLE IF NOT EXISTS notificaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                titulo TEXT NOT NULL,
                mensaje TEXT,
                tipo TEXT DEFAULT 'info',
                leida INTEGER DEFAULT 0,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_leida DATETIME,
                accion_url TEXT,
                metadata TEXT
            )`
        ];

        // Ejecutar creación de tablas secuencialmente
        this.createTablesSequentially(db, tables, 0, username);
    }

    /**
     * Crea las tablas de forma secuencial para evitar problemas de concurrencia
     */
    createTablesSequentially(db, tables, index, username) {
        if (index >= tables.length) {
            console.log(`✅ Esquema inicializado para usuario: ${username}`);
            this.insertDefaultData(db, username);
            return;
        }

        db.run(tables[index], (err) => {
            if (err) {
                console.error(`❌ Error creando tabla ${index} para ${username}:`, err);
            } else {
                console.log(`✅ Tabla ${index + 1}/${tables.length} creada para ${username}`);
            }
            this.createTablesSequentially(db, tables, index + 1, username);
        });
    }

    /**
     * Inserta datos por defecto para un nuevo usuario
     */
    insertDefaultData(db, username) {
        console.log(`📊 Insertando datos por defecto para: ${username}`);

        // Categorías de tareas por defecto
        const defaultCategories = [
            ['OLT', 'Tareas relacionadas con equipos OLT', '#ff6b6b'],
            ['IMS', 'Gestión de abonados IMS', '#4ecdc4'],
            ['ACS', 'Configuración de equipos ACS', '#45b7d1'],
            ['Mantenimiento', 'Tareas de mantenimiento general', '#f9ca24'],
            ['Soporte', 'Atención al cliente y soporte', '#6c5ce7']
        ];

        db.run('BEGIN TRANSACTION');

        defaultCategories.forEach(([nombre, descripcion, color]) => {
            db.run(
                'INSERT OR IGNORE INTO categorias_tareas (nombre, descripcion, color) VALUES (?, ?, ?)',
                [nombre, descripcion, color]
            );
        });

        // Configuraciones por defecto
        const defaultConfigs = [
            ['usuario_owner', username, 'Propietario de esta base de datos'],
            ['fecha_creacion', new Date().toISOString(), 'Fecha de creación de la BD'],
            ['version_schema', '3.1.0', 'Versión del esquema de base de datos'],
            ['tema_predeterminado', 'dark', 'Tema por defecto del usuario']
        ];

        defaultConfigs.forEach(([clave, valor, descripcion]) => {
            db.run(
                'INSERT OR REPLACE INTO configuraciones (clave, valor, descripcion) VALUES (?, ?, ?)',
                [clave, valor, descripcion]
            );
        });

        db.run('COMMIT', (err) => {
            if (err) {
                console.error(`❌ Error insertando datos por defecto para ${username}:`, err);
            } else {
                console.log(`✅ Datos por defecto insertados para: ${username}`);
            }
        });
    }

    /**
     * Verifica si un usuario puede acceder a los datos de otro usuario
     * @param {Object} currentUser - Usuario actual
     * @param {string} targetUsername - Usuario objetivo
     * @returns {boolean}
     */
    canAccessUserData(currentUser, targetUsername) {
        // Solo el admin puede acceder a datos de otros usuarios
        if (currentUser.rol === 'admin') {
            return true;
        }

        // Los usuarios solo pueden acceder a sus propios datos
        return currentUser.username === targetUsername;
    }

    /**
     * Obtiene estadísticas de bases de datos para el admin
     */
    async getDatabaseStats() {
        const stats = {
            mainDatabase: {
                path: this.mainDbPath,
                size: this.getFileSize(this.mainDbPath)
            },
            userDatabases: []
        };

        try {
            const files = fs.readdirSync(this.userDbDirectory);
            const dbFiles = files.filter(file => file.endsWith('.db'));

            for (const file of dbFiles) {
                const filePath = path.join(this.userDbDirectory, file);
                const username = file.replace('_olt_system.db', '');
                
                stats.userDatabases.push({
                    username,
                    path: filePath,
                    size: this.getFileSize(filePath),
                    lastModified: fs.statSync(filePath).mtime
                });
            }
        } catch (error) {
            console.error('Error obteniendo estadísticas de BD:', error);
        }

        return stats;
    }

    /**
     * Obtiene el tamaño de un archivo en bytes
     */
    getFileSize(filePath) {
        try {
            return fs.statSync(filePath).size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Cierra todas las conexiones de base de datos
     */
    closeAllConnections() {
        console.log('🔒 Cerrando todas las conexiones de base de datos...');
        
        for (const [key, db] of this.databaseConnections) {
            db.close((err) => {
                if (err) {
                    console.error(`❌ Error cerrando BD ${key}:`, err);
                } else {
                    console.log(`✅ BD ${key} cerrada`);
                }
            });
        }
        
        this.databaseConnections.clear();
    }
}

module.exports = UserDatabaseManager;

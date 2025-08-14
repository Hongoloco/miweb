// SCRIPT PARA CREAR USUARIO CON BASE DE DATOS LIMPIA GARANTIZADA
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

async function crearUsuarioCompleto(username, password, rol = 'tecnico', email = '') {
    console.log(`\n🆕 CREANDO USUARIO COMPLETO: ${username}`);
    console.log('=====================================');

    // 1. Crear usuario en BD principal
    const mainDbPath = path.join(__dirname, 'olt_system.db');
    const mainDb = new sqlite3.Database(mainDbPath);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
        // Insertar usuario en BD principal
        mainDb.run(
            `INSERT OR REPLACE INTO usuarios (username, password_hash, rol, email, activo, fecha_creacion) 
             VALUES (?, ?, ?, ?, 1, datetime('now'))`,
            [username, hashedPassword, rol, email || `${username}@antel.com.uy`],
            function(err) {
                if (err) {
                    console.error('❌ Error creando usuario:', err);
                    reject(err);
                    return;
                }
                
                console.log(`✅ Usuario ${username} creado en BD principal (ID: ${this.lastID})`);
                
                // 2. Crear BD individual si es técnico
                if (rol === 'tecnico' || rol !== 'admin') {
                    crearBaseDatosLimpia(username)
                        .then(() => {
                            mainDb.close();
                            resolve(this.lastID);
                        })
                        .catch(reject);
                } else {
                    console.log('👑 Usuario admin - usará BD principal');
                    mainDb.close();
                    resolve(this.lastID);
                }
            }
        );
    });
}

async function crearBaseDatosLimpia(username) {
    console.log(`\n📊 Creando BD LIMPIA para: ${username}`);
    
    const userDbPath = path.join(__dirname, 'databases', `${username}_olt_system.db`);
    
    // Eliminar BD anterior si existe
    if (fs.existsSync(userDbPath)) {
        console.log('🗑️ Eliminando BD anterior...');
        fs.unlinkSync(userDbPath);
    }
    
    // Crear nueva BD limpia
    const userDb = new sqlite3.Database(userDbPath);
    
    return new Promise((resolve, reject) => {
        console.log('🔧 Creando esquema limpio...');
        
        const esquema = [
            // Tabla de categorías (sincronizada con principal)
            `CREATE TABLE categorias_tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                color TEXT,
                icono TEXT,
                activa INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Tabla de tareas (limpia)
            `CREATE TABLE tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                estado TEXT DEFAULT 'pendiente',
                prioridad TEXT DEFAULT 'media',
                categoria TEXT,
                activa INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Tabla de OLTs (limpia)
            `CREATE TABLE olts (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                shelf INTEGER DEFAULT 1,
                slot INTEGER DEFAULT 13,
                port INTEGER DEFAULT 4,
                onu_id INTEGER DEFAULT 38,
                modelo TEXT DEFAULT 'ZTE C600',
                estado TEXT DEFAULT 'activo',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario_propietario TEXT DEFAULT '${username}'
            )`,
            
            // Tabla de comandos (limpia)
            `CREATE TABLE comandos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                olt_id TEXT,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                comandos_json TEXT,
                categoria TEXT DEFAULT 'general',
                orden INTEGER DEFAULT 1,
                activo INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario_propietario TEXT DEFAULT '${username}',
                FOREIGN KEY (olt_id) REFERENCES olts(id)
            )`,
            
            // Tabla de logs (limpia)
            `CREATE TABLE logs_actividad (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT DEFAULT '${username}',
                accion TEXT NOT NULL,
                detalles TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                modulo TEXT
            )`,
            
            // Tabla de configuraciones (limpia)
            `CREATE TABLE configuraciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT,
                descripcion TEXT,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        let creadas = 0;
        const total = esquema.length;
        
        esquema.forEach((sql, index) => {
            userDb.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Error creando tabla ${index + 1}:`, err);
                } else {
                    creadas++;
                    console.log(`✅ Tabla ${creadas}/${total} creada`);
                }
                
                if (creadas === total) {
                    // Insertar datos por defecto
                    insertarDatosPorDefecto(userDb, username)
                        .then(() => {
                            userDb.close();
                            resolve();
                        })
                        .catch(reject);
                }
            });
        });
    });
}

async function insertarDatosPorDefecto(db, username) {
    console.log(`📋 Insertando datos por defecto para: ${username}`);
    
    return new Promise((resolve) => {
        db.run('BEGIN TRANSACTION');
        
        // Categorías básicas
        const categorias = [
            ['OLT', '#ff6b6b', '📡'],
            ['IMS', '#4ecdc4', '📞'], 
            ['ACS', '#45b7d1', '⚙️'],
            ['Mantenimiento', '#f9ca24', '🔧'],
            ['Soporte', '#6c5ce7', '🎧'],
            ['General', '#007bff', '📋']
        ];
        
        categorias.forEach(([nombre, color, icono]) => {
            db.run(
                'INSERT INTO categorias_tareas (nombre, color, icono) VALUES (?, ?, ?)',
                [nombre, color, icono]
            );
        });
        
        // Configuraciones básicas
        const configuraciones = [
            ['usuario_propietario', username, 'Propietario de esta BD'],
            ['bd_inicializada', 'true', 'BD inicializada correctamente'],
            ['fecha_creacion', new Date().toISOString(), 'Fecha de creación'],
            ['version_esquema', '3.1.0', 'Versión del esquema'],
            ['interfaz_limpia', 'true', 'Interfaz debe estar limpia'],
            ['primer_acceso', 'true', 'Primer acceso del usuario']
        ];
        
        configuraciones.forEach(([clave, valor, descripcion]) => {
            db.run(
                'INSERT INTO configuraciones (clave, valor, descripcion) VALUES (?, ?, ?)',
                [clave, valor, descripcion]
            );
        });
        
        db.run('COMMIT', () => {
            console.log(`✅ BD LIMPIA creada exitosamente para: ${username}`);
            resolve();
        });
    });
}

// Función de uso directo
async function main() {
    if (process.argv.length < 4) {
        console.log('Uso: node crear-usuario-completo.js <username> <password> [rol] [email]');
        console.log('Ejemplo: node crear-usuario-completo.js juan 123456 tecnico juan@antel.com.uy');
        process.exit(1);
    }
    
    const [,, username, password, rol, email] = process.argv;
    
    try {
        const userId = await crearUsuarioCompleto(username, password, rol || 'tecnico', email);
        console.log(`\n🎉 USUARIO CREADO EXITOSAMENTE`);
        console.log(`   Usuario: ${username}`);
        console.log(`   ID: ${userId}`);
        console.log(`   Rol: ${rol || 'tecnico'}`);
        console.log(`   BD privada: ${rol !== 'admin' ? '✅ Creada' : '❌ Usa BD principal'}`);
        console.log(`\n💡 El usuario ${username} tendrá una interfaz COMPLETAMENTE LIMPIA`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { crearUsuarioCompleto, crearBaseDatosLimpia };

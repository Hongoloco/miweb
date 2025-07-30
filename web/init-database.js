const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Inicializando base de datos...');

db.serialize(() => {
    // Tabla de categorías de tareas
    db.run(`CREATE TABLE IF NOT EXISTS categorias_tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        color TEXT,
        icono TEXT,
        activa INTEGER DEFAULT 1
    )`);

    // Insertar categorías de tareas de ejemplo
    db.run(`INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono) VALUES ('Mantenimiento', '#1976d2', 'build')`);
    db.run(`INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono) VALUES ('Soporte', '#388e3c', 'support_agent')`);
    db.run(`INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono) VALUES ('Mejora', '#fbc02d', 'trending_up')`);

    // Tabla de tareas
    db.run(`CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'pendiente',
        prioridad TEXT DEFAULT 'media',
        categoria TEXT,
        usuario_id INTEGER,
        activa INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (categoria) REFERENCES categorias_tareas(nombre)
    )`);

    // Insertar tarea de ejemplo
    db.run(`INSERT OR IGNORE INTO tareas (titulo, descripcion, estado, prioridad, categoria, usuario_id) VALUES (
        'Revisión de OLT principal',
        'Verificar logs y estado de la OLT ZTE C600 - Principal',
        'pendiente',
        'alta',
        'Mantenimiento',
        1
    )`);

    // Tabla de notas/comentarios de tareas
    db.run(`CREATE TABLE IF NOT EXISTS tareas_notas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tarea_id INTEGER,
        nota TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER,
        tipo TEXT DEFAULT 'comentario',
        FOREIGN KEY (tarea_id) REFERENCES tareas (id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`);

    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre_completo TEXT,
        email TEXT,
        rol TEXT DEFAULT 'operador',
        descripcion TEXT,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso DATETIME
    )`);

    // Tabla de roles
    db.run(`CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        descripcion TEXT,
        permisos TEXT,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insertar roles por defecto
    db.run(`INSERT OR IGNORE INTO roles (nombre, descripcion, permisos) VALUES 
        ('admin', 'Administrador del sistema', '["all"]'),
        ('operador', 'Operador estándar', '["read", "execute"]'),
        ('supervisor', 'Supervisor de operaciones', '["read", "execute", "manage_users"]')`);
    
    // Tabla de comandos IMS personalizados
    db.run(`CREATE TABLE IF NOT EXISTS comandos_ims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        template TEXT NOT NULL,
        categoria TEXT,
        usuario_creador INTEGER,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_creador) REFERENCES usuarios(id)
    )`);

    // Tabla de OLTs
    db.run(`CREATE TABLE IF NOT EXISTS olts (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        shelf INTEGER DEFAULT 1,
        slot INTEGER DEFAULT 1,
        port INTEGER DEFAULT 1,
        onu_id INTEGER DEFAULT 1,
        ip_address TEXT,
        modelo TEXT DEFAULT 'ZTE C600',
        ubicacion TEXT,
        estado TEXT DEFAULT 'activa',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de comandos
    db.run(`CREATE TABLE IF NOT EXISTS comandos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        olt_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        comandos_json TEXT NOT NULL,
        categoria TEXT DEFAULT 'general',
        orden INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (olt_id) REFERENCES olts (id) ON DELETE CASCADE
    )`);

    // Tabla de logs de actividad
    db.run(`CREATE TABLE IF NOT EXISTS logs_actividad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        accion TEXT NOT NULL,
        detalles TEXT,
        ip_address TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`);

    // Tabla de modelos ONT para ACS
    db.run(`CREATE TABLE IF NOT EXISTS modelos_ont (
        id TEXT PRIMARY KEY,
        fabricante TEXT NOT NULL,
        modelo TEXT NOT NULL,
        version TEXT,
        tipo TEXT NOT NULL,
        descripcion TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME,
        usuario_id INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`);

    // Tabla de comandos específicos de modelos ONT
    db.run(`CREATE TABLE IF NOT EXISTS comandos_ont (
        id TEXT PRIMARY KEY,
        modelo_id TEXT NOT NULL,
        comando TEXT NOT NULL,
        descripcion TEXT,
        orden INTEGER DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (modelo_id) REFERENCES modelos_ont (id) ON DELETE CASCADE
    )`);

    // Insertar usuario por defecto
    const bcrypt = require('bcrypt');
    const defaultPassword = bcrypt.hashSync('123', 10);
    
    db.run(`INSERT OR IGNORE INTO usuarios (username, password_hash, nombre_completo, rol) 
            VALUES ('alito', ?, 'Administrador Sistema', 'admin')`, [defaultPassword]);

    // IMPORTANTE: No insertar OLT por defecto ni comandos automáticamente
    // Los comandos están guardados en la base de datos y se restauran con restore-zte-commands.js
    // Para evitar pérdida de datos, este script solo crea las tablas básicas

    // No insertar OLTs de ejemplo - el usuario cargará sus propias OLTs
    // Las OLTs demo han sido eliminadas por solicitud del usuario

    console.log('✅ Base de datos inicializada correctamente');
    console.log('📊 Tablas creadas:');
    console.log('   - usuarios (gestión de usuarios)');
    console.log('   - olts (equipos OLT)');
    console.log('   - comandos (comandos por OLT)');
    console.log('   - logs_actividad (registro de actividades)');
    console.log('');
    console.log('🔐 Usuario por defecto:');
    console.log('   Username: alito');
    console.log('   Password: 123');
});

db.close((err) => {
    if (err) {
        console.error('❌ Error al cerrar la base de datos:', err.message);
    } else {
        console.log('🔒 Conexión a base de datos cerrada.');
    }
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexión a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Configurando sistema de roles...');

// Crear tabla de roles si no existe
db.serialize(() => {
    // Tabla de roles
    db.run(`CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        descripcion TEXT,
        permisos TEXT, -- JSON con los permisos
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error al crear tabla roles:', err);
        } else {
            console.log('✅ Tabla roles creada/verificada');
        }
    });

    // Insertar roles predeterminados
    const rolesDefault = [
        {
            nombre: 'administrador',
            descripcion: 'Acceso completo al sistema',
            permisos: JSON.stringify({
                usuarios: ['crear', 'editar', 'eliminar', 'ver'],
                olts: ['crear', 'editar', 'eliminar', 'ver'],
                comandos: ['crear', 'editar', 'eliminar', 'ejecutar', 'ver'],
                roles: ['crear', 'editar', 'eliminar', 'ver'],
                sistema: ['configurar', 'logs', 'backup']
            })
        },
        {
            nombre: 'tecnico',
            descripcion: 'Gestión de OLTs y comandos',
            permisos: JSON.stringify({
                usuarios: ['ver'],
                olts: ['crear', 'editar', 'ver'],
                comandos: ['crear', 'editar', 'ejecutar', 'ver'],
                roles: ['ver'],
                sistema: ['logs']
            })
        },
        {
            nombre: 'operador',
            descripcion: 'Operaciones básicas',
            permisos: JSON.stringify({
                usuarios: [],
                olts: ['ver'],
                comandos: ['ejecutar', 'ver'],
                roles: [],
                sistema: []
            })
        },
        {
            nombre: 'usuario',
            descripcion: 'Acceso de solo lectura',
            permisos: JSON.stringify({
                usuarios: [],
                olts: ['ver'],
                comandos: ['ver'],
                roles: [],
                sistema: []
            })
        }
    ];

    // Insertar roles si no existen
    rolesDefault.forEach(rol => {
        db.run(`INSERT OR IGNORE INTO roles (nombre, descripcion, permisos) VALUES (?, ?, ?)`,
            [rol.nombre, rol.descripcion, rol.permisos], (err) => {
                if (err) {
                    console.error(`❌ Error al insertar rol ${rol.nombre}:`, err);
                } else {
                    console.log(`✅ Rol ${rol.nombre} configurado`);
                }
            });
    });

    // Tabla de permisos personalizados
    db.run(`CREATE TABLE IF NOT EXISTS permisos_usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        permiso TEXT,
        valor INTEGER DEFAULT 1,
        fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error al crear tabla permisos_usuario:', err);
        } else {
            console.log('✅ Tabla permisos_usuario creada/verificada');
        }
    });

    console.log('🎯 Sistema de roles configurado correctamente');
});

// Cerrar conexión
db.close((err) => {
    if (err) {
        console.error('❌ Error al cerrar la base de datos:', err);
    } else {
        console.log('🔒 Base de datos cerrada');
    }
});

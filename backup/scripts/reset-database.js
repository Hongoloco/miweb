const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'olt_system.db');

console.log('🔄 Reseteando base de datos completa...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('🔗 Conectado a la base de datos SQLite');
    }
});

// Eliminar todas las tablas existentes y recrear
db.serialize(() => {
    // Eliminar tablas existentes
    console.log('🗑️ Eliminando tablas existentes...');
    
    db.run(`DROP TABLE IF EXISTS comandos_ims`);
    db.run(`DROP TABLE IF EXISTS modelos_ont`);
    db.run(`DROP TABLE IF EXISTS sesiones_usuario`);
    db.run(`DROP TABLE IF EXISTS logs_actividad`);
    db.run(`DROP TABLE IF EXISTS comandos`);
    db.run(`DROP TABLE IF EXISTS olts`);
    db.run(`DROP TABLE IF EXISTS usuarios`);

    // Crear tabla de usuarios
    console.log('👥 Creando tabla de usuarios...');
    db.run(`CREATE TABLE usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nombre_completo VARCHAR(100),
        email VARCHAR(100),
        rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('admin', 'tecnico', 'usuario')),
        descripcion TEXT,
        activo BOOLEAN DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso DATETIME
    )`);

    // Crear tabla de OLTs
    console.log('🏢 Creando tabla de OLTs...');
    db.run(`CREATE TABLE olts (
        id TEXT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        shelf INTEGER DEFAULT 1,
        slot INTEGER DEFAULT 1,
        port INTEGER DEFAULT 1,
        onu_id INTEGER DEFAULT 1,
        descripcion TEXT,
        estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
        usuario_creador INTEGER,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_creador) REFERENCES usuarios(id)
    )`);

    // Crear tabla de comandos
    console.log('📋 Creando tabla de comandos...');
    db.run(`CREATE TABLE comandos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        comandos TEXT NOT NULL,
        olt_id TEXT NOT NULL,
        orden INTEGER DEFAULT 0,
        activo BOOLEAN DEFAULT 1,
        usuario_creador INTEGER,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (olt_id) REFERENCES olts(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_creador) REFERENCES usuarios(id)
    )`);

    // Crear tabla de comandos IMS
    console.log('📞 Creando tabla de comandos IMS...');
    db.run(`CREATE TABLE comandos_ims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        template TEXT NOT NULL,
        categoria VARCHAR(50) DEFAULT 'general',
        activo BOOLEAN DEFAULT 1,
        usuario_creador INTEGER,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_creador) REFERENCES usuarios(id)
    )`);

    // Crear tabla de modelos ONT
    console.log('📡 Creando tabla de modelos ONT...');
    db.run(`CREATE TABLE modelos_ont (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fabricante VARCHAR(50) NOT NULL,
        modelo VARCHAR(50) NOT NULL,
        tipo VARCHAR(30) DEFAULT 'GPON',
        version VARCHAR(20),
        descripcion TEXT,
        comandos_especificos TEXT,
        activo BOOLEAN DEFAULT 1,
        usuario_creador INTEGER,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_creador) REFERENCES usuarios(id),
        UNIQUE(fabricante, modelo)
    )`);

    // Crear tabla de sesiones de usuario
    console.log('🔐 Creando tabla de sesiones...');
    db.run(`CREATE TABLE sesiones_usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        token VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        activa BOOLEAN DEFAULT 1,
        fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_expiracion DATETIME,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`);

    // Crear tabla de logs de actividad
    console.log('📊 Creando tabla de logs...');
    db.run(`CREATE TABLE logs_actividad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        accion VARCHAR(100) NOT NULL,
        detalles TEXT,
        ip_address VARCHAR(45),
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`);

    // Crear índices para mejor rendimiento
    console.log('🔍 Creando índices...');
    db.run(`CREATE INDEX idx_usuarios_username ON usuarios(username)`);
    db.run(`CREATE INDEX idx_comandos_olt_id ON comandos(olt_id)`);
    db.run(`CREATE INDEX idx_comandos_orden ON comandos(orden)`);
    db.run(`CREATE INDEX idx_logs_usuario_fecha ON logs_actividad(usuario_id, fecha)`);
    db.run(`CREATE INDEX idx_sesiones_usuario ON sesiones_usuario(usuario_id, activa)`);

    // Insertar usuarios por defecto
    console.log('👤 Creando usuarios por defecto...');
    
    const usuarios = [
        {
            username: 'alito',
            password: '1234',
            nombre_completo: 'Administrador Principal',
            email: 'alito@antel.com.uy',
            rol: 'admin',
            descripcion: 'Administrador principal del sistema con acceso completo'
        },
        {
            username: 'tecnico1',
            password: '1234',
            nombre_completo: 'Técnico de Red',
            email: 'tecnico1@antel.com.uy',
            rol: 'tecnico',
            descripcion: 'Técnico especializado en configuración de equipos OLT'
        },
        {
            username: 'demo',
            password: 'demo',
            nombre_completo: 'Usuario Demo',
            email: 'demo@antel.com.uy',
            rol: 'usuario',
            descripcion: 'Usuario de demostración con permisos limitados'
        }
    ];

    let usuariosCreados = 0;
    usuarios.forEach((usuario, index) => {
        const hashedPassword = bcrypt.hashSync(usuario.password, 10);
        
        db.run(`INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, descripcion) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                [usuario.username, hashedPassword, usuario.nombre_completo, usuario.email, usuario.rol, usuario.descripcion], 
                function(err) {
                    if (err) {
                        console.error(`❌ Error al crear usuario ${usuario.username}:`, err.message);
                    } else {
                        console.log(`✅ Usuario creado: ${usuario.username} (ID: ${this.lastID})`);
                        usuariosCreados++;
                        
                        if (usuariosCreados === usuarios.length) {
                            // Insertar comandos IMS por defecto
                            insertarComandosIMSPorDefecto();
                        }
                    }
                });
    });

    function insertarComandosIMSPorDefecto() {
        console.log('📞 Insertando comandos IMS por defecto...');
        
        const comandosIMS = [
            {
                nombre: 'Consulta Usuario IMS',
                descripcion: 'Comando para consultar información de usuario IMS',
                template: 'EXP USRINF: ENTITYPE=SCSCF,IMPU="tel:+598{numero}";',
                categoria: 'consulta'
            },
            {
                nombre: 'Cancelar Usuario IMS',
                descripcion: 'Comando para cancelar/desregistrar usuario IMS',
                template: 'CNL URCNL: TYPE=IMPU,IMPU="tel:+598{numero}";',
                categoria: 'cancelacion'
            },
            {
                nombre: 'Registro Manual IMS',
                descripcion: 'Comando para registro manual de usuario IMS',
                template: 'ADD USRINF: ENTITYPE=SCSCF,IMPU="tel:+598{numero}",STATUS=ACTIVE;',
                categoria: 'registro'
            }
        ];

        let comandosIMSCreados = 0;
        comandosIMS.forEach((comando) => {
            db.run(`INSERT INTO comandos_ims (nombre, descripcion, template, categoria, usuario_creador) 
                    VALUES (?, ?, ?, ?, 1)`, 
                    [comando.nombre, comando.descripcion, comando.template, comando.categoria], 
                    function(err) {
                        if (err) {
                            console.error(`❌ Error al crear comando IMS ${comando.nombre}:`, err.message);
                        } else {
                            console.log(`✅ Comando IMS creado: ${comando.nombre} (ID: ${this.lastID})`);
                            comandosIMSCreados++;
                            
                            if (comandosIMSCreados === comandosIMS.length) {
                                finalizarReset();
                            }
                        }
                    });
        });
    }

    function finalizarReset() {
        console.log('🎉 ¡Base de datos reseteada completamente!');
        console.log('');
        console.log('📋 Resumen:');
        console.log('   ✅ Todas las tablas recreadas');
        console.log('   ✅ Usuarios por defecto creados');
        console.log('   ✅ Comandos IMS iniciales agregados');
        console.log('   ✅ Índices creados para mejor rendimiento');
        console.log('');
        console.log('🔐 Credenciales por defecto:');
        console.log('   👑 Admin: alito / 1234');
        console.log('   🔧 Técnico: tecnico1 / 1234');
        console.log('   👤 Demo: demo / demo');
        console.log('');
        console.log('🚀 Puedes iniciar el servidor con: npm start');
        
        db.close((err) => {
            if (err) {
                console.error('❌ Error al cerrar la base de datos:', err.message);
            } else {
                console.log('🔒 Conexión a la base de datos cerrada correctamente');
            }
            process.exit(0);
        });
    }
});

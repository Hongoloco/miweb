const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Inicializando base de datos...');

db.serialize(() => {
    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre_completo TEXT,
        email TEXT,
        rol TEXT DEFAULT 'operador',
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso DATETIME
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
    const defaultPassword = bcrypt.hashSync('vinil28', 10);
    
    db.run(`INSERT OR IGNORE INTO usuarios (username, password_hash, nombre_completo, rol) 
            VALUES ('alito', ?, 'Administrador Sistema', 'admin')`, [defaultPassword]);

    // Insertar OLT por defecto con comandos
    const oltId = 'olt-' + Date.now();
    db.run(`INSERT OR IGNORE INTO olts (id, nombre, shelf, slot, port, onu_id) 
            VALUES (?, 'ZTE C600 - Principal', 1, 13, 4, 38)`, [oltId], function() {
        
        if (this.changes > 0) {
            // Comandos por defecto
            const comandosDefault = [
                {
                    nombre: "Factory Reset",
                    descripcion: "Comando para restaurar la configuración de fábrica de una ONU",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "restore factory"
                    ],
                    categoria: "mantenimiento"
                },
                {
                    nombre: "Ver la base de ONU's",
                    descripcion: "Sirve para ver las onus conectadas",
                    comandos: [
                        "show gpon onu baseinfo gpon_olt-{shelf}/{slot}/{port}"
                    ],
                    categoria: "consulta"
                },
                {
                    nombre: "Configurar en modo bridge",
                    descripcion: "Comandos para cambiar la configuración de una ONU a modo bridge",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "no wan-ip",
                        "dhcp-ip ethuni eth_0/1 from-internet",
                        "dhcp-ip ethuni eth_0/2 from-internet",
                        "dhcp-ip ethuni eth_0/3 from-internet",
                        "dhcp-ip ethuni eth_0/4 from-internet",
                        "vlan port eth_0/1 mode tag vlan 10",
                        "vlan port eth_0/2 mode tag vlan 10",
                        "vlan port eth_0/3 mode tag vlan 10",
                        "vlan port eth_0/4 mode tag vlan 10",
                        "interface wifi wifi_0/1 arc disable arc-interval 0 state lock",
                        "interface wifi wifi_0/2 arc disable arc-interval 0 state lock",
                        "interface wifi wifi_0/3 arc disable arc-interval 0 state lock",
                        "interface wifi wifi_0/4 arc disable arc-interval 0 state lock",
                        "interface wifi wifi_0/5 arc disable arc-interval 0 state lock",
                        "interface wifi wifi_0/6 arc disable arc-interval 0 state lock",
                        "interface wifi wifi_0/7 arc disable arc-interval 0 state lock",
                        "interface wifi wifi_0/8 arc disable arc-interval 0 state lock",
                        "exit"
                    ],
                    categoria: "configuracion"
                },
                {
                    nombre: "Volver a modo router",
                    descripcion: "Comandos para volver la configuración de una ONU a modo router",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "wan-ip ipv4 mode inner vlan-profile vlanHSI host 1",
                        "dhcp-ip ethuni eth_0/1 from-onu",
                        "dhcp-ip ethuni eth_0/2 from-onu",
                        "dhcp-ip ethuni eth_0/3 from-onu",
                        "dhcp-ip ethuni eth_0/4 from-onu",
                        "no vlan port eth_0/1 mode",
                        "no vlan port eth_0/2 mode",
                        "no vlan port eth_0/3 mode",
                        "no vlan port eth_0/4 mode",
                        "interface wifi wifi_0/1 arc disable arc-interval 0 state unlock",
                        "interface wifi wifi_0/5 arc disable arc-interval 0 state unlock",
                        "interface wifi wifi_0/8 arc disable arc-interval 0 state unlock",
                        "exit"
                    ],
                    categoria: "configuracion"
                },
                {
                    nombre: "Ver estado VoIP",
                    descripcion: "Ver el estado de la linea de telefono",
                    comandos: [
                        "show gpon remote-onu voip-linestatus gpon_onu-{shelf}/{slot}/{port}:{onuId}"
                    ],
                    categoria: "voip"
                },
                {
                    nombre: "Ver IP de VoIP",
                    descripcion: "Ver si le asigno IP al Telefono",
                    comandos: [
                        "show gpon remote-onu voip-ip gpon_onu-{shelf}/{slot}/{port}"
                    ],
                    categoria: "voip"
                }
            ];

            comandosDefault.forEach((cmd, index) => {
                db.run(`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden) 
                        VALUES (?, ?, ?, ?, ?, ?)`, 
                    [oltId, cmd.nombre, cmd.descripcion, JSON.stringify(cmd.comandos), cmd.categoria, index + 1]);
            });
        }
    });

    console.log('✅ Base de datos inicializada correctamente');
    console.log('📊 Tablas creadas:');
    console.log('   - usuarios (gestión de usuarios)');
    console.log('   - olts (equipos OLT)');
    console.log('   - comandos (comandos por OLT)');
    console.log('   - logs_actividad (registro de actividades)');
    console.log('');
    console.log('🔐 Usuario por defecto:');
    console.log('   Username: alito');
    console.log('   Password: vinil28');
});

db.close((err) => {
    if (err) {
        console.error('❌ Error al cerrar la base de datos:', err.message);
    } else {
        console.log('🔒 Conexión a base de datos cerrada.');
    }
});

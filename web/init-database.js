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
    db.run(`INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono) VALUES ('Incidente', '#d32f2f', 'report_problem')`);
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

    // Insertar OLT por defecto con comandos
    const oltId = 'olt-' + Date.now();
    db.run(`INSERT OR IGNORE INTO olts (id, nombre, shelf, slot, port, onu_id) 
            VALUES (?, 'ZTE C600 - Principal', 1, 13, 4, 38)`, [oltId], function() {
        
        if (this.changes > 0) {
            // Comandos completos para ZTE C600
            const comandosDefault = [
                // === COMANDOS BÁSICOS ===
                {
                    nombre: "Ver la base de ONU's",
                    descripcion: "Sirve para ver las onus conectadas",
                    comandos: [
                        "show gpon onu baseinfo gpon_olt-{shelf}/{slot}/{port}"
                    ],
                    categoria: "consulta"
                },
                {
                    nombre: "Ver información detallada de ONU",
                    descripcion: "Ver información completa de una ONU específica",
                    comandos: [
                        "show gpon onu detail-info gpon_onu-{shelf}/{slot}/{port}:{onuId}"
                    ],
                    categoria: "consulta"
                },
                {
                    nombre: "Ver estado de la ONU",
                    descripcion: "Verificar el estado actual de la ONU",
                    comandos: [
                        "show gpon onu state gpon_olt-{shelf}/{slot}/{port} {onuId}"
                    ],
                    categoria: "consulta"
                },
                {
                    nombre: "Ver distancia de la ONU",
                    descripcion: "Verificar la distancia óptica de la ONU",
                    comandos: [
                        "show gpon onu distance gpon_olt-{shelf}/{slot}/{port}"
                    ],
                    categoria: "consulta"
                },
                {
                    nombre: "Ver potencia óptica",
                    descripcion: "Verificar niveles de potencia óptica",
                    comandos: [
                        "show pon power attenuation gpon_onu-{shelf}/{slot}/{port}:{onuId}"
                    ],
                    categoria: "consulta"
                },
                
                // === CONFIGURACIÓN BÁSICA ===
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
                    nombre: "Reiniciar ONU",
                    descripcion: "Reiniciar una ONU específica",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "reboot"
                    ],
                    categoria: "mantenimiento"
                },
                {
                    nombre: "Desautorizar ONU",
                    descripcion: "Desautorizar una ONU del sistema",
                    comandos: [
                        "no gpon onu gpon_onu-{shelf}/{slot}/{port}:{onuId}"
                    ],
                    categoria: "mantenimiento"
                },
                
                // === CONFIGURACIÓN BRIDGE ===
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
                
                // === CONFIGURACIÓN WIFI ===
                {
                    nombre: "Configurar WiFi básico",
                    descripcion: "Configuración básica de WiFi en la ONU",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "interface wifi wifi_0/1",
                        "ssid nombre_red",
                        "authentication-method wpa2-psk",
                        "wpa-psk-key password123",
                        "channel auto",
                        "state unlock",
                        "exit"
                    ],
                    categoria: "wifi"
                },
                {
                    nombre: "Deshabilitar WiFi",
                    descripcion: "Deshabilitar todas las interfaces WiFi",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "interface wifi wifi_0/1 state lock",
                        "interface wifi wifi_0/2 state lock",
                        "interface wifi wifi_0/3 state lock",
                        "interface wifi wifi_0/4 state lock",
                        "interface wifi wifi_0/5 state lock",
                        "interface wifi wifi_0/8 state lock",
                        "exit"
                    ],
                    categoria: "wifi"
                },
                {
                    nombre: "Habilitar WiFi",
                    descripcion: "Habilitar interfaces WiFi principales",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "interface wifi wifi_0/1 state unlock",
                        "interface wifi wifi_0/5 state unlock",
                        "interface wifi wifi_0/8 state unlock",
                        "exit"
                    ],
                    categoria: "wifi"
                },
                
                // === CONFIGURACIÓN VOIP ===
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
                },
                {
                    nombre: "Configurar VoIP básico",
                    descripcion: "Configuración básica de VoIP",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "voip-ip mode dhcp",
                        "voip-protocol sip",
                        "exit"
                    ],
                    categoria: "voip"
                },
                {
                    nombre: "Reiniciar servicio VoIP",
                    descripcion: "Reiniciar el servicio de VoIP en la ONU",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "voip-reset",
                        "exit"
                    ],
                    categoria: "voip"
                },
                
                // === CONFIGURACIÓN VLAN ===
                {
                    nombre: "Configurar VLAN transparente",
                    descripcion: "Configurar VLAN en modo transparente",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "vlan port eth_0/1 mode transparent",
                        "vlan port eth_0/2 mode transparent",
                        "vlan port eth_0/3 mode transparent",
                        "vlan port eth_0/4 mode transparent",
                        "exit"
                    ],
                    categoria: "vlan"
                },
                {
                    nombre: "Configurar VLAN con tag",
                    descripcion: "Configurar puertos con VLAN tag específica",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "vlan port eth_0/1 mode tag vlan 100",
                        "vlan port eth_0/2 mode tag vlan 100",
                        "vlan port eth_0/3 mode tag vlan 100",
                        "vlan port eth_0/4 mode tag vlan 100",
                        "exit"
                    ],
                    categoria: "vlan"
                },
                {
                    nombre: "Quitar configuración VLAN",
                    descripcion: "Remover configuración de VLAN de los puertos",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "no vlan port eth_0/1 mode",
                        "no vlan port eth_0/2 mode",
                        "no vlan port eth_0/3 mode",
                        "no vlan port eth_0/4 mode",
                        "exit"
                    ],
                    categoria: "vlan"
                },
                
                // === DIAGNÓSTICO ===
                {
                    nombre: "Verificar conectividad",
                    descripcion: "Hacer ping desde la ONU",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "ping 8.8.8.8",
                        "exit"
                    ],
                    categoria: "diagnostico"
                },
                {
                    nombre: "Ver estadísticas de puerto",
                    descripcion: "Ver estadísticas de los puertos ethernet",
                    comandos: [
                        "show gpon onu port state gpon_onu-{shelf}/{slot}/{port}:{onuId} eth-port all"
                    ],
                    categoria: "diagnostico"
                },
                {
                    nombre: "Ver tabla ARP",
                    descripcion: "Ver tabla ARP de la ONU",
                    comandos: [
                        "show gpon remote-onu arp gpon_onu-{shelf}/{slot}/{port}:{onuId}"
                    ],
                    categoria: "diagnostico"
                },
                {
                    nombre: "Ver información del cable",
                    descripcion: "Diagnóstico de cable ethernet",
                    comandos: [
                        "show gpon onu port cable-test gpon_onu-{shelf}/{slot}/{port}:{onuId} eth-port 1"
                    ],
                    categoria: "diagnostico"
                },
                
                // === CONFIGURACIÓN AVANZADA ===
                {
                    nombre: "Configurar QoS básico",
                    descripcion: "Configuración básica de Quality of Service",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "traffic-mgmt priority eth_0/1 0",
                        "traffic-mgmt priority eth_0/2 0",
                        "traffic-mgmt priority eth_0/3 0",
                        "traffic-mgmt priority eth_0/4 0",
                        "exit"
                    ],
                    categoria: "avanzado"
                },
                {
                    nombre: "Limitar ancho de banda",
                    descripcion: "Configurar límites de ancho de banda",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "traffic-mgmt upstream eth_0/1 rate 10000",
                        "traffic-mgmt downstream eth_0/1 rate 50000",
                        "exit"
                    ],
                    categoria: "avanzado"
                },
                {
                    nombre: "Configurar filtro MAC",
                    descripcion: "Habilitar filtrado por direcciones MAC",
                    comandos: [
                        "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                        "mac-filter enable",
                        "mac-filter add 00:11:22:33:44:55",
                        "exit"
                    ],
                    categoria: "seguridad"
                },
                {
                    nombre: "Ver configuración completa",
                    descripcion: "Mostrar toda la configuración de la ONU",
                    comandos: [
                        "show running-config pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}"
                    ],
                    categoria: "consulta"
                },
                
                // === COMANDOS DE PUERTO OLT ===
                {
                    nombre: "Ver información del puerto OLT",
                    descripcion: "Ver información del puerto GPON en la OLT",
                    comandos: [
                        "show interface gpon_olt-{shelf}/{slot}/{port}"
                    ],
                    categoria: "puerto_olt"
                },
                {
                    nombre: "Ver estadísticas del puerto OLT",
                    descripcion: "Ver estadísticas del puerto GPON",
                    comandos: [
                        "show interface gpon_olt-{shelf}/{slot}/{port} statistics"
                    ],
                    categoria: "puerto_olt"
                },
                {
                    nombre: "Reiniciar puerto OLT",
                    descripcion: "Reiniciar el puerto GPON de la OLT",
                    comandos: [
                        "interface gpon_olt-{shelf}/{slot}/{port}",
                        "shutdown",
                        "no shutdown",
                        "exit"
                    ],
                    categoria: "puerto_olt"
                }
            ];

            comandosDefault.forEach((cmd, index) => {
                db.run(`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden) 
                        VALUES (?, ?, ?, ?, ?, ?)`, 
                    [oltId, cmd.nombre, cmd.descripcion, JSON.stringify(cmd.comandos), cmd.categoria, index + 1]);
            });
        }
    });

    // Insertar OLTs de ejemplo adicionales
    db.run(`INSERT OR IGNORE INTO olts (id, nombre, shelf, slot, port, onu_id, modelo, estado) VALUES ('olt-demo-1', 'ZTE C600 Demo', 1, 1, 1, 1, 'ZTE C600', 'activa')`);
    db.run(`INSERT OR IGNORE INTO olts (id, nombre, shelf, slot, port, onu_id, modelo, estado) VALUES ('olt-demo-2', 'Huawei MA5800', 2, 2, 2, 2, 'Huawei MA5800', 'activa')`);
    db.run(`INSERT OR IGNORE INTO olts (id, nombre, shelf, slot, port, onu_id, modelo, estado) VALUES ('olt-demo-3', 'Nokia FX-4', 3, 3, 3, 3, 'Nokia FX-4', 'inactiva')`);

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

#!/usr/bin/env node

/**
 * Restauración FORZADA de alito - Borra todo y recrea desde cero
 * Usar cuando la restauración normal no funciona
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

console.log('🔄 RESTAURACIÓN FORZADA DE ALITO');
console.log('⚠️  Esto borrará completamente la base de datos de alito y la recreará');
console.log('='.repeat(60));

async function restauracionForzada() {
    try {
        // 1. Eliminar base de datos existente
        console.log('\n🗑️  1. ELIMINANDO BASE DE DATOS EXISTENTE...');
        const dbPath = './databases/alito_olt_system.db';
        
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('✅ Base de datos anterior eliminada');
        } else {
            console.log('ℹ️  No había base de datos anterior');
        }
        
        // 2. Crear directorio si no existe
        console.log('\n📁 2. CREANDO DIRECTORIO...');
        if (!fs.existsSync('./databases')) {
            fs.mkdirSync('./databases', { recursive: true });
            console.log('✅ Directorio databases creado');
        } else {
            console.log('✅ Directorio databases existe');
        }
        
        // 3. Crear nueva base de datos
        console.log('\n🔧 3. CREANDO NUEVA BASE DE DATOS...');
        await crearBaseDatos();
        
        // 4. Crear usuario alito
        console.log('\n👤 4. CREANDO USUARIO ALITO...');
        await crearUsuarioAlito();
        
        // 5. Crear OLT ZTE C600
        console.log('\n🏢 5. CREANDO OLT ZTE C600...');
        await crearOLT();
        
        // 6. Crear comandos ZTE C600
        console.log('\n📋 6. CREANDO COMANDOS ZTE C600...');
        await crearComandos();
        
        console.log('\n🎉 RESTAURACIÓN FORZADA COMPLETADA');
        console.log('');
        console.log('📋 Datos creados:');
        console.log('   ✅ Usuario: alito');
        console.log('   ✅ Contraseña: vinilo28');
        console.log('   ✅ OLT: ZTE C600 - Alito');
        console.log('   ✅ Comandos: 10 comandos ZTE C600');
        console.log('   ✅ Base de datos: ./databases/alito_olt_system.db');
        console.log('');
        console.log('🚀 Ahora reinicia el servidor y prueba el login');
        
    } catch (error) {
        console.error('❌ Error en restauración forzada:', error);
        process.exit(1);
    }
}

function crearBaseDatos() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./databases/alito_olt_system.db');
        
        const esquemas = [
            `CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre_completo TEXT,
                email TEXT,
                rol TEXT DEFAULT 'tecnico',
                activo INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE olts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                ip TEXT NOT NULL,
                puerto INTEGER DEFAULT 22,
                modelo TEXT,
                ubicacion TEXT,
                activo INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                ultima_conexion DATETIME,
                configuracion TEXT
            )`,
            
            `CREATE TABLE comandos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                comando TEXT NOT NULL,
                descripcion TEXT,
                categoria TEXT DEFAULT 'general',
                parametros TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                activo INTEGER DEFAULT 1,
                orden_display INTEGER DEFAULT 0,
                orden INTEGER DEFAULT 0,
                tipo_comando TEXT DEFAULT 'manual',
                olt_id INTEGER,
                FOREIGN KEY (olt_id) REFERENCES olts(id)
            )`,
            
            `CREATE TABLE categorias_tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                color TEXT DEFAULT '#007bff',
                activo INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                categoria_id INTEGER,
                usuario_id INTEGER,
                estado TEXT DEFAULT 'pendiente',
                prioridad TEXT DEFAULT 'media',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_vencimiento DATETIME,
                FOREIGN KEY (categoria_id) REFERENCES categorias_tareas(id),
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )`
        ];
        
        let tablasCreadas = 0;
        
        esquemas.forEach((esquema, index) => {
            db.run(esquema, (err) => {
                if (err) {
                    console.error(`❌ Error creando tabla ${index + 1}:`, err);
                    reject(err);
                    return;
                }
                
                tablasCreadas++;
                console.log(`✅ Tabla ${tablasCreadas}/5 creada`);
                
                if (tablasCreadas === esquemas.length) {
                    db.close();
                    resolve();
                }
            });
        });
    });
}

function crearUsuarioAlito() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./databases/alito_olt_system.db');
        
        const password = bcrypt.hashSync('vinilo28', 10);
        
        const sql = `INSERT INTO usuarios (username, password, nombre_completo, email, rol) 
                     VALUES (?, ?, ?, ?, ?)`;
        
        db.run(sql, ['alito', password, 'Alito', 'alito@antel.com.uy', 'tecnico'], (err) => {
            if (err) {
                console.error('❌ Error creando usuario:', err);
                reject(err);
                return;
            }
            
            console.log('✅ Usuario alito creado');
            db.close();
            resolve();
        });
    });
}

function crearOLT() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./databases/alito_olt_system.db');
        
        const configuracion = JSON.stringify({
            shelf: 1,
            slot: 13,
            port: 4,
            onuId: 38
        });
        
        const sql = `INSERT INTO olts (nombre, ip, puerto, modelo, ubicacion, configuracion) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [
            'ZTE C600 - Alito',
            '192.168.1.100',
            22,
            'ZTE C600',
            'Central Antel',
            configuracion
        ], function(err) {
            if (err) {
                console.error('❌ Error creando OLT:', err);
                reject(err);
                return;
            }
            
            console.log(`✅ OLT creada con ID: ${this.lastID}`);
            global.oltId = this.lastID;
            db.close();
            resolve();
        });
    });
}

function crearComandos() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./databases/alito_olt_system.db');
        
        const comandos = [
            {
                nombre: "Factory Reset",
                comando: "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\nrestore factory",
                descripcion: "Comando ZTE C600",
                orden: 1
            },
            {
                nombre: "Ver la base de ONU's",
                comando: "pon-onu-mng gpon_onu-1/13/4:2\nshow gpon onu baseinfo gpon_olt-{shelf}/{slot}/{port}:{onuId}",
                descripcion: "Comando ZTE C600",
                orden: 2
            },
            {
                nombre: "Ver configuración de la ONU en la ONT",
                comando: "show collection pon-onu gpon_onu-{shelf}/{slot}/{port}:{onuId} config",
                descripcion: "Comando ZTE C600",
                orden: 3
            },
            {
                nombre: "Configurar en modo bridge (desde modo router)",
                comando: "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\nno wan-ip\ndhcp-ip ethuni eth_0/1 from-internet\ndhcp-ip ethuni eth_0/2 from-internet\ndhcp-ip ethuni eth_0/3 from-internet\ndhcp-ip ethuni eth_0/4 from-internet\nvlan port eth_0/1 mode tag vlan 10\nvlan port eth_0/2 mode tag vlan 10\nvlan port eth_0/3 mode tag vlan 10\nvlan port eth_0/4 mode tag vlan 10\ninterface wifi wifi_0/1 arc disable arc-interval 0 state lock\ninterface wifi wifi_0/2 arc disable arc-interval 0 state lock\ninterface wifi wifi_0/3 arc disable arc-interval 0 state lock\ninterface wifi wifi_0/4 arc disable arc-interval 0 state lock\ninterface wifi wifi_0/5 arc disable arc-interval 0 state lock\ninterface wifi wifi_0/6 arc disable arc-interval 0 state lock\ninterface wifi wifi_0/7 arc disable arc-interval 0 state lock\ninterface wifi wifi_0/8 arc disable arc-interval 0 state lock\nexit",
                descripcion: "Comando ZTE C600",
                orden: 4
            },
            {
                nombre: "Volverla a Configurar en modo router (desde modo bridge)",
                comando: "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\nwan-ip ipv4 mode inner vlan-profile vlanHSI host 1\ndhcp-ip ethuni eth_0/1 from-onu\ndhcp-ip ethuni eth_0/2 from-onu\ndhcp-ip ethuni eth_0/3 from-onu\ndhcp-ip ethuni eth_0/4 from-onu\nno vlan port eth_0/1 mode\nno vlan port eth_0/2 mode\nno vlan port eth_0/3 mode\nno vlan port eth_0/4 mode\ninterface wifi wifi_0/1 arc disable arc-interval 0 state unlock\ninterface wifi wifi_0/5 arc disable arc-interval 0 state unlock\ninterface wifi wifi_0/8 arc disable arc-interval 0 state unlock\nexit",
                descripcion: "Comando ZTE C600",
                orden: 5
            },
            {
                nombre: "Ver configuracion ONU",
                comando: "pon-onu-mng gpon_onu-1/13/4:1\nshow collection pon-onu gpon_onu-{shelf}/{slot}/{port}:{onuId} config",
                descripcion: "Comando ZTE C600",
                orden: 6
            },
            {
                nombre: "Ver estado de la linea VoiP",
                comando: "show gpon remote-onu voip-linestatus gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                descripcion: "Comando ZTE C600",
                orden: 7
            },
            {
                nombre: "Ver IP de Voip",
                comando: "show gpon remote-onu voip-ip gpon_onu-{shelf}/{slot}/{port}",
                descripcion: "Comando ZTE C600",
                orden: 8
            },
            {
                nombre: "Diagnosticar ONU",
                comando: "show gpon onu state gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                descripcion: "Comando ZTE C600",
                orden: 9
            },
            {
                nombre: "Ver potencia óptica",
                comando: "show gpon onu detail-info gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                descripcion: "Comando ZTE C600",
                orden: 10
            }
        ];
        
        let comandosCreados = 0;
        const parametros = JSON.stringify({
            shelf: "{shelf}",
            slot: "{slot}",
            port: "{port}",
            onuId: "{onuId}"
        });
        
        comandos.forEach((cmd, index) => {
            const sql = `INSERT INTO comandos (nombre, comando, descripcion, categoria, parametros, orden_display, orden, olt_id) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [
                cmd.nombre,
                cmd.comando,
                cmd.descripcion,
                'zte_c600',
                parametros,
                cmd.orden,
                cmd.orden,
                global.oltId
            ], (err) => {
                if (err) {
                    console.error(`❌ Error creando comando ${index + 1}:`, err);
                    reject(err);
                    return;
                }
                
                comandosCreados++;
                console.log(`✅ Comando ${comandosCreados}/10 creado: ${cmd.nombre}`);
                
                if (comandosCreados === comandos.length) {
                    db.close();
                    resolve();
                }
            });
        });
    });
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    restauracionForzada();
}

module.exports = { restauracionForzada };

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Creando comandos ZTE C600 limpios...');

// Crear OLT ZTE C600
const oltId = 'olt-zte-c600-clean';

db.run(`INSERT OR REPLACE INTO olts (id, nombre, shelf, slot, port, onu_id) 
        VALUES (?, ?, ?, ?, ?, ?)`, 
        [oltId, 'ZTE C600 - Principal', 1, 13, 4, 38], 
        function() {
    
    console.log(`📡 OLT creada: ZTE C600 - Principal`);
    
    // Comandos ZTE C600 limpios (sin comentarios problemáticos)
    const comandosZTE = [
        {
            nombre: "Factory Reset",
            descripcion: "Restaurar configuración de fábrica de una ONU",
            comandos: [
                "pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}",
                "restore factory"
            ]
        },
        {
            nombre: "Ver base de ONUs",
            descripcion: "Ver las ONUs conectadas en el puerto",
            comandos: [
                "show gpon onu baseinfo gpon_olt-{shelf}/{slot}/{port}"
            ]
        },
        {
            nombre: "Ver configuración ONU",
            descripcion: "Mostrar configuración actual de una ONU",
            comandos: [
                "show collection pon-onu gpon_onu-{shelf}/{slot}/{port}:{onuId} config"
            ]
        },
        {
            nombre: "Configurar modo bridge",
            descripcion: "Cambiar ONU de modo router a modo bridge",
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
                "exit"
            ]
        },
        {
            nombre: "Configurar modo router",
            descripcion: "Cambiar ONU de modo bridge a modo router",
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
            ]
        },
        {
            nombre: "Ver estado línea VoIP",
            descripcion: "Verificar estado de la línea telefónica",
            comandos: [
                "show gpon remote-onu voip-linestatus gpon_onu-{shelf}/{slot}/{port}:{onuId}"
            ]
        },
        {
            nombre: "Ver IP VoIP",
            descripcion: "Verificar IP asignada al teléfono",
            comandos: [
                "show gpon remote-onu voip-ip gpon_onu-{shelf}/{slot}/{port}"
            ]
        },
        {
            nombre: "Estado general ONU",
            descripcion: "Verificar estado general de la ONU",
            comandos: [
                "show gpon onu state gpon_olt-{shelf}/{slot}/{port}:{onuId}"
            ]
        }
    ];
    
    // Insertar comandos uno por uno
    let insertedCount = 0;
    comandosZTE.forEach((comando, index) => {
        const comandoJson = JSON.stringify(comando.comandos);
        
        db.run(`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                [oltId, comando.nombre, comando.descripcion, comandoJson, 'ZTE C600', index + 1], 
                function(err) {
            if (err) {
                console.error('❌ Error insertando comando:', comando.nombre, err);
            } else {
                insertedCount++;
                console.log(`✅ Comando insertado: ${comando.nombre}`);
                
                // Si es el último comando, mostrar resumen
                if (insertedCount === comandosZTE.length) {
                    console.log('');
                    console.log('🎉 ¡Comandos ZTE C600 creados exitosamente!');
                    console.log(`📊 Total de comandos: ${insertedCount}`);
                    console.log(`📡 OLT: ZTE C600 - Principal`);
                    console.log(`🔧 Configuración: Shelf 1, Slot 13, Port 4, ONU ID 38`);
                    
                    db.close();
                }
            }
        });
    });
});

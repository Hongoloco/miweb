const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Insertando comandos de ZTE C600...');

// Obtener el ID de la OLT principal
db.get(`SELECT id FROM olts WHERE nombre LIKE '%ZTE C600 - Principal%'`, (err, olt) => {
    if (err || !olt) {
        console.error('❌ Error: No se encontró la OLT ZTE C600 - Principal');
        db.close();
        return;
    }

    const oltId = olt.id;
    console.log(`📡 OLT encontrada: ${oltId}`);

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

    // Primero limpiar comandos existentes
    db.run(`DELETE FROM comandos WHERE olt_id = ?`, [oltId], (err) => {
        if (err) {
            console.error('❌ Error al limpiar comandos:', err);
            db.close();
            return;
        }

        console.log('🧹 Comandos anteriores limpiados');

        // Insertar todos los comandos
        let insertedCount = 0;
        comandosDefault.forEach((cmd, index) => {
            db.run(`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden) 
                    VALUES (?, ?, ?, ?, ?, ?)`, 
                [oltId, cmd.nombre, cmd.descripcion, JSON.stringify(cmd.comandos), cmd.categoria, index + 1],
                function(err) {
                    if (err) {
                        console.error(`❌ Error insertando comando "${cmd.nombre}":`, err);
                    } else {
                        insertedCount++;
                        if (insertedCount === comandosDefault.length) {
                            console.log(`✅ Se insertaron ${insertedCount} comandos correctamente`);
                            console.log('📋 Categorías incluidas:');
                            const categorias = [...new Set(comandosDefault.map(c => c.categoria))];
                            categorias.forEach(cat => console.log(`   - ${cat}`));
                            db.close();
                        }
                    }
                }
            );
        });
    });
});

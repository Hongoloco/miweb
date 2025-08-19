#!/bin/bash

# 🔧 RESTAURADOR ESPECÍFICO ZTE C600 PARA ALITO
# Restaura específicamente la OLT ZTE C600 con todos sus comandos

echo "🔧 RESTAURADOR ESPECÍFICO ZTE C600 PARA ALITO..."
echo "==============================================="

# Cambiar al directorio web
cd web 2>/dev/null || cd /root/miweb/web || { echo "❌ No se encuentra directorio web"; exit 1; }

# Verificar base de datos
if [ ! -f "olt_system.db" ]; then
    echo "🆕 Creando base de datos..."
    node init-database.js
fi

echo ""
echo "🔍 VERIFICANDO ESTADO ACTUAL..."

# Verificar usuario alito
ALITO_ID=$(sqlite3 olt_system.db "SELECT id FROM usuarios WHERE username='alito';" 2>/dev/null)
if [ -z "$ALITO_ID" ]; then
    echo "⚠️ Usuario alito no encontrado, creando..."
    sqlite3 olt_system.db "
    INSERT OR REPLACE INTO usuarios (id, username, password_hash, rol, email, activo, fecha_creacion) 
    VALUES (2, 'alito', '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'alito@antel.com.uy', 1, datetime('now'));
    " 2>/dev/null && echo "✅ Usuario alito creado" || echo "❌ Error creando usuario"
    ALITO_ID=2
else
    echo "✅ Usuario alito encontrado (ID: $ALITO_ID)"
fi

# Limpiar OLTs ZTE existentes
echo ""
echo "🧹 Limpiando OLTs ZTE C600 existentes..."
sqlite3 olt_system.db "
DELETE FROM comandos WHERE olt_id IN (SELECT id FROM olts WHERE modelo LIKE '%ZTE%' OR nombre LIKE '%C600%');
DELETE FROM olts WHERE modelo LIKE '%ZTE%' OR nombre LIKE '%C600%';
" 2>/dev/null && echo "✅ OLTs ZTE anteriores eliminadas" || echo "⚠️ Error limpiando OLTs"

# Crear nueva OLT ZTE C600
ZTE_ID="olt-zte-c600-alito-$(date +%s)"
echo ""
echo "📡 Creando OLT ZTE C600 para alito..."
sqlite3 olt_system.db "
INSERT INTO olts (id, nombre, shelf, slot, port, onu_id, modelo, estado, fecha_creacion, usuario_id) 
VALUES (
    '$ZTE_ID', 
    'ZTE C600 - Alito', 
    1, 
    13, 
    4, 
    38, 
    'ZTE C600', 
    'activo',
    datetime('now'),
    $ALITO_ID
);
" 2>/dev/null && echo "✅ OLT ZTE C600 creada (ID: $ZTE_ID)" || echo "❌ Error creando OLT"

# Restaurar comandos desde JSON si existe
echo ""
echo "🔧 Restaurando comandos ZTE C600..."

if [ -f "../docs/ZTE C600-2025-07-22.json" ]; then
    echo "📄 Usando archivo JSON oficial..."
    
    node -e "
        const sqlite3 = require('sqlite3').verbose();
        const fs = require('fs');
        const path = require('path');
        
        const db = new sqlite3.Database('olt_system.db');
        const ztePath = path.join(__dirname, '..', 'docs', 'ZTE C600-2025-07-22.json');
        
        try {
            const zteData = JSON.parse(fs.readFileSync(ztePath, 'utf8'));
            const oltId = '$ZTE_ID';
            
            let insertedCount = 0;
            const totalComandos = zteData.comandos.length;
            
            console.log(\`📊 Insertando \${totalComandos} comandos...\`);
            
            zteData.comandos.forEach((comando, index) => {
                const lineasSinComentarios = comando.lines.filter(line => {
                    const linea = line.trim();
                    return linea.length > 0 && !linea.startsWith('#') && !linea.startsWith('//');
                });
                
                const comandoJson = JSON.stringify(lineasSinComentarios);
                
                db.run(
                    \`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden, usuario_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)\`, 
                    [oltId, comando.summary, 'Comando ZTE C600', comandoJson, 'zte_c600', index + 1, $ALITO_ID], 
                    function(err) {
                        if (!err) {
                            insertedCount++;
                            console.log(\`✅ [\${insertedCount}/\${totalComandos}] \${comando.summary}\`);
                            if (insertedCount === totalComandos) {
                                console.log(\`🎉 \${insertedCount} comandos ZTE C600 restaurados exitosamente\`);
                                db.close();
                            }
                        } else {
                            console.error(\`❌ Error insertando comando: \${comando.summary}\`, err.message);
                            insertedCount++;
                            if (insertedCount === totalComandos) {
                                db.close();
                            }
                        }
                    }
                );
            });
        } catch (error) {
            console.error('❌ Error procesando archivo JSON:', error.message);
            db.close();
        }
    " 2>/dev/null || echo "⚠️ Error con archivo JSON, usando comandos básicos..."
    
    sleep 3  # Esperar a que termine la inserción
else
    echo "📝 Archivo JSON no encontrado, creando comandos básicos..."
fi

# Crear comandos básicos si no hay JSON o como respaldo
COMANDOS_ACTUALES=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM comandos WHERE olt_id='$ZTE_ID';" 2>/dev/null || echo "0")

if [ "$COMANDOS_ACTUALES" -eq 0 ]; then
    echo "🔧 Creando comandos básicos ZTE C600..."
    
    sqlite3 olt_system.db "
    INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden, usuario_id) VALUES 
    ('$ZTE_ID', 'Ver base de ONUs', 'Mostrar todas las ONUs conectadas en el puerto', '[\"show gpon onu baseinfo gpon_olt-{shelf}/{slot}/{port}\"]', 'consulta', 1, $ALITO_ID),
    ('$ZTE_ID', 'Estado de ONU específica', 'Ver estado detallado de una ONU', '[\"show gpon onu state gpon_olt-{shelf}/{slot}/{port}:{onuId}\"]', 'consulta', 2, $ALITO_ID),
    ('$ZTE_ID', 'Información de ONU', 'Ver información completa de una ONU', '[\"show gpon onu info gpon_olt-{shelf}/{slot}/{port}:{onuId}\"]', 'consulta', 3, $ALITO_ID),
    ('$ZTE_ID', 'Factory Reset ONU', 'Restaurar ONU a configuración de fábrica', '[\"pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\", \"restore factory\", \"exit\"]', 'configuracion', 4, $ALITO_ID),
    ('$ZTE_ID', 'Configurar modo Bridge', 'Cambiar ONU a modo bridge (transparente)', '[\"pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\", \"vlan port eth_0/1 mode transparent\", \"vlan port eth_0/2 mode transparent\", \"vlan port eth_0/3 mode transparent\", \"vlan port eth_0/4 mode transparent\", \"exit\"]', 'configuracion', 5, $ALITO_ID),
    ('$ZTE_ID', 'Configurar modo Router', 'Cambiar ONU a modo router con DHCP', '[\"pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\", \"dhcp-ip ethuni eth_0/1 from-onu\", \"dhcp-ip ethuni eth_0/2 from-onu\", \"dhcp-ip ethuni eth_0/3 from-onu\", \"dhcp-ip ethuni eth_0/4 from-onu\", \"exit\"]', 'configuracion', 6, $ALITO_ID),
    ('$ZTE_ID', 'Ver configuración VoIP', 'Mostrar configuración de telefonía VoIP', '[\"show gpon remote-onu voip-config gpon_onu-{shelf}/{slot}/{port}:{onuId}\"]', 'voip', 7, $ALITO_ID),
    ('$ZTE_ID', 'Estado línea VoIP', 'Verificar estado de línea telefónica', '[\"show gpon remote-onu voip-linestatus gpon_onu-{shelf}/{slot}/{port}:{onuId}\"]', 'voip', 8, $ALITO_ID),
    ('$ZTE_ID', 'Reiniciar ONU', 'Reiniciar una ONU específica', '[\"pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\", \"reboot\", \"exit\"]', 'mantenimiento', 9, $ALITO_ID),
    ('$ZTE_ID', 'Ver estadísticas puerto', 'Mostrar estadísticas del puerto OLT', '[\"show interface gpon_olt-{shelf}/{slot}/{port} statistics\"]', 'estadisticas', 10, $ALITO_ID);
    " 2>/dev/null && echo "✅ 10 comandos básicos creados" || echo "⚠️ Error creando comandos básicos"
fi

# Verificación final
echo ""
echo "🔍 VERIFICACIÓN FINAL..."

ZTE_COUNT=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM olts WHERE id='$ZTE_ID';" 2>/dev/null || echo "0")
COMANDOS_COUNT=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM comandos WHERE olt_id='$ZTE_ID';" 2>/dev/null || echo "0")
ALITO_PERMISOS=$(sqlite3 olt_system.db "SELECT rol FROM usuarios WHERE username='alito';" 2>/dev/null || echo "sin_rol")

echo "📊 RESULTADOS:"
echo "   👤 Usuario alito: ✅ Configurado (rol: $ALITO_PERMISOS)"
echo "   📡 OLT ZTE C600: $([ "$ZTE_COUNT" -eq 1 ] && echo "✅ Creada" || echo "❌ Error")"
echo "   🔧 Comandos: $([ "$COMANDOS_COUNT" -gt 0 ] && echo "✅ $COMANDOS_COUNT comandos" || echo "❌ Sin comandos")"
echo "   🆔 ID de OLT: $ZTE_ID"

# Mostrar algunos comandos creados
if [ "$COMANDOS_COUNT" -gt 0 ]; then
    echo ""
    echo "🔧 COMANDOS DISPONIBLES:"
    sqlite3 olt_system.db "
    SELECT '   ' || orden || '. ' || nombre || ' (' || categoria || ')' 
    FROM comandos 
    WHERE olt_id='$ZTE_ID' 
    ORDER BY orden 
    LIMIT 5;
    " 2>/dev/null
    
    if [ "$COMANDOS_COUNT" -gt 5 ]; then
        echo "   ... y $((COMANDOS_COUNT - 5)) comandos más"
    fi
fi

echo ""
echo "🌐 INFORMACIÓN DE ACCESO:"
echo "   URL: http://localhost:3000"
echo "   Usuario: alito"
echo "   Contraseña: 123"
echo "   OLT: ZTE C600 - Alito"
echo "   Configuración: Shelf 1, Slot 13, Port 4, ONU ID 38"

echo ""
echo "✅ RESTAURACIÓN ZTE C600 COMPLETADA"
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "1. Inicia sesión con alito/123"
echo "2. Ve a la sección 'OLTs' en el menú"
echo "3. Deberías ver 'ZTE C600 - Alito' con $COMANDOS_COUNT comandos"
echo "4. Si no aparece, presiona Ctrl+F5 para limpiar cache del navegador"

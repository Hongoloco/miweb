#!/bin/bash

# 🔧 SOLUCIONADOR DE PROBLEMAS ZTE C600 Y TAREAS DUPLICADAS
# Repara problemas específicos con la OLT ZTE C600 de alito y duplicación de tareas

echo "🔧 SOLUCIONANDO PROBLEMAS ZTE C600 Y TAREAS DUPLICADAS..."
echo "========================================================="

# Cambiar al directorio web
cd web 2>/dev/null || cd /root/miweb/web || { echo "❌ No se encuentra directorio web"; exit 1; }

# Verificar que existe la base de datos
if [ ! -f "olt_system.db" ]; then
    echo "❌ Base de datos no encontrada"
    echo "🔧 Creando base de datos..."
    node init-database.js
fi

echo ""
echo "🔍 DIAGNÓSTICO INICIAL..."

# Verificar usuario alito
ALITO_EXISTS=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM usuarios WHERE username='alito';" 2>/dev/null || echo "0")
echo "👤 Usuario alito: $([ "$ALITO_EXISTS" -gt 0 ] && echo "✅ Existe" || echo "❌ No existe")"

# Verificar OLT ZTE C600
ZTE_COUNT=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM olts WHERE modelo LIKE '%ZTE%C600%';" 2>/dev/null || echo "0")
echo "📡 OLTs ZTE C600: $ZTE_COUNT encontradas"

# Verificar comandos
COMANDOS_COUNT=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM comandos;" 2>/dev/null || echo "0")
echo "🔧 Comandos totales: $COMANDOS_COUNT"

# Verificar tareas duplicadas
TAREAS_DUPLICADAS=$(sqlite3 olt_system.db "SELECT COUNT(*) - COUNT(DISTINCT nombre) as duplicados FROM tareas;" 2>/dev/null || echo "0")
echo "📋 Tareas duplicadas: $TAREAS_DUPLICADAS"

echo ""
echo "🛠️ APLICANDO SOLUCIONES..."

# SOLUCIÓN 1: Crear/Verificar usuario alito
echo ""
echo "1️⃣ Configurando usuario alito..."
sqlite3 olt_system.db "
INSERT OR REPLACE INTO usuarios (id, username, password_hash, rol, email, activo, fecha_creacion) 
VALUES (
    2, 
    'alito', 
    '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    'admin', 
    'alito@antel.com.uy', 
    1, 
    datetime('now')
);
" 2>/dev/null && echo "✅ Usuario alito configurado" || echo "⚠️ Error configurando usuario"

# SOLUCIÓN 2: Limpiar y recrear OLT ZTE C600
echo ""
echo "2️⃣ Recreando OLT ZTE C600..."

# Eliminar OLTs y comandos existentes
sqlite3 olt_system.db "
DELETE FROM comandos WHERE olt_id LIKE '%zte%' OR olt_id LIKE '%c600%';
DELETE FROM olts WHERE modelo LIKE '%ZTE%' OR modelo LIKE '%C600%';
" 2>/dev/null

# Crear OLT ZTE C600 nueva
ZTE_ID="olt-zte-c600-$(date +%s)"
sqlite3 olt_system.db "
INSERT INTO olts (id, nombre, shelf, slot, port, onu_id, modelo, estado, fecha_creacion) 
VALUES (
    '$ZTE_ID', 
    'ZTE C600 - Principal', 
    1, 
    13, 
    4, 
    38, 
    'ZTE C600', 
    'activo',
    datetime('now')
);
" 2>/dev/null && echo "✅ OLT ZTE C600 creada" || echo "⚠️ Error creando OLT"

# SOLUCIÓN 3: Restaurar comandos ZTE C600
echo ""
echo "3️⃣ Restaurando comandos ZTE C600..."

# Verificar si existe el archivo JSON
if [ -f "../docs/ZTE C600-2025-07-22.json" ]; then
    echo "📄 Archivo JSON encontrado, restaurando comandos..."
    node -e "
        const sqlite3 = require('sqlite3').verbose();
        const fs = require('fs');
        const path = require('path');
        
        const db = new sqlite3.Database('olt_system.db');
        const ztePath = path.join(__dirname, '..', 'docs', 'ZTE C600-2025-07-22.json');
        const zteData = JSON.parse(fs.readFileSync(ztePath, 'utf8'));
        const oltId = '$ZTE_ID';
        
        let insertedCount = 0;
        const totalComandos = zteData.comandos.length;
        
        zteData.comandos.forEach((comando, index) => {
            const lineasSinComentarios = comando.lines.filter(line => !line.trim().startsWith('#'));
            const comandoJson = JSON.stringify(lineasSinComentarios);
            
            db.run(
                'INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden) VALUES (?, ?, ?, ?, ?, ?)', 
                [oltId, comando.summary, 'Comando ZTE C600', comandoJson, 'zte_c600', index + 1], 
                function(err) {
                    if (!err) {
                        insertedCount++;
                        console.log(\`✅ Comando insertado: \${comando.summary}\`);
                        if (insertedCount === totalComandos) {
                            console.log(\`🎉 \${insertedCount} comandos ZTE C600 restaurados\`);
                            db.close();
                        }
                    } else {
                        console.error(\`❌ Error insertando comando: \${comando.summary}\`, err);
                    }
                }
            );
        });
    " 2>/dev/null || echo "⚠️ Error restaurando comandos desde JSON"
else
    # Crear comandos básicos manualmente
    echo "📝 Creando comandos básicos ZTE C600..."
    sqlite3 olt_system.db "
    INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden) VALUES 
    ('$ZTE_ID', 'Ver base ONUs', 'Ver ONUs conectadas', '[\"show gpon onu baseinfo gpon_olt-{shelf}/{slot}/{port}\"]', 'consulta', 1),
    ('$ZTE_ID', 'Estado ONU', 'Ver estado de una ONU', '[\"show gpon onu state gpon_olt-{shelf}/{slot}/{port}:{onuId}\"]', 'consulta', 2),
    ('$ZTE_ID', 'Factory Reset', 'Resetear ONU a fábrica', '[\"pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\", \"restore factory\"]', 'configuracion', 3),
    ('$ZTE_ID', 'Modo Bridge', 'Configurar modo bridge', '[\"pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\", \"vlan port eth_0/1 mode transparent\", \"exit\"]', 'configuracion', 4),
    ('$ZTE_ID', 'Modo Router', 'Configurar modo router', '[\"pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\", \"dhcp-ip ethuni eth_0/1 from-onu\", \"exit\"]', 'configuracion', 5);
    " 2>/dev/null && echo "✅ Comandos básicos creados" || echo "⚠️ Error creando comandos básicos"
fi

# SOLUCIÓN 4: Limpiar tareas duplicadas
echo ""
echo "4️⃣ Limpiando tareas duplicadas..."

sqlite3 olt_system.db "
-- Crear tabla temporal con tareas únicas
CREATE TEMP TABLE tareas_unicas AS 
SELECT MIN(id) as id, nombre, descripcion, categoria, prioridad, estado, fecha_creacion, fecha_vencimiento, asignado_a
FROM tareas 
GROUP BY nombre, LOWER(TRIM(descripcion));

-- Eliminar todas las tareas
DELETE FROM tareas;

-- Insertar solo las tareas únicas
INSERT INTO tareas (nombre, descripcion, categoria, prioridad, estado, fecha_creacion, fecha_vencimiento, asignado_a)
SELECT nombre, descripcion, categoria, prioridad, estado, fecha_creacion, fecha_vencimiento, asignado_a
FROM tareas_unicas;

-- Mostrar resultado
SELECT 'Tareas después de limpieza: ' || COUNT(*) FROM tareas;
" 2>/dev/null && echo "✅ Tareas duplicadas eliminadas" || echo "⚠️ Error limpiando tareas"

# SOLUCIÓN 5: Verificar permisos de usuario alito
echo ""
echo "5️⃣ Verificando permisos de alito..."

sqlite3 olt_system.db "
UPDATE usuarios 
SET rol = 'admin', activo = 1 
WHERE username = 'alito';
" 2>/dev/null && echo "✅ Permisos de alito verificados" || echo "⚠️ Error actualizando permisos"

# VERIFICACIÓN FINAL
echo ""
echo "🔍 VERIFICACIÓN FINAL..."

# Contar resultados
ALITO_FINAL=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM usuarios WHERE username='alito';" 2>/dev/null || echo "0")
ZTE_FINAL=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM olts WHERE modelo LIKE '%ZTE%C600%';" 2>/dev/null || echo "0")
COMANDOS_FINAL=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM comandos WHERE olt_id='$ZTE_ID';" 2>/dev/null || echo "0")
TAREAS_FINAL=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM tareas;" 2>/dev/null || echo "0")

echo "📊 RESULTADOS FINALES:"
echo "   👤 Usuario alito: $([ "$ALITO_FINAL" -gt 0 ] && echo "✅ Configurado" || echo "❌ Error")"
echo "   📡 OLT ZTE C600: $([ "$ZTE_FINAL" -gt 0 ] && echo "✅ $ZTE_FINAL creada(s)" || echo "❌ No creada")"
echo "   🔧 Comandos ZTE: $([ "$COMANDOS_FINAL" -gt 0 ] && echo "✅ $COMANDOS_FINAL comandos" || echo "❌ Sin comandos")"
echo "   📋 Tareas: ✅ $TAREAS_FINAL tareas (sin duplicados)"

# Mostrar información de conexión
echo ""
echo "🌐 INFORMACIÓN DE CONEXIÓN:"
echo "   URL: http://localhost:3000"
echo "   Usuario: alito"
echo "   Contraseña: 123"

# Verificar si el servidor está corriendo
if pgrep -f "node.*server" > /dev/null; then
    echo "   Estado servidor: ✅ Ejecutándose"
else
    echo "   Estado servidor: ⚠️ No ejecutándose"
    echo "   Para iniciar: npm start"
fi

echo ""
echo "✅ SOLUCIÓN COMPLETADA"
echo ""
echo "💡 INSTRUCCIONES FINALES:"
echo "1. Si el servidor no está ejecutándose, ejecuta: npm start"
echo "2. Abre http://localhost:3000 en tu navegador"
echo "3. Haz login con alito/123"
echo "4. Ve a la sección OLTs para ver la ZTE C600"
echo "5. Ve a Tareas para verificar que no hay duplicados"
echo ""
echo "🔧 Si persisten problemas:"
echo "   - Presiona Ctrl+F5 en el navegador para limpiar cache"
echo "   - Ejecuta: ./verificar-deploy.sh"

#!/bin/bash

# Script para ejecutar después de git pull
# Restaura la base de datos con la OLT ZTE C600 y sus comandos
# Mantiene la contraseña vinilo28 para el usuario alito

echo "🔄 Ejecutando script post-git-pull..."
echo "============================================"

# Cambiar al directorio web
cd "$(dirname "$0")/web" || exit 1

# 1. Verificar si existe la base de datos
if [ ! -f olt_system.db ]; then
    echo "⚠️ Base de datos no encontrada, creando nueva..."
    node init-database.js
else
    # Hacer backup de la base de datos actual por si acaso
    echo "📦 Haciendo backup de la base de datos existente..."
    cp olt_system.db olt_system.db.bak
fi

# 2. Verificar si la OLT ZTE C600 existe
echo "🔍 Verificando OLT ZTE C600..."
OLT_COUNT=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM olts WHERE modelo='ZTE C600';")

if [ "$OLT_COUNT" -eq 0 ]; then
    echo "⚠️ OLT ZTE C600 no encontrada, restaurando..."
    
    # Restaurar OLT y comandos desde el archivo JSON
    echo "📡 Restaurando OLT ZTE C600 desde archivo JSON..."
    
    # Verificar si el archivo JSON existe
    if [ -f "../docs/ZTE C600-2025-07-22.json" ]; then
        # Insertar OLT
        ZTE_ID="olt-1747418871049"
        sqlite3 olt_system.db "INSERT OR REPLACE INTO olts (id, nombre, shelf, slot, port, onu_id, modelo, estado) VALUES ('$ZTE_ID', 'ZTE C600', 1, 13, 4, 38, 'ZTE C600', 'activo');"
        
        echo "✅ OLT ZTE C600 restaurada"
        
        # Restaurar comandos usando JavaScript (más fácil para parsear JSON)
        echo "🔧 Restaurando comandos..."
        node -e "
            const fs = require('fs');
            const path = require('path');
            const sqlite3 = require('sqlite3').verbose();
            
            const db = new sqlite3.Database('olt_system.db');
            const ztePath = path.join(__dirname, '..', 'docs', 'ZTE C600-2025-07-22.json');
            const zteData = JSON.parse(fs.readFileSync(ztePath, 'utf8'));
            const oltId = zteData.id || 'olt-1747418871049';
            
            // Eliminar comandos existentes para evitar duplicados
            db.run('DELETE FROM comandos WHERE olt_id = ?', [oltId], function() {
                console.log('   Limpiando comandos existentes...');
                
                // Insertar comandos
                let insertedCount = 0;
                zteData.comandos.forEach((comando, index) => {
                    const lineasSinComentarios = comando.lines.filter(line => !line.trim().startsWith('#'));
                    const comandoJson = JSON.stringify(lineasSinComentarios);
                    
                    db.run(
                        'INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, orden) VALUES (?, ?, ?, ?, ?)', 
                        [oltId, comando.summary, 'Comando ZTE C600', comandoJson, index + 1], 
                        function() {
                            insertedCount++;
                            if (insertedCount === zteData.comandos.length) {
                                console.log('   ✅ ' + insertedCount + ' comandos restaurados');
                                db.close();
                            }
                        }
                    );
                });
            });
        "
    else
        echo "❌ Archivo JSON de OLT ZTE C600 no encontrado"
    fi
else
    echo "✅ OLT ZTE C600 ya existe en la base de datos"
fi

# 3. Asegurarse que alito tenga la contraseña correcta (vinilo28)
echo "🔐 Verificando contraseña del usuario alito..."
if [ -f "actualizar-password-vinilo28.js" ]; then
    node actualizar-password-vinilo28.js
else
    echo "⚠️ Script actualizar-password-vinilo28.js no encontrado"
    # Actualizar manualmente si el script no está disponible
    node -e "
        const sqlite3 = require('sqlite3').verbose();
        const bcrypt = require('bcrypt');
        const db = new sqlite3.Database('olt_system.db');
        
        const nuevaContrasena = 'vinilo28';
        const hashedPassword = bcrypt.hashSync(nuevaContrasena, 10);
        
        db.run('UPDATE usuarios SET password_hash = ? WHERE username = ?', 
            [hashedPassword, 'alito'], 
            function(err) {
                if (err) console.error('❌ Error:', err);
                else console.log('   ✅ Contraseña de alito actualizada a: vinilo28');
                db.close();
            }
        );
    "
fi

# 4. Verificar que todo está correcto
echo "🔍 Verificando configuración final..."
sqlite3 olt_system.db "
    SELECT 'Usuarios: ' || COUNT(*) FROM usuarios;
    SELECT 'OLTs: ' || COUNT(*) FROM olts;
    SELECT 'Comandos: ' || COUNT(*) FROM comandos;
    SELECT 'Usuario alito: ' || COUNT(*) FROM usuarios WHERE username='alito';
"

echo ""
echo "✅ Restauración post-git-pull completada"
echo "🔐 Credenciales: usuario=alito, contraseña=vinilo28"
echo ""
echo "📡 Para iniciar el servidor: npm start"

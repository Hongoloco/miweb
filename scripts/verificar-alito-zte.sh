#!/bin/bash
# Script para verificar que la base de datos ZTE C600 de alito esté siempre presente

DB_PATH="/workspaces/miweb/web/databases/alito_olt_system.db"
BACKUP_PATH="/workspaces/miweb/backup/alito-zte-backup.db"

echo "🔍 Verificando base de datos de alito..."

# Verificar que existe la base de datos
if [ ! -f "$DB_PATH" ]; then
    echo "❌ ERROR: Base de datos de alito no encontrada!"
    echo "📁 Buscando respaldos..."
    
    if [ -f "$BACKUP_PATH" ]; then
        echo "🔄 Restaurando desde respaldo..."
        cp "$BACKUP_PATH" "$DB_PATH"
        echo "✅ Base de datos restaurada"
    else
        echo "❌ No se encontró respaldo. Ejecutando restauración completa..."
        cd /workspaces/miweb/web
        node restaurar-alito-zte.js
    fi
fi

# Verificar OLTs ZTE C600
OLTS_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM olts WHERE modelo LIKE '%C600%';")
COMANDOS_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM comandos WHERE olt_id = 8;")

echo "📊 Estado actual:"
echo "   🏢 OLTs ZTE C600: $OLTS_COUNT"
echo "   📋 Comandos ZTE: $COMANDOS_COUNT"

if [ "$OLTS_COUNT" -lt 1 ] || [ "$COMANDOS_COUNT" -lt 10 ]; then
    echo "⚠️  Datos incompletos detectados. Restaurando..."
    cd /workspaces/miweb/web
    node restaurar-alito-zte.js
    echo "✅ Datos restaurados"
fi

# Crear respaldo
mkdir -p /workspaces/miweb/backup
cp "$DB_PATH" "$BACKUP_PATH"
echo "💾 Respaldo creado: $(date)"

echo "🎯 Verificación completada. Base de datos de alito protegida."

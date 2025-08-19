#!/bin/bash
# Script para limpiar OLTs de prueba y mantener solo la principal de alito

DB_PATH="/workspaces/miweb/web/databases/alito_olt_system.db"
BACKUP_DIR="/workspaces/miweb/backup"

echo "🧹 Limpiando OLTs de prueba de alito..."

# Crear respaldo antes de limpiar
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/alito-backup-limpieza-$(date +%Y%m%d_%H%M%S).db"
cp "$DB_PATH" "$BACKUP_FILE"
echo "💾 Respaldo creado: $BACKUP_FILE"

# Verificar que existe la OLT principal (ID 8)
OLT_PRINCIPAL=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM olts WHERE id = 8 AND nombre LIKE '%Alito%';")

if [ "$OLT_PRINCIPAL" -eq 0 ]; then
    echo "❌ ERROR: No se encuentra la OLT principal de Alito (ID 8)"
    echo "🔄 Restaurando desde respaldo..."
    cd /workspaces/miweb/web
    node restaurar-alito-zte.js
    echo "✅ OLT principal restaurada"
fi

# Contar OLTs antes de limpiar
OLTS_ANTES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM olts WHERE modelo LIKE '%C600%';")
COMANDOS_ANTES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM comandos;")

echo "📊 Estado antes de limpieza:"
echo "   🏢 OLTs ZTE C600: $OLTS_ANTES"
echo "   📋 Comandos totales: $COMANDOS_ANTES"

# Eliminar OLTs de prueba (mantener solo la principal con ID 8)
sqlite3 "$DB_PATH" "
BEGIN TRANSACTION;

-- Eliminar comandos de OLTs que no son la principal
DELETE FROM comandos WHERE olt_id IN (
    SELECT id FROM olts 
    WHERE modelo LIKE '%C600%' 
    AND id != 8
);

-- Eliminar OLTs que no son la principal
DELETE FROM olts WHERE modelo LIKE '%C600%' AND id != 8;

COMMIT;
"

# Verificar resultado
OLTS_DESPUES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM olts WHERE modelo LIKE '%C600%';")
COMANDOS_DESPUES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM comandos WHERE olt_id = 8;")

echo "📊 Estado después de limpieza:"
echo "   🏢 OLTs ZTE C600: $OLTS_DESPUES"
echo "   📋 Comandos ZTE (ID 8): $COMANDOS_DESPUES"

# Verificar que la OLT principal está intacta
OLT_PRINCIPAL_NOMBRE=$(sqlite3 "$DB_PATH" "SELECT nombre FROM olts WHERE id = 8;")
echo "✅ OLT principal mantenida: $OLT_PRINCIPAL_NOMBRE"

if [ "$COMANDOS_DESPUES" -eq 10 ]; then
    echo "✅ Limpieza completada exitosamente"
    echo "🎯 Solo queda la OLT principal con sus 10 comandos ZTE C600"
else
    echo "⚠️  Advertencia: La OLT principal no tiene 10 comandos"
    echo "🔄 Puede necesitar restauración"
fi

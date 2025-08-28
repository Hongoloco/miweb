#!/bin/bash

# 💾 SCRIPT DE RESPALDO MANUAL ANTES DE ACTUALIZACIONES
# ====================================================
# Usa este script antes de hacer git pull para extra seguridad

echo "💾 RESPALDO MANUAL DE DATOS"
echo "=========================="

# Obtener timestamp para el nombre del respaldo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./respaldos_manuales/backup_$TIMESTAMP"

# Crear directorio de respaldos
mkdir -p "$BACKUP_DIR"

echo ""
echo "📦 Creando respaldo en: $BACKUP_DIR"

# Contar archivos a respaldar
FILES_COUNT=0

# Respaldar base de datos principal
if [ -f "web/olt_system.db" ]; then
    cp "web/olt_system.db" "$BACKUP_DIR/"
    echo "✅ Base de datos principal ($(du -h web/olt_system.db | cut -f1))"
    ((FILES_COUNT++))
fi

# Respaldar bases de datos de usuarios
if [ -d "web/databases" ]; then
    cp -r "web/databases" "$BACKUP_DIR/"
    USER_DBS=$(find web/databases -name "*.db" 2>/dev/null | wc -l)
    echo "✅ Bases de datos de usuarios ($USER_DBS archivos)"
    ((FILES_COUNT++))
fi

# Respaldar backups existentes
if [ -d "web/backups" ]; then
    cp -r "web/backups" "$BACKUP_DIR/"
    EXISTING_BACKUPS=$(find web/backups -name "*.json" 2>/dev/null | wc -l)
    echo "✅ Backups automáticos existentes ($EXISTING_BACKUPS archivos)"
    ((FILES_COUNT++))
fi

# Respaldar configuraciones personalizadas
if [ -f "web/.env" ]; then
    cp "web/.env" "$BACKUP_DIR/"
    echo "✅ Configuración personalizada (.env)"
    ((FILES_COUNT++))
fi

# Respaldar cookies y sesiones
if [ -f "web/cookies.txt" ]; then
    cp "web/cookies.txt" "$BACKUP_DIR/"
    echo "✅ Cookies de sesión"
    ((FILES_COUNT++))
fi

# Crear un manifiesto del respaldo
cat > "$BACKUP_DIR/MANIFIESTO.txt" << EOF
RESPALDO MANUAL DE DATOS
========================
Fecha: $(date)
Usuario: $(whoami)
Directorio origen: $(pwd)
Archivos respaldados: $FILES_COUNT

CONTENIDO:
$(ls -la "$BACKUP_DIR")

INSTRUCCIONES DE RESTAURACIÓN:
1. Para restaurar base de datos principal:
   cp $BACKUP_DIR/olt_system.db web/

2. Para restaurar bases de datos de usuarios:
   cp -r $BACKUP_DIR/databases web/

3. Para restaurar backups:
   cp -r $BACKUP_DIR/backups web/

4. Para restaurar configuración:
   cp $BACKUP_DIR/.env web/

NOTA: Este respaldo se creó antes de una actualización Git.
EOF

echo ""
echo "📋 RESUMEN DEL RESPALDO"
echo "======================"
echo "📂 Ubicación: $BACKUP_DIR"
echo "📁 Archivos: $FILES_COUNT elementos respaldados"
echo "💾 Tamaño: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo "📄 Manifiesto: $BACKUP_DIR/MANIFIESTO.txt"

echo ""
echo "✅ RESPALDO COMPLETADO"
echo "===================="
echo "🔒 Tus datos están seguros en: $BACKUP_DIR"
echo "📝 Lee el manifiesto para instrucciones de restauración"
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "   1. Ahora puedes hacer: git pull"
echo "   2. Ejecutar: bash post-git-pull.sh (restaura automáticamente)"
echo "   3. O restaurar manualmente según el manifiesto"

echo ""
echo "🗑️ LIMPIEZA: Para eliminar respaldos antiguos ejecuta:"
echo "   find ./respaldos_manuales -type d -name 'backup_*' -mtime +7 -exec rm -rf {} +"

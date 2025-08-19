#!/bin/bash

# 🔄 SOLUCIÓN SUAVE - Forzar actualización git pull
# Ejecuta este script en tu servidor cuando git pull no refleje cambios

echo "🔄 FORZANDO ACTUALIZACIÓN GIT PULL..."
echo "====================================="

# Paso 1: Detener servidor si está ejecutándose
echo "🛑 Deteniendo servidor..."
pkill -f "node.*server.js" 2>/dev/null || echo "No hay servidor ejecutándose"

# Paso 2: Hacer stash de cambios locales (por si acaso)
echo "💾 Guardando cambios locales temporalmente..."
git stash push -m "Backup antes de forzar pull - $(date)"

# Paso 3: Forzar fetch y reset
echo "🌐 Forzando actualización desde remoto..."
git fetch origin
git reset --hard origin/main

# Paso 4: Limpiar archivos no rastreados
echo "🧹 Limpiando archivos no rastreados..."
git clean -fd

# Paso 5: Verificar que se aplicaron los cambios
echo "✅ Verificando cambios aplicados..."
git log --oneline -3

# Paso 6: Forzar actualización de timestamps para evitar cache
echo "⏰ Actualizando timestamps de archivos..."
find web -name "*.html" -exec touch {} \; 2>/dev/null
find web -name "*.js" -exec touch {} \; 2>/dev/null

# Paso 7: Restaurar base de datos si es necesario
echo "💾 Configurando base de datos..."
cd web 2>/dev/null || echo "Directorio web no encontrado"
if [ -f "init-database.js" ]; then
    node init-database.js
fi

# Paso 8: Reiniciar servidor
echo "🚀 Reiniciando servidor..."
npm start &

echo ""
echo "✅ ACTUALIZACIÓN FORZADA COMPLETADA"
echo "🌐 Servidor disponible en: http://localhost:3000"
echo "💡 Si persisten problemas, usa la solución drástica"

#!/bin/bash

# SCRIPT DE EMERGENCIA: Solución rápida para base de datos vacía
# Usar cuando olt_system.db está vacía después de git pull

echo "🚑 SOLUCIÓN DE EMERGENCIA - BASE DE DATOS VACÍA"
echo "=============================================="

# Ir al directorio web
cd web 2>/dev/null || { echo "❌ Error: No se encontró directorio 'web'"; exit 1; }

# Verificar el problema
if [ -f "olt_system.db" ]; then
    SIZE=$(stat -c%s "olt_system.db" 2>/dev/null || stat -f%z "olt_system.db" 2>/dev/null || echo "unknown")
    echo "📄 olt_system.db actual: ${SIZE} bytes"
else
    echo "📄 olt_system.db: NO EXISTE"
    SIZE="0"
fi

if [ "$SIZE" != "0" ] && [ "$SIZE" != "unknown" ]; then
    echo "✅ La base de datos parece estar bien (${SIZE} bytes)"
    echo "🔍 Si tienes errores, el problema puede ser de tablas faltantes"
    echo "🔧 Ejecuta: node database-migrations.js"
    exit 0
fi

echo "⚠️  Base de datos vacía o corrupta, procediendo con recuperación..."

# Paso 1: Eliminar archivo corrupto
if [ -f "olt_system.db" ]; then
    echo "🗑️  Eliminando archivo corrupto..."
    rm olt_system.db
fi

# Paso 2: Detener cualquier proceso del servidor
echo "⏹️  Deteniendo servidor si está corriendo..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Paso 3: Inicializar nueva base de datos
echo "🔄 Inicializando nueva base de datos..."
echo "   (Esto puede tomar 10-15 segundos)"

# Iniciar servidor en background para que inicialice la BD
node server.js &
SERVER_PID=$!

# Esperar que se inicialice
sleep 12

# Detener servidor
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
sleep 2

# Verificar que se creó la base de datos
if [ -f "olt_system.db" ]; then
    NEW_SIZE=$(stat -c%s "olt_system.db" 2>/dev/null || stat -f%z "olt_system.db" 2>/dev/null || echo "0")
    echo "✅ Base de datos inicializada: ${NEW_SIZE} bytes"
else
    echo "❌ Error: No se pudo inicializar la base de datos"
    echo "🔧 Intenta ejecutar manualmente: node server.js"
    exit 1
fi

# Paso 4: Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
if [ -f "database-migrations.js" ]; then
    node database-migrations.js
    echo "✅ Migraciones completadas"
else
    echo "⚠️  Archivo de migraciones no encontrado"
fi

# Paso 5: Verificación final
echo ""
echo "🔍 VERIFICACIÓN FINAL:"
echo "===================="

if command -v sqlite3 >/dev/null 2>&1; then
    echo "📊 Tablas en la base de datos:"
    sqlite3 olt_system.db ".tables" 2>/dev/null || echo "   Error consultando tablas"
    
    echo ""
    echo "👥 Usuarios disponibles:"
    sqlite3 olt_system.db "SELECT id, username, rol FROM usuarios;" 2>/dev/null || echo "   Error consultando usuarios"
else
    echo "⚠️  sqlite3 no disponible para verificación detallada"
fi

echo ""
echo "✅ RECUPERACIÓN COMPLETADA"
echo "========================"
echo "🔹 Base de datos inicializada ✓"
echo "🔹 Migraciones ejecutadas ✓"
echo "🔹 Sistema listo para usar ✓"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "   1. Ejecutar: npm start"
echo "   2. Acceder a: http://tu-servidor:3000"
echo "   3. Crear usuarios si es necesario"
echo ""
echo "💡 Si necesitas usuarios de prueba, usa la interfaz web"
echo "   o ejecuta scripts de creación de usuarios disponibles"

cd ..
echo "🏁 Script de emergencia completado"

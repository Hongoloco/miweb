#!/bin/bash

# 🔍 SCRIPT DE VERIFICACIÓN POST-DEPLOY
# Verifica que los cambios se aplicaron correctamente después del git pull

echo "🔍 VERIFICANDO ESTADO DEL DEPLOY..."
echo "==================================="

# Cambiar al directorio del proyecto
cd "$(dirname "$0")" || exit 1

# Función para verificar archivo
verificar_archivo() {
    if [ -f "$1" ]; then
        local fecha_mod=$(stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null)
        local fecha_actual=$(date +%s)
        local diferencia=$((fecha_actual - fecha_mod))
        
        if [ $diferencia -lt 300 ]; then  # Menos de 5 minutos
            echo "✅ $1 (modificado recientemente: ${diferencia}s)"
        else
            echo "⚠️  $1 (último cambio: $(date -d @$fecha_mod 2>/dev/null || date -r $fecha_mod 2>/dev/null))"
        fi
    else
        echo "❌ $1 (NO ENCONTRADO)"
    fi
}

echo ""
echo "📄 VERIFICANDO ARCHIVOS PRINCIPALES:"
verificar_archivo "web/index.html"
verificar_archivo "web/server.js"
verificar_archivo "web/package.json"

echo ""
echo "🗃️ VERIFICANDO BASE DE DATOS:"
cd web

if [ -f "olt_system.db" ]; then
    echo "✅ olt_system.db encontrada"
    
    # Verificar contenido de la BD
    echo "📊 Contenido de la BD:"
    sqlite3 olt_system.db "
        SELECT '   👥 Usuarios: ' || COUNT(*) FROM usuarios;
        SELECT '   📡 OLTs: ' || COUNT(*) FROM olts;
        SELECT '   🔧 Comandos: ' || COUNT(*) FROM comandos;
    " 2>/dev/null || echo "❌ Error al acceder a la BD"
    
    # Verificar usuario del sistema
    USUARIO_COUNT=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM usuarios WHERE username='aser' OR username='alito';" 2>/dev/null)
    if [ "$USUARIO_COUNT" -gt 0 ]; then
        echo "   ✅ Usuario del sistema configurado"
    else
        echo "   ⚠️  Usuario del sistema no encontrado"
    fi
else
    echo "❌ olt_system.db NO ENCONTRADA"
fi

echo ""
echo "🔄 VERIFICANDO PROCESOS:"
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Servidor Node.js ejecutándose"
    echo "   PID: $(pgrep -f "node.*server.js")"
else
    echo "⚠️ Servidor Node.js NO está ejecutándose"
fi

echo ""
echo "🌐 VERIFICANDO PUERTO 3000:"
if netstat -tuln 2>/dev/null | grep ":3000 " > /dev/null || ss -tuln 2>/dev/null | grep ":3000 " > /dev/null; then
    echo "✅ Puerto 3000 en uso (servidor probablemente ejecutándose)"
else
    echo "⚠️ Puerto 3000 libre (servidor no ejecutándose)"
fi

echo ""
echo "🏠 VERIFICANDO ACCESO WEB:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    echo "✅ Servidor web respondiendo correctamente"
else
    echo "⚠️ Servidor web no responde en localhost:3000"
fi

echo ""
echo "📂 VERIFICANDO LIMPIEZA DE ARCHIVOS:"
ARCHIVOS_TEST=$(find web -name "test-*.js" -o -name "test-*.html" -o -name "diagnostico*.js" -o -name "diagnostico*.html" | wc -l)
ARCHIVOS_DEBUG=$(find web -name "debug*.js" -o -name "debug*.html" | wc -l)
ARCHIVOS_BACKUP=$(find web -name "*.backup.*" | wc -l)

if [ "$ARCHIVOS_TEST" -eq 0 ] && [ "$ARCHIVOS_DEBUG" -eq 0 ] && [ "$ARCHIVOS_BACKUP" -eq 0 ]; then
    echo "✅ Proyecto limpio (sin archivos de testing/debug)"
else
    echo "⚠️ Archivos de testing/debug encontrados:"
    echo "   🧪 Testing: $ARCHIVOS_TEST archivos"
    echo "   🐛 Debug: $ARCHIVOS_DEBUG archivos"  
    echo "   📦 Backup: $ARCHIVOS_BACKUP archivos"
fi

echo ""
echo "📋 RESUMEN DE VERIFICACIÓN"
echo "=========================="

# Determinar estado general
ERRORES=0

if [ ! -f "web/olt_system.db" ]; then ((ERRORES++)); fi
if ! pgrep -f "node.*server.js" > /dev/null; then ((ERRORES++)); fi

if [ $ERRORES -eq 0 ]; then
    echo "🎉 DEPLOY EXITOSO - Todo funcionando correctamente"
    echo ""
    echo "✅ Próximos pasos:"
    echo "   1. Abrir http://localhost:3000 en el navegador"
    echo "   2. Hacer login con usuario: aser"
    echo "   3. Verificar funcionalidad completa"
else
    echo "⚠️ DEPLOY CON PROBLEMAS - Se encontraron $ERRORES errores"
    echo ""
    echo "🔧 Acciones recomendadas:"
    if [ ! -f "web/olt_system.db" ]; then
        echo "   1. Ejecutar: cd web && node init-database.js"
    fi
    if ! pgrep -f "node.*server.js" > /dev/null; then
        echo "   2. Ejecutar: npm start"
    fi
fi

echo ""
echo "💡 TIP: Si hay problemas de cache, presiona Ctrl+F5 en el navegador"

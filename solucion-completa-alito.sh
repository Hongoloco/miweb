#!/bin/bash

# Script de SOLUCIÓN COMPLETA para el problema de alito
# Corrige base de datos principal y reinicia servidor

echo "🚀 SOLUCIONANDO PROBLEMA DE ALITO"
echo "=================================="
echo ""

# Ir al directorio correcto
cd web || { echo "❌ Error: No se encuentra directorio web"; exit 1; }

echo "🔧 1. Corrigiendo base de datos principal..."
node corregir-base-principal.js

if [ $? -ne 0 ]; then
    echo "❌ Error corrigiendo base principal"
    exit 1
fi

echo ""
echo "🔧 2. Aplicando corrección de columna orden..."
node fix-orden-column.js

if [ $? -ne 0 ]; then
    echo "❌ Error aplicando fix-orden-column"
    exit 1
fi

echo ""
echo "🔄 3. Reiniciando servidor..."
cd ..

# Detener servidor actual
if pgrep -f "node server.js" > /dev/null; then
    echo "🛑 Deteniendo servidor actual..."
    pkill -f "node server.js"
    sleep 2
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
cd web
nohup node server.js > ../server.log 2>&1 &
cd ..

# Esperar a que inicie
sleep 3

# Verificar que está corriendo
if pgrep -f "node server.js" > /dev/null; then
    echo "✅ Servidor iniciado correctamente"
else
    echo "❌ Error iniciando servidor"
    echo "💡 Revisa los logs: tail -f server.log"
    exit 1
fi

echo ""
echo "🧪 4. Probando login de alito..."
cd web

# Probar login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alito","password":"vinilo28"}' \
  -c test_cookies.txt \
  -s > login_result.txt

if grep -q "success.*true" login_result.txt; then
    echo "✅ Login de alito exitoso"
    
    # Probar OLTs
    echo "📊 Verificando OLTs disponibles..."
    curl -X GET http://localhost:3000/api/olts \
      -b test_cookies.txt \
      -s > olts_result.txt
    
    if grep -q "ZTE C600" olts_result.txt; then
        echo "✅ OLT ZTE C600 detectada"
        
        # Contar comandos
        COMANDOS=$(grep -o '"id":[0-9]*' olts_result.txt | wc -l)
        echo "📋 Comandos disponibles: $COMANDOS"
        
    else
        echo "⚠️  OLT no detectada en respuesta"
    fi
    
else
    echo "❌ Error en login de alito"
    echo "💡 Revisa: cat web/login_result.txt"
fi

# Limpiar archivos temporales
rm -f test_cookies.txt login_result.txt olts_result.txt

cd ..

echo ""
echo "🎉 SOLUCIÓN COMPLETADA"
echo "====================="
echo ""
echo "📋 Estado:"
echo "   ✅ Base de datos principal corregida"
echo "   ✅ Estructura de comandos actualizada"
echo "   ✅ Servidor reiniciado"
echo "   ✅ Login de alito probado"
echo ""
echo "🌐 Accede a: http://tu-servidor:3000"
echo "🔑 Usuario: alito"
echo "🔑 Contraseña: vinilo28"
echo ""
echo "💡 Si hay problemas, revisa: tail -f server.log"

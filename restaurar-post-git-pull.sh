#!/bin/bash

# Script de restauración completa después de git pull
# Ejecutar este script en tu servidor después de hacer git pull

echo "� Iniciando restauración post git pull..."

# 1. Ir al directorio web
cd web || { echo "❌ Error: No se encuentra directorio web"; exit 1; }

# 2. Verificar que existen los scripts necesarios
if [ ! -f "restaurar-alito-zte.js" ]; then
    echo "❌ Error: No se encuentra restaurar-alito-zte.js"
    echo "💡 Ejecuta: git pull origin main"
    exit 1
fi

if [ ! -f "fix-orden-column.js" ]; then
    echo "❌ Error: No se encuentra fix-orden-column.js"
    echo "💡 Ejecuta: git pull origin main"
    exit 1
fi

# 3. Instalar dependencias (por si hay nuevas)
echo "📦 Instalando dependencias..."
cd ..
npm install
cd web

# 4. Corregir problema de columna 'orden'
echo "🔧 Corrigiendo estructura de base de datos..."
node fix-orden-column.js

if [ $? -ne 0 ]; then
    echo "❌ Error corrigiendo base de datos"
    exit 1
fi

# 5. Restaurar comandos ZTE C600 para alito
echo "� Restaurando usuario alito y comandos ZTE C600..."
node restaurar-alito-zte.js

if [ $? -eq 0 ]; then
    echo "✅ Restauración completada exitosamente"
    echo ""
    echo "📋 Datos restaurados:"
    echo "   • ✅ Base de datos corregida (columna orden)"
    echo "   • ✅ Usuario: alito"
    echo "   • ✅ Contraseña: vinilo28"
    echo "   • ✅ OLT: ZTE C600"
    echo "   • ✅ Comandos: 10 comandos ZTE C600"
    echo ""
    echo "� Ahora reinicia tu servidor:"
    echo "   • Si usas PM2: pm2 restart all"
    echo "   • Si usas node: pkill -f 'node server.js' && node server.js"
    echo ""
    echo "🚀 Luego accede con: alito/vinilo28"
else
    echo "❌ Error en la restauración"
    exit 1
fi

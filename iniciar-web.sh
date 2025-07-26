#!/bin/bash

echo "🚀 Sistema OLT Antel - Versión Web"
echo "=================================="
echo ""

# Cambiar al directorio correcto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/web"

# Verificar si existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json en carpeta web/"
    exit 1
fi

# Verificar si existen dependencias
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar base de datos
if [ ! -f "olt_system.db" ]; then
    echo "🗄️ Inicializando base de datos..."
    npm run init-db
fi

echo "🌐 Iniciando servidor web..."
echo "📍 Acceder en: http://localhost:3000"
echo "⌨️ Presiona Ctrl+C para detener"
echo ""

exec node server.js

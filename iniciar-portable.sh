#!/bin/bash

echo "📱 Desarrollo Residenciales - Versión Portable"
echo "======================================"
echo ""

# Cambiar al directorio correcto  
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/portable"

# Verificar si existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json en carpeta portable/"
    exit 1
fi

# Verificar si existen dependencias
if [ ! -d "node_modules" ]; then
    echo "� Instalando dependencias..."
    npm install
fi

echo "🚀 Iniciando versión portable..."
echo "📍 Acceder en: http://localhost:3001"
echo "⌨️ Presiona Ctrl+C para detener"
echo ""

PORT=3001 exec node server-simple.js

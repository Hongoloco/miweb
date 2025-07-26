#!/bin/bash

echo "📱 Sistema OLT Antel - Versión Portable"
echo "======================================"
echo ""

# Cambiar al directorio correcto  
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/portable/dist"

# Verificar si existe el ejecutable
if [ ! -f "SistemaOLT-Antel-linux" ]; then
    echo "❌ Error: No se encuentra el ejecutable SistemaOLT-Antel-linux"
    echo "💡 Debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

echo "🚀 Iniciando versión portable..."
echo "📍 Acceder en: http://localhost:3000"
echo ""

chmod +x ejecutar-linux.sh
./ejecutar-linux.sh

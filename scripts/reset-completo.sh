#!/bin/bash

# 🔨 SOLUCIÓN INTERMEDIA - Reset completo del repositorio
# Elimina cambios locales y fuerza sincronización con el remoto

echo "🔨 RESET COMPLETO DEL REPOSITORIO..."
echo "==================================="

# Confirmación de seguridad
read -p "⚠️ ATENCIÓN: Esto eliminará TODOS los cambios locales. ¿Continuar? (s/N): " confirmacion
if [[ $confirmacion != "s" && $confirmacion != "S" ]]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Paso 1: Detener todos los procesos
echo "🛑 Deteniendo todos los procesos..."
pkill -f "node.*server" 2>/dev/null
pkill -f "npm.*start" 2>/dev/null

# Paso 2: Hacer backup de archivos importantes (si existen)
echo "💾 Haciendo backup de archivos importantes..."
mkdir -p ../backup-servidor-$(date +%Y%m%d-%H%M%S)
cp web/olt_system.db ../backup-servidor-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || echo "No hay BD que respaldar"

# Paso 3: Reset completo
echo "🔄 Ejecutando reset completo..."
git fetch origin
git reset --hard origin/main
git clean -fdx  # Elimina TODOS los archivos no rastreados

# Paso 4: Verificar estado limpio
echo "✅ Verificando estado después del reset..."
git status

# Paso 5: Restaurar configuración
echo "⚙️ Restaurando configuración inicial..."
chmod +x *.sh 2>/dev/null
cd web 2>/dev/null
if [ -f "package.json" ]; then
    npm install
fi
if [ -f "init-database.js" ]; then
    node init-database.js
fi

# Paso 6: Aplicar post-git-pull
echo "🔧 Aplicando configuración post-pull..."
cd ..
if [ -f "post-git-pull.sh" ]; then
    ./post-git-pull.sh
fi

echo ""
echo "✅ RESET COMPLETO TERMINADO"
echo "🔍 Estado del repositorio:"
git log --oneline -3
echo ""
echo "🚀 Para iniciar servidor: npm start"

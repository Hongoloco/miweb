#!/bin/bash

# 🔍 SCRIPT DE DIAGNÓSTICO PARA SERVIDOR
# Ejecuta este script en tu servidor para diagnosticar problemas de git pull

echo "🔍 DIAGNÓSTICO DE PROBLEMAS GIT PULL"
echo "===================================="

# 1. Verificar estado de git
echo ""
echo "📋 ESTADO DE GIT:"
git status
echo ""
git log --oneline -5

# 2. Verificar archivos locales vs remotos
echo ""
echo "🌐 COMPARACIÓN CON REMOTO:"
git fetch
git diff HEAD origin/main --name-only

# 3. Verificar archivos modificados localmente
echo ""
echo "📝 ARCHIVOS MODIFICADOS LOCALMENTE:"
git diff --name-only

# 4. Verificar archivos sin seguimiento
echo ""
echo "❓ ARCHIVOS SIN SEGUIMIENTO:"
git ls-files --others --exclude-standard

# 5. Verificar configuración de git
echo ""
echo "⚙️ CONFIGURACIÓN GIT:"
git config --list | grep -E "(user\.|remote\.)"

# 6. Verificar permisos de archivos
echo ""
echo "🔐 PERMISOS DE ARCHIVOS PRINCIPALES:"
ls -la web/index.html web/server.js 2>/dev/null || echo "Archivos no encontrados"

# 7. Verificar procesos en ejecución
echo ""
echo "🔄 PROCESOS NODE EJECUTÁNDOSE:"
ps aux | grep node | grep -v grep

echo ""
echo "✅ DIAGNÓSTICO COMPLETADO"
echo "Envía esta información para determinar la solución"

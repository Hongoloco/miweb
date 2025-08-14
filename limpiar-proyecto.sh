#!/bin/bash

# 🧹 SCRIPT DE LIMPIEZA AUTOMÁTICA DEL PROYECTO
# Elimina archivos duplicados y de testing para mejorar el funcionamiento

echo "🧹 INICIANDO LIMPIEZA DEL PROYECTO..."
echo "========================================"

# Cambiar al directorio del proyecto
cd "$(dirname "$0")" || exit 1

# Contador de archivos eliminados
ELIMINADOS=0

# Función para eliminar archivo si existe
eliminar_archivo() {
    if [ -f "$1" ]; then
        echo "❌ Eliminando: $1"
        rm "$1"
        ((ELIMINADOS++))
    else
        echo "ℹ️  No encontrado: $1"
    fi
}

echo ""
echo "🗂️ ELIMINANDO ARCHIVOS DE TESTING..."
cd web

# Archivos de testing duplicados
eliminar_archivo "test-eliminar-usuarios.js"
eliminar_archivo "test-botones-eliminar.js"
eliminar_archivo "test-cargar-usuarios.js"
eliminar_archivo "test-password-alito.js"
eliminar_archivo "test-simple.html"
eliminar_archivo "test-user-db-system.js"
eliminar_archivo "test-password.js"

echo ""
echo "🔍 ELIMINANDO ARCHIVOS DE DIAGNÓSTICO..."

# Archivos de diagnóstico obsoletos
eliminar_archivo "diagnostico.html"
eliminar_archivo "diagnostico-botones.html"
eliminar_archivo "diagnostico-eliminacion.js"
eliminar_archivo "diagnostico-tareas.js"
eliminar_archivo "verificar-botones.html"
eliminar_archivo "debug.html"
eliminar_archivo "debug-frontend.js"
eliminar_archivo "debug-inject.js"

echo ""
echo "📦 ELIMINANDO ARCHIVOS BACKUP..."

# Archivos backup
eliminar_archivo "index.html.backup.20250807_185816"

echo ""
echo "🔐 CONSOLIDANDO SCRIPTS DE PASSWORD..."

# Scripts de password conflictivos
eliminar_archivo "actualizar-password-vinilo28.js"
eliminar_archivo "test-password-alito.js"

echo ""
echo "🗑️ ELIMINANDO SCRIPTS DE EMERGENCIA..."

# Scripts de emergencia que ya no son necesarios
eliminar_archivo "script-emergencia-botones.js"
eliminar_archivo "demo-eliminar-usuarios.js"
eliminar_archivo "solucion-eliminacion.js"
eliminar_archivo "guia-eliminar-usuarios.js"

echo ""
echo "🧪 ELIMINANDO ARCHIVOS DE DESARROLLO..."

# Archivos de desarrollo temporales
eliminar_archivo "emoji-test.js"
eliminar_archivo "verificar-comandos-alito.js"
eliminar_archivo "cookies.txt"
eliminar_archivo "session_cookies.txt"

echo ""
echo "📊 RESUMEN DE LIMPIEZA"
echo "======================"
echo "✅ Archivos eliminados: $ELIMINADOS"
echo ""

# Verificar el estado después de la limpieza
echo "📁 ARCHIVOS PRINCIPALES RESTANTES:"
ls -la *.html *.js | grep -E "(index\.html|server\.js|package\.json)" | head -10

echo ""
echo "🎉 LIMPIEZA COMPLETADA"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Ejecutar: npm start"
echo "2. Verificar funcionamiento en navegador"
echo "3. Hacer commit de los cambios limpios"
echo ""
echo "💡 TIP: Para evitar problemas de cache, presiona Ctrl+F5 en el navegador"

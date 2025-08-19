#!/bin/bash

# 💥 SOLUCIÓN DRÁSTICA - Eliminar y reclonar repositorio
# Borra todo y descarga una copia fresca del repositorio

echo "💥 ELIMINACIÓN Y RECLONADO COMPLETO..."
echo "====================================="

# Variables de configuración
REPO_URL="https://github.com/Hongoloco/miweb.git"
DIRECTORIO_ACTUAL=$(pwd)
DIRECTORIO_PADRE=$(dirname "$DIRECTORIO_ACTUAL")
NOMBRE_PROYECTO=$(basename "$DIRECTORIO_ACTUAL")

# Confirmación de seguridad
echo "⚠️ ATENCIÓN: Esta operación:"
echo "   - Eliminará COMPLETAMENTE el directorio actual"
echo "   - Descargará una copia fresca del repositorio"
echo "   - Perderás TODOS los cambios locales no subidos"
echo ""
echo "📁 Directorio actual: $DIRECTORIO_ACTUAL"
echo "🌐 Se reclonará desde: $REPO_URL"
echo ""
read -p "¿Estás COMPLETAMENTE SEGURO? Escribe 'ELIMINAR' para continuar: " confirmacion

if [[ $confirmacion != "ELIMINAR" ]]; then
    echo "❌ Operación cancelada por seguridad"
    exit 1
fi

# Paso 1: Hacer backup crítico
echo "💾 Haciendo backup de archivos críticos..."
BACKUP_DIR="/tmp/backup-miweb-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Respaldar base de datos si existe
if [ -f "web/olt_system.db" ]; then
    cp web/olt_system.db "$BACKUP_DIR/"
    echo "   ✅ BD respaldada en: $BACKUP_DIR/olt_system.db"
fi

# Respaldar configuraciones personalizadas
if [ -f "web/.env" ]; then
    cp web/.env "$BACKUP_DIR/"
    echo "   ✅ Configuración respaldada"
fi

# Paso 2: Detener procesos
echo "🛑 Deteniendo procesos..."
pkill -f "node.*server" 2>/dev/null
pkill -f "npm.*start" 2>/dev/null

# Paso 3: Moverse al directorio padre
echo "📂 Cambiando al directorio padre..."
cd "$DIRECTORIO_PADRE"

# Paso 4: Eliminar directorio actual
echo "🗑️ Eliminando directorio del proyecto..."
rm -rf "$NOMBRE_PROYECTO"

# Paso 5: Clonar repositorio fresco
echo "📥 Clonando repositorio fresco..."
git clone "$REPO_URL" "$NOMBRE_PROYECTO"

# Paso 6: Configurar nuevo proyecto
echo "⚙️ Configurando nuevo proyecto..."
cd "$NOMBRE_PROYECTO"
chmod +x *.sh

# Instalar dependencias
echo "📦 Instalando dependencias..."
cd web
npm install

# Restaurar base de datos si hay backup
if [ -f "$BACKUP_DIR/olt_system.db" ]; then
    echo "🔄 Restaurando base de datos desde backup..."
    cp "$BACKUP_DIR/olt_system.db" ./
else
    echo "🆕 Creando base de datos nueva..."
    node init-database.js
fi

# Restaurar configuraciones
if [ -f "$BACKUP_DIR/.env" ]; then
    cp "$BACKUP_DIR/.env" ./
fi

# Paso 7: Aplicar configuración post-pull
echo "🔧 Aplicando configuración..."
cd ..
if [ -f "post-git-pull.sh" ]; then
    ./post-git-pull.sh
fi

echo ""
echo "🎉 RECLONADO COMPLETADO EXITOSAMENTE"
echo "=================================="
echo "📁 Nuevo directorio: $(pwd)"
echo "💾 Backup guardado en: $BACKUP_DIR"
echo "🚀 Para iniciar: npm start"
echo ""
echo "✅ El proyecto está ahora 100% sincronizado con el repositorio remoto"

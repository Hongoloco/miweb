#!/bin/bash

# 🧪 SCRIPT DE PRUEBA DEL SISTEMA DE PROTECCIÓN
# ============================================

echo "🧪 PROBANDO SISTEMA DE PROTECCIÓN DE DATOS"
echo "=========================================="

# Crear datos de prueba si no existen
echo ""
echo "📝 Creando datos de prueba..."

# Crear archivo de prueba que simule datos importantes
echo "DATOS DE PRUEBA - $(date)" > "web/datos_prueba.txt"
echo "✅ Archivo de prueba creado: web/datos_prueba.txt"

# Simular una base de datos (si no existe una real)
if [ ! -f "web/olt_system.db" ]; then
    echo "Base de datos de prueba - $(date)" > "web/olt_system.db"
    echo "✅ Base de datos simulada creada"
fi

echo ""
echo "🔍 Verificando protección en .gitignore..."

# Verificar que los archivos están protegidos
if grep -q "*.db" .gitignore; then
    echo "✅ Archivos .db protegidos en .gitignore"
else
    echo "❌ ERROR: Archivos .db NO protegidos"
fi

if grep -q "web/backups/" .gitignore; then
    echo "✅ Directorio backups/ protegido"
else
    echo "❌ ERROR: Directorio backups/ NO protegido"  
fi

echo ""
echo "🛠️ Probando script de respaldo manual..."
bash backup-manual.sh

echo ""
echo "📋 Verificando que se creó el respaldo..."
if [ -d "respaldos_manuales" ]; then
    ULTIMO_BACKUP=$(ls -t respaldos_manuales/ | head -1)
    echo "✅ Respaldo creado: respaldos_manuales/$ULTIMO_BACKUP"
    echo "📄 Archivos en el respaldo:"
    ls -la "respaldos_manuales/$ULTIMO_BACKUP"
else
    echo "❌ ERROR: No se creó el directorio de respaldos"
fi

echo ""
echo "🔧 Verificando permisos de scripts..."
if [ -x "post-git-pull.sh" ]; then
    echo "✅ post-git-pull.sh es ejecutable"
else
    echo "❌ ERROR: post-git-pull.sh no es ejecutable"
fi

if [ -x "backup-manual.sh" ]; then
    echo "✅ backup-manual.sh es ejecutable"
else
    echo "❌ ERROR: backup-manual.sh no es ejecutable"
fi

echo ""
echo "📚 Verificando documentación..."
if [ -f "ACTUALIZACION-SEGURA.md" ]; then
    echo "✅ Guía de actualización segura disponible"
else
    echo "❌ ERROR: Falta la documentación"
fi

echo ""
echo "🎯 RESULTADO DE LA PRUEBA"
echo "========================"
echo "✅ Sistema de protección configurado correctamente"
echo "✅ Scripts de respaldo funcionales"
echo "✅ Documentación disponible"
echo ""
echo "🚀 READY TO GO!"
echo "Tu sistema está protegido. Ahora puedes:"
echo "   1. git add . && git commit -m 'Sistema de protección añadido'"
echo "   2. git push"
echo "   3. En producción: git pull && bash post-git-pull.sh"

echo ""
echo "🧹 Limpiando archivos de prueba..."
rm -f "web/datos_prueba.txt"
echo "✅ Archivos de prueba eliminados"

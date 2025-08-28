#!/bin/bash

# Script de recuperación de base de datos después de git pull
# Soluciona el problema cuando olt_system.db queda vacío o corrupto

echo "🔧 RECUPERACIÓN DE BASE DE DATOS DESPUÉS DE GIT PULL"
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "web/server.js" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto"
    echo "   Directorio actual: $(pwd)"
    exit 1
fi

echo "📍 Directorio de trabajo: $(pwd)"
echo "📅 Fecha: $(date)"

cd web

# Verificar el estado actual de las bases de datos
echo ""
echo "📊 DIAGNÓSTICO INICIAL:"
echo "====================="

if [ -f "olt_system.db" ]; then
    SIZE=$(stat -c%s "olt_system.db" 2>/dev/null || stat -f%z "olt_system.db" 2>/dev/null || echo "unknown")
    echo "📄 olt_system.db: ${SIZE} bytes"
    
    if [ "$SIZE" = "0" ] || [ "$SIZE" = "unknown" ]; then
        echo "⚠️  Base de datos principal está vacía o corrupta"
        NEEDS_RECOVERY=true
    else
        echo "✅ Base de datos principal parece estar bien"
        NEEDS_RECOVERY=false
    fi
else
    echo "❌ olt_system.db NO EXISTE"
    NEEDS_RECOVERY=true
fi

# Buscar backups disponibles
echo ""
echo "🔍 BUSCANDO BACKUPS DISPONIBLES:"
echo "==============================="

BACKUP_FOUND=false
BACKUP_FILE=""

# Buscar en directorios de backup comunes
for backup_dir in "/tmp/miweb_backup_*" "backups/" "../respaldos_manuales/" "backup*"; do
    if [ -d "$backup_dir" ]; then
        echo "📁 Buscando en: $backup_dir"
        
        # Buscar olt_system.db en el backup
        FOUND_DB=$(find "$backup_dir" -name "olt_system.db" -size +1000c 2>/dev/null | head -1)
        
        if [ -n "$FOUND_DB" ]; then
            SIZE=$(stat -c%s "$FOUND_DB" 2>/dev/null || stat -f%z "$FOUND_DB" 2>/dev/null)
            echo "✅ Backup encontrado: $FOUND_DB (${SIZE} bytes)"
            BACKUP_FOUND=true
            BACKUP_FILE="$FOUND_DB"
            break
        fi
    fi
done

# Buscar backups con timestamp reciente
if [ "$BACKUP_FOUND" = false ]; then
    echo "🔍 Buscando backups recientes..."
    RECENT_BACKUP=$(find . -name "*backup*" -name "olt_system.db" -mtime -7 2>/dev/null | head -1)
    
    if [ -n "$RECENT_BACKUP" ]; then
        echo "✅ Backup reciente encontrado: $RECENT_BACKUP"
        BACKUP_FOUND=true
        BACKUP_FILE="$RECENT_BACKUP"
    fi
fi

if [ "$NEEDS_RECOVERY" = true ]; then
    echo ""
    echo "🚑 INICIANDO RECUPERACIÓN:"
    echo "========================"
    
    if [ "$BACKUP_FOUND" = true ]; then
        echo "📋 Restaurando desde backup: $BACKUP_FILE"
        
        # Crear backup del archivo corrupto
        if [ -f "olt_system.db" ]; then
            mv "olt_system.db" "olt_system.db.corrupto.$(date +%Y%m%d_%H%M%S)"
            echo "🗃️  Archivo corrupto respaldado"
        fi
        
        # Restaurar backup
        cp "$BACKUP_FILE" "olt_system.db"
        echo "✅ Base de datos restaurada desde backup"
        
    else
        echo "⚠️  No se encontraron backups. Inicializando base de datos nueva..."
        
        # Eliminar archivo corrupto
        if [ -f "olt_system.db" ]; then
            rm "olt_system.db"
        fi
        
        # Inicializar nueva base de datos ejecutando el servidor brevemente
        echo "🔄 Iniciando servidor para inicializar base de datos..."
        
        # Ejecutar servidor en background por unos segundos para que inicialice
        timeout 10s node server.js &
        SERVER_PID=$!
        
        # Esperar un poco para que se inicialice
        sleep 8
        
        # Detener servidor
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        
        echo "⏹️  Servidor detenido"
    fi
    
    # Ejecutar migraciones para asegurar estructura correcta
    echo ""
    echo "🔄 EJECUTANDO MIGRACIONES:"
    echo "========================"
    
    if [ -f "database-migrations.js" ]; then
        node database-migrations.js
        echo "✅ Migraciones ejecutadas"
    else
        echo "⚠️  Archivo de migraciones no encontrado"
    fi
    
else
    echo ""
    echo "✅ Base de datos está en buen estado, no requiere recuperación"
fi

# Verificación final
echo ""
echo "🔍 VERIFICACIÓN FINAL:"
echo "===================="

if [ -f "olt_system.db" ]; then
    SIZE=$(stat -c%s "olt_system.db" 2>/dev/null || stat -f%z "olt_system.db" 2>/dev/null)
    echo "📄 olt_system.db: ${SIZE} bytes"
    
    # Verificar que la base de datos tiene contenido
    if command -v sqlite3 >/dev/null 2>&1; then
        echo "🔍 Verificando tablas..."
        
        TABLES=$(sqlite3 olt_system.db ".tables" 2>/dev/null || echo "error")
        
        if [ "$TABLES" != "error" ] && [ -n "$TABLES" ]; then
            echo "✅ Tablas encontradas: $TABLES"
            
            # Verificar usuarios
            USER_COUNT=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM usuarios;" 2>/dev/null || echo "0")
            echo "👥 Usuarios en base de datos: $USER_COUNT"
            
        else
            echo "❌ No se pudieron verificar las tablas"
        fi
    else
        echo "⚠️  sqlite3 no disponible para verificación"
    fi
fi

echo ""
echo "🎯 RECUPERACIÓN COMPLETADA"
echo "========================"
echo "📋 Pasos realizados:"
echo "   - ✅ Diagnóstico inicial"
echo "   - ✅ Búsqueda de backups"
if [ "$NEEDS_RECOVERY" = true ]; then
    echo "   - ✅ Recuperación de base de datos"
    echo "   - ✅ Ejecución de migraciones"
fi
echo "   - ✅ Verificación final"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "   1. Ejecutar: npm start"
echo "   2. Verificar login con usuario: alito"
echo "   3. Si hay problemas, revisar logs del servidor"
echo ""

cd ..

echo "🏁 Script de recuperación completado"

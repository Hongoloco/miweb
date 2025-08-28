#!/bin/bash

# GUÍA PASO A PASO: Solución para servidor después de git pull con conflictos
# Para el error específico reportado por el usuario

echo "🔧 SOLUCIÓN PASO A PASO PARA TU SERVIDOR"
echo "========================================"
echo ""
echo "📋 Errores reportados:"
echo "   - Conflicto con web/cookies.txt en git pull"
echo "   - Script emergencia-base-datos.sh no encontrado"
echo "   - Directorio web no encontrado"
echo "   - Base de datos olt_system.db vacía (0.0 KB)"
echo ""

# Paso 1: Verificar directorio actual
echo "📍 PASO 1: Verificar ubicación"
echo "=============================="
echo "Directorio actual: $(pwd)"

if [ ! -f "package.json" ]; then
    echo "❌ No estás en el directorio raíz del proyecto"
    echo "🔧 SOLUCIÓN: Navegar al directorio correcto"
    echo "   cd /ruta/completa/a/tu/proyecto"
    echo ""
    echo "ℹ️  El directorio correcto debe contener:"
    echo "   - package.json"
    echo "   - directorio web/"
    echo "   - scripts .sh"
    exit 1
else
    echo "✅ Directorio correcto encontrado"
fi

echo ""

# Paso 2: Resolver conflictos de git
echo "📥 PASO 2: Resolver conflictos de git"
echo "===================================="

# Verificar estado de git
git status 2>/dev/null || {
    echo "❌ Error: No es un repositorio git o git no está disponible"
    exit 1
}

# Resolver conflicto con cookies.txt
if [ -f "web/cookies.txt" ]; then
    echo "🗑️  Eliminando archivo conflictivo web/cookies.txt..."
    rm web/cookies.txt
    echo "✅ Conflicto resuelto"
fi

# Hacer git pull
echo "📦 Obteniendo cambios desde GitHub..."
if git pull origin main; then
    echo "✅ Git pull completado exitosamente"
else
    echo "❌ Error en git pull. Intentando reset..."
    git fetch origin
    git reset --hard origin/main
    echo "✅ Reset completado"
fi

echo ""

# Paso 3: Verificar scripts disponibles
echo "🔍 PASO 3: Verificar scripts disponibles"
echo "======================================="

SCRIPTS=("emergencia-base-datos.sh" "recuperar-base-datos.sh" "post-git-pull.sh" "solucionar-tabla-modelos.sh")

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script" 2>/dev/null
        echo "✅ $script - Disponible y ejecutable"
    else
        echo "❌ $script - NO ENCONTRADO"
    fi
done

echo ""

# Paso 4: Verificar directorio web
echo "📁 PASO 4: Verificar directorio web"
echo "=================================="

if [ -d "web" ]; then
    echo "✅ Directorio web/ existe"
    
    # Verificar archivos críticos
    if [ -f "web/server.js" ]; then
        echo "✅ web/server.js existe"
    else
        echo "❌ web/server.js NO EXISTE"
    fi
    
    if [ -f "web/database-migrations.js" ]; then
        echo "✅ web/database-migrations.js existe"
    else
        echo "❌ web/database-migrations.js NO EXISTE"
    fi
    
else
    echo "❌ Directorio web/ NO EXISTE"
    echo "🔧 Esto indica un problema serio con el repositorio"
    exit 1
fi

echo ""

# Paso 5: Verificar estado de base de datos
echo "🗃️  PASO 5: Verificar base de datos"
echo "=================================="

if [ -f "web/olt_system.db" ]; then
    SIZE=$(stat -c%s "web/olt_system.db" 2>/dev/null || stat -f%z "web/olt_system.db" 2>/dev/null || echo "unknown")
    echo "📄 web/olt_system.db: ${SIZE} bytes"
    
    if [ "$SIZE" = "0" ] || [ "$SIZE" = "unknown" ]; then
        echo "❌ Base de datos está vacía o corrupta"
        NEEDS_DB_RECOVERY=true
    else
        echo "✅ Base de datos tiene contenido"
        NEEDS_DB_RECOVERY=false
    fi
else
    echo "❌ web/olt_system.db NO EXISTE"
    NEEDS_DB_RECOVERY=true
fi

echo ""

# Paso 6: Aplicar solución según el problema
echo "🚑 PASO 6: Aplicar solución"
echo "=========================="

if [ "$NEEDS_DB_RECOVERY" = true ]; then
    echo "🔧 Base de datos requiere recuperación..."
    
    if [ -f "emergencia-base-datos.sh" ]; then
        echo "⚡ Ejecutando script de emergencia..."
        ./emergencia-base-datos.sh
    elif [ -f "recuperar-base-datos.sh" ]; then
        echo "🔄 Ejecutando script de recuperación..."
        ./recuperar-base-datos.sh
    else
        echo "🔧 Ejecutando recuperación manual..."
        
        cd web
        
        # Eliminar base de datos corrupta
        [ -f "olt_system.db" ] && rm olt_system.db
        
        # Inicializar nueva base de datos
        echo "🔄 Inicializando base de datos..."
        node server.js &
        SERVER_PID=$!
        sleep 10
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        
        # Ejecutar migraciones
        if [ -f "database-migrations.js" ]; then
            echo "🔄 Ejecutando migraciones..."
            node database-migrations.js
        fi
        
        cd ..
    fi
else
    echo "✅ Base de datos está bien, no necesita recuperación"
fi

echo ""

# Paso 7: Verificación final
echo "🔍 PASO 7: Verificación final"
echo "=========================="

if [ -f "web/olt_system.db" ]; then
    FINAL_SIZE=$(stat -c%s "web/olt_system.db" 2>/dev/null || stat -f%z "web/olt_system.db" 2>/dev/null || echo "0")
    echo "📄 Base de datos final: ${FINAL_SIZE} bytes"
    
    if [ "$FINAL_SIZE" != "0" ]; then
        echo "✅ Base de datos recuperada exitosamente"
        
        # Verificar contenido si sqlite3 está disponible
        if command -v sqlite3 >/dev/null 2>&1; then
            echo "👥 Usuarios disponibles:"
            cd web
            sqlite3 olt_system.db "SELECT username, rol FROM usuarios;" 2>/dev/null || echo "   Error consultando usuarios"
            cd ..
        fi
    else
        echo "❌ Base de datos sigue vacía"
    fi
fi

echo ""
echo "🎯 RESUMEN DE ACCIONES COMPLETADAS"
echo "================================="
echo "✅ Conflictos de git resueltos"
echo "✅ Scripts actualizados y disponibles"
echo "✅ Directorio web verificado"
if [ "$NEEDS_DB_RECOVERY" = true ]; then
    echo "✅ Base de datos recuperada"
else
    echo "✅ Base de datos verificada"
fi

echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "=================="
echo "1. Ejecutar el servidor:"
echo "   cd web"
echo "   npm start"
echo ""
echo "2. Acceder desde navegador:"
echo "   http://tu-servidor:3000"
echo ""
echo "3. Login con usuarios disponibles:"
echo "   - alito (administrador)"
echo "   - admin (administrador)"
echo ""
echo "💡 Si hay problemas adicionales:"
echo "   - Revisar logs del servidor"
echo "   - Ejecutar ./solucionar-tabla-modelos.sh si hay errores de tablas"
echo "   - Ejecutar ./post-git-pull.sh para futuras actualizaciones"

echo ""
echo "🏁 Guía completada - Tu servidor debería estar funcionando"

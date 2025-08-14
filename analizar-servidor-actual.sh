#!/bin/bash

# 🔍 ANALIZADOR DE CÓDIGO DEL SERVIDOR ACTUAL
# Analiza el código subido desde el servidor para verificación

echo "🔍 ANALIZANDO CÓDIGO DEL SERVIDOR ACTUAL"
echo "========================================"

# Verificar si estamos en la rama correcta
RAMA_ACTUAL=$(git branch --show-current)
if [ "$RAMA_ACTUAL" != "servidor-actual" ]; then
    echo "⚠️  Cambiando a rama servidor-actual..."
    git checkout servidor-actual
fi

echo ""
echo "📊 ANÁLISIS DE ESTRUCTURA..."

# Verificar archivos críticos
echo ""
echo "🔴 ARCHIVOS CRÍTICOS:"
ARCHIVOS_CRITICOS=("web/server.js" "web/index.html" "web/package.json" "web/olt_system.db")

for archivo in "${ARCHIVOS_CRITICOS[@]}"; do
    if [ -f "$archivo" ]; then
        TAMAÑO=$(du -h "$archivo" | cut -f1)
        echo "   ✅ $archivo ($TAMAÑO)"
    else
        echo "   ❌ $archivo (NO ENCONTRADO)"
    fi
done

# Verificar gestión de usuarios
echo ""
echo "👤 SISTEMA DE USUARIOS:"
if [ -f "web/user-database-manager.js" ]; then
    echo "   ✅ Gestor de BD de usuarios encontrado"
else
    echo "   ❌ Gestor de BD de usuarios NO encontrado"
fi

if [ -d "web/databases" ]; then
    USUARIOS_BD=$(find web/databases -name "*_olt_system.db" 2>/dev/null | wc -l)
    echo "   📊 Bases de datos de usuarios: $USUARIOS_BD"
else
    echo "   ❌ Directorio databases NO encontrado"
fi

# Verificar scripts JavaScript
echo ""
echo "🔧 SCRIPTS JAVASCRIPT:"
if [ -d "web" ]; then
    SCRIPTS_JS=$(find web -name "*.js" -type f | wc -l)
    echo "   📋 Total de scripts JS: $SCRIPTS_JS"
    
    echo "   📁 Scripts encontrados:"
    find web -name "*.js" -type f | head -10 | while read script; do
        TAMAÑO=$(du -h "$script" | cut -f1)
        echo "      📄 $(basename "$script") ($TAMAÑO)"
    done
    
    if [ $SCRIPTS_JS -gt 10 ]; then
        echo "      ... y $((SCRIPTS_JS - 10)) scripts más"
    fi
fi

# Verificar base de datos principal
echo ""
echo "🗄️ BASE DE DATOS PRINCIPAL:"
if [ -f "web/olt_system.db" ]; then
    echo "   ✅ BD principal encontrada"
    
    # Intentar analizar contenido de la BD
    if command -v sqlite3 &> /dev/null; then
        echo "   📊 Analizando contenido..."
        
        USUARIOS=$(sqlite3 web/olt_system.db "SELECT COUNT(*) FROM usuarios;" 2>/dev/null || echo "ERROR")
        if [ "$USUARIOS" != "ERROR" ]; then
            echo "   👥 Usuarios en BD: $USUARIOS"
        fi
        
        OLTS=$(sqlite3 web/olt_system.db "SELECT COUNT(*) FROM olts;" 2>/dev/null || echo "ERROR")
        if [ "$OLTS" != "ERROR" ]; then
            echo "   📡 OLTs en BD: $OLTS"
        fi
        
        COMANDOS=$(sqlite3 web/olt_system.db "SELECT COUNT(*) FROM comandos;" 2>/dev/null || echo "ERROR")
        if [ "$COMANDOS" != "ERROR" ]; then
            echo "   🔧 Comandos en BD: $COMANDOS"
        fi
    fi
else
    echo "   ❌ BD principal NO encontrada"
fi

# Verificar dependencias
echo ""
echo "📦 DEPENDENCIAS:"
if [ -f "web/package.json" ]; then
    echo "   ✅ package.json encontrado"
    
    if command -v node &> /dev/null; then
        cd web 2>/dev/null
        
        # Verificar dependencias principales
        echo "   🔍 Verificando dependencias críticas..."
        
        DEPS_CRITICAS=("express" "sqlite3" "bcrypt")
        for dep in "${DEPS_CRITICAS[@]}"; do
            if npm list "$dep" &>/dev/null; then
                VERSION=$(npm list "$dep" --depth=0 2>/dev/null | grep "$dep" | cut -d'@' -f2 || echo "?")
                echo "      ✅ $dep@$VERSION"
            else
                echo "      ❌ $dep (NO INSTALADA)"
            fi
        done
        
        cd ..
    fi
else
    echo "   ❌ package.json NO encontrado"
fi

# Verificar problemas conocidos
echo ""
echo "🚨 VERIFICACIÓN DE PROBLEMAS CONOCIDOS:"

# Problema 1: ZTE C600
echo "   🔍 Verificando problema ZTE C600..."
if grep -r "C600" web/ 2>/dev/null | grep -q "alito"; then
    echo "      ⚠️  Referencias a ZTE C600 de alito encontradas"
else
    echo "      ✅ No se detectan problemas evidentes con ZTE C600"
fi

# Problema 2: Tareas duplicadas
echo "   🔍 Verificando duplicación de tareas..."
if [ -f "web/olt_system.db" ] && command -v sqlite3 &> /dev/null; then
    TAREAS_DUPLICADAS=$(sqlite3 web/olt_system.db "SELECT titulo, COUNT(*) as cantidad FROM tareas GROUP BY titulo HAVING cantidad > 1;" 2>/dev/null | wc -l)
    if [ "$TAREAS_DUPLICADAS" -gt 0 ]; then
        echo "      ⚠️  $TAREAS_DUPLICADAS grupos de tareas duplicadas detectadas"
    else
        echo "      ✅ No se detectan tareas duplicadas evidentes"
    fi
fi

# Problema 3: Usuarios sin BD privada
echo "   🔍 Verificando usuarios sin BD privada..."
if [ -f "web/olt_system.db" ] && command -v sqlite3 &> /dev/null; then
    USUARIOS_TECNICOS=$(sqlite3 web/olt_system.db "SELECT username FROM usuarios WHERE rol != 'admin';" 2>/dev/null)
    if [ -n "$USUARIOS_TECNICOS" ]; then
        echo "      👥 Verificando BD privadas de técnicos..."
        echo "$USUARIOS_TECNICOS" | while read usuario; do
            if [ -f "web/databases/${usuario}_olt_system.db" ]; then
                echo "         ✅ $usuario tiene BD privada"
            else
                echo "         ❌ $usuario SIN BD privada"
            fi
        done
    fi
fi

echo ""
echo "📊 RESUMEN DEL ANÁLISIS:"
echo "========================"

# Generar puntuación de estado
PUNTUACION=0
[ -f "web/server.js" ] && PUNTUACION=$((PUNTUACION + 20))
[ -f "web/index.html" ] && PUNTUACION=$((PUNTUACION + 15))
[ -f "web/olt_system.db" ] && PUNTUACION=$((PUNTUACION + 25))
[ -f "web/package.json" ] && PUNTUACION=$((PUNTUACION + 10))
[ -f "web/user-database-manager.js" ] && PUNTUACION=$((PUNTUACION + 15))
[ -d "web/databases" ] && PUNTUACION=$((PUNTUACION + 15))

echo "🎯 Estado del servidor: $PUNTUACION/100 puntos"

if [ $PUNTUACION -ge 80 ]; then
    echo "✅ EXCELENTE: Servidor en muy buen estado"
elif [ $PUNTUACION -ge 60 ]; then
    echo "🟡 BUENO: Servidor funcional, algunas mejoras posibles"
elif [ $PUNTUACION -ge 40 ]; then
    echo "⚠️  REGULAR: Servidor necesita varias mejoras"
else
    echo "🔴 CRÍTICO: Servidor necesita mejoras importantes"
fi

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "   1. Revisar código específico de problemas reportados"
echo "   2. Comparar con sistema mejorado implementado"
echo "   3. Generar plan de migración personalizado"
echo ""

echo "✅ ANÁLISIS COMPLETADO"
echo "📁 Logs guardados en: logs/analisis-servidor-$(date +%Y%m%d_%H%M%S).log"

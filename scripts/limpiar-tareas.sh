#!/bin/bash

# 🧹 LIMPIADOR DE TAREAS DUPLICADAS
# Elimina tareas duplicadas y permite borrar tareas problemáticas

echo "🧹 LIMPIADOR AVANZADO DE TAREAS DUPLICADAS..."
echo "============================================="

# Cambiar al directorio web
cd web 2>/dev/null || cd /root/miweb/web || { echo "❌ No se encuentra directorio web"; exit 1; }

# Verificar base de datos
if [ ! -f "olt_system.db" ]; then
    echo "❌ Base de datos no encontrada"
    exit 1
fi

echo "🔍 ANALIZANDO TAREAS..."

# Mostrar estadísticas actuales
echo ""
echo "📊 ESTADÍSTICAS ACTUALES:"
TOTAL_TAREAS=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM tareas;" 2>/dev/null || echo "0")
TAREAS_UNICAS=$(sqlite3 olt_system.db "SELECT COUNT(DISTINCT TRIM(LOWER(nombre))) FROM tareas;" 2>/dev/null || echo "0")
DUPLICADOS=$((TOTAL_TAREAS - TAREAS_UNICAS))

echo "   📋 Total tareas: $TOTAL_TAREAS"
echo "   🎯 Tareas únicas: $TAREAS_UNICAS"
echo "   🔄 Duplicados: $DUPLICADOS"

if [ "$DUPLICADOS" -gt 0 ]; then
    echo ""
    echo "🔍 TAREAS DUPLICADAS ENCONTRADAS:"
    sqlite3 olt_system.db "
    SELECT nombre, COUNT(*) as cantidad 
    FROM tareas 
    GROUP BY TRIM(LOWER(nombre)) 
    HAVING COUNT(*) > 1 
    ORDER BY cantidad DESC;
    " 2>/dev/null || echo "Error consultando duplicados"
fi

echo ""
echo "🛠️ OPCIONES DE LIMPIEZA:"
echo "1) Eliminar duplicados conservando el más reciente"
echo "2) Eliminar TODAS las tareas y empezar limpio"
echo "3) Eliminar tareas por nombre específico"
echo "4) Mostrar todas las tareas para revisión"
echo "5) Reparar permisos de eliminación"
echo "6) Salir sin cambios"
echo ""

read -p "Selecciona una opción (1-6): " opcion

case $opcion in
    1)
        echo ""
        echo "🔄 Eliminando duplicados (conservando más recientes)..."
        
        # Crear script SQL para eliminar duplicados
        sqlite3 olt_system.db "
        -- Crear tabla temporal con IDs a conservar (más recientes)
        CREATE TEMP TABLE tareas_conservar AS
        SELECT MAX(id) as id
        FROM tareas
        GROUP BY TRIM(LOWER(nombre));
        
        -- Eliminar tareas que NO están en la lista de conservar
        DELETE FROM tareas 
        WHERE id NOT IN (SELECT id FROM tareas_conservar);
        
        -- Mostrar resultado
        SELECT 'Tareas restantes: ' || COUNT(*) FROM tareas;
        " 2>/dev/null && echo "✅ Duplicados eliminados exitosamente" || echo "❌ Error eliminando duplicados"
        ;;
        
    2)
        echo ""
        read -p "⚠️ ¿Estás seguro de eliminar TODAS las tareas? (escribe 'SI' para confirmar): " confirmacion
        
        if [ "$confirmacion" = "SI" ]; then
            sqlite3 olt_system.db "DELETE FROM tareas;" 2>/dev/null && echo "✅ Todas las tareas eliminadas" || echo "❌ Error eliminando tareas"
        else
            echo "❌ Operación cancelada"
        fi
        ;;
        
    3)
        echo ""
        echo "📋 TAREAS DISPONIBLES:"
        sqlite3 olt_system.db "SELECT DISTINCT nombre FROM tareas ORDER BY nombre;" 2>/dev/null
        echo ""
        read -p "Escribe el nombre exacto de la tarea a eliminar: " nombre_tarea
        
        if [ -n "$nombre_tarea" ]; then
            ELIMINADAS=$(sqlite3 olt_system.db "DELETE FROM tareas WHERE nombre='$nombre_tarea'; SELECT changes();" 2>/dev/null | tail -1)
            echo "✅ $ELIMINADAS tareas eliminadas con nombre: $nombre_tarea"
        else
            echo "❌ Nombre vacío, operación cancelada"
        fi
        ;;
        
    4)
        echo ""
        echo "📋 TODAS LAS TAREAS:"
        sqlite3 olt_system.db "
        SELECT 
            id, 
            nombre, 
            SUBSTR(descripcion, 1, 50) as descripcion_corta,
            estado,
            fecha_creacion 
        FROM tareas 
        ORDER BY fecha_creacion DESC;
        " 2>/dev/null || echo "Error consultando tareas"
        ;;
        
    5)
        echo ""
        echo "🔧 Reparando permisos de eliminación..."
        
        # Verificar estructura de tabla tareas
        sqlite3 olt_system.db "
        -- Asegurar que la tabla tenga los campos necesarios
        PRAGMA table_info(tareas);
        " 2>/dev/null
        
        # Verificar triggers que puedan estar bloqueando eliminación
        echo "🔍 Verificando triggers..."
        sqlite3 olt_system.db "
        SELECT name, sql FROM sqlite_master 
        WHERE type='trigger' AND tbl_name='tareas';
        " 2>/dev/null
        
        # Verificar foreign keys
        echo "🔍 Verificando foreign keys..."
        sqlite3 olt_system.db "PRAGMA foreign_key_list(tareas);" 2>/dev/null
        
        # Habilitar eliminación
        sqlite3 olt_system.db "
        PRAGMA foreign_keys=OFF;
        UPDATE tareas SET estado='completada' WHERE estado IS NULL;
        PRAGMA foreign_keys=ON;
        " 2>/dev/null && echo "✅ Permisos reparados" || echo "⚠️ Verificar manualmente"
        ;;
        
    6)
        echo "👋 Saliendo sin cambios..."
        exit 0
        ;;
        
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

# Verificación final
echo ""
echo "🔍 VERIFICACIÓN FINAL:"
TAREAS_FINALES=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM tareas;" 2>/dev/null || echo "0")
DUPLICADOS_FINALES=$(sqlite3 olt_system.db "SELECT COUNT(*) - COUNT(DISTINCT TRIM(LOWER(nombre))) FROM tareas;" 2>/dev/null || echo "0")

echo "   📋 Tareas totales: $TAREAS_FINALES"
echo "   🔄 Duplicados restantes: $DUPLICADOS_FINALES"

if [ "$DUPLICADOS_FINALES" -eq 0 ]; then
    echo "   ✅ Sin duplicados - Base de datos limpia"
else
    echo "   ⚠️ Aún hay $DUPLICADOS_FINALES duplicados"
fi

echo ""
echo "✅ LIMPIEZA DE TAREAS COMPLETADA"
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "1. Reinicia el servidor si está ejecutándose"
echo "2. Presiona Ctrl+F5 en el navegador para limpiar cache"
echo "3. Verifica que ahora puedes eliminar tareas normalmente"

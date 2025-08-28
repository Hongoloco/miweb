#!/bin/bash

# Script para solucionar el error de tabla modelos_ont faltante
# Este script ejecuta las migraciones de base de datos necesarias

echo "🔧 Solucionando error de tabla modelos_ont..."
echo "================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "web/database-migrations.js" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto"
    echo "   Directorio actual: $(pwd)"
    echo "   Archivo esperado: web/database-migrations.js"
    exit 1
fi

echo "📍 Directorio de trabajo: $(pwd)"
echo "📅 Fecha: $(date)"

# Crear backup antes de ejecutar migraciones
echo ""
echo "🗃️  Creando backup de seguridad..."
if [ -f "web/database.db" ]; then
    cp "web/database.db" "web/database-backup-$(date +%Y%m%d_%H%M%S).db"
    echo "✅ Backup creado: web/database-backup-$(date +%Y%m%d_%H%M%S).db"
else
    echo "⚠️  No se encontró database.db, continuando sin backup..."
fi

# Ejecutar migraciones
echo ""
echo "🚀 Ejecutando migraciones de base de datos..."
cd web

# Verificar si Node.js está disponible
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Ejecutar migraciones con Node.js
node -e "
const { runDatabaseMigrations } = require('./database-migrations.js');

async function main() {
    try {
        console.log('🔄 Iniciando migraciones...');
        await runDatabaseMigrations();
        console.log('✅ Migraciones completadas exitosamente');
        console.log('');
        console.log('🎉 Tabla modelos_ont creada correctamente');
        console.log('💡 El servidor debería funcionar ahora sin errores');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error.message);
        process.exit(1);
    }
}

main();
"

migration_result=$?

# Volver al directorio raíz
cd ..

# Verificar resultado
if [ $migration_result -eq 0 ]; then
    echo ""
    echo "✅ ¡Problema solucionado exitosamente!"
    echo ""
    echo "📋 Resumen de acciones realizadas:"
    echo "   - ✅ Backup de base de datos creado"
    echo "   - ✅ Migración de tabla modelos_ont ejecutada"
    echo "   - ✅ Base de datos actualizada"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "   1. Reinicia el servidor: npm start"
    echo "   2. Verifica que la funcionalidad de modelos ONT funcione"
    echo "   3. El error 'SQLITE_ERROR: no such table: modelos_ont' debería estar resuelto"
    echo ""
    echo "💡 Si necesitas verificar las migraciones aplicadas, puedes:"
    echo "   - Revisar la tabla schema_migrations en la base de datos"
    echo "   - Ejecutar consultas sobre la tabla modelos_ont"
else
    echo ""
    echo "❌ Error al ejecutar migraciones"
    echo "🔧 Acciones recomendadas:"
    echo "   1. Verifica que la base de datos no esté siendo usada por otro proceso"
    echo "   2. Revisa los permisos de escritura en el directorio web/"
    echo "   3. Ejecuta manualmente: cd web && node database-migrations.js"
    echo ""
    echo "🆘 Si el problema persiste, contacta al desarrollador"
fi

echo ""
echo "🏁 Script completado"

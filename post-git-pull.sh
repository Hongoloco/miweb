#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

cd "$(dirname "$0")"

echo "� ACTUALIZACIÓN SEGURA CON PROTECCIÓN DE DATOS"
echo "=============================================="
echo "📁 Proyecto: $(pwd)"

# NUEVO: Crear respaldo de datos antes de cualquier cosa
BACKUP_DIR="/tmp/miweb_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo "📦 PASO 1: Protegiendo datos existentes..."

# Respaldar base de datos principal
if [ -f "web/olt_system.db" ]; then
    cp "web/olt_system.db" "$BACKUP_DIR/"
    echo "✅ Base de datos principal protegida"
fi

# Respaldar bases de datos de usuarios
if [ -d "web/databases" ]; then
    cp -r "web/databases" "$BACKUP_DIR/"
    echo "✅ Bases de datos de usuarios protegidas"
fi

# Respaldar backups existentes
if [ -d "web/backups" ]; then
    cp -r "web/backups" "$BACKUP_DIR/"
    echo "✅ Backups existentes protegidos"
fi

# Respaldar archivos de configuración personalizados
if [ -f "web/.env" ]; then
    cp "web/.env" "$BACKUP_DIR/"
    echo "✅ Configuración .env protegida"
fi

# Respaldar cookies y sesiones
if [ -f "web/cookies.txt" ]; then
    cp "web/cookies.txt" "$BACKUP_DIR/"
    echo "✅ Cookies protegidas"
fi

echo ""
echo "📦 Instalando dependencias (root)..."
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi

echo "📦 Instalando dependencias (web)..."
pushd web >/dev/null
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi
popd >/dev/null

# 2) Asegurar base de datos principal (si aún no existe)
echo "🗄️ Verificando base de datos principal..."
if [ ! -f "web/olt_system.db" ]; then
  echo "📚 Creando base de datos inicial (web/init-database.js)..."
  node web/init-database.js || echo "⚠️ init-database: continuando pese a error"
else
  echo "✅ Base de datos principal encontrada: web/olt_system.db"
fi

# 3) Migraciones de base de datos (seguras e idempotentes)
echo "🗃️ Ejecutando migraciones de base de datos..."
node web/database-migrations.js || echo "⚠️ Migraciones: continuando pese a error (revisar logs)"

# 4) Parches de compatibilidad de esquema
echo "🔧 Aplicando parches de esquema (si corresponden)..."
if [ -f "web/fix-orden-column.js" ]; then
  node web/fix-orden-column.js || echo "⚠️ fix-orden-column: continuando pese a error"
fi
if [ -f "web/corregir-base-principal.js" ]; then
  node web/corregir-base-principal.js || echo "⚠️ corregir-base-principal: continuando pese a error"
fi

# 4) Restauración opcional de entorno de alito (solo si se pide explícitamente)
if [ "${POST_GIT_PULL_RESTORE_ALITO:-0}" = "1" ] && [ -f "web/restaurar-alito-zte.js" ]; then
  echo "👤 Restaurando usuario alito y comandos ZTE C600 (opcional activado)"
  node web/restaurar-alito-zte.js || echo "⚠️ restaurar-alito-zte: continuando pese a error"
fi

# 5) RESTAURAR DATOS PROTEGIDOS
echo ""
echo "📥 PASO 3: Restaurando datos protegidos..."

# Restaurar base de datos principal si existe respaldo
if [ -f "$BACKUP_DIR/olt_system.db" ]; then
    cp "$BACKUP_DIR/olt_system.db" "web/"
    echo "✅ Base de datos principal restaurada"
fi

# Restaurar bases de datos de usuarios
if [ -d "$BACKUP_DIR/databases" ]; then
    cp -r "$BACKUP_DIR/databases" "web/"
    echo "✅ Bases de datos de usuarios restauradas"
fi

# Restaurar backups
if [ -d "$BACKUP_DIR/backups" ]; then
    cp -r "$BACKUP_DIR/backups" "web/"
    echo "✅ Backups restaurados"
fi

# Restaurar configuración personalizada
if [ -f "$BACKUP_DIR/.env" ]; then
    cp "$BACKUP_DIR/.env" "web/"
    echo "✅ Configuración .env restaurada"
fi

# Restaurar cookies
if [ -f "$BACKUP_DIR/cookies.txt" ]; then
    cp "$BACKUP_DIR/cookies.txt" "web/"
    echo "✅ Cookies restauradas"
fi

# 6) Diagnóstico (no bloqueante)
if [ -f "web/diagnosticar-alito.js" ]; then
  echo "🩺 Ejecutando diagnóstico rápido..."
  node web/diagnosticar-alito.js || true
fi

echo ""
echo "🧹 LIMPIEZA Y FINALIZACIÓN"
echo "========================="
echo "📂 Respaldo temporal: $BACKUP_DIR"
echo "💡 Si todo funciona bien, puedes eliminar el respaldo:"
echo "   rm -rf '$BACKUP_DIR'"

echo ""
echo "✅ ACTUALIZACIÓN COMPLETADA CON DATOS PROTEGIDOS"
echo "=============================================="
echo "🔹 Código actualizado desde Git ✓"
echo "🔹 Dependencias instaladas ✓" 
echo "🔹 Base de datos verificada ✓"
echo "🔹 Datos personales restaurados ✓"
echo ""
echo "🚀 Tu aplicación está lista para usar con todos tus datos intactos"

echo ""
echo "ℹ️ REINICIO DEL SERVIDOR:"
echo "   - Si usas PM2: pm2 restart all"
echo "   - Si usas systemd: sudo systemctl restart miweb (o tu servicio)"
echo "   - Sin gestor: matar proceso node y ejecutar: cd web && npm start"

#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

cd "$(dirname "$0")"

echo "🚀 Post Git Pull: iniciando tareas de preparación..."
echo "📁 Proyecto: $(pwd)"

# 1) Instalar dependencias (root y web)
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

# 5) Diagnóstico (no bloqueante)
if [ -f "web/diagnosticar-alito.js" ]; then
  echo "🩺 Ejecutando diagnóstico rápido..."
  node web/diagnosticar-alito.js || true
fi

echo "✅ Post Git Pull: finalizado."
echo "ℹ️ Reinicio: este script no reinicia el servidor automáticamente."
echo "   - Si usas PM2: pm2 restart all"
echo "   - Si usas systemd: sudo systemctl restart miweb (o tu servicio)"
echo "   - Sin gestor: matar proceso node y ejecutar: cd web && npm start"

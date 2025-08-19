#!/usr/bin/env bash
set -euo pipefail

echo "== Fix Linux Start: preparar entorno y recompilar módulos nativos =="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
WEB_DIR="$ROOT_DIR/web"

if [[ ! -d "$WEB_DIR" ]]; then
  echo "❌ No se encontró el directorio web en: $WEB_DIR"
  exit 1
fi

START_AFTER=false
INSTALL_TOOLS=false
for arg in "$@"; do
  case "$arg" in
    --start) START_AFTER=true ;;
    --install-tools) INSTALL_TOOLS=true ;;
    *) echo "Uso: $0 [--install-tools] [--start]" ;;
  esac
done

echo "📦 Directorio del proyecto: $ROOT_DIR"
echo "📁 Directorio web: $WEB_DIR"

echo "🔎 Versiones actuales:"
node -v || true
npm -v || true

# 1) Toolchain de compilación (opcional con --install-tools)
if $INSTALL_TOOLS; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "🔧 Instalando toolchain (build-essential, python3, g++)"
    sudo apt-get update -y
    sudo apt-get install -y build-essential python3 make g++
  else
    echo "⚠️ apt-get no disponible. Instala manualmente build-essential y python3."
  fi
fi

# 2) Reinstalar dependencias en web
cd "$WEB_DIR"
echo "🧹 Limpiando dependencias previas..."
rm -rf node_modules || true
rm -f package-lock.json || true

echo "📥 Instalando dependencias (npm install)..."
npm install

# 3) Recompilar nativos para la versión de Node actual
echo "🛠️ Recompilando módulos nativos (sqlite3, bcrypt)..."
npm rebuild sqlite3 bcrypt --build-from-source || {
  echo "⚠️ Rebuild con build-from-source falló; intentando npm rebuild genérico";
  npm rebuild || true;
}

echo "✅ Reparación completada."

if $START_AFTER; then
  echo "▶️ Iniciando la aplicación: npm start"
  npm start
else
  echo "👉 Puedes iniciar ahora con:"
  echo "   cd '$WEB_DIR' && npm start"
fi

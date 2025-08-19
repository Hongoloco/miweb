#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

cd "$(dirname "$0")"

echo "🔄 Restauración post git pull (wrapper)"

chmod +x ./post-git-pull.sh || true
POST_GIT_PULL_RESTORE_ALITO=${POST_GIT_PULL_RESTORE_ALITO:-0} \
    ./post-git-pull.sh

echo ""
echo "🔁 Reinicio sugerido (elige según tu entorno):"
if command -v pm2 &> /dev/null; then
    echo "  • pm2 restart all"
elif command -v systemctl &> /dev/null; then
    echo "  • sudo systemctl restart miweb   # o tu servicio"
elif pgrep -f "node .*server\\.js" &> /dev/null; then
    echo "  • pkill -f 'node .*server\\.js' && cd web && npm start"
else
    echo "  • cd web && npm start"
fi

echo ""
echo "✅ Listo. Si necesitas restaurar alito, ejecuta: POST_GIT_PULL_RESTORE_ALITO=1 ./restaurar-post-git-pull.sh"

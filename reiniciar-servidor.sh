#!/bin/bash

# Script para reiniciar el servidor de diferentes maneras
# Uso: bash reiniciar-servidor.sh

echo "🔄 Reiniciando servidor de la aplicación web..."

# Función para verificar si el servidor está corriendo
check_server() {
    if pgrep -f "node server.js" > /dev/null; then
        echo "✅ Servidor Node.js está corriendo"
        return 0
    else
        echo "❌ Servidor Node.js no está corriendo"
        return 1
    fi
}

# Función para detener el servidor
stop_server() {
    echo "🛑 Deteniendo servidor..."
    
    if pgrep -f "node server.js" > /dev/null; then
        pkill -f "node server.js"
        sleep 2
        
        if pgrep -f "node server.js" > /dev/null; then
            echo "⚠️  Proceso persistente, forzando terminación..."
            pkill -9 -f "node server.js"
            sleep 1
        fi
        
        echo "✅ Servidor detenido"
    else
        echo "ℹ️  El servidor ya estaba detenido"
    fi
}

# Función para iniciar el servidor
start_server() {
    echo "🚀 Iniciando servidor..."
    
    cd web || { echo "❌ Error: No se encuentra directorio web"; exit 1; }
    
    # Verificar que existe server.js
    if [ ! -f "server.js" ]; then
        echo "❌ Error: No se encuentra server.js"
        exit 1
    fi
    
    # Iniciar según el método disponible
    if command -v pm2 &> /dev/null; then
        echo "📦 Usando PM2..."
        pm2 start server.js --name "miweb"
        pm2 save
    elif command -v screen &> /dev/null; then
        echo "📦 Usando Screen..."
        screen -dmS miweb node server.js
        echo "💡 Para ver logs: screen -r miweb"
    else
        echo "📦 Usando nohup..."
        nohup node server.js > ../server.log 2>&1 &
        echo "💡 Para ver logs: tail -f server.log"
    fi
    
    cd ..
    sleep 3
    
    if check_server; then
        echo "✅ Servidor iniciado correctamente"
        echo "🌐 Accede en: http://tu-servidor:3000"
    else
        echo "❌ Error al iniciar el servidor"
        echo "💡 Revisa los logs para más información"
        exit 1
    fi
}

# Programa principal
echo "🔍 Verificando estado del servidor..."
check_server

echo ""
echo "🔄 Reiniciando..."
stop_server
echo ""
start_server

echo ""
echo "🎉 Reinicio completado!"
echo "🔑 Login: alito / vinilo28"

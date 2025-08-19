#!/bin/bash

# 🔧 SOLUCIONADOR DE CONFLICTOS DE PUERTO
# Soluciona el problema "EADDRINUSE: address already in use :::3000"

echo "🔧 SOLUCIONANDO CONFLICTO DE PUERTO 3000..."
echo "============================================"

# Función para encontrar y matar procesos en puerto 3000
matar_procesos_puerto() {
    echo "🔍 Buscando procesos usando puerto 3000..."
    
    # Buscar procesos en puerto 3000
    PROCESOS=$(lsof -ti:3000 2>/dev/null || netstat -tulpn 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d'/' -f1)
    
    if [ -z "$PROCESOS" ]; then
        echo "ℹ️ No se encontraron procesos específicos en puerto 3000"
    else
        echo "🎯 Procesos encontrados en puerto 3000:"
        echo "$PROCESOS"
        
        echo "💀 Eliminando procesos..."
        echo "$PROCESOS" | xargs -r kill -9 2>/dev/null
        sleep 2
    fi
    
    # Método adicional: matar todos los procesos node
    echo "🔄 Eliminando todos los procesos Node.js..."
    pkill -f "node.*server" 2>/dev/null || true
    pkill -f "npm.*start" 2>/dev/null || true
    killall node 2>/dev/null || true
    
    sleep 3
}

# Función para verificar si el puerto está libre
verificar_puerto() {
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Puerto ocupado
    else
        return 0  # Puerto libre
    fi
}

# Función para forzar liberación del puerto usando fuser
forzar_liberacion() {
    echo "⚡ Forzando liberación del puerto 3000..."
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 2
}

# PASO 1: Matar procesos en puerto 3000
matar_procesos_puerto

# PASO 2: Verificar si el puerto está libre
if verificar_puerto; then
    echo "✅ Puerto 3000 liberado exitosamente"
else
    echo "⚠️ Puerto 3000 aún ocupado, forzando liberación..."
    forzar_liberacion
    
    # Verificar nuevamente
    if verificar_puerto; then
        echo "✅ Puerto 3000 liberado después de forzar"
    else
        echo "❌ Puerto 3000 sigue ocupado"
        echo "🔍 Verificando qué lo está usando..."
        lsof -i :3000 2>/dev/null || netstat -tulpn | grep :3000
        echo ""
        echo "💡 Soluciones alternativas:"
        echo "   1. Reiniciar el servidor: sudo reboot"
        echo "   2. Usar otro puerto: PORT=3001 npm start"
        echo "   3. Esperar unos minutos y reintentar"
        exit 1
    fi
fi

# PASO 3: Limpiar procesos zombies
echo "🧹 Limpiando procesos zombies..."
ps aux | grep '[Zz]ombie' | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

# PASO 4: Verificar que no hay otros servidores web
echo "🌐 Verificando otros servidores web..."
netstat -tulpn 2>/dev/null | grep -E ':(80|8080|3000|3001)' || echo "No hay otros servidores detectados"

# PASO 5: Iniciar el servidor
echo "🚀 Iniciando servidor en puerto 3000..."
cd web 2>/dev/null || cd /root/miweb/web

# Verificar que estamos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo "❌ No se encontró server.js"
    echo "📁 Directorio actual: $(pwd)"
    echo "📂 Contenido:"
    ls -la
    exit 1
fi

# Iniciar servidor en background
echo "▶️ Ejecutando: npm start"
npm start &

# Esperar un momento para que inicie
sleep 5

# PASO 6: Verificar que el servidor esté funcionando
echo "✅ Verificando funcionamiento del servidor..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    echo "🎉 ¡SERVIDOR FUNCIONANDO CORRECTAMENTE!"
    echo "🌐 Acceder a: http://localhost:3000"
    echo "👤 Usuario: alito"
    echo "🔐 Contraseña: 123"
else
    echo "⚠️ El servidor puede estar iniciando..."
    echo "🔍 Estado del proceso:"
    ps aux | grep "node.*server" | grep -v grep
    echo ""
    echo "💡 Espera 30 segundos y verifica manualmente:"
    echo "   curl http://localhost:3000"
fi

echo ""
echo "✅ SOLUCIÓN DE CONFLICTO DE PUERTO COMPLETADA"

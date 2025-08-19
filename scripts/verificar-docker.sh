#!/bin/bash

# Script para verificar y iniciar el daemon de Docker
echo "🐳 Verificando estado de Docker..."

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado."
    echo "Ejecuta './instalar-docker.sh' para instalarlo."
    exit 1
fi

# Verificar si el daemon de Docker está ejecutándose
if ! docker info &> /dev/null; then
    echo "⚠️ El daemon de Docker no está ejecutándose."
    echo "Intentando iniciar el servicio Docker..."
    
    # Intentar iniciar Docker con systemctl
    if command -v systemctl &> /dev/null; then
        sudo systemctl start docker
        sudo systemctl enable docker
        
        # Esperar un momento y verificar
        sleep 2
        
        if docker info &> /dev/null; then
            echo "✅ Docker se ha iniciado correctamente."
        else
            echo "❌ No se pudo iniciar Docker con systemctl."
            echo "Intenta ejecutar manualmente: sudo systemctl start docker"
            exit 1
        fi
    else
        echo "❌ systemctl no está disponible."
        echo "Intenta iniciar Docker manualmente según tu sistema operativo."
        exit 1
    fi
else
    echo "✅ Docker está ejecutándose correctamente."
fi

# Verificar Docker Compose
if docker compose version &> /dev/null; then
    echo "✅ Docker Compose V2 está disponible."
elif command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose V1 está disponible."
else
    echo "❌ Docker Compose no está disponible."
    echo "Ejecuta './instalar-docker.sh' para instalarlo."
    exit 1
fi

echo "🎉 Docker está listo para usar."

#!/bin/bash

# Script para actualizar automáticamente docker-compose a docker compose
echo "Verificando Docker y Docker Compose..."

# Comprobar si docker compose está disponible (v2 sin guion)
if docker compose version &> /dev/null; then
    echo "Docker Compose V2 (docker compose) está disponible."
    
    # Verificar si los archivos usan docker-compose con guion
    if grep -q "docker-compose" docker-manager.sh 2>/dev/null; then
        echo "Detectado docker-compose en los archivos. Actualizando a Docker Compose V2 (sin guion)..."
    else
        echo "Los archivos ya están usando Docker Compose V2 (sin guion). No se requieren cambios."
        exit 0
    fi
# Comprobar si docker-compose está disponible (v1 con guion)
elif command -v docker-compose &> /dev/null; then
    echo "Docker Compose V1 (docker-compose) está disponible. No se requieren cambios."
    exit 0
fi

# Comprobar si docker compose está disponible
if ! docker compose version &> /dev/null; then
    echo "ERROR: Ni docker-compose ni docker compose están disponibles."
    echo "Por favor instala Docker con soporte para Docker Compose V2."
    exit 1
fi

echo "Detectado Docker Compose V2 (docker compose). Actualizando archivos..."

# Actualizar docker-manager.sh
echo "Actualizando docker-manager.sh..."
if [ -f docker-manager.sh ]; then
    sed -i 's/docker-compose/docker compose/g' docker-manager.sh
    echo "✅ docker-manager.sh actualizado correctamente."
else
    echo "⚠️ No se encontró el archivo docker-manager.sh"
fi

# Actualizar DOCKER-README.md
echo "Actualizando DOCKER-README.md..."
if [ -f DOCKER-README.md ]; then
    sed -i 's/- Docker\n- Docker Compose/- Docker (versión 18.09 o superior, con Docker Compose V2 incluido)/g' DOCKER-README.md
    echo "✅ DOCKER-README.md actualizado correctamente."
else
    echo "⚠️ No se encontró el archivo DOCKER-README.md"
fi

echo ""
echo "Actualizaciones completadas."
echo "Ahora puedes usar ./docker-manager.sh para gestionar tu aplicación Docker."

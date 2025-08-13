#!/bin/bash

# Script para instalar Docker y Docker Compose V2 en un servidor Ubuntu/Debian
# Autor: GitHub Copilot
# Fecha: Agosto 2025

echo "======================================================"
echo "  Instalando Docker y Docker Compose en tu servidor"
echo "======================================================"

# Colores para la salida
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si se está ejecutando como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Por favor ejecuta este script como root o usando sudo${NC}"
  exit 1
fi

# Detectar el sistema operativo
echo -e "${BLUE}Detectando sistema operativo...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
    echo -e "${GREEN}Sistema operativo detectado: $OS $VER${NC}"
else
    echo -e "${RED}No se pudo detectar el sistema operativo${NC}"
    exit 1
fi

# Verificar si Docker ya está instalado
if command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker ya está instalado. Versión:${NC}"
    docker --version
    
    # Verificar si Docker Compose está disponible
    if docker compose version &> /dev/null; then
        echo -e "${YELLOW}Docker Compose V2 ya está instalado:${NC}"
        docker compose version
        echo -e "${GREEN}¡Todo listo! Tu sistema ya tiene Docker y Docker Compose V2 instalados.${NC}"
        exit 0
    elif command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Docker Compose V1 está instalado. Recomendamos actualizar a V2.${NC}"
        docker-compose --version
    else
        echo -e "${YELLOW}Docker está instalado pero Docker Compose no. Se instalará Docker Compose.${NC}"
    fi
else
    echo -e "${BLUE}Instalando Docker...${NC}"
    
    # Desinstalar versiones antiguas
    apt-get remove -y docker docker.io containerd runc || true
    
    # Instalar paquetes necesarios
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common gnupg

    # Agregar clave GPG oficial de Docker
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Configurar el repositorio
    if [[ "$OS" == *"Ubuntu"* ]]; then
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    elif [[ "$OS" == *"Debian"* ]]; then
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    else
        echo -e "${RED}Tu sistema operativo no es compatible con este script de instalación${NC}"
        echo -e "${YELLOW}Por favor visita https://docs.docker.com/engine/install/ para instrucciones específicas${NC}"
        exit 1
    fi

    # Actualizar índice de paquetes
    apt-get update

    # Instalar Docker
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Verificar instalación
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}Docker instalado correctamente:${NC}"
        docker --version
    else
        echo -e "${RED}Error al instalar Docker${NC}"
        exit 1
    fi
fi

# Verificar si Docker Compose V2 está disponible después de la instalación
if docker compose version &> /dev/null; then
    echo -e "${GREEN}Docker Compose V2 está configurado correctamente:${NC}"
    docker compose version
else
    echo -e "${RED}Docker Compose V2 no está disponible. Instalando plugin...${NC}"
    apt-get update
    apt-get install -y docker-compose-plugin
    
    if docker compose version &> /dev/null; then
        echo -e "${GREEN}Docker Compose V2 instalado correctamente:${NC}"
        docker compose version
    else
        echo -e "${RED}Error al instalar Docker Compose V2${NC}"
        echo -e "${YELLOW}Intentando instalar Docker Compose V1 como alternativa...${NC}"
        
        apt-get install -y docker-compose
        
        if command -v docker-compose &> /dev/null; then
            echo -e "${GREEN}Docker Compose V1 instalado como alternativa:${NC}"
            docker-compose --version
            echo -e "${YELLOW}NOTA: Estás usando Docker Compose V1. Tu script docker-manager.sh funcionará con 'docker-compose' (con guion).${NC}"
        else
            echo -e "${RED}No se pudo instalar ninguna versión de Docker Compose${NC}"
            exit 1
        fi
    fi
fi

# Configurar Docker para iniciar al arranque
echo -e "${BLUE}Configurando Docker para iniciar al arranque...${NC}"
systemctl enable docker
systemctl start docker

# Configurar permisos (opcional)
echo -e "${BLUE}¿Quieres añadir tu usuario al grupo docker para ejecutar comandos sin sudo? (s/n)${NC}"
read -r respuesta
if [[ "$respuesta" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Por favor, introduce el nombre de usuario:${NC}"
    read -r usuario
    if id "$usuario" &>/dev/null; then
        usermod -aG docker "$usuario"
        echo -e "${GREEN}Usuario $usuario añadido al grupo docker.${NC}"
        echo -e "${YELLOW}IMPORTANTE: Cierra sesión y vuelve a iniciar sesión para que los cambios tengan efecto.${NC}"
    else
        echo -e "${RED}El usuario $usuario no existe${NC}"
    fi
fi

echo ""
echo -e "${GREEN}¡Instalación completada!${NC}"
echo -e "${BLUE}Docker y Docker Compose están instalados y configurados correctamente.${NC}"
echo -e "${YELLOW}Ahora puedes ejecutar './docker-manager.sh start' para iniciar tu aplicación.${NC}"
echo ""
echo -e "${BLUE}Para verificar que todo funciona correctamente, ejecuta:${NC}"
echo -e "  ${YELLOW}docker run hello-world${NC}"

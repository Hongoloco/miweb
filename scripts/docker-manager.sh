#!/bin/bash

# Script para gestionar la aplicación OLT Manager en Docker

# Colores para formateo
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Mostrar encabezado
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}      GESTOR DE APLICACIÓN OLT EN DOCKER        ${NC}"
echo -e "${BLUE}================================================${NC}"

# Función para mostrar ayuda
show_help() {
  echo -e "${GREEN}Uso:${NC}"
  echo -e "  ${YELLOW}./docker-manager.sh${NC} [comando]"
  echo ""
  echo -e "${GREEN}Comandos disponibles:${NC}"
  echo -e "  ${YELLOW}start${NC}      Iniciar la aplicación (construir si es primera vez)"
  echo -e "  ${YELLOW}stop${NC}       Detener la aplicación"
  echo -e "  ${YELLOW}restart${NC}    Reiniciar la aplicación"
  echo -e "  ${YELLOW}build${NC}      Reconstruir la imagen desde cero"
  echo -e "  ${YELLOW}logs${NC}       Ver los logs de la aplicación"
  echo -e "  ${YELLOW}shell${NC}      Abrir una terminal bash dentro del contenedor"
  echo -e "  ${YELLOW}status${NC}     Verificar estado del contenedor"
  echo -e "  ${YELLOW}update${NC}     Actualizar y reiniciar (git pull + rebuild)"
  echo ""
  echo -e "${GREEN}Ejemplo:${NC}"
  echo -e "  ${YELLOW}./docker-manager.sh start${NC}"
}

# Función para iniciar la aplicación
start_app() {
  # Verificar que Docker esté funcionando
  if [ -f "./verificar-docker.sh" ]; then
    ./verificar-docker.sh
    if [ $? -ne 0 ]; then
      echo -e "${RED}Docker no está funcionando correctamente. Abortando.${NC}"
      exit 1
    fi
  fi
  
  echo -e "${BLUE}Iniciando aplicación en Docker...${NC}"
  if docker compose ps -q | grep -q .; then
    echo -e "${YELLOW}La aplicación ya está en ejecución${NC}"
    echo -e "${YELLOW}Accede a:${NC} http://localhost:3000"
  else
    docker compose up -d
    echo -e "${GREEN}Aplicación iniciada correctamente${NC}"
    echo -e "${YELLOW}Accede a:${NC} http://localhost:3000"
  fi
}

# Función para detener la aplicación
stop_app() {
  echo -e "${BLUE}Deteniendo la aplicación...${NC}"
  docker compose down
  echo -e "${GREEN}Aplicación detenida${NC}"
}

# Función para reconstruir la imagen
build_app() {
  echo -e "${BLUE}Reconstruyendo la aplicación desde cero...${NC}"
  docker compose down
  docker compose build --no-cache
  docker compose up -d
  echo -e "${GREEN}Aplicación reconstruida y reiniciada${NC}"
  echo -e "${YELLOW}Accede a:${NC} http://localhost:3000"
}

# Función para ver los logs
show_logs() {
  echo -e "${BLUE}Mostrando logs de la aplicación:${NC}"
  docker compose logs -f
}

# Función para abrir shell
open_shell() {
  echo -e "${BLUE}Abriendo terminal bash en el contenedor...${NC}"
  docker compose exec olt-manager bash
}

# Función para verificar estado
check_status() {
  echo -e "${BLUE}Estado del contenedor:${NC}"
  docker compose ps
}

# Función para actualizar desde git y reiniciar
update_app() {
  echo -e "${BLUE}Actualizando desde git...${NC}"
  git pull
  echo -e "${BLUE}Reconstruyendo la aplicación...${NC}"
  docker compose down
  docker compose build
  docker compose up -d
  echo -e "${GREEN}Aplicación actualizada y reiniciada${NC}"
}

# Procesar el comando
case "$1" in
  start)
    start_app
    ;;
  stop)
    stop_app
    ;;
  restart)
    stop_app
    start_app
    ;;
  build)
    build_app
    ;;
  logs)
    show_logs
    ;;
  shell)
    open_shell
    ;;
  status)
    check_status
    ;;
  update)
    update_app
    ;;
  *)
    show_help
    ;;
esac

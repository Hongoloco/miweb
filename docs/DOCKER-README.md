# Docker para OLT Manager

Este directorio contiene la configuración necesaria para ejecutar la aplicación OLT Manager en Docker.

## Requisitos

- Docker (versión 18.09 o superior, con Docker Compose V2 incluido)

## Estructura

- `docker-compose.yml`: Configuración de los servicios
- `Dockerfile`: Configuración de la imagen Ubuntu
- `docker-manager.sh`: Script para gestionar la aplicación en Docker

## Uso rápido

Para iniciar la aplicación:

```bash
./docker-manager.sh start
```

Para detenerla:

```bash
./docker-manager.sh stop
```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `start` | Inicia la aplicación |
| `stop` | Detiene la aplicación |
| `restart` | Reinicia la aplicación |
| `build` | Reconstruye la imagen desde cero |
| `logs` | Muestra los logs de la aplicación |
| `shell` | Abre una terminal bash en el contenedor |
| `status` | Muestra el estado del contenedor |
| `update` | Actualiza desde git y reinicia la aplicación |

## Acceso

Una vez iniciada la aplicación, accede a:

- **URL**: http://localhost:3000

## Detalles técnicos

La imagen Docker incluye:

- Ubuntu 24.04
- Node.js 20.x
- SQLite3
- Todas las dependencias necesarias para la aplicación

La aplicación se configura automáticamente al iniciar el contenedor, ejecutando el script `post-git-pull.sh` que:

1. Inicializa la base de datos
2. Restaura la OLT ZTE C600 con sus comandos
3. Configura el usuario del sistema

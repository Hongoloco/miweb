# Instalación de Docker y Docker Compose en tu Servidor

Este documento proporciona instrucciones detalladas para instalar Docker y Docker Compose en tu servidor.

## Opción 1: Usando el Script Automatizado

Hemos creado un script automatizado para instalar Docker y Docker Compose en tu servidor. Este es el método recomendado:

1. Descarga y haz ejecutable el script:
   ```bash
   chmod +x instalar-docker.sh
   ```

2. Ejecútalo como root o usando sudo:
   ```bash
   sudo ./instalar-docker.sh
   ```

3. Sigue las instrucciones en pantalla.

4. Después de la instalación, comprueba que Docker funciona:
   ```bash
   docker run hello-world
   ```

## Opción 2: Instalación Manual

Si prefieres realizar la instalación manualmente, sigue estos pasos:

### Para Ubuntu/Debian:

1. Desinstalar versiones antiguas (si existen):
   ```bash
   sudo apt-get remove docker docker-engine docker.io containerd runc
   ```

2. Instalar paquetes necesarios:
   ```bash
   sudo apt-get update
   sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release
   ```

3. Agregar la clave GPG oficial de Docker:
   ```bash
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   ```

4. Configurar el repositorio:
   ```bash
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   ```

5. Instalar Docker Engine:
   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```

6. Verificar la instalación:
   ```bash
   sudo docker run hello-world
   ```

7. Añadir tu usuario al grupo Docker para no tener que usar sudo:
   ```bash
   sudo usermod -aG docker tu-usuario
   ```
   (Cierra sesión y vuelve a iniciar sesión para aplicar los cambios)

### Para CentOS/RHEL/Fedora:

1. Instalar paquetes necesarios:
   ```bash
   sudo yum install -y yum-utils
   sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   ```

2. Instalar Docker:
   ```bash
   sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```

3. Iniciar Docker:
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

## Verificación

Para verificar que Docker y Docker Compose están instalados correctamente:

```bash
# Verificar Docker
docker --version

# Verificar Docker Compose V2
docker compose version
```

## Solución de Problemas

Si encuentras problemas después de instalar Docker:

1. Asegúrate de que el servicio Docker esté en ejecución:
   ```bash
   sudo systemctl status docker
   ```

2. Si no está en ejecución:
   ```bash
   sudo systemctl start docker
   ```

3. Si recibes errores de permisos, verifica que tu usuario esté en el grupo docker:
   ```bash
   groups $USER
   ```

4. Si no está en el grupo, añádelo y reinicia tu sesión:
   ```bash
   sudo usermod -aG docker $USER
   ```

## Después de la Instalación

Una vez que Docker y Docker Compose estén instalados, puedes ejecutar:

```bash
./actualizar-docker-compose.sh
./docker-manager.sh start
```

## Recursos Adicionales

- [Documentación oficial de Docker](https://docs.docker.com/engine/install/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)

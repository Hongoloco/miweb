# 🚑 COMANDOS ESPECÍFICOS PARA TU SERVIDOR

## Basado en tus errores reportados:
```
error: Your local changes to the following files would be overwritten by merge:
        web/cookies.txt
Please commit your changes or stash them before you merge.
Aborting
-bash: ./emergencia-base-datos.sh: No such file or directory
-bash: cd: web: No such file or directory
```

## 🔧 SOLUCIÓN PASO A PASO:

### 1. Navegar al directorio correcto del proyecto
```bash
# Encontrar el directorio del proyecto (ajusta la ruta según tu servidor)
find /home -name "package.json" -path "*/miweb/*" 2>/dev/null
# O si sabes la ruta:
cd /ruta/a/tu/proyecto/miweb
```

### 2. Resolver conflicto de git
```bash
# Eliminar archivo conflictivo
rm web/cookies.txt

# Hacer git pull
git pull origin main

# Si sigue fallando, hacer reset:
git fetch origin
git reset --hard origin/main
```

### 3. Verificar que todo esté en su lugar
```bash
# Verificar scripts
ls -la *.sh

# Verificar directorio web
ls -la web/

# Dar permisos a scripts
chmod +x *.sh
```

### 4. Ejecutar solución de base de datos
```bash
# Opción 1: Script automático completo
./solucion-completa-servidor.sh

# Opción 2: Solo recuperar base de datos
./emergencia-base-datos.sh

# Opción 3: Manual si los scripts fallan
cd web
rm olt_system.db  # si existe y está vacío
node server.js &
sleep 10
pkill -f "node.*server.js"
node database-migrations.js
cd ..
```

### 5. Iniciar servidor
```bash
cd web
npm start
```

## 🎯 COMANDOS EN SECUENCIA (Copia y pega):

```bash
# Paso 1: Ir al directorio correcto (ajusta la ruta)
cd /ruta/a/tu/proyecto

# Paso 2: Resolver git
rm web/cookies.txt 2>/dev/null || true
git pull origin main || (git fetch origin && git reset --hard origin/main)

# Paso 3: Permisos y verificación
chmod +x *.sh
ls -la emergencia-base-datos.sh

# Paso 4: Recuperar base de datos
./emergencia-base-datos.sh

# Paso 5: Iniciar
cd web && npm start
```

## 🔍 Si los directorios no coinciden:

```bash
# Buscar el proyecto en el servidor
find /home -name "server.js" -path "*/web/*" 2>/dev/null
find /var/www -name "server.js" -path "*/web/*" 2>/dev/null
find /opt -name "server.js" -path "*/web/*" 2>/dev/null

# Una vez encontrado, ir a la carpeta padre que contiene web/
cd /ruta/encontrada/..
```

## ⚠️ Errores comunes y soluciones:

### Error: "No such file or directory"
```bash
# Verificar que estás en el directorio correcto
pwd
ls -la package.json  # Debe existir

# Verificar que los scripts se descargaron
git log --oneline -n 5
```

### Error: "Permission denied"
```bash
# Dar permisos
chmod +x *.sh
chmod +x web/*.js
```

### Error: "node: command not found"
```bash
# Instalar Node.js si no está disponible
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 📞 Comandos de diagnóstico:

```bash
# Verificar estado del sistema
./solucion-completa-servidor.sh

# Ver logs si el servidor falla
cd web
node server.js 2>&1 | head -20

# Verificar base de datos
ls -la web/olt_system.db
sqlite3 web/olt_system.db ".tables" 2>/dev/null || echo "sqlite3 no disponible"
```

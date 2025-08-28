# 🚑 SOLUCIÓN RÁPIDA: Base de Datos Vacía Después de Git Pull

## 🎯 Problema
Después de hacer `git pull` en tu servidor, la base de datos `olt_system.db` quedó vacía (0.0 KB) y obtienes errores como:
- `SQLITE_ERROR: no such table: usuarios`
- `SQLITE_ERROR: no such table: olts`
- `SQLITE_ERROR: no such table: modelos_ont`

## ⚡ Solución Inmediata

### Opción 1: Script de Recuperación Automática (Recomendado)
```bash
# En el servidor, ejecutar:
./recuperar-base-datos.sh
```

### Opción 2: Recuperación Manual
```bash
# 1. Detener el servidor si está corriendo
pkill -f "node.*server.js" || pm2 stop all

# 2. Ir al directorio del proyecto
cd /ruta/a/tu/proyecto/web

# 3. Eliminar base de datos corrupta
rm olt_system.db

# 4. Inicializar nueva base de datos
node server.js &
sleep 10
pkill -f "node.*server.js"

# 5. Ejecutar migraciones
node database-migrations.js

# 6. Ejecutar script de solución de modelos ONT
cd ..
./solucionar-tabla-modelos.sh

# 7. Reiniciar servidor
cd web
npm start
```

### Opción 3: Restaurar desde Backup
```bash
# Buscar backups recientes
find /tmp -name "*backup*" -name "olt_system.db" -mtime -7
find . -name "*backup*" -name "olt_system.db" -mtime -7

# Si encuentras un backup válido, copiarlo:
cp /ruta/al/backup/olt_system.db web/olt_system.db

# Luego ejecutar migraciones:
cd web
node database-migrations.js
```

## 🔧 Prevención para el Futuro

### 1. Mejorar el Script post-git-pull.sh
El script `post-git-pull.sh` ha sido mejorado para:
- ✅ Detectar bases de datos vacías antes de restaurar
- ✅ Validar backups antes de usarlos
- ✅ Mostrar advertencias claras cuando hay problemas
- ✅ Sugerir scripts de recuperación automáticamente

### 2. Proceso Recomendado para Actualizaciones
```bash
# En tu servidor, siempre ejecutar en este orden:
git pull origin main
./post-git-pull.sh

# Si post-git-pull.sh reporta problemas:
./recuperar-base-datos.sh
```

## 📋 Verificación de Solución

Después de aplicar cualquiera de las soluciones:

```bash
# 1. Verificar tamaño de base de datos
ls -la web/olt_system.db

# 2. Verificar tablas
sqlite3 web/olt_system.db ".tables"

# 3. Verificar usuarios
sqlite3 web/olt_system.db "SELECT username, rol FROM usuarios;"

# 4. Iniciar servidor
cd web && npm start
```

## 🎯 Usuarios para Login

Una vez recuperada la base de datos:
- **Username**: `alito` (administrador)
- **Username**: `admin` (administrador alternativo)

## 📞 Si Nada Funciona

Si todas las opciones anteriores fallan:

1. **Crear base de datos completamente nueva**:
```bash
cd web
rm olt_system.db
node server.js &
sleep 15
pkill -f "node.*server.js"
node database-migrations.js
npm start
```

2. **Recrear usuarios**:
- Usar la interfaz web para crear nuevos usuarios
- O ejecutar scripts de usuario si están disponibles

## 💡 Explicación del Problema

Este problema ocurre cuando:
1. El script `post-git-pull.sh` no se ejecuta correctamente
2. La base de datos original estaba corrupta o vacía antes del backup
3. Hubo problemas de permisos durante la restauración
4. El proceso de git pull interrumpió la operación de backup/restore

Los scripts mejorados ahora detectan y previenen estos problemas automáticamente.

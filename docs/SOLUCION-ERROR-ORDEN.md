# Guía de Solución: Error columna "orden" después de git pull

## ❌ Problema
Después de hacer `git pull` en tu servidor, aparecen estos errores:
```
Error al obtener comandos: [Error: SQLITE_ERROR: no such column: orden]
Error al cargar OLT: HTTP 500
```

## 🔍 Causa
- El código actualizado espera una columna `orden` en la tabla `comandos`
- Tu base de datos en el servidor no tiene esta columna
- Git pull **NO** actualiza las bases de datos, solo el código

## 🚀 Solución Completa

### **Opción 1: Script Automático (Recomendado)**

```bash
# En tu servidor, ejecuta:
bash restaurar-post-git-pull.sh
```

Este script hace todo automáticamente:
- ✅ Corrige la estructura de base de datos
- ✅ Restaura comandos ZTE C600 para alito
- ✅ Te dice cómo reiniciar el servidor

### **Opción 2: Paso a Paso Manual**

Si prefieres hacerlo manualmente:

```bash
# 1. Ir al directorio web
cd web

# 2. Corregir estructura de base de datos
node fix-orden-column.js

# 3. Restaurar comandos para alito
node restaurar-alito-zte.js

# 4. Reiniciar servidor
pm2 restart all
# O si no usas PM2:
pkill -f "node server.js"
node server.js
```

## 📋 Archivos Creados

- **`fix-orden-column.js`** - Corrige estructura de base de datos
- **`restaurar-post-git-pull.sh`** - Script completo de restauración
- **`restaurar-alito-zte.js`** - Restaura usuario y comandos (ya existía)

## ✅ Verificación

Después de ejecutar la solución:

1. **Ve a tu web**: http://tu-servidor:3000
2. **Login**: alito / vinilo28
3. **Verifica**: Que aparezcan los comandos ZTE C600
4. **Parámetros**: Deberían mostrar `1/13/4:38` (no undefined)

## 🔄 Para Futuros Git Pull

Siempre ejecuta después de `git pull`:
```bash
bash restaurar-post-git-pull.sh
```

Esto asegura que tu servidor siempre tenga:
- ✅ Código actualizado
- ✅ Base de datos correcta
- ✅ Comandos restaurados

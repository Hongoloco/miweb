# 🔧 Solución: Error "Error al crear OLT: Error del servidor"

## 🎯 Problema
Cuando un usuario intenta crear una OLT, obtiene el error:
```
Error de Creación
❌ Error al crear OLT: Error del servidor
```

## 🔍 Causa del Problema
Este error ocurre porque **falta la base de datos específica del usuario**. El sistema utiliza un esquema de bases de datos separadas:

- **Base principal** (`olt_system.db`): Contiene usuarios, configuraciones globales
- **Bases por usuario** (`databases/username_olt_system.db`): Contiene OLTs, comandos y datos específicos de cada usuario

### Por qué sucede:
1. El usuario existe en la base principal
2. Pero **no tiene su base de datos individual** en `databases/`
3. Al intentar crear una OLT, el sistema no encuentra la tabla `olts` porque la base del usuario no existe

## ⚡ Solución Rápida

### Para usuario alito específicamente:
```bash
./solucionar-olt-alito-directo.sh
```

### Para cualquier usuario:
```bash
./solucionar-error-olt-usuario.sh nombre_usuario

# Ejemplos:
./solucionar-error-olt-usuario.sh alito
./solucionar-error-olt-usuario.sh mi_usuario
./solucionar-error-olt-usuario.sh tecnico1
```

## 🔧 Solución Manual

Si los scripts no están disponibles:

```bash
# 1. Ir al directorio web
cd web

# 2. Crear directorio si no existe
mkdir -p databases

# 3. Crear base de datos específica del usuario
# (Reemplazar 'alito' por el nombre de usuario correspondiente)
sqlite3 databases/alito_olt_system.db << 'EOF'
CREATE TABLE IF NOT EXISTS olts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    ip TEXT NOT NULL,
    puerto INTEGER DEFAULT 23,
    modelo TEXT,
    ubicacion TEXT,
    activo INTEGER DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion DATETIME,
    configuracion TEXT
);

CREATE TABLE IF NOT EXISTS comandos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    comando TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT DEFAULT 'general',
    parametros TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo INTEGER DEFAULT 1,
    orden_display INTEGER DEFAULT 0,
    tipo_comando TEXT DEFAULT 'manual',
    olt_id INTEGER
);

-- Agregar otras tablas necesarias...
.quit
EOF
```

## 📋 Verificación de Solución

Después de ejecutar la solución:

### 1. Verificar que la base de datos existe:
```bash
ls -la web/databases/
# Debería mostrar: nombre_usuario_olt_system.db
```

### 2. Verificar contenido de la base de datos:
```bash
sqlite3 web/databases/alito_olt_system.db ".tables"
# Debería mostrar: olts, comandos, tareas, etc.
```

### 3. Probar funcionalidad:
1. Reiniciar el servidor
2. Login con el usuario afectado
3. Intentar crear una nueva OLT
4. El error debería estar resuelto

## 🛡️ Prevención

Para evitar este problema en el futuro:

### 1. Verificación automática
El script general puede usarse para verificar cualquier usuario:
```bash
./solucionar-error-olt-usuario.sh nombre_usuario
```

### 2. Monitoreo
Verificar periódicamente que todos los usuarios activos tengan su base de datos:
```bash
# Listar usuarios activos
sqlite3 web/olt_system.db "SELECT username FROM usuarios WHERE activo = 1;"

# Verificar sus bases de datos
ls web/databases/
```

## 🎯 Scripts Disponibles

1. **`solucionar-olt-alito-directo.sh`** - Solución específica para usuario alito
2. **`solucionar-error-olt-usuario.sh`** - Solución general para cualquier usuario
3. **`solucionar-error-olt-alito.sh`** - Método alternativo para alito

## 📝 Estructura del Sistema

```
web/
├── olt_system.db              # Base principal (usuarios, config global)
├── databases/                 # Bases de datos por usuario
│   ├── alito_olt_system.db   # Base específica de alito
│   ├── user1_olt_system.db   # Base específica de user1
│   └── ...
└── user-database-manager.js  # Gestor de bases de datos por usuario
```

## ⚠️ Notas Importantes

- **Usuarios admin**: Usan la base de datos principal, no necesitan base individual
- **Usuarios técnicos**: Cada uno tiene su propia base de datos aislada
- **Datos separados**: Cada usuario solo ve sus propias OLTs y comandos
- **Seguridad**: El aislamiento previene que usuarios vean datos de otros

## 🆘 Si el Problema Persiste

1. **Verificar logs del servidor** para errores específicos
2. **Reiniciar el servidor** después de aplicar la solución
3. **Verificar permisos** en el directorio `databases/`
4. **Comprobar el usuario** esté activo en la base principal
5. **Ejecutar diagnóstico** con los scripts disponibles

La solución es definitiva y previene futuros problemas del mismo tipo.

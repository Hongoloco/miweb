# Solución: Error "SQLITE_ERROR: no such table: modelos_ont"

## 📝 Descripción del Problema
El servidor de producción mostraba el error:
```
Error al obtener modelos ONT: Error: SQLITE_ERROR: no such table: modelos_ont
```

Este error ocurría porque la tabla `modelos_ont` no existía en la base de datos de producción.

## ✅ Solución Implementada

### 1. Migración de Base de Datos
Se agregó una nueva migración en `web/database-migrations.js` para crear la tabla `modelos_ont`:

```javascript
{
    name: 'create_modelos_ont_table',
    sql: `CREATE TABLE IF NOT EXISTS modelos_ont (
        id INTEGER PRIMARY KEY,
        fabricante TEXT NOT NULL,
        modelo TEXT NOT NULL,
        version TEXT,
        tipo TEXT,
        descripcion TEXT,
        usuario_id INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(fabricante, modelo),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`,
    rollback: `DROP TABLE IF EXISTS modelos_ont`
}
```

### 2. Script de Solución Automática
Se creó el script `solucionar-tabla-modelos.sh` que:
- ✅ Crea un backup de seguridad
- ✅ Ejecuta las migraciones necesarias
- ✅ Verifica que la tabla se creó correctamente
- ✅ Proporciona feedback detallado del proceso

### 3. Ejecución Automática
El servidor ahora ejecuta automáticamente las migraciones en cada inicio, asegurando que la base de datos esté siempre actualizada.

## 🚀 Cómo Usar

### Opción 1: Script Automático (Recomendado)
```bash
./solucionar-tabla-modelos.sh
```

### Opción 2: Ejecución Manual
```bash
cd web
node database-migrations.js
```

### Opción 3: Reinicio del Servidor
Las migraciones se ejecutan automáticamente al iniciar el servidor:
```bash
npm start
```

## 📊 Verificación
Para verificar que la solución funcionó correctamente:

1. **Verificar en logs del servidor**: Buscar la línea "✅ create_modelos_ont_table ejecutada correctamente"
2. **Probar funcionalidad**: Acceder a la sección de modelos ONT en la web
3. **Consultar base de datos**: La tabla `modelos_ont` debe existir y estar accesible

## 🔍 Estructura de la Tabla

La tabla `modelos_ont` tiene la siguiente estructura:
- `id`: Clave primaria
- `fabricante`: Fabricante del modelo (requerido)
- `modelo`: Nombre del modelo (requerido)
- `version`: Versión del modelo
- `tipo`: Tipo de ONT
- `descripcion`: Descripción del modelo
- `usuario_id`: ID del usuario propietario
- `fecha_creacion`: Timestamp de creación

## 🛡️ Prevención
- Las migraciones se ejecutan automáticamente en cada inicio del servidor
- El sistema de migraciones previene duplicación de cambios
- Se mantiene un registro completo en la tabla `schema_migrations`

## 📝 Notas Técnicas
- La migración es idempotente (puede ejecutarse múltiples veces sin problemas)
- Se utiliza `CREATE TABLE IF NOT EXISTS` para prevenir errores
- La tabla incluye restricciones de integridad referencial
- Compatible con el sistema de usuarios multi-tenant existente

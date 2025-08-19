# 🧹 LIMPIEZA RECOMENDADA DEL PROYECTO

## 📂 ARCHIVOS A ELIMINAR (Testing/Debug)

### Archivos de Testing Duplicados:
```bash
# En /workspaces/miweb/web/
rm test-eliminar-usuarios.js
rm test-botones-eliminar.js  
rm test-cargar-usuarios.js
rm test-password-alito.js
rm test-simple.html
rm test-user-db-system.js
```

### Archivos de Diagnóstico Obsoletos:
```bash
rm diagnostico.html
rm diagnostico-botones.html
rm diagnostico-eliminacion.js
rm diagnostico-tareas.js
rm verificar-botones.html
rm debug.html
```

### Archivos Backup:
```bash
rm index.html.backup.20250807_185816
```

### Scripts de Password Conflictivos:
```bash
# Mantener solo uno
rm actualizar-password-vinilo28.js
# Mantener: actualizar-password-alito.js
```

## 🔧 CONSOLIDAR FUNCIONES

### 1. Unificar Scripts de Base de Datos:
- Mantener: `init-database.js`, `database-migrations.js`, `check-database.js`
- Evaluar: `restore-from-backup.js`, `clean-duplicate-commands.js`

### 2. Consolidar Scripts de Usuario:
- Unificar `actualizar-password-*.js` en uno solo
- Consolidar `guia-eliminar-usuarios.js` y `solucion-eliminacion.js`

## 🚀 MEJORAS DE DEPLOY

### 1. Agregar Headers Anti-Cache:
```javascript
// En server.js para archivos críticos
app.get('/index.html', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});
```

### 2. Script de Deploy Mejorado:
```bash
#!/bin/bash
# post-git-pull-mejorado.sh

echo "🔄 Deploy post-git-pull mejorado..."

# 1. Limpiar cache del navegador forzando reload
echo "🧹 Limpiando cache..."
find web -name "*.html" -exec touch {} \;

# 2. Verificar BD
cd web
if [ ! -f olt_system.db ]; then
    echo "🗃️ Creando BD..."
    node init-database.js
fi

# 3. Aplicar migraciones
echo "⬆️ Aplicando migraciones..."
node database-migrations.js

# 4. Verificar usuario del sistema
echo "👤 Configurando usuario..."
node actualizar-password-alito.js

echo "✅ Deploy completado"
```

## 🔍 VERIFICACIÓN DE CAMBIOS

### Script de Verificación:
```bash
#!/bin/bash
# verificar-deploy.sh

echo "🔍 Verificando estado del deploy..."

# 1. Verificar archivos principales
echo "📄 Archivos principales:"
ls -la web/index.html web/server.js web/package.json

# 2. Verificar BD
echo "🗃️ Base de datos:"
cd web
sqlite3 olt_system.db "SELECT COUNT(*) as usuarios FROM usuarios; SELECT COUNT(*) as olts FROM olts;"

# 3. Verificar proceso
echo "🔄 Procesos:"
ps aux | grep node

echo "✅ Verificación completada"
```

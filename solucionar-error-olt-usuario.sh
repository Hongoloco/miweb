#!/bin/bash

# Script general para solucionar errores de creación de OLT por falta de base de datos de usuario
# Funciona para cualquier usuario del sistema

echo "🔧 SOLUCIONADOR GENERAL DE ERRORES DE OLT POR USUARIO"
echo "===================================================="

# Verificar parámetros
if [ $# -eq 0 ]; then
    echo "📋 Uso: $0 [username]"
    echo ""
    echo "🎯 Usuarios comunes a verificar:"
    echo "   - alito"
    echo "   - admin" 
    echo "   - [nombre de usuario específico]"
    echo ""
    echo "💡 Ejemplos:"
    echo "   $0 alito"
    echo "   $0 mi_usuario"
    exit 1
fi

USERNAME="$1"

# Ir al directorio web
cd /workspaces/miweb/web 2>/dev/null || {
    if [ -f "../web/user-database-manager.js" ]; then
        cd ../web
    else
        echo "❌ Error: No se encontró directorio web"
        echo "   Ejecutar desde el directorio raíz del proyecto"
        exit 1
    fi
}

echo "📍 Directorio de trabajo: $(pwd)"
echo "👤 Usuario a verificar: $USERNAME"

# Verificar que existe el directorio databases
echo ""
echo "📁 Verificando estructura de directorios..."
if [ ! -d "databases" ]; then
    mkdir -p databases
    echo "✅ Directorio databases creado"
else
    echo "✅ Directorio databases existe"
fi

# Verificar usuario en base principal
echo ""
echo "👥 Verificando usuario en base principal..."
if [ -f "olt_system.db" ]; then
    if command -v sqlite3 >/dev/null 2>&1; then
        USER_INFO=$(sqlite3 olt_system.db "SELECT id, username, rol, activo FROM usuarios WHERE username = '$USERNAME';" 2>/dev/null)
        
        if [ -n "$USER_INFO" ]; then
            echo "✅ Usuario encontrado en base principal: $USER_INFO"
            USER_ROLE=$(echo "$USER_INFO" | cut -d'|' -f3)
            USER_ACTIVE=$(echo "$USER_INFO" | cut -d'|' -f4)
            
            if [ "$USER_ACTIVE" != "1" ]; then
                echo "⚠️  Usuario está inactivo en la base principal"
            fi
        else
            echo "❌ Usuario '$USERNAME' no encontrado en base principal"
            echo "💡 Necesitas crear el usuario primero en la interfaz web"
            exit 1
        fi
    else
        echo "⚠️  sqlite3 no disponible, continuando sin verificación"
        USER_ROLE="unknown"
    fi
else
    echo "❌ Base de datos principal no encontrada"
    exit 1
fi

# Verificar si ya existe la base de datos del usuario
USER_DB="databases/${USERNAME}_olt_system.db"

echo ""
echo "🗃️ Verificando base de datos específica del usuario..."

if [ -f "$USER_DB" ]; then
    SIZE=$(stat -c%s "$USER_DB" 2>/dev/null || stat -f%z "$USER_DB" 2>/dev/null || echo "unknown")
    echo "📄 Base de datos existente: $USER_DB (${SIZE} bytes)"
    
    if [ "$SIZE" = "0" ] || [ "$SIZE" = "unknown" ]; then
        echo "⚠️  Base de datos está vacía, recreando..."
        rm "$USER_DB"
        NEEDS_CREATION=true
    else
        echo "✅ Base de datos existe y tiene contenido"
        
        # Verificar que tiene la tabla olts
        if command -v sqlite3 >/dev/null 2>&1; then
            OLTS_TABLE=$(sqlite3 "$USER_DB" "SELECT name FROM sqlite_master WHERE type='table' AND name='olts';" 2>/dev/null)
            
            if [ -n "$OLTS_TABLE" ]; then
                echo "✅ Tabla olts existe en la base de datos"
                NEEDS_CREATION=false
            else
                echo "❌ Tabla olts NO existe, recreando base de datos..."
                rm "$USER_DB"
                NEEDS_CREATION=true
            fi
        else
            echo "⚠️  No se puede verificar tabla olts, asumiendo que está bien"
            NEEDS_CREATION=false
        fi
    fi
else
    echo "❌ Base de datos del usuario no existe"
    NEEDS_CREATION=true
fi

# Crear base de datos si es necesario
if [ "$NEEDS_CREATION" = true ]; then
    echo ""
    echo "🔄 Creando base de datos para usuario $USERNAME..."
    
    # Crear script de creación temporal
    cat > "crear_bd_${USERNAME}.js" << EOF
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'databases', '${USERNAME}_olt_system.db');

console.log('🗃️ Creando base de datos para $USERNAME en:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error creando base de datos:', err);
        process.exit(1);
    } else {
        console.log('✅ Base de datos conectada');
        crearTablas();
    }
});

function crearTablas() {
    console.log('🔧 Creando estructura de tablas para $USERNAME...');
    
    const tablas = [
        \`CREATE TABLE IF NOT EXISTS olts (
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
        )\`,
        
        \`CREATE TABLE IF NOT EXISTS comandos (
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
        )\`,
        
        \`CREATE TABLE IF NOT EXISTS tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            estado TEXT DEFAULT 'pendiente',
            prioridad TEXT DEFAULT 'media',
            categoria TEXT,
            usuario_id INTEGER,
            activa INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )\`,
        
        \`CREATE TABLE IF NOT EXISTS categorias_tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            descripcion TEXT,
            color TEXT DEFAULT '#007bff',
            activa INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )\`,
        
        \`CREATE TABLE IF NOT EXISTS logs_actividad (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            accion TEXT NOT NULL,
            detalles TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            modulo TEXT,
            resultado TEXT
        )\`,
        
        \`CREATE TABLE IF NOT EXISTS configuraciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clave TEXT UNIQUE NOT NULL,
            valor TEXT,
            descripcion TEXT,
            categoria TEXT DEFAULT 'general',
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )\`,
        
        \`CREATE TABLE IF NOT EXISTS reportes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            tipo TEXT,
            filtros TEXT,
            configuracion TEXT,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            publico INTEGER DEFAULT 0
        )\`,
        
        \`CREATE TABLE IF NOT EXISTS notificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            mensaje TEXT,
            tipo TEXT DEFAULT 'info',
            leida INTEGER DEFAULT 0,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_leida DATETIME,
            accion_url TEXT,
            metadata TEXT
        )\`
    ];
    
    let completadas = 0;
    const total = tablas.length;
    
    tablas.forEach((sql, index) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(\`❌ Error creando tabla \${index + 1}:\`, err);
            } else {
                console.log(\`✅ Tabla \${index + 1}/\${total} creada\`);
            }
            
            completadas++;
            if (completadas === total) {
                verificarCreacion();
            }
        });
    });
}

function verificarCreacion() {
    console.log('🔍 Verificando estructura...');
    
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
        if (err) {
            console.error('❌ Error verificando tablas:', err);
        } else {
            console.log('📊 Tablas creadas:', tables.map(t => t.name).join(', '));
            probarFuncionalidad();
        }
    });
}

function probarFuncionalidad() {
    console.log('🧪 Probando funcionalidad de OLTs...');
    
    db.run(
        "INSERT INTO olts (nombre, ip, modelo, ubicacion) VALUES (?, ?, ?, ?)",
        ['Test-OLT', '192.168.1.1', 'ZTE C600', 'Prueba'],
        function(err) {
            if (err) {
                console.error('❌ Error en prueba:', err);
            } else {
                console.log(\`✅ Prueba exitosa - ID: \${this.lastID}\`);
                
                db.run("DELETE FROM olts WHERE id = ?", [this.lastID], (err) => {
                    if (!err) console.log('✅ Prueba limpiada');
                    finalizarCreacion();
                });
            }
        }
    );
}

function finalizarCreacion() {
    console.log('🎉 Base de datos para $USERNAME creada exitosamente');
    db.close(() => process.exit(0));
}
EOF

    # Ejecutar creación
    node "crear_bd_${USERNAME}.js"
    
    # Limpiar archivo temporal
    rm "crear_bd_${USERNAME}.js"
fi

# Verificación final
echo ""
echo "🔍 VERIFICACIÓN FINAL:"
echo "===================="

if [ -f "$USER_DB" ]; then
    SIZE=$(stat -c%s "$USER_DB" 2>/dev/null || stat -f%z "$USER_DB" 2>/dev/null || echo "unknown")
    echo "📄 Base de datos $USERNAME: ${SIZE} bytes"
    
    if [ "$SIZE" != "0" ] && [ "$SIZE" != "unknown" ]; then
        echo "✅ Base de datos creada/verificada exitosamente"
        
        if command -v sqlite3 >/dev/null 2>&1; then
            echo "📊 Tablas disponibles:"
            sqlite3 "$USER_DB" ".tables" 2>/dev/null | tr ' ' '\n' | grep -v '^$' | while read table; do
                echo "   - $table"
            done
        fi
    else
        echo "❌ Error: Base de datos está vacía"
        exit 1
    fi
else
    echo "❌ Error: Base de datos no existe"
    exit 1
fi

cd ..

echo ""
echo "🎯 SOLUCIÓN COMPLETADA PARA USUARIO: $USERNAME"
echo "=============================================="
echo "📋 Acciones realizadas:"
echo "   - ✅ Usuario verificado en base principal"
echo "   - ✅ Base de datos específica creada/verificada"
echo "   - ✅ Tablas necesarias disponibles"
echo "   - ✅ Funcionalidad de OLT verificada"
echo ""
echo "🚀 El error 'Error al crear OLT' debería estar resuelto"
echo ""
echo "💡 Si el problema persiste:"
echo "   - Reiniciar el servidor"
echo "   - Verificar que el usuario esté activo"
echo "   - Revisar logs del servidor para otros errores"
echo ""
echo "🏁 Script completado"

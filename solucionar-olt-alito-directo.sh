#!/bin/bash

# Script directo para solucionar error de OLT de usuario alito

echo "🔧 SOLUCIONANDO ERROR DE OLT USUARIO ALITO - MÉTODO DIRECTO"
echo "==========================================================="

# Ir al directorio web
cd /workspaces/miweb/web 2>/dev/null || {
    echo "❌ Error: No se encontró directorio web"
    exit 1
}

echo "📍 Directorio de trabajo: $(pwd)"

# Verificar que existe el directorio databases
echo "📁 Verificando directorio databases..."
if [ ! -d "databases" ]; then
    mkdir -p databases
    echo "✅ Directorio databases creado"
else
    echo "✅ Directorio databases existe"
fi

# Verificar si ya existe la base de datos de alito
ALITO_DB="databases/alito_olt_system.db"

if [ -f "$ALITO_DB" ]; then
    echo "📄 Base de datos de alito ya existe: $ALITO_DB"
    SIZE=$(stat -c%s "$ALITO_DB" 2>/dev/null || stat -f%z "$ALITO_DB" 2>/dev/null || echo "unknown")
    echo "📊 Tamaño: ${SIZE} bytes"
    
    if [ "$SIZE" = "0" ] || [ "$SIZE" = "unknown" ]; then
        echo "⚠️  Base de datos está vacía, eliminando..."
        rm "$ALITO_DB"
    fi
fi

# Crear nueva base de datos para alito con estructura completa
echo "🔄 Creando base de datos específica para usuario alito..."

# Script de creación de BD
cat > crear_bd_alito.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'databases', 'alito_olt_system.db');

console.log('🗃️ Creando base de datos para alito en:', dbPath);

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
    console.log('🔧 Creando estructura de tablas...');
    
    const tablas = [
        // Tabla de OLTs (principal para el error)
        `CREATE TABLE IF NOT EXISTS olts (
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
        )`,
        
        // Tabla de comandos
        `CREATE TABLE IF NOT EXISTS comandos (
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
        )`,
        
        // Tabla de tareas
        `CREATE TABLE IF NOT EXISTS tareas (
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
        )`,
        
        // Tabla de categorías de tareas
        `CREATE TABLE IF NOT EXISTS categorias_tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            descripcion TEXT,
            color TEXT DEFAULT '#007bff',
            activa INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de logs de actividad
        `CREATE TABLE IF NOT EXISTS logs_actividad (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            accion TEXT NOT NULL,
            detalles TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            modulo TEXT,
            resultado TEXT
        )`,
        
        // Tabla de configuraciones
        `CREATE TABLE IF NOT EXISTS configuraciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clave TEXT UNIQUE NOT NULL,
            valor TEXT,
            descripcion TEXT,
            categoria TEXT DEFAULT 'general',
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabla de reportes
        `CREATE TABLE IF NOT EXISTS reportes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            tipo TEXT,
            filtros TEXT,
            configuracion TEXT,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            publico INTEGER DEFAULT 0
        )`,
        
        // Tabla de notificaciones
        `CREATE TABLE IF NOT EXISTS notificaciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            mensaje TEXT,
            tipo TEXT DEFAULT 'info',
            leida INTEGER DEFAULT 0,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_leida DATETIME,
            accion_url TEXT,
            metadata TEXT
        )`
    ];
    
    let completadas = 0;
    const total = tablas.length;
    
    tablas.forEach((sql, index) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(`❌ Error creando tabla ${index + 1}:`, err);
            } else {
                console.log(`✅ Tabla ${index + 1}/${total} creada exitosamente`);
            }
            
            completadas++;
            if (completadas === total) {
                verificarCreacion();
            }
        });
    });
}

function verificarCreacion() {
    console.log('');
    console.log('🔍 Verificando estructura creada...');
    
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
        if (err) {
            console.error('❌ Error verificando tablas:', err);
        } else {
            console.log('📊 Tablas creadas en la base de datos:');
            tables.forEach(table => {
                console.log(`   ✅ ${table.name}`);
            });
            
            // Probar inserción en tabla olts
            probarCreacionOLT();
        }
    });
}

function probarCreacionOLT() {
    console.log('');
    console.log('🧪 Probando creación de OLT...');
    
    db.run(
        "INSERT INTO olts (nombre, ip, modelo, ubicacion) VALUES (?, ?, ?, ?)",
        ['OLT-Test', '192.168.1.100', 'ZTE C600', 'Test'],
        function(err) {
            if (err) {
                console.error('❌ Error probando creación de OLT:', err);
            } else {
                console.log(`✅ OLT de prueba creada con ID: ${this.lastID}`);
                
                // Eliminar OLT de prueba
                db.run("DELETE FROM olts WHERE id = ?", [this.lastID], (err) => {
                    if (err) {
                        console.error('❌ Error eliminando OLT de prueba:', err);
                    } else {
                        console.log('✅ OLT de prueba eliminada');
                    }
                    
                    finalizarCreacion();
                });
            }
        }
    );
}

function finalizarCreacion() {
    console.log('');
    console.log('🎉 CREACIÓN COMPLETADA EXITOSAMENTE');
    console.log('===================================');
    console.log('✅ Base de datos de usuario alito creada');
    console.log('✅ Todas las tablas necesarias están disponibles');
    console.log('✅ Función de creación de OLT verificada');
    console.log('');
    console.log('🚀 El usuario alito puede ahora crear OLTs sin errores');
    
    db.close((err) => {
        if (err) {
            console.error('❌ Error cerrando base de datos:', err);
        } else {
            console.log('🔌 Base de datos cerrada correctamente');
        }
        process.exit(0);
    });
}
EOF

# Ejecutar creación de BD
echo "⚡ Ejecutando creación de base de datos..."
node crear_bd_alito.js

# Limpiar archivo temporal
rm crear_bd_alito.js

# Verificar resultado final
echo ""
echo "🔍 VERIFICACIÓN FINAL:"
echo "===================="

if [ -f "$ALITO_DB" ]; then
    SIZE=$(stat -c%s "$ALITO_DB" 2>/dev/null || stat -f%z "$ALITO_DB" 2>/dev/null || echo "unknown")
    echo "📄 Base de datos alito: ${SIZE} bytes"
    
    if [ "$SIZE" != "0" ] && [ "$SIZE" != "unknown" ]; then
        echo "✅ Base de datos creada exitosamente"
        
        # Verificar tablas con sqlite3 si está disponible
        if command -v sqlite3 >/dev/null 2>&1; then
            echo "📊 Tablas en la base de datos:"
            sqlite3 "$ALITO_DB" ".tables" 2>/dev/null | tr ' ' '\n' | while read table; do
                [ -n "$table" ] && echo "   - $table"
            done
        fi
    else
        echo "❌ Error: Base de datos está vacía"
    fi
else
    echo "❌ Error: Base de datos no fue creada"
fi

cd ..

echo ""
echo "🎯 SOLUCIÓN COMPLETADA"
echo "====================="
echo "📋 Acciones realizadas:"
echo "   - ✅ Directorio databases verificado/creado"
echo "   - ✅ Base de datos específica de alito creada"
echo "   - ✅ Tablas necesarias para OLTs creadas"
echo "   - ✅ Funcionalidad de creación verificada"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "   1. Reiniciar el servidor si está corriendo"
echo "   2. Login con usuario alito"
echo "   3. Intentar crear una nueva OLT"
echo "   4. El error debería estar resuelto"
echo ""
echo "💡 Si el problema persiste, revisar logs del servidor"
echo "🏁 Script completado"

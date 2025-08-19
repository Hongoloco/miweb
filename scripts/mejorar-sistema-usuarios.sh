#!/bin/bash

# 🔧 MEJORADOR DE SISTEMA DE BASES DE DATOS POR USUARIO
# Optimiza el sistema de BD individual para cada usuario

echo "🔧 MEJORANDO SISTEMA DE BASES DE DATOS POR USUARIO..."
echo "===================================================="

# Cambiar al directorio web
cd web 2>/dev/null || cd /root/miweb/web || { echo "❌ No se encuentra directorio web"; exit 1; }

echo ""
echo "🔍 ANALIZANDO SISTEMA ACTUAL..."

# Verificar directorio de bases de datos
if [ ! -d "databases" ]; then
    echo "📁 Creando directorio de bases de datos..."
    mkdir -p databases
else
    echo "✅ Directorio databases encontrado"
fi

# Contar bases de datos de usuarios
USER_DBS=$(find databases -name "*_olt_system.db" 2>/dev/null | wc -l)
echo "📊 Bases de datos de usuarios encontradas: $USER_DBS"

# Verificar gestión de bases de datos
if [ ! -f "user-database-manager.js" ]; then
    echo "❌ Gestor de BD no encontrado"
else
    echo "✅ Gestor de BD encontrado"
fi

echo ""
echo "🛠️ APLICANDO MEJORAS..."

# MEJORA 1: Script de creación de usuario con BD limpia
echo ""
echo "1️⃣ Creando script de usuario con BD limpia..."

cat > crear-usuario-completo.js << 'EOF'
// SCRIPT PARA CREAR USUARIO CON BASE DE DATOS LIMPIA GARANTIZADA
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

async function crearUsuarioCompleto(username, password, rol = 'tecnico', email = '') {
    console.log(`\n🆕 CREANDO USUARIO COMPLETO: ${username}`);
    console.log('=====================================');

    // 1. Crear usuario en BD principal
    const mainDbPath = path.join(__dirname, 'olt_system.db');
    const mainDb = new sqlite3.Database(mainDbPath);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
        // Insertar usuario en BD principal
        mainDb.run(
            `INSERT OR REPLACE INTO usuarios (username, password_hash, rol, email, activo, fecha_creacion) 
             VALUES (?, ?, ?, ?, 1, datetime('now'))`,
            [username, hashedPassword, rol, email || `${username}@antel.com.uy`],
            function(err) {
                if (err) {
                    console.error('❌ Error creando usuario:', err);
                    reject(err);
                    return;
                }
                
                console.log(`✅ Usuario ${username} creado en BD principal (ID: ${this.lastID})`);
                
                // 2. Crear BD individual si es técnico
                if (rol === 'tecnico' || rol !== 'admin') {
                    crearBaseDatosLimpia(username)
                        .then(() => {
                            mainDb.close();
                            resolve(this.lastID);
                        })
                        .catch(reject);
                } else {
                    console.log('👑 Usuario admin - usará BD principal');
                    mainDb.close();
                    resolve(this.lastID);
                }
            }
        );
    });
}

async function crearBaseDatosLimpia(username) {
    console.log(`\n📊 Creando BD LIMPIA para: ${username}`);
    
    const userDbPath = path.join(__dirname, 'databases', `${username}_olt_system.db`);
    
    // Eliminar BD anterior si existe
    if (fs.existsSync(userDbPath)) {
        console.log('🗑️ Eliminando BD anterior...');
        fs.unlinkSync(userDbPath);
    }
    
    // Crear nueva BD limpia
    const userDb = new sqlite3.Database(userDbPath);
    
    return new Promise((resolve, reject) => {
        console.log('🔧 Creando esquema limpio...');
        
        const esquema = [
            // Tabla de categorías (sincronizada con principal)
            `CREATE TABLE categorias_tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                color TEXT,
                icono TEXT,
                activa INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Tabla de tareas (limpia)
            `CREATE TABLE tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                estado TEXT DEFAULT 'pendiente',
                prioridad TEXT DEFAULT 'media',
                categoria TEXT,
                activa INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Tabla de OLTs (limpia)
            `CREATE TABLE olts (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                shelf INTEGER DEFAULT 1,
                slot INTEGER DEFAULT 13,
                port INTEGER DEFAULT 4,
                onu_id INTEGER DEFAULT 38,
                modelo TEXT DEFAULT 'ZTE C600',
                estado TEXT DEFAULT 'activo',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario_propietario TEXT DEFAULT '${username}'
            )`,
            
            // Tabla de comandos (limpia)
            `CREATE TABLE comandos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                olt_id TEXT,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                comandos_json TEXT,
                categoria TEXT DEFAULT 'general',
                orden INTEGER DEFAULT 1,
                activo INTEGER DEFAULT 1,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario_propietario TEXT DEFAULT '${username}',
                FOREIGN KEY (olt_id) REFERENCES olts(id)
            )`,
            
            // Tabla de logs (limpia)
            `CREATE TABLE logs_actividad (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT DEFAULT '${username}',
                accion TEXT NOT NULL,
                detalles TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                modulo TEXT
            )`,
            
            // Tabla de configuraciones (limpia)
            `CREATE TABLE configuraciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT,
                descripcion TEXT,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        let creadas = 0;
        const total = esquema.length;
        
        esquema.forEach((sql, index) => {
            userDb.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Error creando tabla ${index + 1}:`, err);
                } else {
                    creadas++;
                    console.log(`✅ Tabla ${creadas}/${total} creada`);
                }
                
                if (creadas === total) {
                    // Insertar datos por defecto
                    insertarDatosPorDefecto(userDb, username)
                        .then(() => {
                            userDb.close();
                            resolve();
                        })
                        .catch(reject);
                }
            });
        });
    });
}

async function insertarDatosPorDefecto(db, username) {
    console.log(`📋 Insertando datos por defecto para: ${username}`);
    
    return new Promise((resolve) => {
        db.run('BEGIN TRANSACTION');
        
        // Categorías básicas
        const categorias = [
            ['OLT', '#ff6b6b', '📡'],
            ['IMS', '#4ecdc4', '📞'], 
            ['ACS', '#45b7d1', '⚙️'],
            ['Mantenimiento', '#f9ca24', '🔧'],
            ['Soporte', '#6c5ce7', '🎧'],
            ['General', '#007bff', '📋']
        ];
        
        categorias.forEach(([nombre, color, icono]) => {
            db.run(
                'INSERT INTO categorias_tareas (nombre, color, icono) VALUES (?, ?, ?)',
                [nombre, color, icono]
            );
        });
        
        // Configuraciones básicas
        const configuraciones = [
            ['usuario_propietario', username, 'Propietario de esta BD'],
            ['bd_inicializada', 'true', 'BD inicializada correctamente'],
            ['fecha_creacion', new Date().toISOString(), 'Fecha de creación'],
            ['version_esquema', '3.1.0', 'Versión del esquema'],
            ['interfaz_limpia', 'true', 'Interfaz debe estar limpia'],
            ['primer_acceso', 'true', 'Primer acceso del usuario']
        ];
        
        configuraciones.forEach(([clave, valor, descripcion]) => {
            db.run(
                'INSERT INTO configuraciones (clave, valor, descripcion) VALUES (?, ?, ?)',
                [clave, valor, descripcion]
            );
        });
        
        db.run('COMMIT', () => {
            console.log(`✅ BD LIMPIA creada exitosamente para: ${username}`);
            resolve();
        });
    });
}

// Función de uso directo
async function main() {
    if (process.argv.length < 4) {
        console.log('Uso: node crear-usuario-completo.js <username> <password> [rol] [email]');
        console.log('Ejemplo: node crear-usuario-completo.js juan 123456 tecnico juan@antel.com.uy');
        process.exit(1);
    }
    
    const [,, username, password, rol, email] = process.argv;
    
    try {
        const userId = await crearUsuarioCompleto(username, password, rol || 'tecnico', email);
        console.log(`\n🎉 USUARIO CREADO EXITOSAMENTE`);
        console.log(`   Usuario: ${username}`);
        console.log(`   ID: ${userId}`);
        console.log(`   Rol: ${rol || 'tecnico'}`);
        console.log(`   BD privada: ${rol !== 'admin' ? '✅ Creada' : '❌ Usa BD principal'}`);
        console.log(`\n💡 El usuario ${username} tendrá una interfaz COMPLETAMENTE LIMPIA`);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { crearUsuarioCompleto, crearBaseDatosLimpia };
EOF

echo "✅ Script de creación de usuario completo creado"

# MEJORA 2: Script de verificación de aislamiento
echo ""
echo "2️⃣ Creando script de verificación de aislamiento..."

cat > verificar-aislamiento.js << 'EOF'
// VERIFICADOR DE AISLAMIENTO DE DATOS POR USUARIO
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function verificarAislamiento() {
    console.log('\n🔍 VERIFICANDO AISLAMIENTO DE DATOS POR USUARIO');
    console.log('===============================================');
    
    // 1. Verificar BD principal
    const mainDbPath = path.join(__dirname, 'olt_system.db');
    if (!fs.existsSync(mainDbPath)) {
        console.log('❌ BD principal no encontrada');
        return;
    }
    
    const mainDb = new sqlite3.Database(mainDbPath);
    
    // Obtener todos los usuarios
    return new Promise((resolve) => {
        mainDb.all('SELECT username, rol FROM usuarios ORDER BY rol, username', (err, usuarios) => {
            if (err) {
                console.error('❌ Error obteniendo usuarios:', err);
                resolve();
                return;
            }
            
            console.log(`\n👥 USUARIOS ENCONTRADOS: ${usuarios.length}`);
            
            usuarios.forEach(async (usuario, index) => {
                await verificarUsuario(usuario, index === usuarios.length - 1);
            });
            
            mainDb.close();
        });
    });
}

async function verificarUsuario(usuario, esUltimo) {
    console.log(`\n📊 Usuario: ${usuario.username} (${usuario.rol})`);
    
    if (usuario.rol === 'admin') {
        console.log('   👑 Administrador - usa BD principal');
        console.log('   ✅ Acceso: BD principal con todos los datos');
        if (esUltimo) {
            console.log('\n✅ VERIFICACIÓN COMPLETADA');
        }
        return;
    }
    
    // Verificar BD del usuario técnico
    const userDbPath = path.join(__dirname, 'databases', `${usuario.username}_olt_system.db`);
    
    if (!fs.existsSync(userDbPath)) {
        console.log('   ❌ BD privada no existe - se creará en el primer login');
        if (esUltimo) {
            console.log('\n✅ VERIFICACIÓN COMPLETADA');
        }
        return;
    }
    
    const userDb = new sqlite3.Database(userDbPath);
    
    return new Promise((resolve) => {
        // Verificar contenido de la BD del usuario
        const consultas = [
            'SELECT COUNT(*) as total FROM olts',
            'SELECT COUNT(*) as total FROM comandos',
            'SELECT COUNT(*) as total FROM tareas',
            'SELECT COUNT(*) as total FROM categorias_tareas'
        ];
        
        let resultados = {};
        let consultasCompletadas = 0;
        
        consultas.forEach((sql, index) => {
            userDb.get(sql, (err, result) => {
                if (!err && result) {
                    const tabla = sql.split('FROM ')[1];
                    resultados[tabla] = result.total;
                }
                
                consultasCompletadas++;
                if (consultasCompletadas === consultas.length) {
                    console.log('   ✅ BD privada encontrada');
                    console.log(`   📡 OLTs: ${resultados.olts || 0}`);
                    console.log(`   🔧 Comandos: ${resultados.comandos || 0}`);
                    console.log(`   📋 Tareas: ${resultados.tareas || 0}`);
                    console.log(`   📂 Categorías: ${resultados.categorias_tareas || 0}`);
                    
                    // Verificar si está limpia (sin OLTs ajenas)
                    if ((resultados.olts || 0) === 0) {
                        console.log('   🎯 Estado: INTERFAZ LIMPIA ✅');
                    } else {
                        console.log('   ⚠️ Estado: Tiene datos (puede no estar limpia)');
                    }
                    
                    userDb.close();
                    if (esUltimo) {
                        console.log('\n✅ VERIFICACIÓN COMPLETADA');
                    }
                    resolve();
                }
            });
        });
    });
}

if (require.main === module) {
    verificarAislamiento();
}

module.exports = { verificarAislamiento };
EOF

echo "✅ Script de verificación de aislamiento creado"

# MEJORA 3: Script de limpieza de usuario
echo ""
echo "3️⃣ Creando script de limpieza de usuario..."

cat > limpiar-usuario.js << 'EOF'
// LIMPIADOR DE BASE DE DATOS DE USUARIO - GARANTIZA INTERFAZ LIMPIA
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function limpiarUsuario(username) {
    console.log(`\n🧹 LIMPIANDO BD DE USUARIO: ${username}`);
    console.log('=======================================');
    
    const userDbPath = path.join(__dirname, 'databases', `${username}_olt_system.db`);
    
    if (!fs.existsSync(userDbPath)) {
        console.log('❌ BD del usuario no encontrada');
        return false;
    }
    
    const userDb = new sqlite3.Database(userDbPath);
    
    return new Promise((resolve) => {
        console.log('🗑️ Eliminando datos existentes...');
        
        const limpiezaSQL = [
            'DELETE FROM comandos',
            'DELETE FROM olts', 
            'DELETE FROM tareas WHERE id > 0',  // Mantener estructura
            'DELETE FROM logs_actividad',
            'UPDATE configuraciones SET valor = "true" WHERE clave = "interfaz_limpia"',
            'UPDATE configuraciones SET valor = datetime("now") WHERE clave = "fecha_limpieza"',
            'INSERT OR REPLACE INTO configuraciones (clave, valor, descripcion) VALUES ("ultima_limpieza", datetime("now"), "Última limpieza de interfaz")'
        ];
        
        userDb.run('BEGIN TRANSACTION');
        
        let operacionesCompletadas = 0;
        limpiezaSQL.forEach((sql, index) => {
            userDb.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Error en operación ${index + 1}:`, err);
                } else {
                    console.log(`✅ Operación ${index + 1}/${limpiezaSQL.length} completada`);
                }
                
                operacionesCompletadas++;
                if (operacionesCompletadas === limpiezaSQL.length) {
                    userDb.run('COMMIT', () => {
                        console.log(`✅ BD de ${username} COMPLETAMENTE LIMPIA`);
                        console.log('🎯 El usuario tendrá una interfaz VACÍA y LIMPIA');
                        userDb.close();
                        resolve(true);
                    });
                }
            });
        });
    });
}

async function main() {
    if (process.argv.length < 3) {
        console.log('Uso: node limpiar-usuario.js <username>');
        console.log('Ejemplo: node limpiar-usuario.js juan');
        process.exit(1);
    }
    
    const username = process.argv[2];
    
    try {
        const resultado = await limpiarUsuario(username);
        if (resultado) {
            console.log(`\n🎉 LIMPIEZA COMPLETADA PARA: ${username}`);
            console.log('💡 El usuario ahora tendrá una interfaz completamente limpia');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { limpiarUsuario };
EOF

echo "✅ Script de limpieza de usuario creado"

# MEJORA 4: Verificar y actualizar gestor de BD
echo ""
echo "4️⃣ Verificando gestor de bases de datos..."

if [ -f "user-database-manager.js" ]; then
    echo "✅ Gestor existente encontrado"
    
    # Hacer backup del gestor actual
    cp user-database-manager.js user-database-manager.js.backup
    echo "📦 Backup del gestor creado"
else
    echo "❌ Gestor no encontrado - se necesita crear"
fi

echo ""
echo "🔍 VERIFICACIÓN FINAL..."

# Verificar permisos de scripts
chmod +x crear-usuario-completo.js limpiar-usuario.js verificar-aislamiento.js 2>/dev/null

# Verificar directorio databases
DATABASES_COUNT=$(find databases -name "*.db" 2>/dev/null | wc -l)
echo "📊 Bases de datos en directorio databases: $DATABASES_COUNT"

# Verificar usuarios en BD principal
if [ -f "olt_system.db" ]; then
    USUARIOS_TOTAL=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM usuarios;" 2>/dev/null || echo "0")
    USUARIOS_TECNICOS=$(sqlite3 olt_system.db "SELECT COUNT(*) FROM usuarios WHERE rol != 'admin';" 2>/dev/null || echo "0")
    echo "👥 Usuarios totales en BD principal: $USUARIOS_TOTAL"
    echo "🔧 Usuarios técnicos: $USUARIOS_TECNICOS"
else
    echo "⚠️ BD principal no encontrada"
fi

echo ""
echo "✅ MEJORAS APLICADAS AL SISTEMA DE BD POR USUARIO"
echo ""
echo "🛠️ NUEVAS HERRAMIENTAS DISPONIBLES:"
echo "   1. crear-usuario-completo.js - Crea usuario con BD limpia garantizada"
echo "   2. verificar-aislamiento.js - Verifica aislamiento de datos"
echo "   3. limpiar-usuario.js - Limpia completamente la BD de un usuario"
echo ""
echo "💡 COMANDOS DE USO:"
echo "   node crear-usuario-completo.js juan 123456 tecnico"
echo "   node verificar-aislamiento.js"
echo "   node limpiar-usuario.js juan"
echo ""
echo "🎯 BENEFICIOS:"
echo "   ✅ Cada usuario nuevo tiene interfaz COMPLETAMENTE LIMPIA"
echo "   ✅ Sin datos de otros usuarios"
echo "   ✅ Sin OLTs o comandos preexistentes"
echo "   ✅ Aislamiento total de datos"
echo "   ✅ Fácil creación de nuevos usuarios"

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

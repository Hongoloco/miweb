#!/usr/bin/env node

/**
 * Script de diagnóstico completo para problemas de base de datos
 * Identifica por qué no aparecen los comandos de alito
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 DIAGNÓSTICO COMPLETO - BASE DE DATOS ALITO');
console.log('='.repeat(50));

async function diagnosticar() {
    console.log('\n📁 1. VERIFICANDO ARCHIVOS...');
    
    // Verificar archivos principales
    const archivos = [
        './olt_system.db',
        './databases/',
        './databases/alito_olt_system.db',
        './server.js'
    ];
    
    archivos.forEach(archivo => {
        if (fs.existsSync(archivo)) {
            const stats = fs.statSync(archivo);
            if (stats.isDirectory()) {
                console.log(`✅ ${archivo} (directorio)`);
            } else {
                console.log(`✅ ${archivo} (${(stats.size / 1024).toFixed(1)} KB)`);
            }
        } else {
            console.log(`❌ ${archivo} - NO EXISTE`);
        }
    });
    
    console.log('\n👥 2. VERIFICANDO USUARIOS...');
    await verificarUsuarios();
    
    console.log('\n🏢 3. VERIFICANDO OLTS...');
    await verificarOLTs();
    
    console.log('\n📋 4. VERIFICANDO COMANDOS...');
    await verificarComandos();
    
    console.log('\n🔧 5. VERIFICANDO ESTRUCTURA...');
    await verificarEstructura();
    
    console.log('\n💡 6. RECOMENDACIONES...');
    generarRecomendaciones();
}

function verificarUsuarios() {
    return new Promise((resolve) => {
        const db = new sqlite3.Database('./olt_system.db');
        
        db.all("SELECT id, username, rol FROM usuarios WHERE username = 'alito'", (err, users) => {
            if (err) {
                console.log(`❌ Error consultando usuarios: ${err.message}`);
                db.close();
                resolve();
                return;
            }
            
            if (users.length === 0) {
                console.log('❌ Usuario alito NO EXISTE en base principal');
            } else {
                const user = users[0];
                console.log(`✅ Usuario alito existe: ID=${user.id}, rol=${user.rol}`);
                global.alitoId = user.id;
            }
            
            db.close();
            resolve();
        });
    });
}

function verificarOLTs() {
    return new Promise((resolve) => {
        // Verificar OLTs en base principal
        console.log('\n  📊 Base de datos principal:');
        const dbPrincipal = new sqlite3.Database('./olt_system.db');
        
        dbPrincipal.all("SELECT id, nombre FROM olts WHERE activo = 1", (err, olts) => {
            if (err) {
                console.log(`    ❌ Error: ${err.message}`);
            } else {
                console.log(`    📈 OLTs encontradas: ${olts.length}`);
                olts.forEach(olt => {
                    console.log(`      - ${olt.id}: ${olt.nombre}`);
                });
            }
            
            dbPrincipal.close();
            
            // Verificar OLTs en base privada de alito
            if (fs.existsSync('./databases/alito_olt_system.db')) {
                console.log('\n  📊 Base de datos privada de alito:');
                const dbAlito = new sqlite3.Database('./databases/alito_olt_system.db');
                
                dbAlito.all("SELECT id, nombre FROM olts WHERE activo = 1", (err, olts) => {
                    if (err) {
                        console.log(`    ❌ Error: ${err.message}`);
                    } else {
                        console.log(`    📈 OLTs encontradas: ${olts.length}`);
                        olts.forEach(olt => {
                            console.log(`      - ${olt.id}: ${olt.nombre}`);
                        });
                    }
                    
                    dbAlito.close();
                    resolve();
                });
            } else {
                console.log('\n  ❌ Base de datos privada de alito NO EXISTE');
                resolve();
            }
        });
    });
}

function verificarComandos() {
    return new Promise((resolve) => {
        if (!fs.existsSync('./databases/alito_olt_system.db')) {
            console.log('❌ No hay base privada de alito para verificar comandos');
            resolve();
            return;
        }
        
        const db = new sqlite3.Database('./databases/alito_olt_system.db');
        
        // Verificar estructura de tabla comandos
        db.all("PRAGMA table_info(comandos)", (err, columns) => {
            if (err) {
                console.log(`❌ Error verificando estructura: ${err.message}`);
                db.close();
                resolve();
                return;
            }
            
            console.log('  🔧 Columnas en tabla comandos:');
            columns.forEach(col => {
                console.log(`    - ${col.name} (${col.type})`);
            });
            
            // Verificar comandos
            db.all("SELECT COUNT(*) as total FROM comandos", (err, result) => {
                if (err) {
                    console.log(`❌ Error contando comandos: ${err.message}`);
                } else {
                    console.log(`  📋 Total comandos: ${result[0].total}`);
                }
                
                // Verificar comandos por OLT
                db.all("SELECT olt_id, COUNT(*) as cantidad FROM comandos GROUP BY olt_id", (err, grupos) => {
                    if (err) {
                        console.log(`❌ Error agrupando comandos: ${err.message}`);
                    } else {
                        console.log('  📊 Comandos por OLT:');
                        grupos.forEach(grupo => {
                            console.log(`    - OLT ${grupo.olt_id}: ${grupo.cantidad} comandos`);
                        });
                    }
                    
                    db.close();
                    resolve();
                });
            });
        });
    });
}

function verificarEstructura() {
    return new Promise((resolve) => {
        console.log('  🔍 Verificando que todas las tablas existan...');
        
        const tablas = ['usuarios', 'olts', 'comandos', 'categorias_tareas', 'tareas'];
        let verificadas = 0;
        
        const verificarTabla = (nombreTabla, dbPath) => {
            const db = new sqlite3.Database(dbPath);
            
            db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='${nombreTabla}'`, (err, result) => {
                if (err) {
                    console.log(`    ❌ Error verificando ${nombreTabla}: ${err.message}`);
                } else if (result.length === 0) {
                    console.log(`    ❌ Tabla ${nombreTabla} NO EXISTE en ${dbPath}`);
                } else {
                    console.log(`    ✅ Tabla ${nombreTabla} existe en ${dbPath}`);
                }
                
                verificadas++;
                if (verificadas === tablas.length * 2) { // Principal + privada
                    resolve();
                }
                
                db.close();
            });
        };
        
        // Verificar en base principal
        tablas.forEach(tabla => verificarTabla(tabla, './olt_system.db'));
        
        // Verificar en base privada si existe
        if (fs.existsSync('./databases/alito_olt_system.db')) {
            tablas.forEach(tabla => verificarTabla(tabla, './databases/alito_olt_system.db'));
        } else {
            verificadas += tablas.length; // Simular verificación completada
        }
    });
}

function generarRecomendaciones() {
    console.log('\n🔧 ACCIONES RECOMENDADAS:');
    
    if (!fs.existsSync('./databases/alito_olt_system.db')) {
        console.log('1. ❗ CRÍTICO: Base de datos privada de alito no existe');
        console.log('   💡 Ejecuta: node restaurar-alito-zte.js');
        console.log('');
    }
    
    console.log('2. 🔄 Verificar que el servidor esté usando la base correcta');
    console.log('   💡 Reinicia: bash reiniciar-servidor.sh');
    console.log('');
    
    console.log('3. 🧪 Probar login de alito directamente');
    console.log('   💡 curl -X POST http://localhost:3000/api/login \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{"username":"alito","password":"vinilo28"}\'');
    console.log('');
    
    console.log('4. 📊 Verificar OLTs disponibles para alito');
    console.log('   💡 curl -X GET http://localhost:3000/api/olts \\');
    console.log('        -b cookies.txt');
    console.log('');
    
    console.log('5. 🔧 Si nada funciona, restauración completa:');
    console.log('   💡 rm -rf databases/alito_olt_system.db');
    console.log('   💡 node restaurar-alito-zte.js');
    console.log('   💡 bash reiniciar-servidor.sh');
}

// Ejecutar diagnóstico
diagnosticar().catch(console.error);

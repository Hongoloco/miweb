// Script para verificar los comandos del usuario alito en la base de datos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 VERIFICANDO COMANDOS DEL USUARIO ALITO');
console.log('==========================================');

const dbPath = path.join(__dirname, 'olt_system.db');

// Verificar si existe la base de datos
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
    console.log('❌ ERROR: Base de datos no existe');
    console.log('   Ruta esperada:', dbPath);
    console.log('   💡 Ejecuta: node init-database.js');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

console.log('✅ Base de datos encontrada:', dbPath);
console.log('');

// Verificar usuario alito
db.get("SELECT * FROM usuarios WHERE username = 'alito'", (err, user) => {
    if (err) {
        console.error('❌ Error consultando usuario:', err);
        return;
    }
    
    if (!user) {
        console.log('❌ Usuario "alito" no encontrado en la base de datos');
        console.log('   💡 Ejecuta: node init-database.js para crear el usuario');
        db.close();
        return;
    }
    
    console.log('👤 USUARIO ALITO ENCONTRADO:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Nombre:', user.nombre_completo);
    console.log('   Rol:', user.rol);
    console.log('   Activo:', user.activo ? 'Sí' : 'No');
    console.log('');
    
    // Verificar OLTs disponibles
    db.all("SELECT * FROM olts", (err, olts) => {
        if (err) {
            console.error('❌ Error consultando OLTs:', err);
            return;
        }
        
        console.log('📡 OLTs EN LA BASE DE DATOS:');
        if (olts.length === 0) {
            console.log('   ⚠️ No hay OLTs registradas');
            console.log('   💡 Los comandos se asocian a OLTs específicas');
        } else {
            olts.forEach((olt, index) => {
                console.log(`   ${index + 1}. ${olt.nombre} (ID: ${olt.id})`);
                console.log(`      Modelo: ${olt.modelo}`);
                console.log(`      Shelf/Slot/Port: ${olt.shelf}/${olt.slot}/${olt.port}`);
                console.log(`      Estado: ${olt.estado}`);
                console.log('');
            });
        }
        
        // Verificar comandos para cada OLT
        if (olts.length > 0) {
            console.log('🔧 COMANDOS POR OLT:');
            
            let completedChecks = 0;
            olts.forEach((olt) => {
                db.all("SELECT * FROM comandos WHERE olt_id = ? ORDER BY orden ASC", [olt.id], (err, comandos) => {
                    if (err) {
                        console.error(`❌ Error consultando comandos para OLT ${olt.nombre}:`, err);
                        return;
                    }
                    
                    console.log(`\n📋 ${olt.nombre} (${comandos.length} comandos):`);
                    if (comandos.length === 0) {
                        console.log('   ⚠️ No hay comandos para esta OLT');
                    } else {
                        comandos.forEach((comando, index) => {
                            console.log(`   ${index + 1}. ${comando.nombre}`);
                            console.log(`      Descripción: ${comando.descripcion}`);
                            console.log(`      Categoría: ${comando.categoria}`);
                            console.log(`      Activo: ${comando.activo ? 'Sí' : 'No'}`);
                            
                            // Mostrar algunos comandos de ejemplo
                            try {
                                const comandosJson = JSON.parse(comando.comandos_json);
                                if (comandosJson.length > 0) {
                                    console.log(`      Primer comando: ${comandosJson[0]}`);
                                }
                            } catch (e) {
                                console.log('      ⚠️ Error parseando comandos JSON');
                            }
                            console.log('');
                        });
                    }
                    
                    completedChecks++;
                    if (completedChecks === olts.length) {
                        console.log('');
                        console.log('✅ Verificación completada');
                        console.log('');
                        console.log('💡 RESUMEN:');
                        console.log(`   - Usuario alito: ✅ Existe`);
                        console.log(`   - OLTs registradas: ${olts.length}`);
                        
                        let totalComandos = 0;
                        olts.forEach(olt => {
                            db.get("SELECT COUNT(*) as count FROM comandos WHERE olt_id = ?", [olt.id], (err, result) => {
                                if (!err && result) {
                                    totalComandos += result.count;
                                }
                            });
                        });
                        
                        setTimeout(() => {
                            console.log(`   - Total comandos: ${totalComandos}`);
                            console.log('');
                            console.log('🔧 ACCIONES RECOMENDADAS:');
                            if (olts.length === 0) {
                                console.log('   1. Ejecutar: node init-database.js (para restaurar OLT ZTE C600)');
                            }
                            if (totalComandos === 0) {
                                console.log('   2. Ejecutar: node restore-zte-commands.js (para restaurar comandos)');
                            }
                            console.log('   3. Verificar en la interfaz web: http://localhost:3000');
                            
                            db.close();
                        }, 500);
                    }
                });
            });
        } else {
            console.log('');
            console.log('💡 RECOMENDACIONES:');
            console.log('   1. Ejecutar: node init-database.js');
            console.log('   2. Verificar archivo: ../docs/ZTE C600-2025-07-22.json');
            console.log('   3. Iniciar servidor: npm start');
            
            db.close();
        }
    });
});

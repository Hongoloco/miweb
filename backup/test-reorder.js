// Script de prueba para funciones de reordenamiento
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

// Función de prueba para verificar el estado actual
function mostrarComandos() {
    return new Promise((resolve) => {
        db.all(`SELECT c.id, c.nombre, c.orden, o.nombre as olt_nombre 
                FROM comandos c 
                JOIN olts o ON c.olt_id = o.id 
                WHERE c.activo = 1 
                ORDER BY c.olt_id, c.orden`, (err, rows) => {
            if (err) {
                console.error('Error:', err);
                return resolve();
            }
            
            console.log('\n📋 Estado actual de comandos:');
            console.log('=====================================');
            
            let currentOlt = '';
            rows.forEach(cmd => {
                if (cmd.olt_nombre !== currentOlt) {
                    currentOlt = cmd.olt_nombre;
                    console.log(`\n🌐 OLT: ${currentOlt}`);
                    console.log('-----------------------------------');
                }
                console.log(`  ${cmd.orden}. ${cmd.nombre} (ID: ${cmd.id})`);
            });
            
            resolve();
        });
    });
}

// Función para asegurar que todos los comandos tengan orden secuencial
function reorganizarTodos() {
    return new Promise((resolve) => {
        db.all(`SELECT DISTINCT olt_id FROM comandos WHERE activo = 1`, (err, olts) => {
            if (err) {
                console.error('Error:', err);
                return resolve();
            }

            let promises = olts.map(olt => {
                return new Promise((resolveOlt) => {
                    db.all(`SELECT id FROM comandos WHERE olt_id = ? AND activo = 1 ORDER BY orden, nombre`, 
                           [olt.olt_id], (err, comandos) => {
                        if (err) {
                            console.error('Error:', err);
                            return resolveOlt();
                        }

                        let updates = comandos.map((cmd, index) => {
                            return new Promise((resolveUpdate) => {
                                db.run(`UPDATE comandos SET orden = ? WHERE id = ?`, 
                                       [index + 1, cmd.id], () => {
                                    resolveUpdate();
                                });
                            });
                        });

                        Promise.all(updates).then(() => {
                            console.log(`✅ Reorganizado OLT: ${olt.olt_id}`);
                            resolveOlt();
                        });
                    });
                });
            });

            Promise.all(promises).then(() => {
                console.log('🎯 Reorganización completada');
                resolve();
            });
        });
    });
}

// Ejecutar pruebas
async function main() {
    console.log('🚀 Iniciando pruebas de reordenamiento...');
    
    await mostrarComandos();
    
    console.log('\n🔄 Reorganizando órdenes...');
    await reorganizarTodos();
    
    await mostrarComandos();
    
    console.log('\n✅ Pruebas completadas');
    console.log('\n💡 Ahora puedes probar las funciones de reordenamiento en la web');
    
    db.close();
}

main().catch(console.error);

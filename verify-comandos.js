#!/usr/bin/env node

/**
 * Script para verificar los comandos importados en la base de datos
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(DB_PATH);

console.log('📊 Verificando comandos importados...\n');

// Consultar OLTs
db.all('SELECT * FROM olts', (err, olts) => {
    if (err) {
        console.error('❌ Error al consultar OLTs:', err);
        return;
    }
    
    console.log('🌐 OLTs en la base de datos:');
    olts.forEach(olt => {
        console.log(`   ID: ${olt.id}`);
        console.log(`   Nombre: ${olt.nombre}`);
        console.log(`   Parámetros: ${olt.shelf}/${olt.slot}/${olt.port}:${olt.onu_id}`);
        console.log(`   Modelo: ${olt.modelo}`);
        console.log(`   Estado: ${olt.estado}`);
        console.log('   ---');
    });

    // Consultar comandos
    db.all(`
        SELECT c.*, o.nombre as olt_nombre 
        FROM comandos c 
        JOIN olts o ON c.olt_id = o.id 
        ORDER BY c.categoria, c.orden
    `, (err, comandos) => {
        if (err) {
            console.error('❌ Error al consultar comandos:', err);
            return;
        }
        
        console.log(`\n📋 Comandos importados (${comandos.length} total):`);
        
        // Agrupar por categoría
        const categorias = {};
        comandos.forEach(cmd => {
            const cat = cmd.categoria || 'sin_categoria';
            if (!categorias[cat]) categorias[cat] = [];
            categorias[cat].push(cmd);
        });
        
        Object.keys(categorias).forEach(categoria => {
            console.log(`\n   📁 Categoría: ${categoria.toUpperCase()}`);
            categorias[categoria].forEach(cmd => {
                const comandosArray = JSON.parse(cmd.comandos_json);
                console.log(`      ├─ ${cmd.nombre}`);
                console.log(`      │  Descripción: ${cmd.descripcion}`);
                console.log(`      │  Comandos: ${comandosArray.length} líneas`);
                console.log(`      │  OLT: ${cmd.olt_nombre}`);
            });
        });
        
        console.log('\n✅ Verificación completada');
        db.close();
    });
});

#!/usr/bin/env node

/**
 * Script para corregir la base de datos principal agregando columna 'activo'
 * Soluciona el error: "SQLITE_ERROR: no such column: activo"
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔧 CORRIGIENDO BASE DE DATOS PRINCIPAL');
console.log('Agregando columna "activo" faltante...');
console.log('='.repeat(40));

async function corregirBasePrincipal() {
    try {
        // Verificar que existe la base de datos principal
        if (!fs.existsSync('./olt_system.db')) {
            console.log('❌ Error: No se encuentra olt_system.db');
            process.exit(1);
        }

        console.log('📊 Verificando estructura actual...');
        
        const db = new sqlite3.Database('./olt_system.db');
        
        // Verificar estructura de tabla olts
        db.all("PRAGMA table_info(olts)", (err, columns) => {
            if (err) {
                console.error('❌ Error verificando estructura:', err);
                process.exit(1);
            }
            
            console.log('🔍 Columnas actuales en tabla olts:');
            columns.forEach(col => {
                console.log(`   - ${col.name} (${col.type})`);
            });
            
            // Verificar si ya existe la columna activo
            const hasActivoColumn = columns.some(col => col.name === 'activo');
            
            if (hasActivoColumn) {
                console.log('✅ La columna "activo" ya existe');
                db.close();
                return;
            }
            
            console.log('\n🔧 Agregando columna "activo"...');
            
            // Agregar la columna activo
            db.run("ALTER TABLE olts ADD COLUMN activo INTEGER DEFAULT 1", (err) => {
                if (err) {
                    console.error('❌ Error agregando columna activo:', err);
                    db.close();
                    process.exit(1);
                }
                
                console.log('✅ Columna "activo" agregada exitosamente');
                
                // Actualizar todos los registros existentes
                db.run("UPDATE olts SET activo = 1 WHERE activo IS NULL", (err) => {
                    if (err) {
                        console.error('❌ Error actualizando registros:', err);
                        db.close();
                        process.exit(1);
                    }
                    
                    console.log('✅ Registros existentes actualizados');
                    
                    // Verificar resultado
                    db.all("SELECT COUNT(*) as total FROM olts WHERE activo = 1", (err, result) => {
                        if (err) {
                            console.error('❌ Error verificando resultado:', err);
                        } else {
                            console.log(`📊 OLTs activas: ${result[0].total}`);
                        }
                        
                        db.close();
                        
                        console.log('\n🎉 CORRECCIÓN COMPLETADA');
                        console.log('');
                        console.log('📋 Lo que se hizo:');
                        console.log('   ✅ Agregada columna "activo" a tabla olts');
                        console.log('   ✅ Valor por defecto: 1 (activo)');
                        console.log('   ✅ Registros existentes actualizados');
                        console.log('');
                        console.log('🔄 Próximos pasos:');
                        console.log('   1. cd .. && bash reiniciar-servidor.sh');
                        console.log('   2. Probar login: alito / vinilo28');
                        console.log('   3. Verificar que aparezcan las OLTs');
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
}

// Ejecutar corrección
corregirBasePrincipal();

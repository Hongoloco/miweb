#!/usr/bin/env node

/**
 * Script para corregir el error "no such column: orden"
 * Ejecutar después de git pull en el servidor
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔧 Iniciando corrección de columna "orden"...');

// Función para corregir una base de datos
function fixDatabase(dbPath, dbName) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(dbPath)) {
            console.log(`⚠️  Base de datos no encontrada: ${dbPath}`);
            resolve();
            return;
        }

        console.log(`🔍 Procesando: ${dbName}`);
        const db = new sqlite3.Database(dbPath);

        // Verificar si la columna orden existe
        db.all("PRAGMA table_info(comandos)", (err, columns) => {
            if (err) {
                console.error(`❌ Error verificando tabla comandos en ${dbName}:`, err);
                db.close();
                reject(err);
                return;
            }

            const hasOrdenColumn = columns.some(col => col.name === 'orden');
            const hasOrdenDisplayColumn = columns.some(col => col.name === 'orden_display');

            if (hasOrdenColumn) {
                console.log(`✅ Columna "orden" ya existe en ${dbName}`);
                db.close();
                resolve();
                return;
            }

            console.log(`🔧 Agregando columna "orden" a ${dbName}...`);

            // Agregar la columna orden
            db.run("ALTER TABLE comandos ADD COLUMN orden INTEGER DEFAULT 0", (err) => {
                if (err) {
                    console.error(`❌ Error agregando columna orden en ${dbName}:`, err);
                    db.close();
                    reject(err);
                    return;
                }

                console.log(`✅ Columna "orden" agregada a ${dbName}`);

                // Solo sincronizar con orden_display si existe esa columna
                if (hasOrdenDisplayColumn) {
                    console.log(`🔄 Sincronizando con columna orden_display en ${dbName}...`);
                    db.run("UPDATE comandos SET orden = orden_display WHERE orden_display IS NOT NULL", (err) => {
                        if (err) {
                            console.error(`❌ Error sincronizando valores en ${dbName}:`, err);
                            db.close();
                            reject(err);
                            return;
                        }

                        console.log(`✅ Valores sincronizados con orden_display en ${dbName}`);
                        db.close();
                        resolve();
                    });
                } else {
                    console.log(`ℹ️  No hay columna orden_display en ${dbName}, usando valores por defecto`);
                    // Asignar orden secuencial a los comandos existentes
                    db.run("UPDATE comandos SET orden = rowid WHERE orden = 0", (err) => {
                        if (err) {
                            console.error(`❌ Error asignando orden secuencial en ${dbName}:`, err);
                            db.close();
                            reject(err);
                            return;
                        }

                        console.log(`✅ Orden secuencial asignado en ${dbName}`);
                        db.close();
                        resolve();
                    });
                }
            });
        });
    });
}

async function main() {
    try {
        // Corregir base de datos principal
        await fixDatabase('./olt_system.db', 'Base de datos principal');

        // Corregir bases de datos privadas
        const databasesDir = './databases';
        if (fs.existsSync(databasesDir)) {
            const files = fs.readdirSync(databasesDir);
            
            for (const file of files) {
                if (file.endsWith('.db')) {
                    const dbPath = path.join(databasesDir, file);
                    await fixDatabase(dbPath, `Base de datos privada: ${file}`);
                }
            }
        }

        console.log('🎉 Corrección completada exitosamente!');
        console.log('');
        console.log('📋 Siguientes pasos:');
        console.log('1. Reinicia el servidor: npm restart o pm2 restart');
        console.log('2. Verifica que los comandos aparezcan correctamente');
        console.log('3. Si el usuario alito no tiene comandos, ejecuta: node restaurar-alito-zte.js');

    } catch (error) {
        console.error('❌ Error durante la corrección:', error);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { fixDatabase };

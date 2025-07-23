#!/usr/bin/env node

/**
 * Script para importar comandos desde el archivo JSON ZTE C600-2025-07-22.json
 * a la base de datos SQLite del sistema
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Rutas de archivos
const DB_PATH = path.join(__dirname, 'olt_system.db');
const JSON_PATH = path.join(__dirname, 'ZTE C600-2025-07-22.json');

// Función principal
async function importarComandos() {
    console.log('🔄 Iniciando importación de comandos ZTE C600...');
    
    // Verificar que existan los archivos
    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ No se encontró la base de datos:', DB_PATH);
        console.log('💡 Ejecuta: npm run init-db');
        process.exit(1);
    }
    
    if (!fs.existsSync(JSON_PATH)) {
        console.error('❌ No se encontró el archivo JSON:', JSON_PATH);
        process.exit(1);
    }
    
    // Leer el archivo JSON
    let jsonData;
    try {
        const jsonContent = fs.readFileSync(JSON_PATH, 'utf8');
        jsonData = JSON.parse(jsonContent);
        console.log(`📖 Leído archivo JSON con ${jsonData.comandos.length} comandos`);
    } catch (error) {
        console.error('❌ Error al leer el archivo JSON:', error.message);
        process.exit(1);
    }
    
    // Conectar a la base de datos
    const db = new sqlite3.Database(DB_PATH);
    
    try {
        // Buscar o crear la OLT principal
        const oltPrincipal = await buscarOCrearOLT(db, jsonData);
        console.log(`🌐 OLT encontrada/creada: ${oltPrincipal.nombre} (ID: ${oltPrincipal.id})`);
        
        // Limpiar comandos existentes de esta OLT
        await limpiarComandosOLT(db, oltPrincipal.id);
        
        // Importar comandos nuevos
        let comandosImportados = 0;
        for (const comando of jsonData.comandos) {
            await insertarComando(db, oltPrincipal.id, comando);
            comandosImportados++;
        }
        
        console.log(`✅ Importación completada: ${comandosImportados} comandos agregados`);
        console.log('🎉 ¡Lista la ZTE C600 con todos los comandos del repositorio!');
        
        // Registrar en logs
        await registrarLog(db, 'IMPORT_COMANDOS', `Importados ${comandosImportados} comandos desde JSON`, 1);
        
    } catch (error) {
        console.error('❌ Error durante la importación:', error.message);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Buscar OLT existente o crear una nueva
function buscarOCrearOLT(db, jsonData) {
    return new Promise((resolve, reject) => {
        // Primero buscar si existe una OLT ZTE C600
        db.get(
            'SELECT * FROM olts WHERE nombre LIKE ? OR nombre LIKE ?',
            ['%ZTE C600%', '%ZTE%'],
            (err, olt) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (olt) {
                    // Actualizar parámetros desde el JSON
                    db.run(
                        `UPDATE olts SET 
                         shelf = ?, slot = ?, port = ?, onu_id = ?,
                         fecha_modificacion = CURRENT_TIMESTAMP
                         WHERE id = ?`,
                        [
                            jsonData.shelf,
                            jsonData.slot, 
                            jsonData.port,
                            jsonData.onuId,
                            olt.id
                        ],
                        (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    id: olt.id,
                                    nombre: olt.nombre
                                });
                            }
                        }
                    );
                } else {
                    // Crear nueva OLT
                    const oltId = `olt-${Date.now()}`;
                    db.run(
                        `INSERT INTO olts (id, nombre, shelf, slot, port, onu_id, fecha_creacion, fecha_modificacion)
                         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                        [
                            oltId,
                            jsonData.nombre || 'ZTE C600 - Repositorio',
                            jsonData.shelf,
                            jsonData.slot,
                            jsonData.port,
                            jsonData.onuId
                        ],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    id: oltId,
                                    nombre: jsonData.nombre || 'ZTE C600 - Repositorio'
                                });
                            }
                        }
                    );
                }
            }
        );
    });
}

// Limpiar comandos existentes de una OLT
function limpiarComandosOLT(db, oltId) {
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM comandos WHERE olt_id = ?',
            [oltId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(`🧹 Limpiados ${this.changes} comandos anteriores`);
                    resolve();
                }
            }
        );
    });
}

// Insertar un comando
function insertarComando(db, oltId, comandoData) {
    return new Promise((resolve, reject) => {
        const comandoId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Convertir el formato del JSON al formato de la BD
        const nombre = comandoData.summary;
        const descripcion = comandoData.lines[0].startsWith('#') ? 
                          comandoData.lines[0].substring(1).trim() : 
                          `Comando: ${comandoData.summary}`;
        const comandos = JSON.stringify(comandoData.lines.filter(line => !line.startsWith('#') && line.trim() !== ''));
        
        db.run(
            `INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden, fecha_creacion, fecha_modificacion)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [oltId, nombre, descripcion, comandos, 'repositorio', Math.floor(Math.random() * 1000)],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Registrar en logs
function registrarLog(db, accion, detalles, userId) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO logs_actividad (accion, detalles, usuario_id, fecha)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [accion, detalles, userId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

// Ejecutar el script
if (require.main === module) {
    importarComandos().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = { importarComandos };

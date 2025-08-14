// SCRIPT PARA IMPORTAR DATOS OLT C600 PARA ALITO
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Leer el archivo JSON con los datos de la OLT C600
const c600DataPath = path.join(__dirname, '..', 'docs', 'ZTE C600-2025-07-22.json');
const c600Data = JSON.parse(fs.readFileSync(c600DataPath, 'utf8'));

// Conectar a la base de datos de alito
const alitoDbPath = path.join(__dirname, 'databases', 'alito_olt_system.db');
const db = new sqlite3.Database(alitoDbPath);

console.log('🔧 Importando datos OLT C600 para alito...');
console.log('📊 Datos leídos:', c600Data.nombre);

// Función para insertar la OLT
function insertOLT() {
    return new Promise((resolve, reject) => {
        const oltData = {
            nombre: c600Data.nombre,
            ip: '192.168.1.100', // IP de ejemplo
            puerto: 22,
            modelo: 'ZTE C600',
            ubicacion: 'Central Antel',
            activo: 1,
            configuracion: JSON.stringify({
                shelf: c600Data.shelf || 1,
                slot: c600Data.slot || 13,
                port: c600Data.port || 4,
                onuId: c600Data.onuId || 38
            })
        };

        db.run(`INSERT INTO olts (nombre, ip, puerto, modelo, ubicacion, activo, configuracion) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [oltData.nombre, oltData.ip, oltData.puerto, oltData.modelo, 
             oltData.ubicacion, oltData.activo, oltData.configuracion],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ OLT insertada con ID:', this.lastID);
                    resolve(this.lastID);
                }
            }
        );
    });
}

// Función para insertar comandos
function insertCommands(oltId) {
    return new Promise((resolve, reject) => {
        let insertedCount = 0;
        const totalCommands = c600Data.comandos.length;

        if (totalCommands === 0) {
            resolve(0);
            return;
        }

        c600Data.comandos.forEach((comando, index) => {
            // Convertir las líneas del comando a texto único
            const comandoTexto = comando.lines.join('\n');
            
            db.run(`INSERT INTO comandos (nombre, comando, descripcion, categoria, parametros, olt_id, activo) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    comando.summary, 
                    comandoTexto,
                    `Comando para ${comando.summary}`,
                    'gpon',
                    JSON.stringify({
                        shelf: '{shelf}',
                        slot: '{slot}',
                        port: '{port}',
                        onuId: '{onuId}'
                    }),
                    oltId,
                    1
                ],
                function(err) {
                    if (err) {
                        console.error(`❌ Error insertando comando ${index + 1}:`, err);
                    } else {
                        console.log(`✅ Comando ${index + 1}/${totalCommands}: ${comando.summary}`);
                    }
                    
                    insertedCount++;
                    if (insertedCount === totalCommands) {
                        resolve(insertedCount);
                    }
                }
            );
        });
    });
}

// Función para crear categorías de tareas
function insertTaskCategories() {
    return new Promise((resolve, reject) => {
        const categories = [
            { nombre: 'Configuración GPON', color: '#007bff', icono: '⚙️' },
            { nombre: 'Diagnóstico ONU', color: '#28a745', icono: '🔍' },
            { nombre: 'Configuración Bridge/Router', color: '#ffc107', icono: '🔧' },
            { nombre: 'VoIP', color: '#dc3545', icono: '📞' }
        ];

        let insertedCount = 0;
        categories.forEach((categoria, index) => {
            db.run(`INSERT INTO categorias_tareas (nombre, color, icono, activa) VALUES (?, ?, ?, ?)`,
                [categoria.nombre, categoria.color, categoria.icono, 1],
                function(err) {
                    if (err) {
                        console.error(`❌ Error insertando categoría ${index + 1}:`, err);
                    } else {
                        console.log(`✅ Categoría: ${categoria.nombre}`);
                    }
                    
                    insertedCount++;
                    if (insertedCount === categories.length) {
                        resolve(insertedCount);
                    }
                }
            );
        });
    });
}

// Función principal
async function main() {
    try {
        console.log('🚀 Iniciando importación de datos...');
        
        // 1. Insertar OLT
        const oltId = await insertOLT();
        
        // 2. Insertar comandos
        const commandCount = await insertCommands(oltId);
        
        // 3. Insertar categorías de tareas
        const categoryCount = await insertTaskCategories();
        
        console.log('\n🎉 Importación completada exitosamente!');
        console.log(`📊 Resumen:`);
        console.log(`   - OLTs insertadas: 1`);
        console.log(`   - Comandos insertados: ${commandCount}`);
        console.log(`   - Categorías creadas: ${categoryCount}`);
        
        // Verificar datos insertados
        db.all('SELECT COUNT(*) as total FROM comandos', (err, rows) => {
            if (!err) {
                console.log(`✅ Total comandos en BD: ${rows[0].total}`);
            }
            
            db.all('SELECT COUNT(*) as total FROM olts', (err, rows) => {
                if (!err) {
                    console.log(`✅ Total OLTs en BD: ${rows[0].total}`);
                }
                
                db.close();
                console.log('🔚 Base de datos cerrada');
            });
        });
        
    } catch (error) {
        console.error('💥 Error durante la importación:', error);
        db.close();
        process.exit(1);
    }
}

// Ejecutar
main();

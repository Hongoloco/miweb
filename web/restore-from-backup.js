const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Función para mostrar ayuda
function showHelp() {
    console.log('');
    console.log('🔧 Script de Restauración de Comandos');
    console.log('');
    console.log('Uso:');
    console.log('  node restore-from-backup.js [archivo-backup]');
    console.log('');
    console.log('Ejemplos:');
    console.log('  node restore-from-backup.js                     # Restaura el backup más reciente');
    console.log('  node restore-from-backup.js backup-file.json    # Restaura un archivo específico');
    console.log('');
}

// Obtener archivo de backup
const backupFile = process.argv[2];
let backupPath;

if (backupFile) {
    // Archivo específico proporcionado
    if (path.isAbsolute(backupFile)) {
        backupPath = backupFile;
    } else {
        backupPath = path.join(__dirname, '..', 'backup', backupFile);
    }
} else {
    // Buscar el backup más reciente
    const backupDir = path.join(__dirname, '..', 'backup');
    
    if (!fs.existsSync(backupDir)) {
        console.error('❌ Directorio de backup no existe:', backupDir);
        showHelp();
        process.exit(1);
    }
    
    const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('commands-backup-') && file.endsWith('.json'))
        .sort()
        .reverse();
    
    if (backupFiles.length === 0) {
        console.error('❌ No se encontraron archivos de backup');
        showHelp();
        process.exit(1);
    }
    
    backupPath = path.join(backupDir, backupFiles[0]);
    console.log(`📁 Usando backup más reciente: ${backupFiles[0]}`);
}

// Verificar que el archivo existe
if (!fs.existsSync(backupPath)) {
    console.error('❌ Archivo de backup no encontrado:', backupPath);
    showHelp();
    process.exit(1);
}

// Leer archivo de backup
let backupData;
try {
    backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`📦 Cargando backup del ${new Date(backupData.fecha_backup).toLocaleString()}`);
} catch (error) {
    console.error('❌ Error leyendo archivo de backup:', error.message);
    process.exit(1);
}

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Restaurando desde backup...');

// Limpiar datos existentes
db.run(`DELETE FROM comandos`, function() {
    console.log(`🗑️ Eliminados ${this.changes} comandos existentes`);
    
    db.run(`DELETE FROM olts`, function() {
        console.log(`🗑️ Eliminadas ${this.changes} OLTs existentes`);
        
        // Restaurar OLTs y comandos
        let processedOlts = 0;
        let totalCommandsRestored = 0;
        
        if (backupData.olts.length === 0) {
            console.log('⚠️ No hay OLTs en el backup para restaurar');
            db.close();
            return;
        }
        
        backupData.olts.forEach(olt => {
            // Insertar OLT
            db.run(`INSERT INTO olts (id, nombre, shelf, slot, port, onu_id, ip_address, modelo, ubicacion, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [olt.id, olt.nombre, olt.shelf, olt.slot, olt.port, olt.onu_id, olt.ip_address, olt.modelo, olt.ubicacion, olt.estado], 
                    function(err) {
                if (err) {
                    console.error(`❌ Error insertando OLT ${olt.nombre}:`, err);
                } else {
                    console.log(`📡 OLT restaurada: ${olt.nombre}`);
                    
                    // Insertar comandos de esta OLT
                    let comandosInsertados = 0;
                    
                    if (olt.comandos && olt.comandos.length > 0) {
                        olt.comandos.forEach(comando => {
                            db.run(`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, orden) 
                                    VALUES (?, ?, ?, ?, ?, ?)`, 
                                    [olt.id, comando.nombre, comando.descripcion, comando.comandos_json, comando.categoria, comando.orden], 
                                    function(err) {
                                if (err) {
                                    console.error(`❌ Error insertando comando ${comando.nombre}:`, err);
                                } else {
                                    comandosInsertados++;
                                    totalCommandsRestored++;
                                    
                                    if (comandosInsertados === olt.comandos.length) {
                                        console.log(`  ✅ ${comandosInsertados} comandos restaurados para ${olt.nombre}`);
                                        
                                        processedOlts++;
                                        if (processedOlts === backupData.olts.length) {
                                            finishRestore();
                                        }
                                    }
                                }
                            });
                        });
                    } else {
                        processedOlts++;
                        if (processedOlts === backupData.olts.length) {
                            finishRestore();
                        }
                    }
                }
            });
        });
        
        function finishRestore() {
            console.log('');
            console.log('🎉 ¡Restauración completada exitosamente!');
            console.log(`📊 OLTs restauradas: ${backupData.olts.length}`);
            console.log(`📊 Comandos restaurados: ${totalCommandsRestored}`);
            console.log(`📁 Backup usado: ${path.basename(backupPath)}`);
            
            db.close();
        }
    });
});

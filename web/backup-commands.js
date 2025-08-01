const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('📦 Creando backup de comandos...');

// Obtener todas las OLTs y sus comandos
db.all(`SELECT o.*, GROUP_CONCAT(c.id) as comando_ids
        FROM olts o 
        LEFT JOIN comandos c ON o.id = c.olt_id 
        GROUP BY o.id`, (err, olts) => {
    if (err) {
        console.error('❌ Error obteniendo OLTs:', err);
        return;
    }

    const backup = {
        fecha_backup: new Date().toISOString(),
        olts: []
    };

    let processedOlts = 0;

    if (olts.length === 0) {
        console.log('⚠️ No hay OLTs para hacer backup');
        saveBackup(backup);
        return;
    }

    olts.forEach(olt => {
        const oltData = {
            id: olt.id,
            nombre: olt.nombre,
            shelf: olt.shelf,
            slot: olt.slot,
            port: olt.port,
            onu_id: olt.onu_id,
            ip_address: olt.ip_address,
            modelo: olt.modelo,
            ubicacion: olt.ubicacion,
            estado: olt.estado,
            comandos: []
        };

        if (olt.comando_ids) {
            // Obtener los comandos de esta OLT
            db.all(`SELECT * FROM comandos WHERE olt_id = ? ORDER BY orden`, [olt.id], (err, comandos) => {
                if (err) {
                    console.error(`❌ Error obteniendo comandos para OLT ${olt.nombre}:`, err);
                } else {
                    oltData.comandos = comandos.map(cmd => ({
                        nombre: cmd.nombre,
                        descripcion: cmd.descripcion,
                        comandos_json: cmd.comandos_json,
                        categoria: cmd.categoria,
                        orden: cmd.orden
                    }));
                    console.log(`✅ Backup OLT: ${olt.nombre} (${oltData.comandos.length} comandos)`);
                }

                backup.olts.push(oltData);
                processedOlts++;

                if (processedOlts === olts.length) {
                    saveBackup(backup);
                }
            });
        } else {
            backup.olts.push(oltData);
            processedOlts++;
            console.log(`✅ Backup OLT: ${olt.nombre} (sin comandos)`);

            if (processedOlts === olts.length) {
                saveBackup(backup);
            }
        }
    });
});

function saveBackup(backup) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, '..', 'backup', `commands-backup-${timestamp}.json`);
    
    // Crear directorio backup si no existe
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log('');
    console.log('🎉 ¡Backup completado exitosamente!');
    console.log(`📁 Archivo: ${backupPath}`);
    console.log(`📊 OLTs respaldadas: ${backup.olts.length}`);
    console.log(`📊 Total comandos: ${backup.olts.reduce((total, olt) => total + olt.comandos.length, 0)}`);
    
    db.close();
}

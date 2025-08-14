const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

// Leer el archivo de comandos ZTE
const ztePath = path.join(__dirname, '..', 'docs', 'ZTE C600-2025-07-22.json');
const zteData = JSON.parse(fs.readFileSync(ztePath, 'utf8'));

console.log('🔧 Restaurando comandos ZTE C600...');

// Primero eliminar comandos existentes de esta OLT para evitar duplicados
db.run(`DELETE FROM comandos WHERE olt_id LIKE 'olt-%'`, function() {
    console.log(`🗑️ Eliminados ${this.changes} comandos existentes`);
    
    // Crear nueva OLT con los datos del archivo
    const oltId = zteData.id || 'olt-zte-c600-restored';
    
    db.run(`INSERT OR REPLACE INTO olts (id, nombre, shelf, slot, port, onu_id) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [oltId, zteData.nombre, zteData.shelf, zteData.slot, zteData.port, zteData.onuId], 
            function() {
        
        console.log(`📡 OLT creada/actualizada: ${zteData.nombre}`);
        
        // Insertar cada comando
        let insertedCount = 0;
        zteData.comandos.forEach((comando, index) => {
            // Filtrar líneas que no sean comentarios para evitar errores de JSON parsing
            const lineasSinComentarios = comando.lines.filter(line => !line.trim().startsWith('#'));
            const comandoJson = JSON.stringify(lineasSinComentarios);
            
            db.run(`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, orden) 
                    VALUES (?, ?, ?, ?, ?)`, 
                    [oltId, comando.summary, 'Comando ZTE C600', comandoJson, index + 1], 
                    function(err) {
                if (err) {
                    console.error('❌ Error insertando comando:', comando.summary, err);
                } else {
                    insertedCount++;
                    console.log(`✅ Comando insertado: ${comando.summary}`);
                    
                    // Si es el último comando, mostrar resumen
                    if (insertedCount === zteData.comandos.length) {
                        console.log('');
                        console.log('🎉 ¡Comandos ZTE C600 restaurados exitosamente!');
                        console.log(`📊 Total de comandos restaurados: ${insertedCount}`);
                        console.log(`📡 OLT: ${zteData.nombre}`);
                        console.log(`🔧 Configuración: Shelf ${zteData.shelf}, Slot ${zteData.slot}, Port ${zteData.port}, ONU ID ${zteData.onuId}`);
                        
                        db.close();
                    }
                }
            });
        });
    });
});

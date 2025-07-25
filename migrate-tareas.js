const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexión a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Migrando tabla de tareas...');

db.serialize(() => {
    // Verificar si las columnas ya existen
    db.all("PRAGMA table_info(tareas)", (err, columns) => {
        if (err) {
            console.error('❌ Error al verificar tabla:', err);
            return;
        }

        const columnNames = columns.map(col => col.name);
        console.log('📋 Columnas actuales:', columnNames);

        // Columnas que necesitamos añadir
        const columnsToAdd = [
            { name: 'fecha_vencimiento', definition: 'DATETIME' },
            { name: 'fecha_finalizacion', definition: 'DATETIME' },
            { name: 'etiquetas', definition: 'TEXT' },
            { name: 'progreso', definition: 'INTEGER DEFAULT 0' },
            { name: 'tiempo_estimado', definition: 'INTEGER' },
            { name: 'tiempo_real', definition: 'INTEGER' }
        ];

        // Añadir columnas faltantes
        columnsToAdd.forEach(column => {
            if (!columnNames.includes(column.name)) {
                const sql = `ALTER TABLE tareas ADD COLUMN ${column.name} ${column.definition}`;
                console.log(`🔨 Añadiendo columna: ${column.name}`);
                
                db.run(sql, (err) => {
                    if (err) {
                        console.error(`❌ Error al añadir ${column.name}:`, err);
                    } else {
                        console.log(`✅ Columna ${column.name} añadida correctamente`);
                    }
                });
            } else {
                console.log(`⏭️ Columna ${column.name} ya existe`);
            }
        });

        // Cerrar la base de datos después de un breve delay
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error al cerrar la base de datos:', err);
                } else {
                    console.log('✅ Migración completada. Base de datos cerrada.');
                }
            });
        }, 1000);
    });
});

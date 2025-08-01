const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando integridad de datos...');
console.log('');

// Verificar OLTs
db.get(`SELECT COUNT(*) as count FROM olts`, (err, result) => {
    if (err) {
        console.error('❌ Error verificando OLTs:', err);
        return;
    }
    
    console.log(`📡 OLTs en la base de datos: ${result.count}`);
    
    if (result.count === 0) {
        console.log('⚠️ ¡ALERTA! No hay OLTs en la base de datos');
        console.log('💡 Ejecuta: node restore-zte-commands.js');
        console.log('💡 O bien: node restore-from-backup.js');
    } else {
        // Mostrar detalles de OLTs
        db.all(`SELECT id, nombre, modelo FROM olts`, (err, olts) => {
            if (!err) {
                olts.forEach(olt => {
                    console.log(`   - ${olt.nombre} (${olt.modelo})`);
                });
            }
        });
    }
});

// Verificar comandos
db.get(`SELECT COUNT(*) as count FROM comandos`, (err, result) => {
    if (err) {
        console.error('❌ Error verificando comandos:', err);
        return;
    }
    
    console.log(`⚙️ Comandos en la base de datos: ${result.count}`);
    
    if (result.count === 0) {
        console.log('⚠️ ¡ALERTA! No hay comandos en la base de datos');
        console.log('💡 Ejecuta: node restore-zte-commands.js');
        console.log('💡 O bien: node restore-from-backup.js');
    } else {
        // Mostrar distribución por OLT
        db.all(`SELECT o.nombre as olt_nombre, COUNT(c.id) as comandos_count
                FROM olts o 
                LEFT JOIN comandos c ON o.id = c.olt_id 
                GROUP BY o.id, o.nombre`, (err, stats) => {
            if (!err) {
                stats.forEach(stat => {
                    console.log(`   - ${stat.olt_nombre}: ${stat.comandos_count} comandos`);
                });
            }
        });
    }
});

// Verificar usuarios
db.get(`SELECT COUNT(*) as count FROM usuarios WHERE activo = 1`, (err, result) => {
    if (err) {
        console.error('❌ Error verificando usuarios:', err);
        return;
    }
    
    console.log(`👥 Usuarios activos: ${result.count}`);
    
    if (result.count === 0) {
        console.log('⚠️ ¡ALERTA! No hay usuarios activos en la base de datos');
        console.log('💡 Ejecuta: node init-database.js');
    }
});

// Verificar estructura de tablas
const expectedTables = ['usuarios', 'olts', 'comandos', 'logs_actividad', 'roles', 'tareas', 'categorias_tareas'];

db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, (err, tables) => {
    if (err) {
        console.error('❌ Error verificando tablas:', err);
        db.close();
        return;
    }
    
    const existingTables = tables.map(t => t.name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    console.log(`🗃️ Tablas en la base de datos: ${existingTables.length}`);
    
    if (missingTables.length > 0) {
        console.log('⚠️ ¡ALERTA! Faltan tablas:');
        missingTables.forEach(table => {
            console.log(`   - ${table}`);
        });
        console.log('💡 Ejecuta: node init-database.js');
    } else {
        console.log('✅ Todas las tablas esperadas están presentes');
    }
    
    console.log('');
    console.log('🏁 Verificación completada');
    
    db.close();
});

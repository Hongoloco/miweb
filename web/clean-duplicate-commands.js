// SCRIPT PARA LIMPIAR COMANDOS DUPLICADOS EN BD PRINCIPAL
// Mantiene solo una versión de cada comando

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function cleanDuplicateCommands() {
    console.log('🧹 LIMPIANDO COMANDOS DUPLICADOS EN BD PRINCIPAL DEL ADMIN');
    
    const mainDbPath = path.join(__dirname, 'olt_system.db');
    const mainDb = new sqlite3.Database(mainDbPath);
    
    return new Promise((resolve, reject) => {
        console.log('\n1️⃣ Buscando comandos duplicados...');
        
        // Encontrar duplicados por nombre (manteniendo el ID más alto)
        mainDb.all(`
            SELECT nombre, MAX(id) as keep_id, COUNT(*) as duplicates, GROUP_CONCAT(id) as all_ids
            FROM comandos 
            GROUP BY nombre 
            HAVING COUNT(*) > 1
            ORDER BY nombre
        `, (err, duplicates) => {
            if (err) {
                console.error('❌ Error buscando duplicados:', err);
                reject(err);
                return;
            }
            
            if (duplicates.length === 0) {
                console.log('✅ No se encontraron comandos duplicados');
                mainDb.close();
                resolve();
                return;
            }
            
            console.log(`\n📊 Encontrados ${duplicates.length} comandos con duplicados:`);
            
            duplicates.forEach(dup => {
                console.log(`  - "${dup.nombre}": ${dup.duplicates} copias (IDs: ${dup.all_ids}) -> Mantener ID ${dup.keep_id}`);
            });
            
            // Crear lista de IDs a eliminar
            let idsToDelete = [];
            duplicates.forEach(dup => {
                const allIds = dup.all_ids.split(',').map(id => parseInt(id));
                const keepId = dup.keep_id;
                const deleteIds = allIds.filter(id => id !== keepId);
                idsToDelete = idsToDelete.concat(deleteIds);
            });
            
            if (idsToDelete.length === 0) {
                console.log('✅ No hay IDs para eliminar');
                mainDb.close();
                resolve();
                return;
            }
            
            console.log(`\n2️⃣ Eliminando ${idsToDelete.length} comandos duplicados...`);
            console.log(`   IDs a eliminar: ${idsToDelete.join(', ')}`);
            
            // Eliminar duplicados
            const placeholders = idsToDelete.map(() => '?').join(',');
            mainDb.run(`DELETE FROM comandos WHERE id IN (${placeholders})`, idsToDelete, function(err) {
                if (err) {
                    console.error('❌ Error eliminando duplicados:', err);
                    reject(err);
                    return;
                }
                
                console.log(`✅ ${this.changes} comandos duplicados eliminados`);
                
                // Verificar resultado
                mainDb.get('SELECT COUNT(*) as total FROM comandos', (err, result) => {
                    if (err) {
                        console.error('❌ Error verificando resultado:', err);
                        reject(err);
                        return;
                    }
                    
                    console.log(`\n3️⃣ RESULTADO:`);
                    console.log(`   Total de comandos después de limpieza: ${result.total}`);
                    
                    // Mostrar comandos finales
                    mainDb.all('SELECT id, nombre, categoria FROM comandos ORDER BY id', (err, finalCommands) => {
                        if (err) {
                            console.error('❌ Error obteniendo comandos finales:', err);
                            reject(err);
                            return;
                        }
                        
                        console.log(`\n📋 COMANDOS ÚNICOS FINALES:`);
                        finalCommands.forEach(cmd => {
                            console.log(`   ${cmd.id}. ${cmd.nombre} (${cmd.categoria})`);
                        });
                        
                        console.log('\n✨ LIMPIEZA COMPLETADA');
                        console.log('🎯 La BD principal del admin ahora tiene comandos únicos');
                        console.log('🔒 Las BDs de usuarios técnicos siguen limpias (0 comandos)');
                        
                        mainDb.close();
                        resolve();
                    });
                });
            });
        });
    });
}

// Ejecutar limpieza si se llama directamente
if (require.main === module) {
    cleanDuplicateCommands()
        .then(() => {
            console.log('\n🎉 LIMPIEZA DE DUPLICADOS COMPLETADA EXITOSAMENTE');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ERROR EN LA LIMPIEZA:', error);
            process.exit(1);
        });
}

module.exports = { cleanDuplicateCommands };

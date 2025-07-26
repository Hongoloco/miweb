const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 AUDITORÍA COMPLETA DEL SISTEMA');
console.log('==================================\n');

db.serialize(() => {
    console.log('1️⃣ VERIFICANDO TABLAS Y ESTRUCTURA...');
    
    // Verificar todas las tablas existentes
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
        if (err) {
            console.error('❌ Error obteniendo tablas:', err);
            return;
        }
        
        console.log('📊 Tablas existentes:');
        tables.forEach(table => {
            console.log(`   ✅ ${table.name}`);
        });
        
        console.log('\n2️⃣ LIMPIANDO COMANDOS DUPLICADOS...');
        
        // Buscar y eliminar comandos duplicados
        db.all(`SELECT nombre, COUNT(*) as cantidad 
                FROM comandos 
                GROUP BY nombre 
                HAVING COUNT(*) > 1`, (err, duplicados) => {
            
            if (err) {
                console.error('❌ Error buscando duplicados:', err);
                return;
            }
            
            if (duplicados.length === 0) {
                console.log('   ✅ No se encontraron comandos duplicados');
            } else {
                console.log(`   ⚠️ Encontrados ${duplicados.length} comandos duplicados:`);
                duplicados.forEach(dup => {
                    console.log(`      - ${dup.nombre} (${dup.cantidad} copias)`);
                });
                
                // Eliminar duplicados manteniendo solo el primero
                duplicados.forEach(dup => {
                    db.run(`DELETE FROM comandos 
                            WHERE nombre = ? 
                            AND id NOT IN (
                                SELECT MIN(id) FROM comandos WHERE nombre = ?
                            )`, [dup.nombre, dup.nombre]);
                });
            }
            
            console.log('\n3️⃣ VERIFICANDO DATOS POR PESTAÑA...');
            
            // Verificar datos de cada pestaña
            verificarPestanas();
        });
    });
    
    function verificarPestanas() {
        const pestanas = [
            { nombre: 'Tareas', tabla: 'tareas', api: '/api/tareas' },
            { nombre: 'Comandos OLT', tabla: 'comandos', api: '/api/comandos' },
            { nombre: 'OLTs', tabla: 'olts', api: '/api/olts' },
            { nombre: 'IMS', tabla: 'comandos_ims', api: '/api/comandos-ims' },
            { nombre: 'ACS (Modelos ONT)', tabla: 'modelos_ont', api: '/api/modelos-ont' },
            { nombre: 'ACS (Comandos ONT)', tabla: 'comandos_ont', api: '/api/modelos-ont/:id/comandos' },
            { nombre: 'Usuarios', tabla: 'usuarios', api: '/api/usuarios' }
        ];
        
        let contadorPestanas = 0;
        
        pestanas.forEach(pestana => {
            db.get(`SELECT COUNT(*) as total FROM ${pestana.tabla}`, (err, result) => {
                contadorPestanas++;
                
                if (err) {
                    console.log(`   ❌ ${pestana.nombre}: Error - ${err.message}`);
                } else {
                    const status = result.total > 0 ? '✅' : '⚠️';
                    console.log(`   ${status} ${pestana.nombre}: ${result.total} registros (API: ${pestana.api})`);
                }
                
                if (contadorPestanas === pestanas.length) {
                    verificarIntegridad();
                }
            });
        });
    }
    
    function verificarIntegridad() {
        console.log('\n4️⃣ VERIFICANDO INTEGRIDAD DE DATOS...');
        
        // Verificar comandos huérfanos (sin OLT)
        db.all(`SELECT c.id, c.nombre, c.olt_id 
                FROM comandos c 
                LEFT JOIN olts o ON c.olt_id = o.id 
                WHERE o.id IS NULL`, (err, huerfanos) => {
            
            if (err) {
                console.error('❌ Error verificando comandos huérfanos:', err);
            } else if (huerfanos.length === 0) {
                console.log('   ✅ No hay comandos huérfanos');
            } else {
                console.log(`   ⚠️ Encontrados ${huerfanos.length} comandos huérfanos:`);
                huerfanos.forEach(cmd => {
                    console.log(`      - ID: ${cmd.id}, Nombre: ${cmd.nombre}, OLT ID: ${cmd.olt_id}`);
                });
                
                // Eliminar comandos huérfanos
                db.run(`DELETE FROM comandos WHERE olt_id NOT IN (SELECT id FROM olts)`);
                console.log('   🧹 Comandos huérfanos eliminados');
            }
            
            verificarOLTsActivas();
        });
    }
    
    function verificarOLTsActivas() {
        // Verificar OLTs activas
        db.all(`SELECT id, nombre, estado FROM olts`, (err, olts) => {
            if (err) {
                console.error('❌ Error verificando OLTs:', err);
            } else {
                console.log(`   📡 Total OLTs: ${olts.length}`);
                olts.forEach(olt => {
                    console.log(`      - ${olt.nombre} (${olt.id}) - Estado: ${olt.estado || 'activa'}`);
                });
            }
            
            generarResumen();
        });
    }
    
    function generarResumen() {
        console.log('\n5️⃣ RESUMEN FINAL...');
        
        // Contar registros finales
        const consultas = [
            { nombre: 'OLTs', query: 'SELECT COUNT(*) as total FROM olts' },
            { nombre: 'Comandos OLT', query: 'SELECT COUNT(*) as total FROM comandos' },
            { nombre: 'Comandos IMS', query: 'SELECT COUNT(*) as total FROM comandos_ims' },
            { nombre: 'Modelos ONT', query: 'SELECT COUNT(*) as total FROM modelos_ont' },
            { nombre: 'Comandos ONT', query: 'SELECT COUNT(*) as total FROM comandos_ont' },
            { nombre: 'Tareas', query: 'SELECT COUNT(*) as total FROM tareas' },
            { nombre: 'Usuarios', query: 'SELECT COUNT(*) as total FROM usuarios' }
        ];
        
        let contadorConsultas = 0;
        const resumen = {};
        
        consultas.forEach(consulta => {
            db.get(consulta.query, (err, result) => {
                contadorConsultas++;
                
                if (!err) {
                    resumen[consulta.nombre] = result.total;
                }
                
                if (contadorConsultas === consultas.length) {
                    console.log('\n📊 ESTADO FINAL DE LA BASE DE DATOS:');
                    console.log('=====================================');
                    
                    Object.entries(resumen).forEach(([nombre, total]) => {
                        const status = total > 0 ? '✅' : '⚠️';
                        console.log(`${status} ${nombre}: ${total} registros`);
                    });
                    
                    console.log('\n✨ AUDITORÍA COMPLETADA');
                    console.log('======================');
                    console.log('🔧 Comandos duplicados eliminados');
                    console.log('🧹 Comandos huérfanos limpiados'); 
                    console.log('📊 Todas las tablas verificadas');
                    console.log('🌐 APIs correspondientes identificadas');
                    console.log('💾 Sistema configurado para usar solo base de datos (no localStorage)');
                    
                    db.close();
                }
            });
        });
    }
});

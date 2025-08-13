// Script para probar la carga de usuarios y OLTs
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🧪 PROBANDO CARGA DE USUARIOS Y OLTs');
console.log('=====================================');

const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 1. VERIFICANDO USUARIOS:');
db.all("SELECT * FROM usuarios", (err, users) => {
    if (err) {
        console.error('❌ Error:', err);
        return;
    }
    
    console.log(`   Usuarios encontrados: ${users.length}`);
    users.forEach(user => {
        console.log(`   - ${user.username} (${user.rol}) - Activo: ${user.activo}`);
    });
    
    console.log('\n📡 2. VERIFICANDO OLTs:');
    db.all("SELECT * FROM olts", (err, olts) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        console.log(`   OLTs encontradas: ${olts.length}`);
        olts.forEach(olt => {
            console.log(`   - ${olt.nombre} (${olt.id}) - Estado: ${olt.estado}`);
        });
        
        console.log('\n🔧 3. VERIFICANDO COMANDOS:');
        db.all("SELECT olt_id, COUNT(*) as count FROM comandos GROUP BY olt_id", (err, comandos) => {
            if (err) {
                console.error('❌ Error:', err);
                return;
            }
            
            comandos.forEach(cmd => {
                console.log(`   - OLT ${cmd.olt_id}: ${cmd.count} comandos`);
            });
            
            console.log('\n🔍 4. PROBANDO CONSULTA DE OLTs ACTIVAS:');
            db.all("SELECT * FROM olts WHERE estado = 'activo' ORDER BY fecha_creacion DESC", (err, activeOlts) => {
                if (err) {
                    console.error('❌ Error:', err);
                    return;
                }
                
                console.log(`   OLTs activas: ${activeOlts.length}`);
                activeOlts.forEach(olt => {
                    console.log(`   ✅ ${olt.nombre} (${olt.id})`);
                });
                
                console.log('\n💡 5. SIMULANDO LOGIN USUARIO ALITO:');
                db.get("SELECT * FROM usuarios WHERE username = 'alito'", (err, user) => {
                    if (err) {
                        console.error('❌ Error:', err);
                        return;
                    }
                    
                    if (user) {
                        console.log(`   ✅ Usuario alito encontrado - Rol: ${user.rol}`);
                        console.log(`   📡 Este usuario debería ver ${activeOlts.length} OLT(s)`);
                        
                        if (activeOlts.length === 0) {
                            console.log('\n⚠️  PROBLEMA DETECTADO:');
                            console.log('   - No hay OLTs con estado "activo"');
                            console.log('   - Revisar consulta o estado de OLTs');
                        } else {
                            console.log('\n✅ TODO PARECE CORRECTO');
                            console.log('   - Usuario existe');
                            console.log('   - OLTs disponibles');
                            console.log('   - Comandos asociados');
                        }
                    } else {
                        console.log('   ❌ Usuario alito NO encontrado');
                    }
                    
                    db.close();
                });
            });
        });
    });
});

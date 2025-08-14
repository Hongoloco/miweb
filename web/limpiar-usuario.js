// LIMPIADOR DE BASE DE DATOS DE USUARIO - GARANTIZA INTERFAZ LIMPIA
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function limpiarUsuario(username) {
    console.log(`\n🧹 LIMPIANDO BD DE USUARIO: ${username}`);
    console.log('=======================================');
    
    const userDbPath = path.join(__dirname, 'databases', `${username}_olt_system.db`);
    
    if (!fs.existsSync(userDbPath)) {
        console.log('❌ BD del usuario no encontrada');
        return false;
    }
    
    const userDb = new sqlite3.Database(userDbPath);
    
    return new Promise((resolve) => {
        console.log('🗑️ Eliminando datos existentes...');
        
        const limpiezaSQL = [
            'DELETE FROM comandos',
            'DELETE FROM olts', 
            'DELETE FROM tareas WHERE id > 0',  // Mantener estructura
            'DELETE FROM logs_actividad',
            'UPDATE configuraciones SET valor = "true" WHERE clave = "interfaz_limpia"',
            'UPDATE configuraciones SET valor = datetime("now") WHERE clave = "fecha_limpieza"',
            'INSERT OR REPLACE INTO configuraciones (clave, valor, descripcion) VALUES ("ultima_limpieza", datetime("now"), "Última limpieza de interfaz")'
        ];
        
        userDb.run('BEGIN TRANSACTION');
        
        let operacionesCompletadas = 0;
        limpiezaSQL.forEach((sql, index) => {
            userDb.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Error en operación ${index + 1}:`, err);
                } else {
                    console.log(`✅ Operación ${index + 1}/${limpiezaSQL.length} completada`);
                }
                
                operacionesCompletadas++;
                if (operacionesCompletadas === limpiezaSQL.length) {
                    userDb.run('COMMIT', () => {
                        console.log(`✅ BD de ${username} COMPLETAMENTE LIMPIA`);
                        console.log('🎯 El usuario tendrá una interfaz VACÍA y LIMPIA');
                        userDb.close();
                        resolve(true);
                    });
                }
            });
        });
    });
}

async function main() {
    if (process.argv.length < 3) {
        console.log('Uso: node limpiar-usuario.js <username>');
        console.log('Ejemplo: node limpiar-usuario.js juan');
        process.exit(1);
    }
    
    const username = process.argv[2];
    
    try {
        const resultado = await limpiarUsuario(username);
        if (resultado) {
            console.log(`\n🎉 LIMPIEZA COMPLETADA PARA: ${username}`);
            console.log('💡 El usuario ahora tendrá una interfaz completamente limpia');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { limpiarUsuario };

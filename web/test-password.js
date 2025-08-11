const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('olt_system.db');

db.get('SELECT username, password_hash FROM usuarios WHERE username = ?', ['alito'], async (err, row) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }
    
    if (!row) {
        console.log('Usuario alito no encontrado');
        db.close();
        return;
    }
    
    console.log('Usuario:', row.username);
    console.log('Hash almacenado:', row.password_hash);
    console.log('Hash length:', row.password_hash.length);
    
    // Probar contraseñas comunes
    const passwords = ['alito', 'alito123', 'password', '123456', 'admin', 'admin123'];
    
    for (const password of passwords) {
        try {
            const result = await bcrypt.compare(password, row.password_hash);
            console.log(`Probando '${password}': ${result ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
        } catch (error) {
            console.log(`Error probando '${password}': ${error.message}`);
        }
    }
    
    db.close();
    process.exit(0);
});

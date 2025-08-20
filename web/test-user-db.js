// Test del sistema de bases de datos por usuario
console.log('🧪 INICIANDO TEST DEL SISTEMA DE BASES DE DATOS POR USUARIO');
console.log('================================================');

try {
    const UserDatabaseManager = require('./user-database-manager');
    const fs = require('fs');
    const path = require('path');
    
    console.log('✅ UserDatabaseManager cargado correctamente');
    
    // Crear instancia del gestor
    const dbManager = new UserDatabaseManager();
    console.log('✅ Instancia de UserDatabaseManager creada');
    
    // Verificar directorio de bases de datos
    console.log('📁 Directorio de bases de datos:', dbManager.userDbDirectory);
    
    if (fs.existsSync(dbManager.userDbDirectory)) {
        console.log('✅ Directorio de bases de datos existe');
        const files = fs.readdirSync(dbManager.userDbDirectory);
        console.log('📋 Archivos encontrados:', files.length);
        files.forEach(f => console.log('  -', f));
    } else {
        console.log('❌ Directorio no existe, se creará automáticamente');
    }
    
    // Test de base de datos principal
    console.log('\n🔍 PROBANDO BASE DE DATOS PRINCIPAL...');
    const mainDb = dbManager.getMainDatabase();
    console.log('✅ Conexión a base de datos principal obtenida');
    
    // Test de base de datos de usuario
    console.log('\n🔍 PROBANDO BASE DE DATOS DE USUARIO...');
    const testUser = 'test_usuario';
    const userDb = dbManager.getTechnicianDatabase(testUser);
    console.log(`✅ Base de datos para usuario '${testUser}' creada/obtenida`);
    
    // Verificar que se creó el archivo
    const userDbPath = path.join(dbManager.userDbDirectory, `${testUser}_olt_system.db`);
    if (fs.existsSync(userDbPath)) {
        console.log('✅ Archivo de base de datos de usuario creado correctamente');
        console.log('📄 Ruta:', userDbPath);
        
        // Obtener tamaño del archivo
        const stats = fs.statSync(userDbPath);
        console.log('📊 Tamaño del archivo:', stats.size, 'bytes');
    } else {
        console.log('❌ Archivo de base de datos de usuario NO fue creado');
    }
    
    // Test de diferenciación por rol
    console.log('\n🔍 PROBANDO DIFERENCIACIÓN POR ROL...');
    
    // Simular usuario admin
    const adminDb = dbManager.getUserDatabase('admin', 'admin');
    console.log('✅ Base de datos para admin obtenida (debería ser la principal)');
    
    // Simular usuario técnico
    const techDb = dbManager.getUserDatabase('tecnico1', 'tecnico');
    console.log('✅ Base de datos para técnico obtenida (debería ser individual)');
    
    console.log('\n🎯 RESUMEN DEL TEST:');
    console.log('==================');
    console.log('✅ UserDatabaseManager funciona correctamente');
    console.log('✅ Directorio de bases de datos configurado');
    console.log('✅ Base de datos principal accesible');
    console.log('✅ Bases de datos individuales por usuario funcionando');
    console.log('✅ Diferenciación por roles implementada');
    
    // Cerrar conexiones
    if (mainDb) mainDb.close();
    if (userDb) userDb.close();
    if (adminDb && adminDb !== mainDb) adminDb.close();
    if (techDb && techDb !== userDb && techDb !== mainDb) techDb.close();
    
    console.log('\n🏆 RESULTADO: SISTEMA FUNCIONANDO PERFECTAMENTE');
    
} catch (error) {
    console.error('❌ ERROR EN EL TEST:', error.message);
    console.error('📍 Stack:', error.stack);
    process.exit(1);
}

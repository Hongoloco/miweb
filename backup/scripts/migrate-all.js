const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'olt_system.db');

console.log('🔄 Iniciando migración de datos desde localStorage a base de datos...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('🔗 Conectado a la base de datos SQLite');
    }
});

// Datos simulados que estaban en localStorage (extraídos del frontend)
const usuariosSimulados = [
    {
        id: 1,
        username: 'alito',
        email: 'alito@antel.com.uy',
        rol: 'admin',
        descripcion: 'Administrador principal del sistema',
        activo: true,
        password: '1234' // Se hashearán
    },
    {
        id: 2,
        username: 'tecnico1',
        email: 'tecnico1@antel.com.uy',
        rol: 'tecnico',
        descripcion: 'Técnico de soporte de red',
        activo: true,
        password: '1234'
    },
    {
        id: 3,
        username: 'usuario1',
        email: 'usuario1@antel.com.uy',
        rol: 'usuario',
        descripcion: 'Usuario estándar del sistema',
        activo: false,
        password: '1234'
    }
];

const credencialesSimuladas = [
    { username: 'alito', password: '1234', rol: 'admin', nombre_completo: 'Administrador Principal' },
    { username: 'tecnico1', password: '1234', rol: 'tecnico', nombre_completo: 'Técnico de Red' },
    { username: 'demo', password: 'demo', rol: 'usuario', nombre_completo: 'Usuario Demo' }
];

const comandosIMSPersonalizados = [
    {
        id: 'ims_consulta_1',
        nombre: 'Consulta Usuario Completa',
        descripcion: 'Consulta completa de usuario IMS con detalles extendidos',
        template: 'EXP USRINF: ENTITYPE=SCSCF,IMPU="tel:+598{numero}",DETAIL=FULL;',
        categoria: 'consulta'
    },
    {
        id: 'ims_registro_1',
        nombre: 'Registro Forzado',
        descripcion: 'Fuerza el registro de un usuario IMS',
        template: 'ADD USRINF: ENTITYPE=SCSCF,IMPU="tel:+598{numero}",STATUS=ACTIVE,FORCE=YES;',
        categoria: 'registro'
    }
];

db.serialize(() => {
    console.log('👥 Migrando usuarios...');
    
    // Combinar datos de usuariosSimulados y credencialesSimuladas
    const usuariosParaMigrar = usuariosSimulados.map(usuario => {
        const credencial = credencialesSimuladas.find(c => c.username === usuario.username);
        return {
            ...usuario,
            nombre_completo: credencial ? credencial.nombre_completo : usuario.username,
            password: credencial ? credencial.password : usuario.password || '1234'
        };
    });

    // Agregar usuarios que están en credenciales pero no en usuariosSimulados
    credencialesSimuladas.forEach(cred => {
        if (!usuariosSimulados.find(u => u.username === cred.username)) {
            usuariosParaMigrar.push({
                username: cred.username,
                nombre_completo: cred.nombre_completo,
                rol: cred.rol,
                password: cred.password,
                activo: true,
                descripcion: `Usuario ${cred.rol}`
            });
        }
    });

    let usuariosMigrados = 0;
    usuariosParaMigrar.forEach((usuario, index) => {
        const hashedPassword = bcrypt.hashSync(usuario.password, 10);
        
        // Verificar si el usuario ya existe
        db.get(`SELECT id FROM usuarios WHERE username = ?`, [usuario.username], (err, existingUser) => {
            if (err) {
                console.error(`❌ Error al verificar usuario ${usuario.username}:`, err.message);
                return;
            }

            if (existingUser) {
                // Actualizar usuario existente
                db.run(`UPDATE usuarios SET 
                        nombre_completo = ?,
                        email = ?,
                        rol = ?,
                        descripcion = ?,
                        activo = ?
                        WHERE username = ?`, 
                        [usuario.nombre_completo, usuario.email, usuario.rol, usuario.descripcion, usuario.activo, usuario.username], 
                        function(err) {
                            if (err) {
                                console.error(`❌ Error al actualizar usuario ${usuario.username}:`, err.message);
                            } else {
                                console.log(`🔄 Usuario actualizado: ${usuario.username}`);
                            }
                            usuariosMigrados++;
                            verificarCompletado();
                        });
            } else {
                // Crear nuevo usuario
                db.run(`INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, descripcion, activo) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                        [usuario.username, hashedPassword, usuario.nombre_completo, usuario.email, usuario.rol, usuario.descripcion, usuario.activo], 
                        function(err) {
                            if (err) {
                                console.error(`❌ Error al crear usuario ${usuario.username}:`, err.message);
                            } else {
                                console.log(`✅ Usuario migrado: ${usuario.username} (ID: ${this.lastID})`);
                            }
                            usuariosMigrados++;
                            verificarCompletado();
                        });
            }
        });
    });

    function verificarCompletado() {
        if (usuariosMigrados === usuariosParaMigrar.length) {
            migrarComandosIMS();
        }
    }

    function migrarComandosIMS() {
        console.log('📞 Migrando comandos IMS personalizados...');
        
        if (comandosIMSPersonalizados.length === 0) {
            finalizarMigracion();
            return;
        }

        let comandosIMSMigrados = 0;
        comandosIMSPersonalizados.forEach((comando) => {
            // Verificar si el comando ya existe
            db.get(`SELECT id FROM comandos_ims WHERE nombre = ?`, [comando.nombre], (err, existingComando) => {
                if (err) {
                    console.error(`❌ Error al verificar comando IMS ${comando.nombre}:`, err.message);
                    comandosIMSMigrados++;
                    verificarComandosIMSCompletados();
                    return;
                }

                if (existingComando) {
                    // Actualizar comando existente
                    db.run(`UPDATE comandos_ims SET 
                            descripcion = ?,
                            template = ?,
                            categoria = ?
                            WHERE nombre = ?`, 
                            [comando.descripcion, comando.template, comando.categoria, comando.nombre], 
                            function(err) {
                                if (err) {
                                    console.error(`❌ Error al actualizar comando IMS ${comando.nombre}:`, err.message);
                                } else {
                                    console.log(`🔄 Comando IMS actualizado: ${comando.nombre}`);
                                }
                                comandosIMSMigrados++;
                                verificarComandosIMSCompletados();
                            });
                } else {
                    // Crear nuevo comando
                    db.run(`INSERT INTO comandos_ims (nombre, descripcion, template, categoria, usuario_creador) 
                            VALUES (?, ?, ?, ?, 1)`, 
                            [comando.nombre, comando.descripcion, comando.template, comando.categoria], 
                            function(err) {
                                if (err) {
                                    console.error(`❌ Error al crear comando IMS ${comando.nombre}:`, err.message);
                                } else {
                                    console.log(`✅ Comando IMS migrado: ${comando.nombre} (ID: ${this.lastID})`);
                                }
                                comandosIMSMigrados++;
                                verificarComandosIMSCompletados();
                            });
                }
            });
        });

        function verificarComandosIMSCompletados() {
            if (comandosIMSMigrados === comandosIMSPersonalizados.length) {
                finalizarMigracion();
            }
        }
    }

    function finalizarMigracion() {
        console.log('🎉 ¡Migración completada exitosamente!');
        console.log('');
        console.log('📋 Resumen de migración:');
        console.log(`   ✅ ${usuariosParaMigrar.length} usuarios procesados`);
        console.log(`   ✅ ${comandosIMSPersonalizados.length} comandos IMS procesados`);
        console.log('');
        console.log('🔐 Todos los usuarios mantienen sus credenciales originales');
        console.log('📞 Comandos IMS personalizados ahora están en la base de datos');
        console.log('');
        console.log('🚀 La aplicación ya puede usar completamente la base de datos');
        
        db.close((err) => {
            if (err) {
                console.error('❌ Error al cerrar la base de datos:', err.message);
            } else {
                console.log('🔒 Conexión a la base de datos cerrada correctamente');
            }
            process.exit(0);
        });
    }
});

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Servir el archivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Conexión a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos:', err.message);
    } else {
        console.log('🔗 Conectado a la base de datos SQLite');
    }
});

// Función para registrar actividad
function logActivity(userId, accion, detalles, ip) {
    db.run(`INSERT INTO logs_actividad (usuario_id, accion, detalles, ip_address) 
            VALUES (?, ?, ?, ?)`, [userId, accion, detalles, ip]);
}

// ===== RUTAS DE AUTENTICACIÓN =====

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    db.get(`SELECT * FROM usuarios WHERE username = ? AND activo = 1`, [username], (err, user) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            logActivity(null, 'login_fallido', `Usuario: ${username}, IP: ${clientIP}`, clientIP);
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        // Actualizar último acceso
        db.run(`UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);
        
        logActivity(user.id, 'login_exitoso', `Usuario: ${username}`, clientIP);

        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user.id,
                username: user.username,
                nombre_completo: user.nombre_completo,
                email: user.email,
                rol: user.rol
            }
        });
    });
});

// ===== RUTAS DE USUARIOS =====

// Obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
    db.all(`SELECT id, username, nombre_completo, email, rol, descripcion, activo, fecha_creacion, ultimo_acceso 
            FROM usuarios ORDER BY rol, username`, (err, usuarios) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        res.json({ success: true, usuarios });
    });
});

// Obtener un usuario específico
app.get('/api/usuarios/:id', (req, res) => {
    const userId = req.params.id;
    
    db.get(`SELECT id, username, nombre_completo, email, rol, descripcion, activo, fecha_creacion, ultimo_acceso 
            FROM usuarios WHERE id = ?`, [userId], (err, usuario) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, usuario });
    });
});

// Crear nuevo usuario
app.post('/api/usuarios', (req, res) => {
    const { username, password, nombre_completo, email, rol, descripcion, activo, creadorId } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username y password son obligatorios' });
    }

    // Verificar si el username ya existe
    db.get(`SELECT id FROM usuarios WHERE username = ?`, [username], (err, existingUser) => {
        if (err) {
            console.error('Error al verificar usuario:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
        }

        // Crear el usuario
        const hashedPassword = bcrypt.hashSync(password, 10);
        
        db.run(`INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, descripcion, activo) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, nombre_completo, email, rol || 'usuario', descripcion, activo !== false],
            function(err) {
                if (err) {
                    console.error('Error al crear usuario:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor' });
                }

                logActivity(creadorId, 'crear_usuario', `Usuario: ${username}, Rol: ${rol}`, req.ip);
                
                res.json({
                    success: true,
                    message: 'Usuario creado correctamente',
                    usuario: { id: this.lastID, username, nombre_completo, email, rol }
                });
            }
        );
    });
});

// Actualizar usuario
app.put('/api/usuarios/:id', (req, res) => {
    const userId = req.params.id;
    const { username, nombre_completo, email, rol, descripcion, activo, editorId } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username es obligatorio' });
    }

    // Verificar si el username ya existe en otro usuario
    db.get(`SELECT id FROM usuarios WHERE username = ? AND id != ?`, [username, userId], (err, existingUser) => {
        if (err) {
            console.error('Error al verificar usuario:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
        }

        db.run(`UPDATE usuarios SET 
                username = ?, nombre_completo = ?, email = ?, rol = ?, descripcion = ?, activo = ?
                WHERE id = ?`,
            [username, nombre_completo, email, rol, descripcion, activo, userId],
            function(err) {
                if (err) {
                    console.error('Error al actualizar usuario:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
                }

                logActivity(editorId, 'actualizar_usuario', `Usuario: ${username}`, req.ip);
                
                res.json({ success: true, message: 'Usuario actualizado correctamente' });
            }
        );
    });
});

// Eliminar usuario
app.delete('/api/usuarios/:id', (req, res) => {
    const userId = req.params.id;
    const { eliminadorId } = req.body;

    // Verificar que no sea el usuario alito
    db.get(`SELECT username FROM usuarios WHERE id = ?`, [userId], (err, usuario) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (usuario.username === 'alito') {
            return res.status(403).json({ success: false, message: 'No se puede eliminar el usuario alito' });
        }

        db.run(`DELETE FROM usuarios WHERE id = ?`, [userId], function(err) {
            if (err) {
                console.error('Error al eliminar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            logActivity(eliminadorId, 'eliminar_usuario', `Usuario: ${usuario.username}`, req.ip);
            
            res.json({ success: true, message: 'Usuario eliminado correctamente' });
        });
    });
});

// Cambiar contraseña
app.post('/api/usuarios/cambiar-password', (req, res) => {
    const { userId, passwordActual, passwordNueva } = req.body;

    if (!userId || !passwordActual || !passwordNueva) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    if (passwordNueva.length < 4) {
        return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 4 caracteres' });
    }

    // Verificar contraseña actual
    db.get(`SELECT password_hash, username FROM usuarios WHERE id = ?`, [userId], (err, usuario) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (!bcrypt.compareSync(passwordActual, usuario.password_hash)) {
            return res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' });
        }

        // Actualizar contraseña
        const hashedNewPassword = bcrypt.hashSync(passwordNueva, 10);
        
        db.run(`UPDATE usuarios SET password_hash = ? WHERE id = ?`, [hashedNewPassword, userId], function(err) {
            if (err) {
                console.error('Error al cambiar contraseña:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            logActivity(userId, 'cambiar_password', `Usuario: ${usuario.username}`, req.ip);
            
            res.json({ success: true, message: 'Contraseña cambiada correctamente' });
        });
    });
});

// ===== RUTAS DE COMANDOS IMS =====

// Obtener todos los comandos IMS
app.get('/api/comandos-ims', (req, res) => {
    db.all(`SELECT * FROM comandos_ims WHERE activo = 1 ORDER BY categoria, nombre`, (err, comandos) => {
        if (err) {
            console.error('Error al obtener comandos IMS:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        res.json({ success: true, comandos });
    });
});

// Crear nuevo comando IMS
app.post('/api/comandos-ims', (req, res) => {
    const { nombre, descripcion, template, categoria, creadorId } = req.body;
    
    if (!nombre || !template) {
        return res.status(400).json({ success: false, message: 'Nombre y template son obligatorios' });
    }

    db.run(`INSERT INTO comandos_ims (nombre, descripcion, template, categoria, usuario_creador) 
            VALUES (?, ?, ?, ?, ?)`,
        [nombre, descripcion, template, categoria || 'general', creadorId],
        function(err) {
            if (err) {
                console.error('Error al crear comando IMS:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            logActivity(creadorId, 'crear_comando_ims', `Comando: ${nombre}`, req.ip);
            
            res.json({
                success: true,
                message: 'Comando IMS creado correctamente',
                comando: { id: this.lastID, nombre, descripcion, template, categoria }
            });
        }
    );
});

// Actualizar comando IMS
app.put('/api/comandos-ims/:id', (req, res) => {
    const comandoId = req.params.id;
    const { nombre, descripcion, template, categoria, editorId } = req.body;

    if (!nombre || !template) {
        return res.status(400).json({ success: false, message: 'Nombre y template son obligatorios' });
    }

    db.run(`UPDATE comandos_ims SET 
            nombre = ?, descripcion = ?, template = ?, categoria = ?
            WHERE id = ?`,
        [nombre, descripcion, template, categoria, comandoId],
        function(err) {
            if (err) {
                console.error('Error al actualizar comando IMS:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Comando IMS no encontrado' });
            }

            logActivity(editorId, 'actualizar_comando_ims', `Comando: ${nombre}`, req.ip);
            
            res.json({ success: true, message: 'Comando IMS actualizado correctamente' });
        }
    );
});

// Eliminar comando IMS
app.delete('/api/comandos-ims/:id', (req, res) => {
    const comandoId = req.params.id;
    const { eliminadorId } = req.body;

    // Obtener info del comando para el log
    db.get(`SELECT nombre FROM comandos_ims WHERE id = ?`, [comandoId], (err, comando) => {
        if (err) {
            console.error('Error al obtener comando IMS:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!comando) {
            return res.status(404).json({ success: false, message: 'Comando IMS no encontrado' });
        }

        db.run(`DELETE FROM comandos_ims WHERE id = ?`, [comandoId], function(err) {
            if (err) {
                console.error('Error al eliminar comando IMS:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Comando IMS no encontrado' });
            }

            logActivity(eliminadorId, 'eliminar_comando_ims', `Comando: ${comando.nombre}`, req.ip);
            
            res.json({ success: true, message: 'Comando IMS eliminado correctamente' });
        });
    });
});

// ===== RUTAS DE OLTs =====

// Obtener todas las OLTs
app.get('/api/olts', (req, res) => {
    db.all(`SELECT * FROM olts WHERE estado = 'activa' ORDER BY fecha_creacion`, (err, rows) => {
        if (err) {
            console.error('Error al obtener OLTs:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        res.json({ success: true, olts: rows });
    });
});

// Obtener una OLT específica con sus comandos
app.get('/api/olts/:id', (req, res) => {
    const oltId = req.params.id;
    
    db.get(`SELECT * FROM olts WHERE id = ?`, [oltId], (err, olt) => {
        if (err) {
            console.error('Error al obtener OLT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (!olt) {
            return res.status(404).json({ success: false, message: 'OLT no encontrada' });
        }

        // Obtener comandos de la OLT
        db.all(`SELECT * FROM comandos WHERE olt_id = ? AND activo = 1 ORDER BY orden, id`, 
               [oltId], (err, comandos) => {
            if (err) {
                console.error('Error al obtener comandos:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            // Convertir comandos_json de string a array
            const comandosFormateados = comandos.map(cmd => ({
                ...cmd,
                comandos: JSON.parse(cmd.comandos_json)
            }));

            res.json({
                success: true,
                olt: {
                    ...olt,
                    comandos: comandosFormateados
                }
            });
        });
    });
});

// Crear nueva OLT
app.post('/api/olts', (req, res) => {
    const { nombre, shelf, slot, port, onu_id, ip_address, ubicacion } = req.body;
    const oltId = 'olt-' + Date.now();

    db.run(`INSERT INTO olts (id, nombre, shelf, slot, port, onu_id, ip_address, ubicacion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [oltId, nombre, shelf || 1, slot || 1, port || 1, onu_id || 1, ip_address, ubicacion],
        function(err) {
            if (err) {
                console.error('Error al crear OLT:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            logActivity(req.body.userId, 'crear_olt', `OLT: ${nombre}`, req.ip);
            
            res.json({
                success: true,
                message: 'OLT creada correctamente',
                olt: { id: oltId, nombre, shelf, slot, port, onu_id }
            });
        }
    );
});

// Actualizar OLT
app.put('/api/olts/:id', (req, res) => {
    const oltId = req.params.id;
    const { nombre, shelf, slot, port, onu_id, ip_address, ubicacion } = req.body;

    db.run(`UPDATE olts SET 
                nombre = ?, shelf = ?, slot = ?, port = ?, onu_id = ?, 
                ip_address = ?, ubicacion = ?, fecha_modificacion = CURRENT_TIMESTAMP 
            WHERE id = ?`,
        [nombre, shelf, slot, port, onu_id, ip_address, ubicacion, oltId],
        function(err) {
            if (err) {
                console.error('Error al actualizar OLT:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'OLT no encontrada' });
            }

            logActivity(req.body.userId, 'actualizar_olt', `OLT: ${nombre}`, req.ip);
            
            res.json({ success: true, message: 'OLT actualizada correctamente' });
        }
    );
});

// Eliminar OLT
app.delete('/api/olts/:id', (req, res) => {
    const oltId = req.params.id;

    db.run(`UPDATE olts SET estado = 'inactiva' WHERE id = ?`, [oltId], function(err) {
        if (err) {
            console.error('Error al eliminar OLT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'OLT no encontrada' });
        }

        logActivity(req.body.userId, 'eliminar_olt', `OLT ID: ${oltId}`, req.ip);
        
        res.json({ success: true, message: 'OLT eliminada correctamente' });
    });
});

// ===== RUTAS DE COMANDOS =====

// Crear nuevo comando
app.post('/api/comandos', (req, res) => {
    const { olt_id, nombre, descripcion, comandos, categoria } = req.body;

    db.run(`INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria) 
            VALUES (?, ?, ?, ?, ?)`,
        [olt_id, nombre, descripcion, JSON.stringify(comandos), categoria || 'general'],
        function(err) {
            if (err) {
                console.error('Error al crear comando:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            logActivity(req.body.userId, 'crear_comando', `Comando: ${nombre} en OLT: ${olt_id}`, req.ip);
            
            res.json({
                success: true,
                message: 'Comando creado correctamente',
                comando_id: this.lastID
            });
        }
    );
});

// Actualizar comando
app.put('/api/comandos/:id', (req, res) => {
    const comandoId = req.params.id;
    const { nombre, descripcion, comandos, categoria } = req.body;

    db.run(`UPDATE comandos SET 
                nombre = ?, descripcion = ?, comandos_json = ?, categoria = ?,
                fecha_modificacion = CURRENT_TIMESTAMP 
            WHERE id = ?`,
        [nombre, descripcion, JSON.stringify(comandos), categoria, comandoId],
        function(err) {
            if (err) {
                console.error('Error al actualizar comando:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Comando no encontrado' });
            }

            logActivity(req.body.userId, 'actualizar_comando', `Comando ID: ${comandoId}`, req.ip);
            
            res.json({ success: true, message: 'Comando actualizado correctamente' });
        }
    );
});

// Eliminar comando
app.delete('/api/comandos/:id', (req, res) => {
    const comandoId = req.params.id;
    const { userId } = req.body;

    // Primero obtener información del comando para el log
    db.get(`SELECT c.nombre, o.nombre as olt_nombre 
            FROM comandos c 
            JOIN olts o ON c.olt_id = o.id 
            WHERE c.id = ?`, [comandoId], (err, comando) => {
        
        if (err) {
            console.error('Error al obtener comando:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!comando) {
            return res.status(404).json({ success: false, message: 'Comando no encontrado' });
        }

        // Eliminar el comando completamente de la base de datos
        db.run(`DELETE FROM comandos WHERE id = ?`, [comandoId], function(err) {
            if (err) {
                console.error('Error al eliminar comando:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Comando no encontrado' });
            }

            logActivity(userId, 'eliminar_comando', `Comando: ${comando.nombre} de OLT: ${comando.olt_nombre}`, req.ip);
            
            res.json({ 
                success: true, 
                message: 'Comando eliminado correctamente',
                comando_eliminado: comando.nombre
            });
        });
    });
});

// ===== NUEVAS RUTAS DE REORDENAMIENTO =====

// Mover comando hacia arriba o abajo
app.post('/api/comandos/:id/mover', (req, res) => {
    const comandoId = parseInt(req.params.id);
    const { direccion, oltId, userId } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!['up', 'down'].includes(direccion)) {
        return res.status(400).json({ success: false, message: 'Dirección inválida' });
    }

    console.log(`Moviendo comando ${comandoId} ${direccion} en OLT ${oltId}`);

    // Obtener el comando actual y su orden
    db.get(`SELECT orden, nombre FROM comandos WHERE id = ? AND olt_id = ?`, [comandoId, oltId], (err, comandoActual) => {
        if (err) {
            console.error('Error al obtener comando:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!comandoActual) {
            return res.status(404).json({ success: false, message: 'Comando no encontrado' });
        }

        const ordenActual = comandoActual.orden || 0;
        const nuevoOrden = direccion === 'up' ? ordenActual - 1 : ordenActual + 1;

        console.log(`Comando actual orden: ${ordenActual}, nuevo orden: ${nuevoOrden}`);

        // Verificar si hay un comando en la posición destino
        db.get(`SELECT id, orden FROM comandos WHERE olt_id = ? AND orden = ?`, 
               [oltId, nuevoOrden], (err, comandoDestino) => {
            if (err) {
                console.error('Error al verificar posición destino:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (!comandoDestino) {
                console.log(`No hay comando en posición ${nuevoOrden}`);
                return res.status(400).json({ 
                    success: false, 
                    message: `No se puede mover ${direccion === 'up' ? 'más arriba' : 'más abajo'}` 
                });
            }

            console.log(`Intercambiando con comando ID: ${comandoDestino.id}`);

            // Intercambiar posiciones
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // Actualizar comando actual
                db.run(`UPDATE comandos SET orden = ? WHERE id = ?`, [nuevoOrden, comandoId], (err) => {
                    if (err) {
                        console.error('Error al actualizar comando actual:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ success: false, message: 'Error al actualizar orden' });
                    }
                });

                // Actualizar comando destino
                db.run(`UPDATE comandos SET orden = ? WHERE id = ?`, [ordenActual, comandoDestino.id], (err) => {
                    if (err) {
                        console.error('Error al actualizar comando destino:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ success: false, message: 'Error al actualizar orden' });
                    }
                });

                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Error al confirmar transacción:', err);
                        return res.status(500).json({ success: false, message: 'Error del servidor' });
                    }

                    logActivity(userId, 'reordenar_comando', 
                               `Comando "${comandoActual.nombre}" movido ${direccion}`, clientIP);
                    console.log('✅ Comando reordenado exitosamente');
                    res.json({ success: true, message: 'Comando reordenado correctamente' });
                });
            });
        });
    });
});

// Reordenar comando por drag & drop
app.post('/api/comandos/:id/reordenar', (req, res) => {
    const comandoId = parseInt(req.params.id);
    const { targetId, posicion, oltId, userId } = req.body;
    const targetIdInt = parseInt(targetId);
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!['before', 'after'].includes(posicion)) {
        return res.status(400).json({ success: false, message: 'Posición inválida' });
    }

    console.log(`Reordenando comando ${comandoId} ${posicion} del comando ${targetIdInt} en OLT ${oltId}`);

    // Obtener información de ambos comandos
    db.all(`SELECT id, orden, nombre FROM comandos WHERE id IN (?, ?) AND olt_id = ?`, 
           [comandoId, targetIdInt, oltId], (err, comandos) => {
        if (err) {
            console.error('Error al obtener comandos:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        console.log('Comandos encontrados:', comandos);

        if (comandos.length !== 2) {
            console.error(`Solo se encontraron ${comandos.length} comandos de 2 esperados`);
            return res.status(404).json({ success: false, message: 'Comandos no encontrados' });
        }

        const comandoMovido = comandos.find(c => c.id === comandoId);
        const comandoDestino = comandos.find(c => c.id === targetIdInt);

        if (!comandoMovido || !comandoDestino) {
            console.error('Comando movido o destino no encontrado:', { comandoMovido, comandoDestino });
            return res.status(404).json({ success: false, message: 'Error al identificar comandos' });
        }

        const ordenDestino = comandoDestino.orden;
        let nuevoOrden;

        if (posicion === 'before') {
            nuevoOrden = ordenDestino - 0.5;
        } else {
            nuevoOrden = ordenDestino + 0.5;
        }

        console.log(`Moviendo comando "${comandoMovido.nombre}" a orden ${nuevoOrden}`);

        // Actualizar el orden del comando movido
        db.run(`UPDATE comandos SET orden = ? WHERE id = ?`, [nuevoOrden, comandoId], function(err) {
            if (err) {
                console.error('Error al reordenar comando:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            // Reorganizar todos los órdenes para evitar decimales
            reorganizarOrdenes(oltId, () => {
                logActivity(userId, 'reordenar_comando_drag', 
                           `Comando "${comandoMovido.nombre}" reubicado`, clientIP);
                res.json({ success: true, message: 'Comando reordenado correctamente' });
            });
        });
    });
});

// Función auxiliar para reorganizar órdenes
function reorganizarOrdenes(oltId, callback) {
    db.all(`SELECT id FROM comandos WHERE olt_id = ? ORDER BY orden, nombre`, 
           [oltId], (err, comandos) => {
        if (err) {
            console.error('Error al reorganizar órdenes:', err);
            return callback();
        }

        const updates = comandos.map((cmd, index) => {
            return new Promise((resolve) => {
                db.run(`UPDATE comandos SET orden = ? WHERE id = ?`, [index + 1, cmd.id], () => {
                    resolve();
                });
            });
        });

        Promise.all(updates).then(() => {
            callback();
        });
    });
}

// Buscar comandos
app.get('/api/comandos/buscar', (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        return res.json({ success: true, comandos: [] });
    }

    const query = `
        SELECT c.*, o.nombre as olt_nombre 
        FROM comandos c 
        JOIN olts o ON c.olt_id = o.id 
        WHERE c.activo = 1 AND o.estado = 'activa' AND 
              (c.nombre LIKE ? OR c.descripcion LIKE ? OR c.comandos_json LIKE ?)
        ORDER BY c.nombre
    `;

    const searchTerm = `%${q}%`;
    
    db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            console.error('Error en búsqueda:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const comandosFormateados = rows.map(cmd => ({
            ...cmd,
            comandos: JSON.parse(cmd.comandos_json)
        }));

        res.json({ success: true, comandos: comandosFormateados });
    });
});

// ===== RUTAS DE LOGS =====

app.get('/api/logs', (req, res) => {
    const { limit = 100 } = req.query;
    
    db.all(`SELECT l.*, u.username, u.nombre_completo 
            FROM logs_actividad l 
            LEFT JOIN usuarios u ON l.usuario_id = u.id 
            ORDER BY l.fecha DESC 
            LIMIT ?`, [parseInt(limit)], (err, rows) => {
        if (err) {
            console.error('Error al obtener logs:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        res.json({ success: true, logs: rows });
    });
});

// ===== RUTAS DE MODELOS ONT (ACS) =====

// Obtener todos los modelos ONT
app.get('/api/modelos-ont', (req, res) => {
    db.all(`SELECT * FROM modelos_ont ORDER BY fabricante, modelo`, (err, modelos) => {
        if (err) {
            console.error('Error al obtener modelos ONT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        // Obtener comandos para cada modelo
        const modelosConComandos = [];
        let processed = 0;

        if (modelos.length === 0) {
            return res.json({ success: true, modelos: [] });
        }

        modelos.forEach(modelo => {
            db.all(`SELECT * FROM comandos_ont WHERE modelo_id = ? ORDER BY orden`, [modelo.id], (err, comandos) => {
                if (!err) {
                    modelo.comandos = comandos || [];
                }
                modelosConComandos.push(modelo);
                processed++;

                if (processed === modelos.length) {
                    res.json({ success: true, modelos: modelosConComandos });
                }
            });
        });
    });
});

// Crear nuevo modelo ONT
app.post('/api/modelos-ont', (req, res) => {
    const { id, fabricante, modelo, version, tipo, descripcion, comandos, usuarioId } = req.body;
    
    db.run(`INSERT INTO modelos_ont (id, fabricante, modelo, version, tipo, descripcion, usuario_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, fabricante, modelo, version || '', tipo, descripcion || '', usuarioId || 1],
        function(err) {
            if (err) {
                console.error('Error al crear modelo ONT:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            // Agregar comandos específicos si los hay
            if (comandos && comandos.length > 0) {
                let processed = 0;
                comandos.forEach((cmd, index) => {
                    db.run(`INSERT INTO comandos_ont (id, modelo_id, comando, descripcion, orden) 
                            VALUES (?, ?, ?, ?, ?)`,
                        [cmd.id, id, cmd.comando, cmd.descripcion || '', cmd.orden || index],
                        () => {
                            processed++;
                            if (processed === comandos.length) {
                                logActivity(usuarioId, 'crear_modelo_ont', `Modelo: ${fabricante} ${modelo}`, req.ip);
                                res.json({ success: true, modeloId: id, message: 'Modelo ONT creado correctamente' });
                            }
                        }
                    );
                });
            } else {
                logActivity(usuarioId, 'crear_modelo_ont', `Modelo: ${fabricante} ${modelo}`, req.ip);
                res.json({ success: true, modeloId: id, message: 'Modelo ONT creado correctamente' });
            }
        }
    );
});

// Eliminar modelo ONT
app.delete('/api/modelos-ont/:id', (req, res) => {
    const modeloId = req.params.id;
    const { usuarioId } = req.body;
    
    // Primero obtener info del modelo para el log
    db.get(`SELECT fabricante, modelo FROM modelos_ont WHERE id = ?`, [modeloId], (err, modelo) => {
        if (err) {
            console.error('Error al obtener modelo ONT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!modelo) {
            return res.status(404).json({ success: false, message: 'Modelo ONT no encontrado' });
        }

        // Eliminar modelo (los comandos se eliminan automáticamente por CASCADE)
        db.run(`DELETE FROM modelos_ont WHERE id = ?`, [modeloId], function(err) {
            if (err) {
                console.error('Error al eliminar modelo ONT:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Modelo ONT no encontrado' });
            }

            logActivity(usuarioId, 'eliminar_modelo_ont', `Modelo: ${modelo.fabricante} ${modelo.modelo}`, req.ip);
            res.json({ success: true, message: 'Modelo ONT eliminado correctamente' });
        });
    });
});

// Agregar comando a modelo ONT existente
app.post('/api/modelos-ont/:id/comandos', (req, res) => {
    const modeloId = req.params.id;
    const { comandoId, comando, descripcion, usuarioId } = req.body;
    
    // Obtener el próximo orden
    db.get(`SELECT MAX(orden) as maxOrden FROM comandos_ont WHERE modelo_id = ?`, [modeloId], (err, result) => {
        if (err) {
            console.error('Error al obtener orden:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const nuevoOrden = (result.maxOrden || 0) + 1;

        db.run(`INSERT INTO comandos_ont (id, modelo_id, comando, descripcion, orden) 
                VALUES (?, ?, ?, ?, ?)`,
            [comandoId, modeloId, comando, descripcion || '', nuevoOrden],
            function(err) {
                if (err) {
                    console.error('Error al agregar comando:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor' });
                }

                logActivity(usuarioId, 'agregar_comando_ont', `Comando: ${comando}`, req.ip);
                res.json({ success: true, comandoId: comandoId, message: 'Comando agregado correctamente' });
            }
        );
    });
});

// Eliminar comando específico de modelo ONT
app.delete('/api/modelos-ont/:modeloId/comandos/:comandoId', (req, res) => {
    const { modeloId, comandoId } = req.params;
    const { usuarioId } = req.body;
    
    db.run(`DELETE FROM comandos_ont WHERE id = ? AND modelo_id = ?`, [comandoId, modeloId], function(err) {
        if (err) {
            console.error('Error al eliminar comando:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Comando no encontrado' });
        }

        logActivity(usuarioId, 'eliminar_comando_ont', `Comando ID: ${comandoId}`, req.ip);
        res.json({ success: true, message: 'Comando eliminado correctamente' });
    });
});

// ===== MANEJO DE ERRORES =====

app.use((err, req, res, next) => {
    console.error('Error no manejado:', err.stack);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// ===== INICIO DEL SERVIDOR =====

app.listen(PORT, () => {
    console.log('🚀 Servidor iniciado en puerto', PORT);
    console.log('🌐 Acceder a: http://localhost:' + PORT);
    console.log('📊 Base de datos: ' + dbPath);
});

// Manejo de cierre del servidor
process.on('SIGINT', () => {
    console.log('\n🔒 Cerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar base de datos:', err.message);
        } else {
            console.log('✅ Base de datos cerrada correctamente');
        }
        process.exit(0);
    });
});

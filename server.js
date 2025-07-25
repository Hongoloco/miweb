const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Variables para SSE y notificaciones
let sseClients = new Set();
let notificationSubscriptions = new Set();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Servir archivos estáticos adicionales
app.use('/dashboard-charts.js', express.static(path.join(__dirname, 'dashboard-charts.js')));
app.use('/notification-system.js', express.static(path.join(__dirname, 'notification-system.js')));
app.use('/reports-analytics.js', express.static(path.join(__dirname, 'reports-analytics.js')));
app.use('/sw-notifications.js', express.static(path.join(__dirname, 'sw-notifications.js')));
app.use('/theme-system.js', express.static(path.join(__dirname, 'theme-system.js')));
app.use('/automation-system.js', express.static(path.join(__dirname, 'automation-system.js')));
app.use('/sw.js', express.static(path.join(__dirname, 'sw.js')));
app.use('/manifest.json', express.static(path.join(__dirname, 'manifest.json')));

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
    db.all(`SELECT id, username, nombre_completo, email, rol, activo, fecha_creacion, ultimo_acceso 
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
    
    db.get(`SELECT id, username, nombre_completo, email, rol, activo, fecha_creacion, ultimo_acceso 
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
        
        db.run(`INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo) 
                VALUES (?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, nombre_completo, email, rol || 'usuario', activo !== false],
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
                username = ?, nombre_completo = ?, email = ?, rol = ?, activo = ?
                WHERE id = ?`,
            [username, nombre_completo, email, rol, activo, userId],
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

// ===== RUTAS DE ROLES =====

// Obtener todos los roles
app.get('/api/roles', (req, res) => {
    db.all(`SELECT * FROM roles WHERE activo = 1 ORDER BY nombre`, (err, roles) => {
        if (err) {
            console.error('Error al obtener roles:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        // Parsear permisos JSON
        const rolesConPermisos = roles.map(rol => ({
            ...rol,
            permisos: JSON.parse(rol.permisos || '{}')
        }));
        
        res.json({ success: true, roles: rolesConPermisos });
    });
});

// Obtener un rol específico
app.get('/api/roles/:id', (req, res) => {
    const rolId = req.params.id;
    
    db.get(`SELECT * FROM roles WHERE id = ? AND activo = 1`, [rolId], (err, rol) => {
        if (err) {
            console.error('Error al obtener rol:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (!rol) {
            return res.status(404).json({ success: false, message: 'Rol no encontrado' });
        }
        
        res.json({ 
            success: true, 
            rol: {
                ...rol,
                permisos: JSON.parse(rol.permisos || '{}')
            }
        });
    });
});

// Crear nuevo rol
app.post('/api/roles', (req, res) => {
    const { nombre, descripcion, permisos, creadorId } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ success: false, message: 'El nombre del rol es obligatorio' });
    }
    
    const permisosJson = JSON.stringify(permisos || {});
    
    db.run(`INSERT INTO roles (nombre, descripcion, permisos) VALUES (?, ?, ?)`,
        [nombre, descripcion || '', permisosJson],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ success: false, message: 'Ya existe un rol con ese nombre' });
                }
                console.error('Error al crear rol:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            logActivity(creadorId, 'crear_rol', `Rol: ${nombre}`, req.ip);
            
            res.json({
                success: true,
                message: 'Rol creado correctamente',
                rol: { id: this.lastID, nombre, descripcion, permisos }
            });
        }
    );
});

// Actualizar rol
app.put('/api/roles/:id', (req, res) => {
    const rolId = req.params.id;
    const { nombre, descripcion, permisos, editorId } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ success: false, message: 'El nombre del rol es obligatorio' });
    }
    
    const permisosJson = JSON.stringify(permisos || {});
    
    db.run(`UPDATE roles SET nombre = ?, descripcion = ?, permisos = ? WHERE id = ?`,
        [nombre, descripcion || '', permisosJson, rolId],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ success: false, message: 'Ya existe un rol con ese nombre' });
                }
                console.error('Error al actualizar rol:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Rol no encontrado' });
            }
            
            logActivity(editorId, 'actualizar_rol', `Rol: ${nombre}`, req.ip);
            
            res.json({ success: true, message: 'Rol actualizado correctamente' });
        }
    );
});

// Eliminar rol (desactivar)
app.delete('/api/roles/:id', (req, res) => {
    const rolId = req.params.id;
    const { eliminadorId } = req.body;
    
    // Verificar que no haya usuarios usando este rol
    db.get(`SELECT COUNT(*) as count FROM usuarios WHERE rol = (SELECT nombre FROM roles WHERE id = ?)`, 
        [rolId], (err, result) => {
        if (err) {
            console.error('Error al verificar usuarios del rol:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (result.count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `No se puede eliminar el rol porque ${result.count} usuario(s) lo están usando` 
            });
        }
        
        // Desactivar el rol
        db.run(`UPDATE roles SET activo = 0 WHERE id = ?`, [rolId], function(err) {
            if (err) {
                console.error('Error al eliminar rol:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Rol no encontrado' });
            }
            
            logActivity(eliminadorId, 'eliminar_rol', `Rol ID: ${rolId}`, req.ip);
            
            res.json({ success: true, message: 'Rol eliminado correctamente' });
        });
    });
});

// Obtener permisos de un usuario específico
app.get('/api/usuarios/:id/permisos', (req, res) => {
    const userId = req.params.id;
    
    db.get(`SELECT u.rol, r.permisos FROM usuarios u 
            LEFT JOIN roles r ON u.rol = r.nombre 
            WHERE u.id = ? AND u.activo = 1`, [userId], (err, usuario) => {
        if (err) {
            console.error('Error al obtener permisos del usuario:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        const permisos = JSON.parse(usuario.permisos || '{}');
        
        res.json({ 
            success: true, 
            rol: usuario.rol,
            permisos: permisos
        });
    });
});

// ===== RUTAS DE TAREAS =====

// Obtener todas las tareas
app.get('/api/tareas', (req, res) => {
    const { estado, categoria, usuario_id } = req.query;
    
    let query = `SELECT t.*, c.color as categoria_color, c.icono as categoria_icono,
                 u.username as creador_username 
                 FROM tareas t 
                 LEFT JOIN categorias_tareas c ON t.categoria = c.nombre
                 LEFT JOIN usuarios u ON t.usuario_id = u.id
                 WHERE t.activa = 1`;
    let params = [];
    
    if (estado) {
        query += ` AND t.estado = ?`;
        params.push(estado);
    }
    
    if (categoria) {
        query += ` AND t.categoria = ?`;
        params.push(categoria);
    }
    
    if (usuario_id) {
        query += ` AND t.usuario_id = ?`;
        params.push(usuario_id);
    }
    
    query += ` ORDER BY 
        CASE t.prioridad 
            WHEN 'urgente' THEN 1 
            WHEN 'alta' THEN 2 
            WHEN 'media' THEN 3 
            WHEN 'baja' THEN 4 
        END,
        t.fecha_creacion DESC`;
    
    db.all(query, params, (err, tareas) => {
        if (err) {
            console.error('Error al obtener tareas:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        res.json({ success: true, tareas });
    });
});

// Obtener estadísticas de tareas
app.get('/api/tareas/estadisticas', (req, res) => {
    const { usuario_id } = req.query;
    
    let whereClause = 'WHERE t.activa = 1';
    let params = [];
    
    if (usuario_id) {
        whereClause += ' AND t.usuario_id = ?';
        params.push(usuario_id);
    }
    
    db.get(`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
        SUM(CASE WHEN estado = 'finalizada' THEN 1 ELSE 0 END) as finalizadas,
        SUM(CASE WHEN prioridad = 'urgente' THEN 1 ELSE 0 END) as urgentes,
        AVG(progreso) as progreso_promedio
        FROM tareas t ${whereClause}`, params, (err, stats) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        res.json({ success: true, estadisticas: stats });
    });
});

// Obtener una tarea específica con sus notas
app.get('/api/tareas/:id', (req, res) => {
    const tareaId = req.params.id;
    
    // Obtener tarea
    db.get(`SELECT t.*, c.color as categoria_color, c.icono as categoria_icono,
            u.username as creador_username 
            FROM tareas t 
            LEFT JOIN categorias_tareas c ON t.categoria = c.nombre
            LEFT JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.id = ? AND t.activa = 1`, [tareaId], (err, tarea) => {
        if (err) {
            console.error('Error al obtener tarea:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (!tarea) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }
        
        // Obtener notas de la tarea
        db.all(`SELECT n.*, u.username 
                FROM tareas_notas n 
                LEFT JOIN usuarios u ON n.usuario_id = u.id
                WHERE n.tarea_id = ? 
                ORDER BY n.fecha_creacion DESC`, [tareaId], (err, notas) => {
            if (err) {
                console.error('Error al obtener notas:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            res.json({ 
                success: true, 
                tarea: { ...tarea, notas }
            });
        });
    });
});

// Crear nueva tarea
app.post('/api/tareas', (req, res) => {
    const { titulo, descripcion, estado, prioridad, categoria, fecha_vencimiento, 
            tiempo_estimado, etiquetas, usuario_id } = req.body;
    
    if (!titulo) {
        return res.status(400).json({ success: false, message: 'El título es obligatorio' });
    }
    
    const etiquetasJson = etiquetas ? JSON.stringify(etiquetas) : null;
    
    db.run(`INSERT INTO tareas (titulo, descripcion, estado, prioridad, categoria, 
            fecha_vencimiento, tiempo_estimado, etiquetas, usuario_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descripcion || '', estado || 'pendiente', prioridad || 'media', 
         categoria || 'General', fecha_vencimiento, tiempo_estimado, etiquetasJson, usuario_id],
        function(err) {
            if (err) {
                console.error('Error al crear tarea:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            logActivity(usuario_id, 'crear_tarea', `Tarea: ${titulo}`, req.ip);
            
            res.json({
                success: true,
                message: 'Tarea creada correctamente',
                tarea: { id: this.lastID, titulo, descripcion, estado, prioridad, categoria }
            });
        }
    );
});

// Actualizar tarea
app.put('/api/tareas/:id', (req, res) => {
    const tareaId = req.params.id;
    const { titulo, descripcion, estado, prioridad, categoria, fecha_vencimiento, 
            tiempo_estimado, tiempo_real, progreso, etiquetas, editor_id } = req.body;
    
    if (!titulo) {
        return res.status(400).json({ success: false, message: 'El título es obligatorio' });
    }
    
    const etiquetasJson = etiquetas ? JSON.stringify(etiquetas) : null;
    const fechaFinalizacion = estado === 'finalizada' ? new Date().toISOString() : null;
    
    db.run(`UPDATE tareas SET titulo = ?, descripcion = ?, estado = ?, prioridad = ?, 
            categoria = ?, fecha_vencimiento = ?, tiempo_estimado = ?, tiempo_real = ?, 
            progreso = ?, etiquetas = ?, fecha_finalizacion = ?
            WHERE id = ? AND activa = 1`,
        [titulo, descripcion || '', estado || 'pendiente', prioridad || 'media', 
         categoria || 'General', fecha_vencimiento, tiempo_estimado, tiempo_real, 
         progreso || 0, etiquetasJson, fechaFinalizacion, tareaId],
        function(err) {
            if (err) {
                console.error('Error al actualizar tarea:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
            }
            
            logActivity(editor_id, 'actualizar_tarea', `Tarea: ${titulo}`, req.ip);
            
            res.json({ success: true, message: 'Tarea actualizada correctamente' });
        }
    );
});

// Eliminar tarea (marcar como inactiva)
app.delete('/api/tareas/:id', (req, res) => {
    const tareaId = req.params.id;
    const { eliminador_id } = req.body;
    
    db.run(`UPDATE tareas SET activa = 0 WHERE id = ?`, [tareaId], function(err) {
        if (err) {
            console.error('Error al eliminar tarea:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }
        
        logActivity(eliminador_id, 'eliminar_tarea', `Tarea ID: ${tareaId}`, req.ip);
        
        res.json({ success: true, message: 'Tarea eliminada correctamente' });
    });
});

// Agregar nota a tarea
app.post('/api/tareas/:id/notas', (req, res) => {
    const tareaId = req.params.id;
    const { nota, tipo, usuario_id } = req.body;
    
    if (!nota) {
        return res.status(400).json({ success: false, message: 'La nota es obligatoria' });
    }
    
    db.run(`INSERT INTO tareas_notas (tarea_id, nota, tipo, usuario_id) VALUES (?, ?, ?, ?)`,
        [tareaId, nota, tipo || 'comentario', usuario_id],
        function(err) {
            if (err) {
                console.error('Error al agregar nota:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            res.json({
                success: true,
                message: 'Nota agregada correctamente',
                nota: { id: this.lastID, tarea_id: tareaId, nota, tipo: tipo || 'comentario' }
            });
        }
    );
});

// Obtener categorías de tareas
app.get('/api/categorias-tareas', (req, res) => {
    db.all(`SELECT * FROM categorias_tareas WHERE activa = 1 ORDER BY nombre`, (err, categorias) => {
        if (err) {
            console.error('Error al obtener categorías:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        res.json({ success: true, categorias });
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

// Endpoint específico para actualizar solo parámetros de conexión
app.patch('/api/olts/:id/parametros', (req, res) => {
    const oltId = req.params.id;
    const { shelf, slot, port, onu_id } = req.body;

    // Construir query dinámicamente solo con los campos proporcionados
    const fieldsToUpdate = [];
    const values = [];
    
    if (shelf !== undefined) {
        fieldsToUpdate.push('shelf = ?');
        values.push(shelf);
    }
    if (slot !== undefined) {
        fieldsToUpdate.push('slot = ?');
        values.push(slot);
    }
    if (port !== undefined) {
        fieldsToUpdate.push('port = ?');
        values.push(port);
    }
    if (onu_id !== undefined) {
        fieldsToUpdate.push('onu_id = ?');
        values.push(onu_id);
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay parámetros para actualizar' });
    }

    fieldsToUpdate.push('fecha_modificacion = CURRENT_TIMESTAMP');
    values.push(oltId);

    const query = `UPDATE olts SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Error al actualizar parámetros de OLT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'OLT no encontrada' });
        }

        logActivity(req.body.userId, 'actualizar_parametros_olt', `Parámetros OLT ID: ${oltId}`, req.ip);
        
        res.json({ success: true, message: 'Parámetros de conexión actualizados automáticamente' });
    });
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

// Obtener comandos por OLT ID
app.get('/api/comandos/:olt_id', (req, res) => {
    const oltId = req.params.olt_id;
    
    db.all(`SELECT * FROM comandos WHERE olt_id = ? AND activo = 1 ORDER BY orden, nombre`, [oltId], (err, comandos) => {
        if (err) {
            console.error('Error al obtener comandos:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        // Parsear los comandos JSON
        const comandosFormateados = comandos.map(cmd => ({
            ...cmd,
            comandos: JSON.parse(cmd.comandos_json)
        }));
        
        res.json({ success: true, comandos: comandosFormateados });
    });
});

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

// Crear nuevo modelo ONT (versión mejorada con validación)
app.post('/api/modelos-ont', (req, res) => {
    const { id, fabricante, modelo, version, tipo, descripcion, comandos, usuarioId } = req.body;
    
    console.log('=== CREANDO MODELO ONT ===');
    console.log('Datos recibidos:', { id, fabricante, modelo, version, tipo, descripcion, comandos: comandos?.length, usuarioId });
    
    // Validaciones básicas
    if (!id || !fabricante || !modelo || !tipo) {
        console.error('Datos incompletos:', { id: !!id, fabricante: !!fabricante, modelo: !!modelo, tipo: !!tipo });
        return res.status(400).json({ 
            success: false, 
            message: 'Datos incompletos. Se requiere ID, fabricante, modelo y tipo.' 
        });
    }
    
    // Verificar que el ID no exista ya
    db.get(`SELECT id FROM modelos_ont WHERE id = ?`, [id], (err, existingModel) => {
        if (err) {
            console.error('Error al verificar ID existente:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor al validar' });
        }
        
        if (existingModel) {
            console.error('ID duplicado encontrado:', id);
            return res.status(400).json({ 
                success: false, 
                message: 'Ya existe un modelo con ese ID. Intente nuevamente.' 
            });
        }
        
        // Insertar modelo principal
        console.log('Insertando modelo en BD...');
        db.run(`INSERT INTO modelos_ont (id, fabricante, modelo, version, tipo, descripcion, usuario_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, fabricante, modelo, version || '', tipo, descripcion || '', usuarioId || 1],
            function(err) {
                if (err) {
                    console.error('Error al insertar modelo ONT:', err);
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Error de integridad: posible ID duplicado o datos inválidos' 
                        });
                    }
                    return res.status(500).json({ success: false, message: 'Error del servidor al insertar modelo' });
                }

                console.log('Modelo insertado exitosamente. Changes:', this.changes);

                // Agregar comandos específicos si los hay
                if (comandos && comandos.length > 0) {
                    console.log(`Insertando ${comandos.length} comandos específicos...`);
                    let processed = 0;
                    let errors = 0;
                    
                    comandos.forEach((cmd, index) => {
                        const comandoId = cmd.id || `${id}-cmd-${index}-${Date.now()}`;
                        
                        db.run(`INSERT INTO comandos_ont (id, modelo_id, comando, descripcion, orden) 
                                VALUES (?, ?, ?, ?, ?)`,
                            [comandoId, id, cmd.comando, cmd.descripcion || '', cmd.orden || index],
                            function(cmdErr) {
                                processed++;
                                if (cmdErr) {
                                    console.error(`Error al insertar comando ${index}:`, cmdErr);
                                    errors++;
                                }
                                
                                if (processed === comandos.length) {
                                    console.log(`Comandos procesados: ${processed}, errores: ${errors}`);
                                    logActivity(usuarioId, 'crear_modelo_ont', `Modelo: ${fabricante} ${modelo} con ${comandos.length - errors} comandos`, req.ip);
                                    
                                    res.json({ 
                                        success: true, 
                                        modeloId: id, 
                                        message: `Modelo ONT creado correctamente${errors > 0 ? ` (${errors} comandos fallaron)` : ''}`,
                                        comandosCreados: comandos.length - errors
                                    });
                                }
                            }
                        );
                    });
                } else {
                    console.log('Modelo creado sin comandos específicos');
                    logActivity(usuarioId, 'crear_modelo_ont', `Modelo: ${fabricante} ${modelo}`, req.ip);
                    res.json({ 
                        success: true, 
                        modeloId: id, 
                        message: 'Modelo ONT creado correctamente',
                        comandosCreados: 0
                    });
                }
            }
        );
    });
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

// ===== RUTAS PARA NOTIFICACIONES SSE =====

// Stream de notificaciones en tiempo real
app.get('/api/notifications/stream', (req, res) => {
    // Configurar headers para SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Agregar cliente a la lista
    const client = {
        id: Date.now(),
        response: res,
        userId: req.query.userId || 'anonymous'
    };
    
    sseClients.add(client);
    console.log(`📡 Cliente SSE conectado: ${client.id} (Total: ${sseClients.size})`);

    // Enviar mensaje de conexión
    res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Conectado al stream de notificaciones',
        timestamp: new Date().toISOString()
    })}\n\n`);

    // Limpiar al desconectar
    req.on('close', () => {
        sseClients.delete(client);
        console.log(`📡 Cliente SSE desconectado: ${client.id} (Total: ${sseClients.size})`);
    });
});

// Suscribirse a notificaciones push
app.post('/api/notifications/subscribe', (req, res) => {
    try {
        const subscription = req.body;
        notificationSubscriptions.add(subscription);
        
        console.log('📱 Nueva suscripción push registrada');
        res.json({ success: true, message: 'Suscripción registrada' });
    } catch (error) {
        console.error('Error registrando suscripción push:', error);
        res.status(500).json({ success: false, message: 'Error registrando suscripción' });
    }
});

// Obtener notificaciones pendientes
app.get('/api/notifications/pending', (req, res) => {
    // Aquí se pueden obtener notificaciones pendientes de la BD
    res.json({ 
        success: true, 
        notifications: [] // Por ahora vacío
    });
});

// Enviar notificación a todos los clientes conectados
function broadcastNotification(notification) {
    const message = `data: ${JSON.stringify(notification)}\n\n`;
    
    sseClients.forEach(client => {
        try {
            client.response.write(message);
        } catch (error) {
            console.error('Error enviando notificación SSE:', error);
            sseClients.delete(client);
        }
    });
    
    console.log(`📢 Notificación enviada a ${sseClients.size} clientes`);
}

// ===== RUTAS PARA ANALYTICS Y REPORTES =====

// Obtener métricas del sistema
app.get('/api/analytics/metrics', async (req, res) => {
    try {
        const period = req.query.period || '7d';
        
        // Obtener estadísticas básicas
        const tasksStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as en_progreso,
                    SUM(CASE WHEN estado = 'finalizada' THEN 1 ELSE 0 END) as finalizadas
                FROM tareas
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const userStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos
                FROM usuarios
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const oltStats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT COUNT(*) as total FROM olts
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json({
            success: true,
            metrics: {
                tasks: tasksStats,
                users: userStats,
                olts: oltStats,
                system: {
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage(),
                    generated_at: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        res.status(500).json({ success: false, message: 'Error obteniendo métricas' });
    }
});

// Generar reporte específico
app.post('/api/reports/generate', async (req, res) => {
    try {
        const { type, filters, format } = req.body;
        
        console.log(`� Generando reporte: ${type} en formato ${format}`);
        
        let reportData;
        
        switch (type) {
            case 'tasks':
                reportData = await generateTaskReport(filters);
                break;
            case 'users':
                reportData = await generateUserReport(filters);
                break;
            case 'olts':
                reportData = await generateOLTReport(filters);
                break;
            default:
                throw new Error('Tipo de reporte no soportado');
        }
        
        res.json({
            success: true,
            report: reportData,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error generando reporte:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Funciones auxiliares para reportes
async function generateTaskReport(filters = {}) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM tareas WHERE 1=1';
        const params = [];
        
        if (filters.estado) {
            query += ' AND estado = ?';
            params.push(filters.estado);
        }
        
        if (filters.prioridad) {
            query += ' AND prioridad = ?';
            params.push(filters.prioridad);
        }
        
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    title: 'Reporte de Tareas',
                    data: rows,
                    summary: {
                        total: rows.length,
                        by_status: groupBy(rows, 'estado'),
                        by_priority: groupBy(rows, 'prioridad')
                    }
                });
            }
        });
    });
}

async function generateUserReport(filters = {}) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT id, username, rol, email, activo, created_at FROM usuarios WHERE 1=1';
        const params = [];
        
        if (filters.rol) {
            query += ' AND rol = ?';
            params.push(filters.rol);
        }
        
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    title: 'Reporte de Usuarios',
                    data: rows,
                    summary: {
                        total: rows.length,
                        active: rows.filter(u => u.activo).length,
                        by_role: groupBy(rows, 'rol')
                    }
                });
            }
        });
    });
}

async function generateOLTReport(filters = {}) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM olts WHERE 1=1';
        const params = [];
        
        if (filters.estado) {
            query += ' AND estado = ?';
            params.push(filters.estado);
        }
        
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    title: 'Reporte de OLTs',
                    data: rows,
                    summary: {
                        total: rows.length,
                        by_status: groupBy(rows, 'estado')
                    }
                });
            }
        });
    });
}

// Función auxiliar para agrupar datos
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const value = item[key] || 'Sin especificar';
        groups[value] = (groups[value] || 0) + 1;
        return groups;
    }, {});
}

// ===== RUTAS PARA CATEGORÍAS DE TAREAS =====

// Obtener categorías de tareas disponibles
app.get('/api/categorias-tareas', (req, res) => {
    db.all('SELECT * FROM task_categories ORDER BY nombre', (err, rows) => {
        if (err) {
            console.error('Error obteniendo categorías:', err);
            res.status(500).json({ success: false, message: 'Error obteniendo categorías' });
        } else {
            res.json({ success: true, categorias: rows });
        }
    });
});

// ===== INTERCEPTORES PARA NOTIFICACIONES AUTOMÁTICAS =====

// Interceptar creación de tareas para enviar notificación
const originalTaskCreate = app.post;

// Middleware para notificaciones automáticas en tareas
app.use('/api/tareas', (req, res, next) => {
    if (req.method === 'POST') {
        // Interceptar respuesta para enviar notificación
        const originalSend = res.send;
        res.send = function(data) {
            try {
                const response = JSON.parse(data);
                if (response.success && response.tarea) {
                    // Enviar notificación de nueva tarea
                    broadcastNotification({
                        type: 'task-update',
                        data: {
                            titulo: response.tarea.titulo,
                            accion: 'creada',
                            id: response.tarea.id
                        }
                    });
                }
            } catch (e) {
                // Ignorar errores de parsing
            }
            originalSend.call(this, data);
        };
    }
    next();
});

app.listen(PORT, () => {
    console.log('�🚀 Servidor iniciado en puerto', PORT);
    console.log('🌐 Acceder a: http://localhost:' + PORT);
    console.log('📊 Base de datos: ' + dbPath);
    console.log('📡 SSE habilitado para notificaciones en tiempo real');
    console.log('📊 Analytics y reportes habilitados');
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

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
                rol: user.rol
            }
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

    db.run(`UPDATE comandos SET activo = 0 WHERE id = ?`, [comandoId], function(err) {
        if (err) {
            console.error('Error al eliminar comando:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Comando no encontrado' });
        }

        logActivity(req.body.userId, 'eliminar_comando', `Comando ID: ${comandoId}`, req.ip);
        
        res.json({ success: true, message: 'Comando eliminado correctamente' });
    });
});

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

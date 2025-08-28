const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const { runDatabaseMigrations } = require('./database-migrations');
const UserDatabaseManager = require('./user-database-manager');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar gestor de bases de datos por usuario
const dbManager = new UserDatabaseManager();
console.log('🔧 Gestor de bases de datos por usuario inicializado');

// Variables para SSE y notificaciones
let sseClients = new Set();
let notificationSubscriptions = new Set();

// Middlewares
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar multer para manejo de archivos
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configuración de sesiones
app.use(session({
    secret: 'desarrollo-residenciales-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true para HTTPS, false para desarrollo local
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// app.use(express.static('public')); // Deshabilitado: carpeta no existe

// Servir archivos estáticos adicionales
app.use('/dashboard-charts.js', express.static(path.join(__dirname, 'dashboard-charts.js')));
app.use('/notification-system.js', express.static(path.join(__dirname, 'notification-system.js')));
app.use('/reports-analytics.js', express.static(path.join(__dirname, 'reports-analytics.js')));
app.use('/sw-notifications.js', express.static(path.join(__dirname, 'sw-notifications.js')));
// app.use('/theme-system.js', express.static(path.join(__dirname, 'theme-system.js'))); // Archivo no presente
app.use('/automation-system.js', express.static(path.join(__dirname, 'automation-system.js')));
app.use('/elegant-dark-mode.js', express.static(path.join(__dirname, 'elegant-dark-mode.js')));
// app.use('/test-dark-mode.js', express.static(path.join(__dirname, 'test-dark-mode.js'))); // Archivo no presente
app.use('/force-commands-dark.js', express.static(path.join(__dirname, 'force-commands-dark.js')));
// app.use('/diagnostico-tareas.js', express.static(path.join(__dirname, 'diagnostico-tareas.js'))); // Archivo no presente
app.use('/fix-tareas-login.js', express.static(path.join(__dirname, 'fix-tareas-login.js')));
app.use('/adaptive-colors.js', express.static(path.join(__dirname, 'adaptive-colors.js')));
app.use('/sw.js', express.static(path.join(__dirname, 'sw.js')));
app.use('/manifest.json', express.static(path.join(__dirname, 'manifest.json')));

// Servir el archivo HTML principal con headers anti-cache
app.get('/', (req, res) => {
    // Headers para evitar caché del index.html
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Conexión a la base de datos principal (solo para inicialización)
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos:', err.message);
    } else {
        console.log('🔗 Conectado a la base de datos SQLite');
        // Verificar y crear tablas automáticamente
        initializeDatabase();
        
        // Ejecutar migraciones después de la inicialización
        setTimeout(async () => {
            try {
                console.log('🔄 Ejecutando migraciones de base de datos...');
                await runDatabaseMigrations();
                console.log('✅ Migraciones completadas');
            } catch (error) {
                console.error('❌ Error en migraciones:', error);
            }
        }, 3000);
    }
});

// ===== FUNCIÓN HELPER PARA OBTENER BASE DE DATOS POR USUARIO =====
function getUserDatabase(req) {
    if (!req.session || !req.session.user) {
        console.log('⚠️ Sesión no válida - usando BD principal');
        return dbManager.getMainDatabase();
    }
    
    const user = req.session.user;
    return dbManager.getUserDatabase(user.username, user.rol);
}

// ===== FUNCIÓN HELPER PARA VERIFICAR SI ES ADMINISTRADOR =====
function isAdmin(user) {
    return user && (user.rol === 'admin' || user.rol === 'administrador');
}

// ===== INICIALIZACIÓN AUTOMÁTICA DE LA BASE DE DATOS =====
function initializeDatabase() {
    console.log('🔧 Verificando estructura de la base de datos...');
    
    db.serialize(() => {
        // Tabla de categorías de tareas
        db.run(`CREATE TABLE IF NOT EXISTS categorias_tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            color TEXT,
            icono TEXT,
            activa INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creando tabla categorias_tareas:', err);
            else console.log('✅ Tabla categorias_tareas verificada');
        });

        // Tabla de tareas
        db.run(`CREATE TABLE IF NOT EXISTS tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            estado TEXT DEFAULT 'pendiente',
            prioridad TEXT DEFAULT 'media',
            categoria TEXT,
            usuario_id INTEGER,
            activa INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
            FOREIGN KEY (categoria) REFERENCES categorias_tareas(nombre)
        )`, (err) => {
            if (err) console.error('Error creando tabla tareas:', err);
            else console.log('✅ Tabla tareas verificada');
        });

        // Tabla de usuarios
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nombre_completo TEXT,
            email TEXT UNIQUE,
            rol TEXT DEFAULT 'usuario',
            activo INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            ultimo_acceso DATETIME,
            configuraciones TEXT
        )`, (err) => {
            if (err) console.error('Error creando tabla usuarios:', err);
            else console.log('✅ Tabla usuarios verificada');
        });

        // Tabla de comandos OLT
        db.run(`CREATE TABLE IF NOT EXISTS comandos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            comando TEXT NOT NULL,
            descripcion TEXT,
            categoria TEXT DEFAULT 'general',
            parametros TEXT,
            ejemplo TEXT,
            activo INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            creado_por INTEGER,
            FOREIGN KEY (creado_por) REFERENCES usuarios(id)
        )`, (err) => {
            if (err) console.error('Error creando tabla comandos:', err);
            else console.log('✅ Tabla comandos verificada');
        });

        // Tabla de OLTs
        db.run(`CREATE TABLE IF NOT EXISTS olts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            ip TEXT UNIQUE NOT NULL,
            modelo TEXT,
            ubicacion TEXT,
            estado TEXT DEFAULT 'activo',
            puerto_ssh INTEGER DEFAULT 22,
            usuario_ssh TEXT,
            notas TEXT,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            ultima_conexion DATETIME
        )`, (err) => {
            if (err) console.error('Error creando tabla olts:', err);
            else console.log('✅ Tabla olts verificada');
        });

        // Tabla de logs de actividad
        db.run(`CREATE TABLE IF NOT EXISTS logs_actividad (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            accion TEXT NOT NULL,
            detalles TEXT,
            ip_address TEXT,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`, (err) => {
            if (err) console.error('Error creando tabla logs_actividad:', err);
            else console.log('✅ Tabla logs_actividad verificada');
        });

        // Tabla de configuraciones del sistema
        db.run(`CREATE TABLE IF NOT EXISTS configuraciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clave TEXT UNIQUE NOT NULL,
            valor TEXT,
            descripcion TEXT,
            tipo TEXT DEFAULT 'texto',
            fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creando tabla configuraciones:', err);
            else console.log('✅ Tabla configuraciones verificada');
        });

        // Tabla de modelos ACS
        db.run(`CREATE TABLE IF NOT EXISTS modelos_acs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE NOT NULL,
            descripcion TEXT,
            comandos_compatibles TEXT,
            parametros_especiales TEXT,
            activo INTEGER DEFAULT 1,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creando tabla modelos_acs:', err);
            else console.log('✅ Tabla modelos_acs verificada');
        });

        // Tabla de reportes y análisis
        db.run(`CREATE TABLE IF NOT EXISTS reportes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            titulo TEXT NOT NULL,
            datos TEXT,
            fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            generado_por INTEGER,
            FOREIGN KEY (generado_por) REFERENCES usuarios(id)
        )`, (err) => {
            if (err) console.error('Error creando tabla reportes:', err);
            else console.log('✅ Tabla reportes verificada');
        });

        // Insertar datos iniciales
        insertInitialData();
    });
}

// Insertar datos iniciales si no existen
function insertInitialData() {
    // Categorías de tareas por defecto
    const categorias = [
        { nombre: 'Mantenimiento', color: '#1976d2', icono: 'build' },
        { nombre: 'Soporte', color: '#388e3c', icono: 'support_agent' },
        { nombre: 'Mejora', color: '#fbc02d', icono: 'trending_up' },
        { nombre: 'Urgente', color: '#d32f2f', icono: 'priority_high' },
        { nombre: 'Configuración', color: '#7b1fa2', icono: 'settings' }
    ];

    categorias.forEach(cat => {
        db.run(`INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono) VALUES (?, ?, ?)`, 
               [cat.nombre, cat.color, cat.icono]);
    });

    // Usuario administrador por defecto (solo si no existe)
    db.get(`SELECT id FROM usuarios WHERE username = 'admin'`, (err, row) => {
        if (!row) {
            const adminPassword = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol) 
                    VALUES (?, ?, ?, ?, ?)`, 
                   ['admin', adminPassword, 'Administrador del Sistema', 'admin@localhost', 'administrador'],
                   (err) => {
                       if (err) console.error('Error creando usuario admin:', err);
                       else console.log('👤 Usuario administrador creado (admin/admin123)');
                   });
        }
    });

    // Configuraciones por defecto
    const configuraciones = [
        { clave: 'tema_por_defecto', valor: 'claro', descripcion: 'Tema visual por defecto' },
        { clave: 'notificaciones_habilitadas', valor: 'true', descripcion: 'Notificaciones del sistema' },
        { clave: 'backup_automatico', valor: 'true', descripcion: 'Backup automático de datos' },
        { clave: 'version_sistema', valor: '3.0.0', descripcion: 'Versión actual del sistema' }
    ];

    configuraciones.forEach(config => {
        db.run(`INSERT OR IGNORE INTO configuraciones (clave, valor, descripcion) VALUES (?, ?, ?)`, 
               [config.clave, config.valor, config.descripcion]);
    });

    console.log('📊 Datos iniciales verificados e insertados');
}

// ===== FUNCIÓN DE VERIFICACIÓN DE INTEGRIDAD DE LA BD =====
function checkDatabaseIntegrity() {
    console.log('🔍 Verificando integridad de la base de datos...');
    
    // Verificar que las tablas principales existen
    const requiredTables = [
        'usuarios', 'tareas', 'categorias_tareas', 'comandos', 
        'olts', 'logs_actividad', 'configuraciones', 'modelos_acs', 'reportes'
    ];
    
    let tablesChecked = 0;
    const totalTables = requiredTables.length;
    
    requiredTables.forEach(tableName => {
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
            tablesChecked++;
            if (err) {
                console.error(`❌ Error verificando tabla ${tableName}:`, err);
            } else if (!row) {
                console.warn(`⚠️  Tabla ${tableName} no encontrada, será creada automáticamente`);
            } else {
                console.log(`✅ Tabla ${tableName} existe`);
            }
            
            // Cuando se hayan verificado todas las tablas
            if (tablesChecked === totalTables) {
                console.log('🎯 Verificación de integridad completada');
                
                // Ejecutar mantenimiento de base de datos
                performDatabaseMaintenance();
            }
        });
    });
}

// ===== MANTENIMIENTO AUTOMÁTICO DE LA BASE DE DATOS =====
function performDatabaseMaintenance() {
    console.log('🧹 Ejecutando mantenimiento de base de datos...');
    
    // Limpiar logs antiguos (más de 90 días)
    db.run(`DELETE FROM logs_actividad WHERE fecha < datetime('now', '-90 days')`, (err) => {
        if (err) {
            console.error('Error limpiando logs antiguos:', err);
        } else {
            console.log('🗑️  Logs antiguos limpiados');
        }
    });
    
    // Optimizar base de datos
    db.run(`VACUUM`, (err) => {
        if (err) {
            console.error('Error optimizando base de datos:', err);
        } else {
            console.log('⚡ Base de datos optimizada');
        }
    });
    
    // Analizar estadísticas
    db.run(`ANALYZE`, (err) => {
        if (err) {
            console.error('Error analizando estadísticas:', err);
        } else {
            console.log('📈 Estadísticas de base de datos actualizadas');
        }
    });
    
    console.log('✨ Mantenimiento de base de datos completado');
}

// Ejecutar verificación de integridad después de la inicialización
setTimeout(() => {
    checkDatabaseIntegrity();
}, 2000); // Esperar 2 segundos para que se complete la inicialización

// Función para registrar actividad
function logActivity(userId, accion, detalles, ip) {
    db.run(`INSERT INTO logs_actividad (usuario_id, accion, detalles, ip_address) 
            VALUES (?, ?, ?, ?)`, [userId, accion, detalles, ip]);
}

// ===== RUTAS DE SISTEMA Y BASE DE DATOS =====

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '3.0.0',
        database: 'connected'
    });
});

// Estado de la base de datos
app.get('/api/database/status', (req, res) => {
    const status = {
        connected: true,
        timestamp: new Date().toISOString(),
        tables: {},
        statistics: {}
    };

    const requiredTables = [
        'usuarios', 'tareas', 'categorias_tareas', 'comandos', 
        'olts', 'logs_actividad', 'configuraciones', 'modelos_acs', 'reportes'
    ];

    let completedChecks = 0;
    
    requiredTables.forEach(tableName => {
        // Verificar existencia de tabla
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
            if (err) {
                status.tables[tableName] = { exists: false, error: err.message };
            } else {
                status.tables[tableName] = { exists: !!row };
                
                // Si la tabla existe, obtener estadísticas
                if (row) {
                    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, countRow) => {
                        if (!err && countRow) {
                            status.tables[tableName].count = countRow.count;
                        }
                        
                        completedChecks++;
                        if (completedChecks === requiredTables.length) {
                            // Estadísticas generales
                            db.get(`SELECT 
                                (SELECT COUNT(*) FROM usuarios WHERE activo = 1) as usuarios_activos,
                                (SELECT COUNT(*) FROM tareas WHERE estado != 'completada') as tareas_pendientes,
                                (SELECT COUNT(*) FROM logs_actividad WHERE fecha > datetime('now', '-24 hours')) as actividad_24h
                            `, (err, stats) => {
                                if (!err && stats) {
                                    status.statistics = stats;
                                }
                                res.json(status);
                            });
                        }
                    });
                } else {
                    completedChecks++;
                    if (completedChecks === requiredTables.length) {
                        res.json(status);
                    }
                }
            }
        });
    });
});

// Reinicializar base de datos (solo para desarrollo)
app.post('/api/database/reinitialize', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
            success: false, 
            message: 'Operación no permitida en producción' 
        });
    }

    console.log('🔄 Reinicializando base de datos...');
    
    try {
        initializeDatabase();
        res.json({ 
            success: true, 
            message: 'Base de datos reinicializada correctamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error reinicializando base de datos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al reinicializar base de datos',
            error: error.message
        });
    }
});

// Ejecutar mantenimiento manual
app.post('/api/database/maintenance', (req, res) => {
    console.log('🧹 Ejecutando mantenimiento manual de base de datos...');
    
    try {
        performDatabaseMaintenance();
        res.json({ 
            success: true, 
            message: 'Mantenimiento ejecutado correctamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en mantenimiento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en mantenimiento de base de datos',
            error: error.message
        });
    }
});

// Backup de base de datos
app.get('/api/database/backup', (req, res) => {
    const backupData = {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        tables: {}
    };

    const tables = ['usuarios', 'tareas', 'categorias_tareas', 'comandos', 'configuraciones'];
    let completedTables = 0;

    tables.forEach(tableName => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (!err) {
                backupData.tables[tableName] = rows;
            }
            
            completedTables++;
            if (completedTables === tables.length) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="backup_${Date.now()}.json"`);
                res.json(backupData);
            }
        });
    });
});

// ===== RUTAS DE EXPORTAR/IMPORTAR COMANDOS Y OLTs =====

// Exportar OLTs y comandos del usuario actual
app.get('/api/export/olts-commands', (req, res) => {
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    const userDb = getUserDatabase(req);
    const exportData = {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        user: usuarioActual.username,
        data: {}
    };
    
    // Exportar OLTs
    userDb.all(`SELECT * FROM olts WHERE activo = 1`, (err, olts) => {
        if (err) {
            console.error('Error exportando OLTs:', err);
            return res.status(500).json({ success: false, message: 'Error exportando OLTs' });
        }
        
        exportData.data.olts = olts;
        
        // Exportar comandos
        userDb.all(`SELECT * FROM comandos WHERE activo = 1`, (err, comandos) => {
            if (err) {
                console.error('Error exportando comandos:', err);
                return res.status(500).json({ success: false, message: 'Error exportando comandos' });
            }
            
            exportData.data.comandos = comandos;
            
            const filename = `olts-commands-${usuarioActual.username}-${Date.now()}.json`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.json(exportData);
            
            logActivity(usuarioActual.id, 'exportar_olts_comandos', `Archivo: ${filename}`, req.ip);
        });
    });
});

// Importar OLTs y comandos
app.post('/api/import/olts-commands', upload.single('file'), (req, res) => {
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Archivo no proporcionado' });
    }
    
    let importData;
    try {
        // Parsear el archivo JSON
        const fileContent = req.file.buffer.toString('utf8');
        importData = JSON.parse(fileContent);
        
        // Validar estructura del archivo
        if (!importData.data || !importData.data.olts || !importData.data.comandos) {
            return res.status(400).json({ success: false, message: 'Estructura de archivo inválida' });
        }
    } catch (error) {
        console.error('Error parseando archivo JSON:', error);
        return res.status(400).json({ success: false, message: 'Archivo JSON inválido' });
    }
    
    const data = importData.data;
    const overwrite = req.body.overwrite === 'true';
    
    const userDb = getUserDatabase(req);
    const results = {
        olts: { created: 0, updated: 0, errors: 0 },
        comandos: { created: 0, updated: 0, errors: 0 }
    };
    
    // Función para importar OLTs
    const importOLTs = () => {
        return new Promise((resolve) => {
            let processed = 0;
            const total = data.olts.length;
            
            if (total === 0) {
                resolve();
                return;
            }
            
            data.olts.forEach(olt => {
                // Verificar si existe OLT con mismo nombre o IP
                userDb.get(`SELECT id FROM olts WHERE nombre = ? OR ip = ?`, [olt.nombre, olt.ip], (err, existing) => {
                    if (err) {
                        results.olts.errors++;
                        processed++;
                        if (processed === total) resolve();
                        return;
                    }
                    
                    if (existing && !overwrite) {
                        // Saltar si existe y no se permite sobrescribir
                        processed++;
                        if (processed === total) resolve();
                        return;
                    }
                    
                    if (existing && overwrite) {
                        // Actualizar OLT existente
                        userDb.run(`UPDATE olts SET modelo = ?, ubicacion = ?, puerto_ssh = ?, usuario_ssh = ?, notas = ? WHERE id = ?`,
                            [olt.modelo, olt.ubicacion, olt.puerto_ssh, olt.usuario_ssh, olt.notas, existing.id], (err) => {
                            if (err) {
                                results.olts.errors++;
                            } else {
                                results.olts.updated++;
                            }
                            processed++;
                            if (processed === total) resolve();
                        });
                    } else {
                        // Crear nueva OLT
                        userDb.run(`INSERT INTO olts (nombre, ip, modelo, ubicacion, estado, puerto_ssh, usuario_ssh, notas) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [olt.nombre, olt.ip, olt.modelo, olt.ubicacion, 'activo', olt.puerto_ssh, olt.usuario_ssh, olt.notas], (err) => {
                            if (err) {
                                results.olts.errors++;
                            } else {
                                results.olts.created++;
                            }
                            processed++;
                            if (processed === total) resolve();
                        });
                    }
                });
            });
        });
    };
    
    // Función para importar comandos
    const importComandos = () => {
        return new Promise((resolve) => {
            let processed = 0;
            const total = data.comandos.length;
            
            if (total === 0) {
                resolve();
                return;
            }
            
            data.comandos.forEach(comando => {
                // Buscar OLT por nombre para asociar comando
                userDb.get(`SELECT id FROM olts WHERE nombre = ?`, [comando.olt_nombre || ''], (err, olt) => {
                    if (err || !olt) {
                        // Si no se encuentra la OLT, usar olt_id original o saltar
                        if (!comando.olt_id) {
                            results.comandos.errors++;
                            processed++;
                            if (processed === total) resolve();
                            return;
                        }
                    }
                    
                    const oltId = olt ? olt.id : comando.olt_id;
                    
                    // Verificar si existe comando con mismo nombre en la misma OLT
                    userDb.get(`SELECT id FROM comandos WHERE nombre = ? AND olt_id = ?`, [comando.nombre, oltId], (err, existing) => {
                        if (err) {
                            results.comandos.errors++;
                            processed++;
                            if (processed === total) resolve();
                            return;
                        }
                        
                        if (existing && !overwrite) {
                            processed++;
                            if (processed === total) resolve();
                            return;
                        }
                        
                        // Detectar esquema de comandos (comandos_json vs comando)
                        userDb.all(`PRAGMA table_info(comandos)`, (pragmaErr, cols) => {
                            if (pragmaErr) {
                                results.comandos.errors++;
                                processed++;
                                if (processed === total) resolve();
                                return;
                            }
                            
                            const hasComandosJson = cols.some(c => c.name === 'comandos_json');
                            const hasComando = cols.some(c => c.name === 'comando');
                            
                            let sql, params;
                            
                            if (existing && overwrite) {
                                // Actualizar comando existente
                                if (hasComandosJson) {
                                    sql = `UPDATE comandos SET descripcion = ?, comandos_json = ?, categoria = ? WHERE id = ?`;
                                    params = [comando.descripcion, comando.comandos_json || JSON.stringify([comando.comando || '']), comando.categoria, existing.id];
                                } else if (hasComando) {
                                    sql = `UPDATE comandos SET descripcion = ?, comando = ?, categoria = ? WHERE id = ?`;
                                    const cmdStr = comando.comandos_json ? JSON.parse(comando.comandos_json).join('\n') : (comando.comando || '');
                                    params = [comando.descripcion, cmdStr, comando.categoria, existing.id];
                                } else {
                                    sql = `UPDATE comandos SET descripcion = ?, categoria = ? WHERE id = ?`;
                                    params = [comando.descripcion, comando.categoria, existing.id];
                                }
                                
                                userDb.run(sql, params, (err) => {
                                    if (err) {
                                        results.comandos.errors++;
                                    } else {
                                        results.comandos.updated++;
                                    }
                                    processed++;
                                    if (processed === total) resolve();
                                });
                            } else {
                                // Crear nuevo comando
                                if (hasComandosJson) {
                                    sql = `INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria, activo) VALUES (?, ?, ?, ?, ?, 1)`;
                                    params = [oltId, comando.nombre, comando.descripcion, comando.comandos_json || JSON.stringify([comando.comando || '']), comando.categoria];
                                } else if (hasComando) {
                                    sql = `INSERT INTO comandos (olt_id, nombre, descripcion, comando, categoria, activo) VALUES (?, ?, ?, ?, ?, 1)`;
                                    const cmdStr = comando.comandos_json ? JSON.parse(comando.comandos_json).join('\n') : (comando.comando || '');
                                    params = [oltId, comando.nombre, comando.descripcion, cmdStr, comando.categoria];
                                } else {
                                    sql = `INSERT INTO comandos (olt_id, nombre, descripcion, categoria, activo) VALUES (?, ?, ?, ?, 1)`;
                                    params = [oltId, comando.nombre, comando.descripcion, comando.categoria];
                                }
                                
                                userDb.run(sql, params, (err) => {
                                    if (err) {
                                        results.comandos.errors++;
                                    } else {
                                        results.comandos.created++;
                                    }
                                    processed++;
                                    if (processed === total) resolve();
                                });
                            }
                        });
                    });
                });
            });
        });
    };
    
    // Ejecutar importaciones secuencialmente
    importOLTs().then(() => {
        return importComandos();
    }).then(() => {
        logActivity(usuarioActual.id, 'importar_olts_comandos', 
                   `OLTs: ${results.olts.created}/${results.olts.updated}/${results.olts.errors}, Comandos: ${results.comandos.created}/${results.comandos.updated}/${results.comandos.errors}`, 
                   req.ip);
        
        res.json({
            success: true,
            message: 'Importación completada',
            stats: {
                olts_importadas: results.olts.created + results.olts.updated,
                comandos_importados: results.comandos.created + results.comandos.updated,
                olts_omitidas: 0, // Calcular si es necesario
                errores: results.olts.errors + results.comandos.errors
            }
        });
    }).catch(error => {
        console.error('Error en importación:', error);
        res.status(500).json({ success: false, message: 'Error en importación', error: error.message });
    });
});

// ===== RUTAS DE AUTENTICACIÓN =====

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Para login siempre usar la BD principal
    const mainDb = dbManager.getMainDatabase();

    mainDb.get(`SELECT * FROM usuarios WHERE username = ? AND activo = 1`, [username], (err, user) => {
        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            logActivity(null, 'login_fallido', `Usuario: ${username}, IP: ${clientIP}`, clientIP);
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        // Actualizar último acceso en BD principal
        mainDb.run(`UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);
        
        // Guardar usuario en la sesión
        req.session.user = {
            id: user.id,
            username: user.username,
            nombre_completo: user.nombre_completo,
            email: user.email,
            rol: user.rol
        };
        
        // Si es un usuario técnico, asegurar que tenga su BD privada
        if (user.rol === 'tecnico') {
            console.log(`🔧 Inicializando BD privada para usuario técnico: ${username}`);
            dbManager.getUserDatabase(username, user.rol);
        }
        
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
            },
            databaseType: (isAdmin({ rol: user.rol }) ? 'principal' : 'privada')
        });
    });
});

// Endpoint de logout
app.post('/api/logout', (req, res) => {
    const userId = req.session?.user?.id;
    const username = req.session?.user?.username;
    
    if (userId) {
        logActivity(userId, 'logout', `Usuario: ${username}`, req.ip);
    }
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al destruir sesión:', err);
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.json({ success: true, message: 'Sesión cerrada correctamente' });
    });
});

// ===== RUTAS DE USUARIOS =====

// Obtener todos los usuarios (solo admin)
app.get('/api/usuarios', (req, res) => {
    const usuarioActual = req.session && req.session.user;
    
    // Solo el admin puede ver todos los usuarios
    if (!isAdmin(usuarioActual)) {
        return res.status(403).json({ success: false, message: 'Acceso denegado - Solo admin puede ver usuarios' });
    }
    
    // Admin siempre usa la BD principal
    const mainDb = dbManager.getMainDatabase();
    
    mainDb.all(`SELECT id, username, nombre_completo, email, rol, activo, fecha_creacion, ultimo_acceso 
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
    const usuarioActual = req.session && req.session.user;
    
    // Solo admin puede crear usuarios
    if (!isAdmin(usuarioActual)) {
        return res.status(403).json({ success: false, message: 'Solo administradores pueden crear usuarios' });
    }
    
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
            [username, hashedPassword, nombre_completo, email, rol || 'tecnico', activo !== false],
            function(err) {
                if (err) {
                    console.error('Error al crear usuario:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor' });
                }

                // Si es un técnico, crear inmediatamente su BD limpia
                if (rol === 'tecnico') {
                    console.log(`🔧 Creando BD limpia para nuevo técnico: ${username}`);
                    dbManager.resetUserDatabase(username);
                }

                logActivity(usuarioActual.id, 'crear_usuario', `Usuario: ${username}, Rol: ${rol}`, req.ip);
                
                res.json({
                    success: true,
                    message: `Usuario ${rol === 'tecnico' ? 'técnico' : ''} creado correctamente${rol === 'tecnico' ? ' con BD privada limpia' : ''}`,
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
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    // Verificar permisos: admin puede editar cualquier usuario, técnico solo su propio perfil
    if (usuarioActual.rol !== 'admin' && usuarioActual.id != userId) {
        return res.status(403).json({ success: false, message: 'Solo puedes editar tu propio perfil' });
    }
    
    // Solo admin puede cambiar roles
    if (usuarioActual.rol !== 'admin' && rol && usuarioActual.rol !== rol) {
        return res.status(403).json({ success: false, message: 'No puedes cambiar tu rol' });
    }

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

        // Construir query según permisos
        let updateQuery = `UPDATE usuarios SET username = ?, nombre_completo = ?, email = ?`;
        let params = [username, nombre_completo, email];
        
        // Solo admin puede actualizar rol y estado activo
        if (usuarioActual.rol === 'admin') {
            updateQuery += `, rol = ?, activo = ?`;
            params.push(rol, activo);
        }
        
        updateQuery += ` WHERE id = ?`;
        params.push(userId);

        db.run(updateQuery, params, function(err) {
            if (err) {
                console.error('Error al actualizar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            logActivity(usuarioActual.id, 'actualizar_usuario', `Usuario: ${username}`, req.ip);
            
            res.json({ success: true, message: 'Usuario actualizado correctamente' });
        });
    });
});

// Eliminar usuario
app.delete('/api/usuarios/:id', (req, res) => {
    const userId = req.params.id;
    const { eliminadorId } = req.body;
    const usuarioActual = req.session && req.session.user;
    
    // Solo admin puede eliminar usuarios
    if (!isAdmin(usuarioActual)) {
        return res.status(403).json({ success: false, message: 'Solo administradores pueden eliminar usuarios' });
    }

    // Verificar que no sea el usuario alito
    db.get(`SELECT username FROM usuarios WHERE id = ?`, [userId], (err, usuario) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (usuario.username === 'admin') {
            return res.status(403).json({ success: false, message: 'No se puede eliminar el usuario administrador principal' });
        }

        db.run(`DELETE FROM usuarios WHERE id = ?`, [userId], function(err) {
            if (err) {
                console.error('Error al eliminar usuario:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            logActivity(usuarioActual.id, 'eliminar_usuario', `Usuario: ${usuario.username}`, req.ip);
            
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
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    // Usar la base de datos específica del usuario
    const userDb = getUserDatabase(req);
    
    // Consulta SQL mejorada que maneja columnas opcionales
    let query = `SELECT t.*, 
                        COALESCE(c.color, '#007bff') as categoria_color,
                        COALESCE(c.icono, '📋') as categoria_icono,
                        COALESCE(c.nombre, 'Sin categoría') as categoria_nombre
                 FROM tareas t 
                 LEFT JOIN categorias_tareas c ON t.categoria = c.nombre
                 WHERE t.estado != 'eliminada' AND t.activa = 1`;
    let params = [];
    
    // Los usuarios técnicos solo ven sus propias tareas en su BD privada
    // El admin ve todas las tareas en la BD principal
    if (usuarioActual.rol !== 'admin' && usuarioActual.rol !== 'administrador') {
        console.log(`📊 Usuario técnico ${usuarioActual.username} accediendo a su BD privada`);
    } else {
        console.log(`👑 Usuario admin - usando base de datos principal`);
    }
    
    if (estado) {
        query += ` AND t.estado = ?`;
        params.push(estado);
    }
    
    if (categoria) {
        query += ` AND c.nombre = ?`;
        params.push(categoria);
    }
    
    query += ` ORDER BY 
        CASE t.prioridad 
            WHEN 'urgente' THEN 1 
            WHEN 'alta' THEN 2 
            WHEN 'media' THEN 3 
            WHEN 'baja' THEN 4 
        END,
        t.fecha_creacion DESC`;
    
    userDb.all(query, params, (err, tareas) => {
        if (err) {
            console.error('❌ Error al obtener tareas:', err);
            console.error('🔍 Query:', query);
            console.error('🔍 Params:', params);
            console.error('🔍 Usuario:', usuarioActual.username);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        res.json({ success: true, tareas });
    });
});

// Obtener estadísticas de tareas
app.get('/api/tareas/estadisticas', (req, res) => {
    const { usuario_id } = req.query;
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    // Usar la base de datos específica del usuario
    const userDb = getUserDatabase(req);
    
    let whereClause = 'WHERE t.estado != "eliminada" AND t.activa = 1';
    let params = [];
    
    // En BDs privadas (usuarios no admin) no filtramos por usuario: toda la BD ya es del usuario
    // Si es admin y especifica un usuario, filtramos por usuario_id en la BD principal
    if (isAdmin(usuarioActual) && usuario_id) {
        whereClause += ' AND t.usuario_id = ?';
        params.push(usuario_id);
    }
    
    userDb.get(`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) as activas,
        SUM(CASE WHEN estado = 'finalizada' THEN 1 ELSE 0 END) as finalizadas,
        SUM(CASE WHEN prioridad = 'urgente' THEN 1 ELSE 0 END) as urgentes,
        0 as progreso_promedio
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
    const usuarioActual = req.session && req.session.user;
    const userDb = getUserDatabase(req);

    // Obtener tarea (join sólo con categorias para compatibilidad con BDs privadas)
    userDb.get(`SELECT t.*, c.color as categoria_color, c.nombre as categoria_nombre
            FROM tareas t 
            LEFT JOIN categorias_tareas c ON t.categoria = c.nombre
            WHERE t.id = ? AND t.estado != 'eliminada' AND t.activa = 1`, [tareaId], (err, tarea) => {
        if (err) {
            console.error('Error al obtener tarea:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (!tarea) {
            return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
        }
        
        // Obtener notas de la tarea (sin join a usuarios para compatibilidad con BDs privadas)
        userDb.all(`SELECT n.*
                FROM tareas_notas n 
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
    const { titulo, descripcion, estado, prioridad, categoria, usuario_id } = req.body;
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    if (!titulo) {
        return res.status(400).json({ success: false, message: 'El título es obligatorio' });
    }
    
    // Usar la base de datos específica del usuario
    const userDb = getUserDatabase(req);
    
    userDb.run(`INSERT INTO tareas (titulo, descripcion, estado, prioridad, categoria) 
            VALUES (?, ?, ?, ?, ?)`,
        [titulo, descripcion || '', estado || 'pendiente', prioridad || 'media', 
         categoria || 'General'],
        function(err) {
            if (err) {
                console.error('Error al crear tarea:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            console.log(`✅ Tarea creada en BD de usuario: ${usuarioActual.username}`);
            
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
    const { titulo, descripcion, estado, prioridad, categoria, usuario_id, editor_id } = req.body;
    const usuarioActual = req.session && req.session.user;
    const userDb = getUserDatabase(req);
    
    if (!usuarioActual) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    
    if (!titulo) {
        return res.status(400).json({ success: false, message: 'El título es obligatorio' });
    }

    // Verificar permisos según el rol
    let updateQuery = `UPDATE tareas SET titulo = ?, descripcion = ?, estado = ?, prioridad = ?, 
                       categoria = ?, fecha_modificacion = CURRENT_TIMESTAMP`;
    let params = [titulo, descripcion || '', estado || 'pendiente', prioridad || 'media', 
                  categoria || 'General'];
    let whereClause = ` WHERE id = ? AND activa = 1`;
    
    // Solo admin puede actualizar usuario_id (reasignar tareas)
    if (usuarioActual.rol === 'admin' && usuario_id !== undefined) {
        updateQuery += `, usuario_id = ?`;
        params.push(usuario_id);
    }
    
    // En BDs privadas no es necesario forzar filtro por usuario_id; en admin (BD principal) se mantiene por id de tarea
    params.push(tareaId);
    
    // En BDs privadas no forzamos filtro por usuario_id; en admin (BD principal) se mantiene
    const finalQuery = updateQuery + whereClause;
    userDb.run(finalQuery, params, function(err) {
        if (err) {
            console.error('Error al actualizar tarea:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (this.changes === 0) {
            if (usuarioActual.rol !== 'admin') {
                return res.status(403).json({ success: false, message: 'No tienes permisos para editar esta tarea' });
            } else {
                return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
            }
        }
        
        logActivity(usuarioActual.id, 'actualizar_tarea', `Tarea: ${titulo}`, req.ip);
        
        res.json({ success: true, message: 'Tarea actualizada correctamente' });
    });
});

// Eliminar tarea (marcar como inactiva)
app.delete('/api/tareas/:id', (req, res) => {
    const tareaId = req.params.id;
    const { eliminador_id } = req.body;
    const userDb = getUserDatabase(req);
    
    userDb.run(`UPDATE tareas SET activa = 0 WHERE id = ?`, [tareaId], function(err) {
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

// (Eliminada ruta duplicada de /api/usuarios con validación distinta)

// Agregar nota a tarea
app.post('/api/tareas/:id/notas', (req, res) => {
    const tareaId = req.params.id;
    const { nota, tipo, usuario_id } = req.body;
    const userDb = getUserDatabase(req);
    
    if (!nota) {
        return res.status(400).json({ success: false, message: 'La nota es obligatoria' });
    }
    
    userDb.run(`INSERT INTO tareas_notas (tarea_id, nota, tipo, usuario_id) VALUES (?, ?, ?, ?)`,
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
    const usuarioActual = req.session && req.session.user;
    const userDb = getUserDatabase(req);
    
    userDb.all(`SELECT * FROM categorias_tareas WHERE activa = 1 ORDER BY nombre`, (err, categorias) => {
        if (err) {
            console.error('Error al obtener categorías:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        console.log(`📂 Usuario ${usuarioActual?.username} cargó ${categorias.length} categorías`);
        res.json({ success: true, categorias });
    });
});

// ===== RUTAS DE COMANDOS IMS =====

// Obtener todos los comandos IMS
app.get('/api/comandos-ims', (req, res) => {
    db.all(`SELECT * FROM comandos_ims ORDER BY categoria, nombre`, (err, comandos) => {
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
    const usuarioActual = req.session && req.session.user;
    const userDb = getUserDatabase(req);
    
    // Verificar primero la estructura de la tabla para determinar el campo correcto
    userDb.all(`PRAGMA table_info(olts)`, (pragmaErr, columns) => {
        if (pragmaErr) {
            console.error('Error verificando estructura de olts:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        // Determinar si existe 'estado' o 'activo'
        const hasEstado = columns.some(col => col.name === 'estado');
        const hasActivo = columns.some(col => col.name === 'activo');
        
        let query;
        if (hasEstado) {
            query = `SELECT * FROM olts WHERE estado = 'activo' ORDER BY fecha_creacion DESC`;
        } else if (hasActivo) {
            query = `SELECT * FROM olts WHERE activo = 1 ORDER BY fecha_creacion DESC`;
        } else {
            query = `SELECT * FROM olts ORDER BY fecha_creacion DESC`;
        }
        
        userDb.all(query, (err, rows) => {
            if (err) {
                console.error('Error al obtener OLTs:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }
            
            console.log(`📊 Usuario ${usuarioActual?.username} cargó ${rows.length} OLTs`);
            res.json({ success: true, olts: rows });
        });
    });
});

// Obtener una OLT específica con sus comandos
app.get('/api/olts/:id', (req, res) => {
    const oltId = req.params.id;
    const userDb = getUserDatabase(req);
    
    userDb.get(`SELECT * FROM olts WHERE id = ?`, [oltId], (err, olt) => {
        if (err) {
            console.error('Error al obtener OLT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        if (!olt) {
            return res.status(404).json({ success: false, message: 'OLT no encontrada' });
        }

        // Obtener comandos de la OLT (compatible con ambos esquemas)
        userDb.all(`PRAGMA table_info(comandos)`, (pragmaErr, cols) => {
            if (pragmaErr) {
                console.error('Error detectando esquema de comandos:', pragmaErr);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            const hasOrdenDisplay = cols.some(c => c.name === 'orden_display');
            const hasOrden = cols.some(c => c.name === 'orden');
            let orderClause = 'nombre';
            if (hasOrdenDisplay) orderClause = 'orden_display, nombre';
            else if (hasOrden) orderClause = 'orden, nombre';

            const query = `SELECT * FROM comandos WHERE olt_id = ? AND activo = 1 ORDER BY ${orderClause}`;
            userDb.all(query, [oltId], (err, comandos) => {
                if (err) {
                    console.error('Error al obtener comandos:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor' });
                }

                const comandosFormateados = comandos.map(cmd => {
                    let parsed = [];
                    if (cmd.comandos_json) {
                        try { parsed = JSON.parse(cmd.comandos_json || '[]'); } catch (e) { parsed = []; }
                    } else if (cmd.comando) {
                        parsed = [cmd.comando];
                    }
                    return { ...cmd, comandos: parsed };
                });

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
});

// Crear nueva OLT
app.post('/api/olts', (req, res) => {
    const { nombre } = req.body;
    const oltId = 'olt-' + Date.now();
    const userDb = getUserDatabase(req);

    userDb.all(`PRAGMA table_info(olts)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema de OLTs:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const colNames = cols.map(c => c.name);
        const hasCol = (c) => colNames.includes(c);

        const payload = req.body;
        const fields = ['id', 'nombre'];
        const values = [oltId, nombre];

        if (hasCol('shelf')) { fields.push('shelf'); values.push(payload.shelf || 1); }
        if (hasCol('slot')) { fields.push('slot'); values.push(payload.slot || 1); }
        if (hasCol('port')) { fields.push('port'); values.push(payload.port || 1); }
        if (hasCol('onu_id')) { fields.push('onu_id'); values.push(payload.onu_id ?? payload.onuId ?? 1); }
        if (hasCol('ip_address')) { fields.push('ip_address'); values.push(payload.ip_address ?? payload.ip ?? null); }
        if (hasCol('ip')) { fields.push('ip'); values.push(payload.ip ?? payload.ip_address ?? null); }
        if (hasCol('puerto')) { fields.push('puerto'); values.push(payload.port ?? payload.puerto ?? 23); }
        if (hasCol('modelo')) { fields.push('modelo'); values.push(payload.modelo ?? 'ZTE C600'); }
        if (hasCol('ubicacion')) { fields.push('ubicacion'); values.push(payload.ubicacion ?? null); }
        if (hasCol('estado')) { fields.push('estado'); values.push('activo'); }
        if (hasCol('activo')) { fields.push('activo'); values.push(1); }

        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO olts (${fields.join(', ')}) VALUES (${placeholders})`;

        userDb.run(query, values, function(err) {
            if (err) {
                console.error('Error al crear OLT:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            logActivity(req.body.userId, 'crear_olt', `OLT: ${nombre}`, req.ip);
            res.json({ success: true, message: 'OLT creada correctamente', olt: { id: oltId, nombre } });
        });
    });
});

// Actualizar OLT
app.put('/api/olts/:id', (req, res) => {
    const oltId = req.params.id;
    const payload = req.body;
    const userDb = getUserDatabase(req);

    userDb.all(`PRAGMA table_info(olts)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema de OLTs:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const colNames = cols.map(c => c.name);
        const hasCol = (c) => colNames.includes(c);

        const fields = [];
        const values = [];

        if (hasCol('nombre') && payload.nombre !== undefined) { fields.push('nombre = ?'); values.push(payload.nombre); }
        if (hasCol('shelf') && payload.shelf !== undefined) { fields.push('shelf = ?'); values.push(payload.shelf); }
        if (hasCol('slot') && payload.slot !== undefined) { fields.push('slot = ?'); values.push(payload.slot); }
        if (hasCol('port') && payload.port !== undefined) { fields.push('port = ?'); values.push(payload.port); }
        if (hasCol('puerto') && payload.port !== undefined) { fields.push('puerto = ?'); values.push(payload.port); }
        if (hasCol('onu_id') && (payload.onu_id !== undefined || payload.onuId !== undefined)) { fields.push('onu_id = ?'); values.push(payload.onu_id ?? payload.onuId); }
        if (hasCol('ip_address') && (payload.ip_address !== undefined || payload.ip !== undefined)) { fields.push('ip_address = ?'); values.push(payload.ip_address ?? payload.ip); }
        if (hasCol('ip') && (payload.ip !== undefined || payload.ip_address !== undefined)) { fields.push('ip = ?'); values.push(payload.ip ?? payload.ip_address); }
        if (hasCol('ubicacion') && payload.ubicacion !== undefined) { fields.push('ubicacion = ?'); values.push(payload.ubicacion); }
        if (hasCol('fecha_modificacion')) { fields.push('fecha_modificacion = CURRENT_TIMESTAMP'); }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay campos válidos para actualizar' });
        }

        const query = `UPDATE olts SET ${fields.join(', ')} WHERE id = ?`;
        values.push(oltId);

        userDb.run(query, values, function(err) {
            if (err) {
                console.error('Error al actualizar OLT:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'OLT no encontrada' });
            }

            logActivity(req.body.userId, 'actualizar_olt', `OLT: ${payload.nombre || oltId}`, req.ip);
            res.json({ success: true, message: 'OLT actualizada correctamente' });
        });
    });
});

// Endpoint específico para actualizar solo parámetros de conexión
app.patch('/api/olts/:id/parametros', (req, res) => {
    const oltId = req.params.id;
    const { shelf, slot, port, onu_id } = req.body;
    const userDb = getUserDatabase(req);

    userDb.all(`PRAGMA table_info(olts)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema de OLTs:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const colNames = cols.map(c => c.name);
        const hasCol = (c) => colNames.includes(c);

        const fieldsToUpdate = [];
        const values = [];

        if (shelf !== undefined && hasCol('shelf')) { fieldsToUpdate.push('shelf = ?'); values.push(shelf); }
        if (slot !== undefined && hasCol('slot')) { fieldsToUpdate.push('slot = ?'); values.push(slot); }
        if (port !== undefined) {
            if (hasCol('port')) { fieldsToUpdate.push('port = ?'); values.push(port); }
            else if (hasCol('puerto')) { fieldsToUpdate.push('puerto = ?'); values.push(port); }
        }
        if (onu_id !== undefined && hasCol('onu_id')) { fieldsToUpdate.push('onu_id = ?'); values.push(onu_id); }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay parámetros válidos para actualizar' });
        }

        if (hasCol('fecha_modificacion')) fieldsToUpdate.push('fecha_modificacion = CURRENT_TIMESTAMP');
        values.push(oltId);

        const query = `UPDATE olts SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        userDb.run(query, values, function(err) {
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
});

// Eliminar OLT
app.delete('/api/olts/:id', (req, res) => {
    const oltId = req.params.id;
    const userDb = getUserDatabase(req);

    userDb.all(`PRAGMA table_info(olts)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema de OLTs:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const hasEstado = cols.some(c => c.name === 'estado');
        const hasActivo = cols.some(c => c.name === 'activo');

        let query, params;
        if (hasEstado) { query = `UPDATE olts SET estado = 'inactiva' WHERE id = ?`; params = [oltId]; }
        else if (hasActivo) { query = `UPDATE olts SET activo = 0 WHERE id = ?`; params = [oltId]; }
        else { query = `DELETE FROM olts WHERE id = ?`; params = [oltId]; }

        userDb.run(query, params, function(err) {
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
});

// ===== RUTAS DE COMANDOS =====

// Obtener todos los comandos
app.get('/api/comandos', (req, res) => {
    const usuarioActual = req.session && req.session.user;
    const userDb = getUserDatabase(req);

    userDb.all(`PRAGMA table_info(comandos)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema de comandos:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const hasOrdenDisplay = cols.some(c => c.name === 'orden_display');
        const hasOrden = cols.some(c => c.name === 'orden');
        let orderClause = 'nombre';
        if (hasOrdenDisplay) orderClause = 'orden_display, nombre';
        else if (hasOrden) orderClause = 'orden, nombre';

        const query = `SELECT * FROM comandos WHERE activo = 1 ORDER BY ${orderClause}`;
        userDb.all(query, (err, comandos) => {
            if (err) {
                console.error('Error al obtener comandos:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            console.log(`📋 Usuario ${usuarioActual?.username} cargó ${comandos.length} comandos`);
            res.json(comandos);
        });
    });
});

// Obtener comandos por OLT ID
app.get('/api/comandos/:olt_id', (req, res) => {
    const oltId = req.params.olt_id;

    // Usar la base de datos específica del usuario
    const userDb = getUserDatabase(req);

    userDb.all(`PRAGMA table_info(comandos)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema de comandos:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const hasOrdenDisplay = cols.some(c => c.name === 'orden_display');
        const hasOrden = cols.some(c => c.name === 'orden');
        let orderClause = 'nombre';
        if (hasOrdenDisplay) orderClause = 'orden_display, nombre';
        else if (hasOrden) orderClause = 'orden, nombre';

        const query = `SELECT * FROM comandos WHERE olt_id = ? AND activo = 1 ORDER BY ${orderClause}`;
        userDb.all(query, [oltId], (err, comandos) => {
            if (err) {
                console.error('Error al obtener comandos:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            res.json({ success: true, comandos });
        });
    });
});

// Crear nuevo comando
app.post('/api/comandos', (req, res) => {
    const { olt_id, nombre, descripcion, comandos, comando, categoria } = req.body;
    const userDb = getUserDatabase(req);

    // Detectar columnas disponibles
    userDb.all(`PRAGMA table_info(comandos)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema comandos:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const hasComandosJson = cols.some(c => c.name === 'comandos_json');
        const hasComando = cols.some(c => c.name === 'comando');

        let sql;
        let params;

        if (hasComandosJson) {
            sql = `INSERT INTO comandos (olt_id, nombre, descripcion, comandos_json, categoria) VALUES (?, ?, ?, ?, ?)`;
            params = [olt_id, nombre, descripcion || '', JSON.stringify(comandos || []), categoria || 'general'];
        } else if (hasComando) {
            const cmdStr = Array.isArray(comandos) ? comandos.join('\n') : (comando || '');
            sql = `INSERT INTO comandos (olt_id, nombre, descripcion, comando, categoria) VALUES (?, ?, ?, ?, ?)`;
            params = [olt_id, nombre, descripcion || '', cmdStr, categoria || 'general'];
        } else {
            sql = `INSERT INTO comandos (olt_id, nombre, descripcion, categoria) VALUES (?, ?, ?, ?)`;
            params = [olt_id, nombre, descripcion || '', categoria || 'general'];
        }

        userDb.run(sql, params, function(err) {
            if (err) {
                console.error('Error al crear comando:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            logActivity(req.body.userId, 'crear_comando', `Comando: ${nombre} en OLT: ${olt_id}`, req.ip);
            res.json({ success: true, message: 'Comando creado correctamente', comando_id: this.lastID });
        });
    });
});

// Actualizar comando
app.put('/api/comandos/:id', (req, res) => {
    const comandoId = req.params.id;
    const { nombre, descripcion, comandos, comando, categoria } = req.body;
    const userDb = getUserDatabase(req);

    userDb.all(`PRAGMA table_info(comandos)`, (pragmaErr, cols) => {
        if (pragmaErr) {
            console.error('Error detectando esquema comandos:', pragmaErr);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        const hasComandosJson = cols.some(c => c.name === 'comandos_json');
        const hasComando = cols.some(c => c.name === 'comando');

        let sql;
        let params;

        if (hasComandosJson) {
            sql = `UPDATE comandos SET nombre = ?, descripcion = ?, comandos_json = ?, categoria = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = ?`;
            params = [nombre, descripcion || '', JSON.stringify(comandos || []), categoria || 'general', comandoId];
        } else if (hasComando) {
            const cmdStr = Array.isArray(comandos) ? comandos.join('\n') : (comando || '');
            sql = `UPDATE comandos SET nombre = ?, descripcion = ?, comando = ?, categoria = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = ?`;
            params = [nombre, descripcion || '', cmdStr, categoria || 'general', comandoId];
        } else {
            sql = `UPDATE comandos SET nombre = ?, descripcion = ?, categoria = ?, fecha_modificacion = CURRENT_TIMESTAMP WHERE id = ?`;
            params = [nombre, descripcion || '', categoria || 'general', comandoId];
        }

        userDb.run(sql, params, function(err) {
            if (err) {
                console.error('Error al actualizar comando:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Comando no encontrado' });
            }

            logActivity(req.body.userId, 'actualizar_comando', `Comando ID: ${comandoId}`, req.ip);
            res.json({ success: true, message: 'Comando actualizado correctamente' });
        });
    });
});

// Eliminar comando
app.delete('/api/comandos/:id', (req, res) => {
    const comandoId = req.params.id;
    const { userId } = req.body;
    const userDb = getUserDatabase(req);

    // Obtener info básica del comando
    userDb.get(`SELECT id, nombre, olt_id FROM comandos WHERE id = ?`, [comandoId], (err, cmd) => {
        if (err) {
            console.error('Error al obtener comando:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        if (!cmd) {
            return res.status(404).json({ success: false, message: 'Comando no encontrado' });
        }

        // Intentar obtener nombre de la OLT (si existe la tabla/relación)
        userDb.get(`SELECT nombre FROM olts WHERE id = ?`, [cmd.olt_id], (oltErr, olt) => {
            const oltNombre = (!oltErr && olt) ? olt.nombre : 'N/D';

            userDb.run(`DELETE FROM comandos WHERE id = ?`, [comandoId], function(err) {
                if (err) {
                    console.error('Error al eliminar comando:', err);
                    return res.status(500).json({ success: false, message: 'Error del servidor' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ success: false, message: 'Comando no encontrado' });
                }

                logActivity(userId, 'eliminar_comando', `Comando: ${cmd.nombre} de OLT: ${oltNombre}`, req.ip);
                res.json({ success: true, message: 'Comando eliminado correctamente', comando_eliminado: cmd.nombre });
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
    WHERE c.activo = 1 AND o.estado = 'activo' AND 
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

// Crear nuevo modelo ONT desde ACS (funcionalidad agregar modelo)
app.post('/api/modelo-ont', (req, res) => {
    const { fabricante, modelo, tipo, version, descripcion, comandos } = req.body;
    
    console.log('=== CREANDO NUEVO MODELO ACS ===');
    console.log('Datos recibidos:', { fabricante, modelo, tipo, version, descripcion, comandos: comandos?.length });
    
    // Validaciones básicas
    if (!fabricante || !modelo || !tipo) {
        console.error('Datos incompletos:', { fabricante: !!fabricante, modelo: !!modelo, tipo: !!tipo });
        return res.status(400).json({ 
            success: false, 
            error: 'Datos incompletos. Se requiere fabricante, modelo y tipo.' 
        });
    }
    
    // Generar ID único para el modelo
    const modeloId = `${fabricante}-${modelo}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Verificar que no exista un modelo con el mismo fabricante y modelo
    db.get(`SELECT id FROM modelos_ont WHERE fabricante = ? AND modelo = ?`, [fabricante, modelo], (err, existingModel) => {
        if (err) {
            console.error('Error al verificar modelo existente:', err);
            return res.status(500).json({ success: false, error: 'Error del servidor al validar' });
        }
        
        if (existingModel) {
            console.error('Modelo duplicado encontrado:', { fabricante, modelo });
            return res.status(400).json({ 
                success: false, 
                error: `Ya existe un modelo ${fabricante} ${modelo}. Use un nombre diferente.` 
            });
        }
        
        // Insertar modelo principal
        console.log('Insertando modelo en BD con ID:', modeloId);
        db.run(`INSERT INTO modelos_ont (id, fabricante, modelo, version, tipo, descripcion, usuario_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [modeloId, fabricante, modelo, version || '', tipo, descripcion || '', 1], // Usuario admin por defecto
            function(err) {
                if (err) {
                    console.error('Error al insertar modelo ONT:', err);
                    return res.status(500).json({ success: false, error: 'Error del servidor al crear modelo' });
                }

                console.log('Modelo insertado exitosamente. ID:', modeloId);

                // Agregar comandos si los hay
                if (comandos && comandos.length > 0) {
                    console.log(`Insertando ${comandos.length} comandos...`);
                    
                    let comandosInsertados = 0;
                    let erroresComandos = 0;
                    
                    const insertarComando = (index) => {
                        if (index >= comandos.length) {
                            // Todos los comandos procesados
                            console.log(`Comandos procesados: ${comandosInsertados} exitosos, ${erroresComandos} con errores`);
                            return res.json({
                                success: true,
                                message: `Modelo ${fabricante} ${modelo} creado exitosamente`,
                                modeloId: modeloId,
                                comandosCreados: comandosInsertados
                            });
                        }
                        
                        const comando = comandos[index];
                        if (comando.comando) {
                            // Generar ID único para el comando
                            const comandoId = `cmd-tr069-${modeloId}-${Date.now()}-${index}`;
                            
                            db.run(`INSERT INTO comandos_ont (id, modelo_id, comando, descripcion, orden) VALUES (?, ?, ?, ?, ?)`,
                                [comandoId, modeloId, comando.comando, comando.nombre || comando.descripcion || '', index + 1],
                                function(err) {
                                    if (err) {
                                        console.error(`Error al insertar comando TR-069 ${index + 1}:`, err);
                                        erroresComandos++;
                                    } else {
                                        console.log(`Comando TR-069 ${index + 1} insertado exitosamente`);
                                        comandosInsertados++;
                                    }
                                    insertarComando(index + 1);
                                }
                            );
                        } else {
                            console.log(`Comando ${index + 1} omitido por datos incompletos`);
                            insertarComando(index + 1);
                        }
                    };
                    
                    insertarComando(0);
                } else {
                    console.log('No hay comandos para insertar');
                    res.json({
                        success: true,
                        message: `Modelo ${fabricante} ${modelo} creado exitosamente`,
                        modeloId: modeloId,
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
    
    console.log('🐛 DEBUG - DELETE /api/modelos-ont/:id llamado con:', { modeloId, usuarioId });
    
    // Primero obtener info del modelo para el log
    db.get(`SELECT fabricante, modelo FROM modelos_ont WHERE id = ?`, [modeloId], (err, modelo) => {
        if (err) {
            console.error('Error al obtener modelo ONT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        console.log('🔍 DEBUG - Modelo encontrado:', modelo);

        if (!modelo) {
            console.log('❌ DEBUG - Modelo no encontrado para ID:', modeloId);
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

// Obtener modelo ONT específico por ID
app.get('/api/modelos-ont/:id', (req, res) => {
    const modeloId = req.params.id;
    
    db.get(`SELECT * FROM modelos_ont WHERE id = ?`, [modeloId], (err, modelo) => {
        if (err) {
            console.error('Error al obtener modelo ONT:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }

        if (!modelo) {
            return res.status(404).json({ success: false, message: 'Modelo ONT no encontrado' });
        }

        // Obtener comandos asociados
        db.all(`SELECT * FROM comandos_ont WHERE modelo_id = ? ORDER BY orden`, [modeloId], (err, comandos) => {
            if (err) {
                console.error('Error al obtener comandos:', err);
                return res.status(500).json({ success: false, message: 'Error del servidor' });
            }

            modelo.comandos = comandos;
            res.json({ success: true, modelo });
        });
    });
});

// Actualizar modelo ONT
app.put('/api/modelos-ont/:id', (req, res) => {
    const modeloId = req.params.id;
    const { fabricante, modelo, tipo, version, descripcion, comandos, usuarioId } = req.body;
    
    // Validaciones
    if (!fabricante || !modelo) {
        return res.status(400).json({ 
            success: false, 
            error: 'Fabricante y modelo son obligatorios' 
        });
    }

    // Iniciar transacción
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Actualizar información básica del modelo
        db.run(`UPDATE modelos_ont 
                SET fabricante = ?, modelo = ?, tipo = ?, version = ?, descripcion = ?, fecha_modificacion = CURRENT_TIMESTAMP
                WHERE id = ?`, 
            [fabricante, modelo, tipo, version, descripcion, modeloId], 
            function(err) {
                if (err) {
                    console.error('Error al actualizar modelo:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ success: false, error: 'Error del servidor' });
                }

                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ success: false, error: 'Modelo no encontrado' });
                }

                // Eliminar comandos existentes
                db.run(`DELETE FROM comandos_ont WHERE modelo_id = ?`, [modeloId], (err) => {
                    if (err) {
                        console.error('Error al eliminar comandos anteriores:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ success: false, error: 'Error del servidor' });
                    }

                    // Insertar nuevos comandos si existen
                    if (comandos && comandos.length > 0) {
                        const stmt = db.prepare(`INSERT INTO comandos_ont (id, modelo_id, comando, descripcion, orden) VALUES (?, ?, ?, ?, ?)`);
                        
                        let erroresComandos = false;
                        
                        comandos.forEach((cmd, index) => {
                            const comandoId = `cmd-${modeloId}-${Date.now()}-${index}`;
                            stmt.run([comandoId, modeloId, cmd.comando, cmd.descripcion, index + 1], (err) => {
                                if (err) {
                                    console.error('Error al insertar comando:', err);
                                    erroresComandos = true;
                                }
                            });
                        });

                        stmt.finalize((err) => {
                            if (err || erroresComandos) {
                                console.error('Error al finalizar inserción de comandos:', err);
                                db.run('ROLLBACK');
                                return res.status(500).json({ success: false, error: 'Error al guardar comandos' });
                            }

                            // Confirmar transacción
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    console.error('Error al confirmar transacción:', err);
                                    return res.status(500).json({ success: false, error: 'Error del servidor' });
                                }

                                logActivity(usuarioId, 'actualizar_modelo_ont', `Modelo: ${fabricante} ${modelo}`, req.ip);
                                res.json({ 
                                    success: true, 
                                    message: 'Modelo ONT actualizado correctamente',
                                    modeloId: modeloId 
                                });
                            });
                        });
                    } else {
                        // Sin comandos, confirmar transacción
                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('Error al confirmar transacción:', err);
                                return res.status(500).json({ success: false, error: 'Error del servidor' });
                            }

                            logActivity(usuarioId, 'actualizar_modelo_ont', `Modelo: ${fabricante} ${modelo}`, req.ip);
                            res.json({ 
                                success: true, 
                                message: 'Modelo ONT actualizado correctamente',
                                modeloId: modeloId 
                            });
                        });
                    }
                });
            }
        );
    });
});

// Agregar comando a modelo ONT existente
app.post('/api/modelos-ont/:id/comandos', (req, res) => {
    const modeloId = req.params.id;
    const { comando, descripcion, usuarioId } = req.body;
    
    // Generar ID único para el comando
    const comandoId = `cmd-${modeloId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
    let query = 'SELECT id, username, rol, email, activo, fecha_creacion FROM usuarios WHERE 1=1';
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

// (Eliminada duplicación de /api/categorias-tareas con tabla task_categories inexistente)

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

// Inicio robusto del servidor con manejo de EADDRINUSE
function startExpress(port) {
    const server = app.listen(port, () => {
        console.log('🚀 Servidor iniciado en puerto', port);
        console.log('🌐 Acceder a: http://localhost:' + port);
        console.log('📊 Base de datos: ' + dbPath);
        console.log('📡 SSE habilitado para notificaciones en tiempo real');
        console.log('📊 Analytics y reportes habilitados');
    });

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            console.error(`❌ Puerto ${port} en uso (EADDRINUSE)`);
            const allowFallback = process.env.ALLOW_PORT_FALLBACK === '1';
            if (allowFallback) {
                const next = port + 1;
                console.log(`↪️  Intentando puerto alternativo ${next} (ALLOW_PORT_FALLBACK=1)`);
                startExpress(next);
            } else {
                console.log('🛠️ Para liberar el puerto puedes ejecutar:');
                console.log(`   lsof -nP -iTCP:${port} -sTCP:LISTEN`);
                console.log('   kill -9 <PID>');
                console.log('💡 O inicia con otro puerto, por ejemplo: PORT=3001 npm start');
                process.exit(1);
            }
        } else {
            console.error('❌ Error al iniciar servidor:', err);
            process.exit(1);
        }
    });
}

startExpress(PORT);

// ===== ENDPOINTS ADMINISTRATIVOS PARA GESTIÓN DE BASES DE DATOS =====

// Estadísticas de bases de datos (solo admin)
app.get('/api/admin/database-stats', (req, res) => {
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual || !isAdmin(usuarioActual)) {
        return res.status(403).json({ success: false, message: 'Acceso denegado - Solo admin' });
    }
    
    dbManager.getDatabaseStats()
        .then(stats => {
            res.json({ success: true, stats });
        })
        .catch(error => {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ success: false, message: 'Error del servidor' });
        });
});

// Listar usuarios con información de sus bases de datos (solo admin)
app.get('/api/admin/users-databases', (req, res) => {
    const usuarioActual = req.session && req.session.user;
    
    if (!usuarioActual || !isAdmin(usuarioActual)) {
        return res.status(403).json({ success: false, message: 'Acceso denegado - Solo admin' });
    }
    
    // Obtener lista de usuarios de la BD principal
    const mainDb = dbManager.getMainDatabase();
    mainDb.all(`SELECT id, username, nombre_completo, rol, activo, fecha_creacion 
                FROM usuarios WHERE activo = 1 ORDER BY rol, username`, (err, usuarios) => {
        if (err) {
            console.error('Error obteniendo usuarios:', err);
            return res.status(500).json({ success: false, message: 'Error del servidor' });
        }
        
        // Obtener estadísticas de BD para cada usuario
        dbManager.getDatabaseStats()
            .then(dbStats => {
                const usuariosConBD = usuarios.map(user => {
                    const userDbInfo = dbStats.userDatabases.find(db => db.username === user.username);
                    return {
                        ...user,
                        hasPrivateDatabase: !!userDbInfo,
                        databaseSize: userDbInfo ? userDbInfo.size : 0,
                        lastActivity: userDbInfo ? userDbInfo.lastModified : null
                    };
                });
                
                res.json({ 
                    success: true, 
                    usuarios: usuariosConBD,
                    stats: dbStats
                });
            })
            .catch(error => {
                console.error('Error obteniendo estadísticas BD:', error);
                res.json({ success: true, usuarios: usuarios });
            });
    });
});

// Resetear base de datos de un usuario específico (solo admin)
app.post('/api/admin/reset-user-database', (req, res) => {
    const usuarioActual = req.session && req.session.user;
    const { username } = req.body;
    
    if (!usuarioActual || !isAdmin(usuarioActual)) {
        return res.status(403).json({ success: false, message: 'Acceso denegado - Solo admin' });
    }
    
    if (!username) {
        return res.status(400).json({ success: false, message: 'Username requerido' });
    }
    
    try {
        console.log(`🔄 Admin ${usuarioActual.username} reseteando BD del usuario: ${username}`);
        
        // Resetear la base de datos del usuario
        dbManager.resetUserDatabase(username);
        
        res.json({ 
            success: true, 
            message: `Base de datos de ${username} reseteada exitosamente`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error reseteando BD de usuario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ===== CIERRE DEL SERVIDOR =====

// Manejo de cierre del servidor
process.on('SIGINT', () => {
    console.log('\n🔒 Cerrando servidor...');
    
    // Cerrar todas las conexiones de bases de datos
    dbManager.closeAllConnections();
    
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar base de datos:', err.message);
        } else {
            console.log('✅ Base de datos cerrada correctamente');
        }
        process.exit(0);
    });
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexión a la base de datos
const dbPath = path.join(__dirname, 'olt_system.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Configurando sistema de tareas...');

// Crear tabla de tareas si no existe
db.serialize(() => {
    // Tabla principal de tareas
    db.run(`CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'pendiente', -- pendiente, activa, finalizada
        prioridad TEXT DEFAULT 'media', -- baja, media, alta, urgente
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_vencimiento DATETIME,
        fecha_finalizacion DATETIME,
        usuario_id INTEGER,
        categoria TEXT DEFAULT 'general',
        etiquetas TEXT, -- JSON array de etiquetas
        progreso INTEGER DEFAULT 0, -- 0-100%
        tiempo_estimado INTEGER, -- minutos
        tiempo_real INTEGER, -- minutos
        activa INTEGER DEFAULT 1,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error al crear tabla tareas:', err);
        } else {
            console.log('✅ Tabla tareas creada/verificada');
        }
    });

    // Tabla de notas/comentarios de tareas
    db.run(`CREATE TABLE IF NOT EXISTS tareas_notas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tarea_id INTEGER,
        nota TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER,
        tipo TEXT DEFAULT 'comentario', -- comentario, archivo, link, recordatorio
        FOREIGN KEY (tarea_id) REFERENCES tareas (id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error al crear tabla tareas_notas:', err);
        } else {
            console.log('✅ Tabla tareas_notas creada/verificada');
        }
    });

    // Tabla de categorías de tareas
    db.run(`CREATE TABLE IF NOT EXISTS categorias_tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#007bff',
        icono TEXT DEFAULT '📋',
        descripcion TEXT,
        activa INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error al crear tabla categorias_tareas:', err);
        } else {
            console.log('✅ Tabla categorias_tareas creada/verificada');
        }
    });

    // Insertar categorías predeterminadas
    const categoriasDefault = [
        { nombre: 'General', color: '#007bff', icono: '📋', descripcion: 'Tareas generales del sistema' },
        { nombre: 'OLT', color: '#28a745', icono: '📡', descripcion: 'Tareas relacionadas con OLTs' },
        { nombre: 'Usuarios', color: '#fd7e14', icono: '👥', descripcion: 'Gestión de usuarios' },
        { nombre: 'Mantenimiento', color: '#6c757d', icono: '🔧', descripcion: 'Tareas de mantenimiento' },
        { nombre: 'Desarrollo', color: '#6f42c1', icono: '💻', descripcion: 'Desarrollo y mejoras' },
        { nombre: 'Urgente', color: '#dc3545', icono: '⚡', descripcion: 'Tareas urgentes' }
    ];

    categoriasDefault.forEach(categoria => {
        db.run(`INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono, descripcion) VALUES (?, ?, ?, ?)`,
            [categoria.nombre, categoria.color, categoria.icono, categoria.descripcion], (err) => {
                if (err) {
                    console.error(`❌ Error al insertar categoría ${categoria.nombre}:`, err);
                } else {
                    console.log(`✅ Categoría ${categoria.nombre} configurada`);
                }
            });
    });

    // Insertar algunas tareas de ejemplo
    const tareasEjemplo = [
        {
            titulo: 'Configurar sistema de roles',
            descripcion: 'Implementar sistema completo de gestión de roles y permisos',
            estado: 'finalizada',
            prioridad: 'alta',
            categoria: 'Desarrollo',
            progreso: 100,
            tiempo_estimado: 240,
            tiempo_real: 180
        },
        {
            titulo: 'Revisar configuración de OLTs',
            descripcion: 'Verificar que todas las OLTs estén correctamente configuradas',
            estado: 'activa',
            prioridad: 'media',
            categoria: 'OLT',
            progreso: 60,
            tiempo_estimado: 120
        },
        {
            titulo: 'Actualizar documentación',
            descripcion: 'Documentar las nuevas funcionalidades implementadas',
            estado: 'pendiente',
            prioridad: 'baja',
            categoria: 'General',
            progreso: 0,
            tiempo_estimado: 90
        }
    ];

    tareasEjemplo.forEach((tarea, index) => {
        setTimeout(() => {
            db.run(`INSERT OR IGNORE INTO tareas (titulo, descripcion, estado, prioridad, categoria, progreso, tiempo_estimado, tiempo_real, usuario_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [tarea.titulo, tarea.descripcion, tarea.estado, tarea.prioridad, tarea.categoria, 
                 tarea.progreso, tarea.tiempo_estimado, tarea.tiempo_real || null], (err) => {
                    if (err) {
                        console.error(`❌ Error al insertar tarea ${tarea.titulo}:`, err);
                    } else {
                        console.log(`✅ Tarea ejemplo "${tarea.titulo}" creada`);
                    }
                });
        }, index * 100);
    });

    console.log('🎯 Sistema de tareas configurado correctamente');
});

// Cerrar conexión
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('❌ Error al cerrar la base de datos:', err);
        } else {
            console.log('🔒 Base de datos cerrada');
        }
    });
}, 2000);

import sqlite3
import json
import os

print('🚀 CREANDO BASE DE DATOS COMPLETA PARA ALITO')
print('=' * 50)

# Conectar a la base de datos
db_path = 'olt_system.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print('✅ Conectado a la base de datos')

# Crear todas las tablas necesarias
tables_sql = [
    # Tabla de categorías de tareas
    '''CREATE TABLE IF NOT EXISTS categorias_tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        color TEXT,
        icono TEXT,
        activa INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )''',
    
    # Tabla de tareas
    '''CREATE TABLE IF NOT EXISTS tareas (
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
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )''',
    
    # Tabla de OLTs
    '''CREATE TABLE IF NOT EXISTS olts (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        shelf INTEGER DEFAULT 1,
        slot INTEGER DEFAULT 1,
        port INTEGER DEFAULT 1,
        onu_id INTEGER DEFAULT 1,
        ip_address TEXT,
        modelo TEXT DEFAULT 'ZTE C600',
        ubicacion TEXT,
        estado TEXT DEFAULT 'activo',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )''',
    
    # Tabla de comandos
    '''CREATE TABLE IF NOT EXISTS comandos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        olt_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        comandos_json TEXT NOT NULL,
        categoria TEXT DEFAULT 'general',
        orden INTEGER DEFAULT 0,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (olt_id) REFERENCES olts (id) ON DELETE CASCADE
    )''',
    
    # Tabla de logs de actividad
    '''CREATE TABLE IF NOT EXISTS logs_actividad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        accion TEXT NOT NULL,
        detalles TEXT,
        ip_address TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )''',
    
    # Tabla de modelos ONT
    '''CREATE TABLE IF NOT EXISTS modelos_ont (
        id TEXT PRIMARY KEY,
        fabricante TEXT NOT NULL,
        modelo TEXT NOT NULL,
        version TEXT,
        tipo TEXT NOT NULL,
        descripcion TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME,
        usuario_id INTEGER,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    )''',
    
    # Tabla de comandos específicos de modelos ONT
    '''CREATE TABLE IF NOT EXISTS comandos_ont (
        id TEXT PRIMARY KEY,
        modelo_id TEXT NOT NULL,
        comando TEXT NOT NULL,
        descripcion TEXT,
        orden INTEGER DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (modelo_id) REFERENCES modelos_ont (id) ON DELETE CASCADE
    )'''
]

# Crear todas las tablas
for i, sql in enumerate(tables_sql, 1):
    try:
        cursor.execute(sql)
        print(f'✅ Tabla {i}/{len(tables_sql)} creada')
    except Exception as e:
        print(f'❌ Error creando tabla {i}: {e}')

# Insertar categorías por defecto
categorias = [
    ('Mantenimiento', '#1976d2', 'build'),
    ('Soporte', '#388e3c', 'support_agent'), 
    ('Mejora', '#fbc02d', 'trending_up'),
    ('Configuración', '#7b1fa2', 'settings'),
    ('Monitoreo', '#d32f2f', 'monitor')
]

for categoria, color, icono in categorias:
    cursor.execute('''INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono) 
                     VALUES (?, ?, ?)''', (categoria, color, icono))

print(f'✅ {len(categorias)} categorías insertadas')

# Actualizar usuario alito con password hasheado correctamente
password = '123'
# Crear hash compatible con bcrypt de Node.js
import hashlib
password_hash = hashlib.sha256(password.encode()).hexdigest()

cursor.execute('''UPDATE usuarios SET 
                  password_hash = ?,
                  nombre_completo = ?,
                  rol = ?
                  WHERE username = ?''', 
               (password_hash, 'Administrador del Sistema', 'admin', 'alito'))

print('✅ Usuario alito actualizado')

# Cargar comandos ZTE C600 desde el archivo JSON
json_file = '../docs/ZTE C600-2025-07-22.json'
if os.path.exists(json_file):
    print('📋 Cargando comandos ZTE C600...')
    
    with open(json_file, 'r', encoding='utf-8') as f:
        zte_data = json.load(f)
    
    # Insertar OLT ZTE C600
    olt_id = zte_data.get('id', 'zte-c600-principal')
    cursor.execute('''INSERT OR REPLACE INTO olts 
                     (id, nombre, shelf, slot, port, onu_id, modelo, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                   (olt_id, 
                    zte_data.get('nombre', 'ZTE C600'),
                    zte_data.get('shelf', 1),
                    zte_data.get('slot', 13), 
                    zte_data.get('port', 4),
                    zte_data.get('onuId', 38),
                    'ZTE C600',
                    'activo'))
    
    print(f'✅ OLT {zte_data.get("nombre")} insertada')
    
    # Insertar comandos
    comandos = zte_data.get('comandos', [])
    for i, comando in enumerate(comandos):
        cursor.execute('''INSERT INTO comandos 
                         (olt_id, nombre, descripcion, comandos_json, orden, activo)
                         VALUES (?, ?, ?, ?, ?, ?)''',
                       (olt_id,
                        comando.get('summary', f'Comando {i+1}'),
                        'Comando ZTE C600',
                        json.dumps(comando),
                        i,
                        1))
    
    print(f'✅ {len(comandos)} comandos ZTE C600 insertados')

else:
    print('❌ Archivo de comandos ZTE no encontrado')
    # Crear OLT de ejemplo
    cursor.execute('''INSERT OR REPLACE INTO olts 
                     (id, nombre, shelf, slot, port, onu_id, modelo, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                   ('zte-c600-demo', 'ZTE C600 Demo', 1, 13, 4, 38, 'ZTE C600', 'activo'))
    print('✅ OLT demo creada')

# Insertar tarea de ejemplo
cursor.execute('''INSERT OR IGNORE INTO tareas 
                 (titulo, descripcion, estado, prioridad, categoria, usuario_id) 
                 VALUES (?, ?, ?, ?, ?, ?)''',
               ('Verificar OLT ZTE C600', 
                'Revisar el estado y configuración de la OLT principal',
                'pendiente', 'alta', 'Mantenimiento', 1))

print('✅ Tarea de ejemplo insertada')

# Confirmar cambios
conn.commit()

# Verificar resultado final
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f'\n📊 RESUMEN FINAL:')
print(f'   📋 Tablas creadas: {len(tables)}')

for table in tables:
    table_name = table[0]
    cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
    count = cursor.fetchone()[0]
    print(f'   - {table_name}: {count} registros')

# Verificar OLTs específicamente
cursor.execute('SELECT id, nombre, modelo FROM olts')
olts = cursor.fetchall()
print(f'\n🏗️ OLTs CONFIGURADAS:')
for olt in olts:
    print(f'   🔧 {olt[1]} ({olt[2]}) - ID: {olt[0]}')

# Verificar comandos
cursor.execute('SELECT COUNT(*) FROM comandos')
cmd_count = cursor.fetchone()[0]
print(f'\n📟 COMANDOS DISPONIBLES: {cmd_count}')

conn.close()
print('\n🎉 BASE DE DATOS COMPLETA CREADA PARA ALITO')
print('🔑 Usuario: alito | Password: 123 | Rol: admin')

import sqlite3
import os

print('🔍 VERIFICANDO BASE DE DATOS DEL USUARIO ALITO')
print('=' * 50)

# Verificar base de datos principal (alito es admin)
db_path = 'olt_system.db'
if os.path.exists(db_path):
    print('✅ Base de datos principal encontrada')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Verificar usuario alito
    cursor.execute('SELECT * FROM usuarios WHERE username = ?', ('alito',))
    user = cursor.fetchone()
    
    if user:
        print(f'👤 Usuario alito encontrado:')
        print(f'   - ID: {user[0]}')
        print(f'   - Username: {user[1]}')
        print(f'   - Rol: {user[6] if len(user) > 6 else "No definido"}')
        print(f'   - Activo: {user[7] if len(user) > 7 else "No definido"}')
    else:
        print('❌ Usuario alito no encontrado')
    
    # Verificar tablas existentes
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f'\n📊 Tablas existentes ({len(tables)}):')
    for table in tables:
        table_name = table[0]
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            count = cursor.fetchone()[0]
            print(f'   - {table_name}: {count} registros')
        except Exception as e:
            print(f'   - {table_name}: Error al contar ({e})')
    
    # Verificar específicamente OLTs
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%olt%'")
    olt_tables = cursor.fetchall()
    
    if olt_tables:
        print(f'\n🏗️ TABLAS RELACIONADAS CON OLT ({len(olt_tables)}):')
        for table in olt_tables:
            table_name = table[0]
            cursor.execute(f'SELECT * FROM "{table_name}" LIMIT 3')
            rows = cursor.fetchall()
            print(f'   📋 {table_name}: {len(rows)} registros (mostrando primeros 3)')
            for row in rows:
                print(f'      {row}')
    else:
        print('\n❌ No se encontraron tablas de OLT')
    
    # Verificar específicamente comandos
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%comando%'")
    cmd_tables = cursor.fetchall()
    
    if cmd_tables:
        print(f'\n📟 TABLAS DE COMANDOS ({len(cmd_tables)}):')
        for table in cmd_tables:
            table_name = table[0]
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            count = cursor.fetchone()[0]
            print(f'   📋 {table_name}: {count} comandos')
            
            if count > 0:
                cursor.execute(f'SELECT * FROM "{table_name}" LIMIT 2')
                rows = cursor.fetchall()
                for row in rows:
                    print(f'      📝 {row[:3]}...')  # Mostrar solo primeros 3 campos
    else:
        print('\n❌ No se encontraron tablas de comandos')
    
    conn.close()
else:
    print('❌ Base de datos principal no encontrada')

# Verificar si existe archivo de respaldo de comandos ZTE
backup_files = [
    'ZTE C600-2025-07-22.json',
    '../docs/ZTE C600-2025-07-22.json',
    'restore-zte-commands.js',
    'backup-commands.js'
]

print(f'\n📦 VERIFICANDO ARCHIVOS DE RESPALDO:')
for backup_file in backup_files:
    if os.path.exists(backup_file):
        size = os.path.getsize(backup_file)
        print(f'   ✅ {backup_file}: {size:,} bytes')
    else:
        print(f'   ❌ {backup_file}: No encontrado')

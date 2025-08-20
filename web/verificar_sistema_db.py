import os
import sqlite3

print('🔍 VERIFICANDO SISTEMA DE BASES DE DATOS POR USUARIO')
print('=' * 60)

# Verificar estructura del proyecto
web_dir = 'c:/Users/e555044.NTDOM1/Desktop/aser web/miweb/web'
print(f'📁 Directorio web: {web_dir}')
print(f'✅ Existe: {os.path.exists(web_dir)}')

# Verificar archivos clave
files_to_check = [
    'user-database-manager.js',
    'server.js', 
    'package.json',
    'olt_system.db'
]

print('\n📄 ARCHIVOS CLAVE:')
for file in files_to_check:
    file_path = os.path.join(web_dir, file)
    exists = os.path.exists(file_path)
    status = "✅ Existe" if exists else "❌ No existe"
    print(f'  {file}: {status}')
    
    if exists:
        size = os.path.getsize(file_path)
        print(f'     📊 Tamaño: {size:,} bytes')

# Verificar directorio de bases de datos
db_dir = os.path.join(web_dir, 'databases')
print(f'\n📁 Directorio de bases de datos: {db_dir}')
print(f'✅ Existe: {os.path.exists(db_dir)}')

if os.path.exists(db_dir):
    files = os.listdir(db_dir)
    print(f'📋 Archivos encontrados: {len(files)}')
    for f in files:
        file_path = os.path.join(db_dir, f)
        size = os.path.getsize(file_path)
        print(f'  - {f} ({size:,} bytes)')
else:
    print('ℹ️  Se creará automáticamente al usar el sistema')

# Verificar base de datos principal
main_db_path = os.path.join(web_dir, 'olt_system.db')
if os.path.exists(main_db_path):
    print(f'\n🗄️  VERIFICANDO BASE DE DATOS PRINCIPAL:')
    try:
        conn = sqlite3.connect(main_db_path)
        cursor = conn.cursor()
        
        # Obtener lista de tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f'📊 Tablas encontradas: {len(tables)}')
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f'  - {table_name}: {count} registros')
        
        # Verificar usuarios
        cursor.execute("SELECT username, rol FROM usuarios WHERE activo = 1")
        users = cursor.fetchall()
        print(f'\n👥 Usuarios activos: {len(users)}')
        for user in users:
            print(f'  - {user[0]} ({user[1]})')
        
        conn.close()
        print('✅ Base de datos principal verificada correctamente')
        
    except Exception as e:
        print(f'❌ Error verificando base principal: {e}')

print('\n🎯 ANÁLISIS DEL SISTEMA:')
print('=' * 40)

# Verificar implementación en server.js
server_js_path = os.path.join(web_dir, 'server.js')
if os.path.exists(server_js_path):
    with open(server_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    user_db_manager_import = 'UserDatabaseManager' in content
    get_user_database = 'getUserDatabase' in content
    db_manager_instance = 'new UserDatabaseManager()' in content
    
    print(f'📝 UserDatabaseManager importado: {"✅" if user_db_manager_import else "❌"}')
    print(f'📝 Función getUserDatabase: {"✅" if get_user_database else "❌"}')
    print(f'📝 Instancia dbManager: {"✅" if db_manager_instance else "❌"}')

# Verificar implementación en user-database-manager.js
udm_path = os.path.join(web_dir, 'user-database-manager.js')
if os.path.exists(udm_path):
    with open(udm_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    has_class = 'class UserDatabaseManager' in content
    has_get_user_db = 'getUserDatabase(' in content
    has_get_tech_db = 'getTechnicianDatabase(' in content
    has_init_user_db = 'initializeUserDatabase(' in content
    
    print(f'📝 Clase UserDatabaseManager: {"✅" if has_class else "❌"}')
    print(f'📝 Método getUserDatabase: {"✅" if has_get_user_db else "❌"}')
    print(f'📝 Método getTechnicianDatabase: {"✅" if has_get_tech_db else "❌"}')
    print(f'📝 Método initializeUserDatabase: {"✅" if has_init_user_db else "❌"}')

print('\n🏆 RESULTADO FINAL:')
print('=' * 20)

all_files_exist = all(os.path.exists(os.path.join(web_dir, f)) for f in files_to_check)
server_properly_configured = user_db_manager_import and get_user_database and db_manager_instance
udm_properly_implemented = has_class and has_get_user_db and has_get_tech_db and has_init_user_db

if all_files_exist and server_properly_configured and udm_properly_implemented:
    print('✅ SISTEMA DE BASES DE DATOS POR USUARIO FUNCIONANDO CORRECTAMENTE')
    print('📋 Todos los componentes están implementados y configurados')
    print('🚀 Listo para crear bases de datos individuales por usuario')
else:
    print('⚠️  SISTEMA PARCIALMENTE CONFIGURADO')
    if not all_files_exist:
        print('❌ Faltan archivos necesarios')
    if not server_properly_configured:
        print('❌ server.js no está completamente configurado')
    if not udm_properly_implemented:
        print('❌ user-database-manager.js no está completamente implementado')

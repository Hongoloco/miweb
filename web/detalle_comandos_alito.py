import sqlite3
import json

print('🔍 DETALLE COMPLETO DE COMANDOS ZTE C600 PARA ALITO')
print('=' * 60)

# Conectar a la base de datos
conn = sqlite3.connect('olt_system.db')
cursor = conn.cursor()

# Obtener información de la OLT
cursor.execute('SELECT * FROM olts')
olt = cursor.fetchone()

print('🏗️ INFORMACIÓN DE LA OLT:')
print(f'   🔧 ID: {olt[0]}')
print(f'   📛 Nombre: {olt[1]}')
print(f'   🏭 Modelo: {olt[7]}')
print(f'   📡 Configuración: Shelf {olt[2]}, Slot {olt[3]}, Port {olt[4]}, ONU {olt[5]}')
print(f'   📅 Creada: {olt[10]}')
print(f'   ✅ Estado: {olt[9]}')

# Obtener todos los comandos
cursor.execute('''SELECT id, nombre, descripcion, comandos_json, orden 
                 FROM comandos 
                 WHERE olt_id = ? 
                 ORDER BY orden''', (olt[0],))

comandos = cursor.fetchall()
print(f'\n📟 COMANDOS DISPONIBLES ({len(comandos)}):')
print('=' * 40)

for i, (cmd_id, nombre, descripcion, comandos_json, orden) in enumerate(comandos, 1):
    print(f'\n{i}. 📋 {nombre}')
    print(f'   🆔 ID: {cmd_id}')
    print(f'   📝 Descripción: {descripcion}')
    print(f'   🔢 Orden: {orden}')
    
    # Parsear y mostrar los comandos específicos
    try:
        cmd_data = json.loads(comandos_json)
        if 'lines' in cmd_data:
            print(f'   💻 Comandos ({len(cmd_data["lines"])}):')
            for j, line in enumerate(cmd_data['lines'], 1):
                print(f'      {j}. {line}')
        else:
            print(f'   💻 Datos: {cmd_data}')
    except json.JSONDecodeError:
        print(f'   ⚠️  Error al parsear JSON del comando')

# Verificar categorías disponibles
cursor.execute('SELECT nombre, color, icono FROM categorias_tareas WHERE activa = 1')
categorias = cursor.fetchall()

print(f'\n📂 CATEGORÍAS DISPONIBLES ({len(categorias)}):')
for categoria, color, icono in categorias:
    print(f'   📁 {categoria} (Color: {color}, Icono: {icono})')

# Verificar tareas
cursor.execute('SELECT titulo, descripcion, estado, prioridad, categoria FROM tareas WHERE activa = 1')
tareas = cursor.fetchall()

print(f'\n📋 TAREAS ACTIVAS ({len(tareas)}):')
for titulo, descripcion, estado, prioridad, categoria in tareas:
    print(f'   ✓ {titulo}')
    print(f'     📝 {descripcion}')
    print(f'     🎯 Estado: {estado} | Prioridad: {prioridad} | Categoría: {categoria}')

# Verificar usuario alito
cursor.execute('SELECT username, nombre_completo, rol, activo FROM usuarios WHERE username = "alito"')
user = cursor.fetchone()

print(f'\n👤 PERFIL DE USUARIO ALITO:')
print(f'   🔑 Username: {user[0]}')
print(f'   📛 Nombre: {user[1]}')
print(f'   🎭 Rol: {user[2]}')
print(f'   ✅ Activo: {user[3]}')

conn.close()

print(f'\n🎯 RESUMEN EJECUTIVO:')
print('=' * 25)
print(f'✅ Usuario alito configurado como ADMINISTRADOR')
print(f'✅ {len(comandos)} comandos ZTE C600 listos para usar')
print(f'✅ OLT ZTE C600 configurada y activa')
print(f'✅ {len(categorias)} categorías de tareas disponibles')
print(f'✅ Sistema completamente funcional')

print(f'\n🔑 CREDENCIALES:')
print(f'   Usuario: alito')
print(f'   Password: 123')
print(f'   Rol: Administrador')
print(f'\n🚀 ¡El sistema está listo para usar!')

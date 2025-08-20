#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌐 DEMOSTRACIÓN INTERACTIVA DEL SISTEMA OLT ANTEL
=================================================
Simulación del funcionamiento del sistema web con bases de datos por usuario
"""

import sqlite3
import json
import os
from datetime import datetime

class DemoSistemaOLT:
    def __init__(self):
        self.db_path = 'olt_system.db'
        self.current_user = None
        self.session_active = False
        
    def mostrar_banner(self):
        print('🌐 SISTEMA OLT ANTEL - DEMOSTRACIÓN INTERACTIVA')
        print('=' * 60)
        print('📱 Puerto simulado: http://localhost:3000')
        print('🔧 Base de datos: SQLite3 con sistema por usuario')
        print('📅 Fecha:', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        print()
        
    def autenticar_usuario(self, username, password):
        """Simula el proceso de autenticación"""
        if not os.path.exists(self.db_path):
            print('❌ Base de datos no encontrada')
            return False
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Verificar usuario (en una implementación real se hashearia la password)
        cursor.execute('SELECT username, rol, activo FROM usuarios WHERE username = ?', (username,))
        user = cursor.fetchone()
        
        if user and password == '123':  # Password demo
            self.current_user = {
                'username': user[0],
                'rol': user[1], 
                'activo': user[2]
            }
            self.session_active = True
            print(f'✅ Autenticación exitosa para {username}')
            print(f'👤 Rol: {user[1]}')
            return True
        else:
            print('❌ Credenciales incorrectas')
            return False
            
        conn.close()
        
    def mostrar_dashboard(self):
        """Muestra el dashboard principal según el usuario"""
        if not self.session_active:
            print('❌ Debe autenticarse primero')
            return
            
        print(f'\n🏠 DASHBOARD - {self.current_user["username"].upper()}')
        print('=' * 50)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if self.current_user['rol'] == 'admin':
            print('👑 VISTA ADMINISTRADOR - Acceso completo')
            
            # Mostrar estadísticas generales
            cursor.execute('SELECT COUNT(*) FROM usuarios WHERE activo = 1')
            usuarios = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM olts WHERE estado = "activo"')
            olts = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM comandos WHERE activo = 1')
            comandos = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM tareas WHERE activa = 1')
            tareas = cursor.fetchone()[0]
            
            print(f'📊 ESTADÍSTICAS DEL SISTEMA:')
            print(f'   👥 Usuarios activos: {usuarios}')
            print(f'   🏗️  OLTs configuradas: {olts}')
            print(f'   📟 Comandos disponibles: {comandos}')
            print(f'   📋 Tareas activas: {tareas}')
            
        else:
            print('👨‍🔧 VISTA TÉCNICO - Base de datos individual')
            print('   🔒 Datos aislados del resto de usuarios')
            print('   📁 BD individual: databases/{}_olt_system.db'.format(self.current_user['username']))
            
        conn.close()
        
    def listar_olts(self):
        """Lista las OLTs disponibles según el usuario"""
        if not self.session_active:
            print('❌ Debe autenticarse primero')
            return
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        print(f'\n🏗️ OLTs DISPONIBLES:')
        print('=' * 30)
        
        cursor.execute('SELECT id, nombre, modelo, estado, fecha_creacion FROM olts')
        olts = cursor.fetchall()
        
        if olts:
            for i, olt in enumerate(olts, 1):
                print(f'{i}. 📡 {olt[1]} ({olt[2]})')
                print(f'   🆔 ID: {olt[0]}')
                print(f'   ✅ Estado: {olt[3]}')
                print(f'   📅 Creada: {olt[4]}')
                print()
        else:
            print('❌ No hay OLTs configuradas')
            
        conn.close()
        
    def mostrar_comandos(self, olt_id=None):
        """Muestra los comandos disponibles"""
        if not self.session_active:
            print('❌ Debe autenticarse primero')
            return
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if olt_id:
            cursor.execute('SELECT nombre FROM olts WHERE id = ?', (olt_id,))
            olt_name = cursor.fetchone()
            if olt_name:
                print(f'\n📟 COMANDOS PARA OLT: {olt_name[0]}')
            else:
                print(f'\n📟 COMANDOS PARA OLT ID: {olt_id}')
        else:
            print(f'\n📟 TODOS LOS COMANDOS DISPONIBLES:')
            
        print('=' * 50)
        
        if olt_id:
            cursor.execute('''SELECT nombre, descripcion, comandos_json, orden 
                             FROM comandos 
                             WHERE olt_id = ? AND activo = 1 
                             ORDER BY orden''', (olt_id,))
        else:
            cursor.execute('''SELECT nombre, descripcion, comandos_json, orden 
                             FROM comandos 
                             WHERE activo = 1 
                             ORDER BY orden''')
            
        comandos = cursor.fetchall()
        
        if comandos:
            for i, (nombre, descripcion, cmd_json, orden) in enumerate(comandos, 1):
                print(f'{i}. 📋 {nombre}')
                print(f'   📝 {descripcion}')
                
                try:
                    cmd_data = json.loads(cmd_json)
                    if 'lines' in cmd_data:
                        lines = cmd_data['lines'][:3]  # Mostrar solo primeras 3 líneas
                        print(f'   💻 Primeros comandos:')
                        for line in lines:
                            if line.strip():
                                print(f'      {line}')
                        if len(cmd_data['lines']) > 3:
                            print(f'      ... (+{len(cmd_data["lines"]) - 3} líneas más)')
                except:
                    pass
                print()
        else:
            print('❌ No hay comandos disponibles')
            
        conn.close()
        
    def simular_ejecucion_comando(self, comando_id):
        """Simula la ejecución de un comando"""
        if not self.session_active:
            print('❌ Debe autenticarse primero')
            return
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT nombre, comandos_json FROM comandos WHERE id = ?', (comando_id,))
        comando = cursor.fetchone()
        
        if comando:
            print(f'\n🚀 EJECUTANDO COMANDO: {comando[0]}')
            print('=' * 40)
            
            try:
                cmd_data = json.loads(comando[1])
                if 'lines' in cmd_data:
                    print('💻 Comandos a ejecutar:')
                    for i, line in enumerate(cmd_data['lines'], 1):
                        if line.strip():
                            print(f'{i:2d}. {line}')
                    
                    print('\n✅ SIMULACIÓN: Comandos ejecutados exitosamente')
                    print('📊 Resultado: Configuración aplicada en OLT ZTE C600')
                    
                    # Simular log de actividad
                    print(f'📝 Log registrado para usuario: {self.current_user["username"]}')
                    
            except Exception as e:
                print(f'❌ Error al procesar comando: {e}')
        else:
            print('❌ Comando no encontrado')
            
        conn.close()
        
    def mostrar_menu(self):
        """Muestra el menú principal"""
        if not self.session_active:
            print('\n🔐 OPCIONES DE AUTENTICACIÓN:')
            print('1. Iniciar sesión como alito (admin)')
            print('2. Iniciar sesión como tecnico1 (técnico)')
            print('0. Salir')
        else:
            print(f'\n📱 MENÚ PRINCIPAL - {self.current_user["username"]}:')
            print('1. Ver Dashboard')
            print('2. Listar OLTs')
            print('3. Ver todos los comandos')
            print('4. Ver comandos de OLT específica')
            print('5. Ejecutar comando (simulado)')
            print('6. Cerrar sesión')
            print('0. Salir')
            
    def ejecutar_demo(self):
        """Ejecuta la demostración interactiva"""
        self.mostrar_banner()
        
        while True:
            self.mostrar_menu()
            
            try:
                opcion = input('\n👉 Seleccione una opción: ').strip()
                
                if opcion == '0':
                    print('\n👋 ¡Gracias por probar el Sistema OLT Antel!')
                    break
                    
                elif opcion == '1':
                    if not self.session_active:
                        if self.autenticar_usuario('alito', '123'):
                            self.mostrar_dashboard()
                    else:
                        self.mostrar_dashboard()
                        
                elif opcion == '2':
                    if not self.session_active:
                        if self.autenticar_usuario('tecnico1', '123'):
                            self.mostrar_dashboard()
                    else:
                        self.listar_olts()
                        
                elif opcion == '3' and self.session_active:
                    self.mostrar_comandos()
                    
                elif opcion == '4' and self.session_active:
                    olt_id = input('Ingrese ID de la OLT (olt-1747418871049): ').strip()
                    if not olt_id:
                        olt_id = 'olt-1747418871049'
                    self.mostrar_comandos(olt_id)
                    
                elif opcion == '5' and self.session_active:
                    cmd_id = input('Ingrese ID del comando (1-10): ').strip()
                    if cmd_id.isdigit():
                        self.simular_ejecucion_comando(int(cmd_id))
                    else:
                        print('❌ ID de comando inválido')
                        
                elif opcion == '6' and self.session_active:
                    print(f'👋 Sesión cerrada para {self.current_user["username"]}')
                    self.session_active = False
                    self.current_user = None
                    
                else:
                    print('❌ Opción no válida')
                    
            except KeyboardInterrupt:
                print('\n\n👋 Saliendo del sistema...')
                break
            except Exception as e:
                print(f'❌ Error: {e}')
                
            input('\n📝 Presione Enter para continuar...')
            print('\n' + '='*60)

if __name__ == '__main__':
    demo = DemoSistemaOLT()
    demo.ejecutar_demo()

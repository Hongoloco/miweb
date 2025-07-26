# 🖥️ Sistema OLT Antel - Versión Portable para Windows

## 📋 Descripción
Aplicación de escritorio portable para gestión integral de servicios de telecomunicaciones residenciales de Antel. No requiere instalación y funciona completamente offline.

## ⚡ Inicio Rápido

### Opción 1: Usar Aplicación Pre-construida (Recomendado)
1. Descargar el archivo `Sistema-OLT-Antel-X.X.X-portable.exe`
2. Ejecutar directamente (no requiere instalación)
3. ¡Listo para usar!

### Opción 2: Construir desde el Código Fuente
1. **Ejecutar instalador automático:**
   ```batch
   install.bat
   ```

2. **Crear versión portable:**
   ```batch
   build-portable.bat
   ```

3. **Ejecutar aplicación:**
   ```batch
   "Ejecutar Sistema OLT Antel.bat"
   ```

## 🎯 Características

### ✨ Funcionalidades Principales
- **🌐 OLT Management:** Gestión completa de equipos ZTE C600
- **📞 IMS Antel:** Comandos para gestión de abonados
- **🌍 ACS:** Auto Configuration Server para ONTs
- **👥 Multi-usuario:** Sistema de usuarios con roles
- **📋 Tareas:** Gestión de tareas y actividades
- **🗄️ Base de Datos:** SQLite local (sin dependencias externas)

### 🖥️ Características de la Aplicación Desktop
- **Interfaz Nativa:** Aplicación de escritorio completa
- **Sin Navegador:** No depende de navegadores web
- **Portable:** Se ejecuta desde cualquier ubicación
- **Offline:** Funciona sin conexión a internet
- **Menús Nativos:** Menús de Windows integrados
- **Auto-actualización:** Servidor interno auto-gestionado

## 📁 Estructura de Archivos

```
Sistema-OLT-Antel/
├── 📱 Sistema-OLT-Antel-portable.exe    # Aplicación principal
├── 🗄️ olt_system.db                     # Base de datos local
├── 📝 README-PORTABLE.md                # Esta documentación
├── ⚙️ install.bat                       # Instalador automático
├── 🏗️ build-portable.bat               # Constructor portable
├── ▶️ Ejecutar Sistema OLT Antel.bat    # Ejecutor directo
└── 🌐 Ejecutar en Modo Web.bat          # Ejecutor modo web
```

## 🚀 Métodos de Ejecución

### 1. Aplicación de Escritorio (Recomendado)
```batch
"Ejecutar Sistema OLT Antel.bat"
```
- Interfaz nativa de Windows
- Menús integrados
- Mejor rendimiento

### 2. Modo Web (Alternativo)
```batch
"Ejecutar en Modo Web.bat"
```
- Abrir navegador: `http://localhost:3000`
- Interfaz web completa
- Compatible con cualquier navegador

## ⚙️ Configuración

### 🗄️ Base de Datos
- **Archivo:** `olt_system.db`
- **Tipo:** SQLite (portable)
- **Ubicación:** Carpeta de la aplicación
- **Backup:** Copiar archivo .db

### 👤 Usuario por Defecto
- **Usuario:** `alito`
- **Contraseña:** `123456`
- **Rol:** Administrador

### 🌐 Configuración de Red
- **Puerto:** 3000 (auto-configurado)
- **Host:** localhost (solo local)
- **SSL:** No requerido

## 🛠️ Solución de Problemas

### ❌ Error al Iniciar
1. **Ejecutar como administrador**
2. **Verificar puerto 3000 disponible**
3. **Agregar excepción en antivirus**
4. **Verificar permisos de escritura**

### 🔧 Problemas de Base de Datos
1. **Eliminar archivo:** `olt_system.db`
2. **Ejecutar:** `npm run init-db`
3. **Reiniciar aplicación**

### 🌐 Problemas de Conexión
1. **Verificar firewall de Windows**
2. **Comprobar antivirus**
3. **Reiniciar aplicación**
4. **Usar modo web alternativo**

## 📊 Requisitos del Sistema

### Mínimos
- **SO:** Windows 7 SP1 o superior
- **RAM:** 2 GB mínimo
- **Espacio:** 200 MB libre
- **Procesador:** x64 (64-bit)

### Recomendados
- **SO:** Windows 10/11
- **RAM:** 4 GB o más
- **Espacio:** 500 MB libre
- **Pantalla:** 1280x800 o superior

## 🔄 Actualización

### Método 1: Reemplazar Executable
1. Descargar nueva versión portable
2. Cerrar aplicación actual
3. Reemplazar archivo .exe
4. Conservar archivo `olt_system.db`

### Método 2: Reconstruir
```batch
build-portable.bat
```

## 📞 Soporte

### 🐛 Reportar Problemas
1. **Logs:** Ver en aplicación → Servidor → Estado
2. **Archivos:** Incluir `olt_system.db` si es posible
3. **Pantalla:** Captura de pantalla del error

### 🆘 Contacto
- **Sistema:** Interno Antel
- **Documentación:** Wiki corporativa
- **Soporte:** Mesa de ayuda técnica

## 📝 Notas Importantes

### ⚠️ Seguridad
- Cambiar contraseña por defecto
- No compartir archivo de base de datos
- Ejecutar desde ubicación segura

### 💾 Backup
- Respaldar regularmente `olt_system.db`
- Exportar configuraciones importantes
- Documentar cambios personalizados

### 🔄 Mantenimiento
- Revisar logs periódicamente
- Limpiar datos obsoletos
- Actualizar cuando esté disponible

---

## 🎉 ¡Listo para Usar!

Tu Sistema OLT Antel portable está configurado y listo para gestionar toda la infraestructura de red de servicios residenciales.

**¡Que tengas un excelente trabajo! 🚀**

# Sistema OLT Antel - Versión Portable Desktop

## 💻 Descripción
Versión portable de escritorio del Sistema de Gestión OLT Antel. Aplicación nativa para Windows construida con Electron que incluye un servidor Node.js embebido.

## 🚀 Instalación y Ejecución

### Opción 1: Ejecutar desde Código Fuente
1. Instalar dependencias:
   ```batch
   install.bat
   ```

2. Ejecutar aplicación:
   ```batch
   "Ejecutar Sistema OLT Antel.bat"
   ```

### Opción 2: Crear Ejecutable Portable
1. Instalar dependencias (si no se hizo antes):
   ```batch
   install.bat
   ```

2. Construir ejecutable portable:
   ```batch
   build-portable.bat
   ```

3. El ejecutable se generará en la carpeta `dist/`

## 📋 Scripts y Archivos Batch Disponibles
- `install.bat` - Instalar todas las dependencias
- `build-portable.bat` - Crear ejecutable portable
- `Ejecutar Sistema OLT Antel.bat` - Ejecutar aplicación de escritorio
- `Ejecutar en Modo Web.bat` - Ejecutar solo servidor web

## 🔧 Características Desktop
- ✅ Aplicación nativa de Windows
- ✅ Servidor Node.js embebido (auto-inicio)
- ✅ Base de datos SQLite portable
- ✅ Menús nativos de Windows
- ✅ Ventana dedicada sin dependencias del navegador
- ✅ Ejecutable portable (.exe)
- ✅ Todas las funcionalidades de la versión web
- ✅ Manejo de errores y recuperación automática

## 🖥️ Requisitos del Sistema
- Windows 10 o superior (64-bit)
- 4 GB RAM mínimo
- 200 MB espacio libre en disco
- No requiere instalación previa de Node.js

## 📁 Estructura de Archivos
```
portable/
├── electron-main.js        # Aplicación Electron principal
├── error.html             # Página de error
├── package.json           # Configuración Electron
├── server.js              # Servidor Node.js embebido
├── index.html            # Interfaz de usuario
├── olt_system.db         # Base de datos portable
├── *.bat                 # Scripts de ejecución Windows
├── *.js                  # Módulos JavaScript
├── README-PORTABLE.md    # Documentación detallada
├── MANUAL-USUARIO.md     # Manual de usuario
└── dist/                 # Ejecutables generados
```

## 🎯 Modo de Uso
1. **Modo Desktop**: Ejecutar con "Ejecutar Sistema OLT Antel.bat" para usar la aplicación nativa
2. **Modo Web**: Ejecutar con "Ejecutar en Modo Web.bat" y abrir http://localhost:3000 en navegador

## 📞 Soporte
- Ver `MANUAL-USUARIO.md` para instrucciones detalladas
- Ver `README-PORTABLE.md` para documentación técnica completa

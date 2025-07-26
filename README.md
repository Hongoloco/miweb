# 🌐 Sistema OLT Antel - Workspace Organizado

## 📁 Estructura del Proyecto

Este proyecto contiene **dos versiones** del Sistema OLT Antel organizadas en carpetas separadas:

```
miweb/
├── web/                    # 🌐 Versión Web
│   ├── index.html         # Interfaz principal
│   ├── server.js          # Servidor Node.js
│   ├── package.json       # Dependencias web
│   ├── olt_system.db      # Base de datos
│   └── *.js               # Módulos JavaScript
│
├── portable/               # 💻 Versión Desktop Portable
│   ├── electron-main.js   # Aplicación Electron
│   ├── package.json       # Dependencias Electron
│   ├── *.bat              # Scripts Windows
│   └── dist/              # Ejecutables generados
│
├── docs/                   # 📚 Documentación
├── icons/                  # 🎨 Iconos del sistema
├── backup/                 # 💾 Scripts de respaldo
└── README.md              # Este archivo
```

## 🚀 Inicio Rápido

### 🌐 Versión Web
```bash
# Instalar dependencias
npm run install-web

# Inicializar base de datos
cd web && npm run init-db

# Ejecutar aplicación web
npm run web
```
**Acceso:** http://localhost:3000

### 💻 Versión Desktop Portable
```bash
# Instalar dependencias
npm run install-portable

# Ejecutar aplicación desktop
npm run portable

# O usar scripts Windows:
cd portable
install.bat
"Ejecutar Sistema OLT Antel.bat"
```

## 📋 Scripts Disponibles

### Scripts del Workspace Principal
- `npm run web` - Ejecutar versión web
- `npm run portable` - Ejecutar versión desktop
- `npm run install-all` - Instalar todas las dependencias
- `npm run build-portable` - Crear ejecutable portable

### Scripts Específicos
- **Web:** `npm run web-dev` - Modo desarrollo web
- **Portable:** `npm run portable-dev` - Modo desarrollo Electron

## 🔧 Características de Cada Versión

### 🌐 Versión Web
- ✅ Aplicación web responsiva
- ✅ Acceso desde cualquier navegador
- ✅ Progressive Web App (PWA)
- ✅ Service Workers para cache
- ✅ Compartible en red local

### 💻 Versión Desktop Portable
- ✅ Aplicación nativa de Windows
- ✅ Servidor embebido (no requiere navegador)
- ✅ Ejecutable portable (.exe)
- ✅ Menús nativos de Windows
- ✅ Auto-inicio del servidor

## 🎯 ¿Cuál Versión Usar?

| Aspecto | Web | Desktop |
|---------|-----|---------|
| **Instalación** | Requiere Node.js | Ejecutable independiente |
| **Acceso** | Navegador web | Aplicación nativa |
| **Portabilidad** | Acceso remoto | Archivo .exe portable |
| **Rendimiento** | Depende del navegador | Optimizado para desktop |
| **Actualizaciones** | Manual en servidor | Redistribución de .exe |

## 📚 Documentación Detallada

- **Web:** Ver `web/README.md`
- **Portable:** Ver `portable/README.md` y `portable/MANUAL-USUARIO.md`
- **Técnica:** Ver `docs/` para documentación específica

## 🔄 Migración entre Versiones

Las bases de datos son **compatibles** entre ambas versiones. Puedes copiar `olt_system.db` de una carpeta a otra para mantener los datos sincronizados.

## 📞 Soporte Técnico

Para soporte, consultar:
1. Documentación en la pestaña "Ayuda" de cualquier versión
2. READMEs específicos de cada carpeta
3. Archivos en la carpeta `docs/`

---

**Desarrollado por:** Equipo de Desarrollo de Servicios Residenciales - Antel  
**Versión:** 2.0.0 - Workspace Organizado

# 🌐 Sistema OLT Antel

Sistema integral para la gestión de equipos OLT, comandos de telecomunicaciones, modelos ACS y tareas operativas con modo oscuro avanzado.

## 🚀 Características Principales

- ✅ **Gestión de OLTs ZTE C600/C300** - Configuración y gestión completa
- ✅ **Sistema de comandos telecomunicaciones** - Generación automática  
- ✅ **Modelos ACS** - Gestión de modelos con comandos personalizables
- ✅ **Dashboard con analytics en tiempo real** - Métricas y estadísticas
- ✅ **Sistema de usuarios y roles** - Control de acceso granular
- ✅ **Gestión de tareas y seguimiento** - Workflow operativo
- ✅ **PWA (Progressive Web App)** - Instalable y offline
- ✅ **Notificaciones en tiempo real (SSE)** - Updates automáticos
- ✅ **Modo Oscuro Inteligente** - Adaptación automática de colores
- ✅ **Sistema de Auditoría** - Trazabilidad completa
- ✅ **Copiar Comandos** - Funcionalidad de portapapeles integrada

## 🛠️ Tecnologías

- **Backend:** Node.js + Express + SQLite3
- **Frontend:** HTML5 + CSS3 + JavaScript ES6+
- **Autenticación:** bcrypt + express-session
- **Tiempo real:** Server-Sent Events (SSE)
- **PWA:** Service Workers + Web App Manifest
- **Modo Oscuro:** Sistema CSS + JavaScript adaptativo

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/Hongoloco/miweb.git
cd miweb

# Instalar dependencias
npm install

# Inicializar base de datos
npm run init-db

# Iniciar servidor
npm start
```

## 🔐 Credenciales por defecto

- **Usuario:** `alito`
- **Contraseña:** `123`
- **Rol:** Administrador

## 🏗️ Estructura del proyecto

```
web/
├── server.js              # Servidor principal
├── index.html             # Frontend SPA
├── init-database.js       # Inicialización BD
├── olt_system.db         # Base de datos SQLite
├── theme-system.js       # Sistema de temas
├── notification-system.js # Notificaciones
├── dashboard-charts.js   # Gráficos y analytics
└── docs/                 # Documentación
```

## 🌐 Acceso

Una vez iniciado, accede a: **http://localhost:3000**

## 📊 Funcionalidades principales

### OLT Management
- Gestión completa de OLTs ZTE
- Comandos predefinidos y personalizados
- Configuración Bridge/Router
- Gestión de ONUs

### Dashboard
- Métricas en tiempo real
- Gráficos de actividad
- Estadísticas de sistema
- Monitoreo de tareas

### Sistema de usuarios
- Roles y permisos granulares
- Logs de actividad
- Gestión de sesiones seguras

## 🔧 Comandos disponibles

```bash
npm start          # Iniciar en producción
npm run dev        # Modo desarrollo (nodemon)
npm run init-db    # Reinicializar BD
```

## 🐛 Solución de problemas

### Credenciales incorrectasnpm run init-db 
```bash
cd web && node init-database.js
```

### Base de datos corrupta
```bash
rm web/olt_system.db && npm run init-db
```

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles

---
**Desarrollado para Antel - Servicios Residenciales**

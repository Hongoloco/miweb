# 🌐 Sistema de Desarrollo de Servicios Residenciales

Sistema integral para la gestión de equipos OLT, comandos de telecomunicaciones y tareas operativas.

## 🚀 Características

- ✅ **Gestión de OLTs ZTE C600/C300**
- ✅ **Sistema de comandos telecomunicaciones**  
- ✅ **Dashboard con analytics en tiempo real**
- ✅ **Sistema de usuarios y roles**
- ✅ **Gestión de tareas y seguimiento**
- ✅ **PWA (Progressive Web App)**
- ✅ **Notificaciones en tiempo real (SSE)**
- ✅ **Sistema de temas (claro/oscuro)**

## 🛠️ Tecnologías

- **Backend:** Node.js + Express
- **Base de datos:** SQLite3
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Autenticación:** bcrypt + express-session
- **Tiempo real:** Server-Sent Events (SSE)

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

### Credenciales incorrectas
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

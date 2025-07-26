# Sistema OLT Antel - Versión Web

## 🌐 Descripción
Versión web del Sistema de Gestión OLT Antel. Una aplicación web completa para la gestión técnica de servicios de telecomunicaciones residenciales.

## 🚀 Instalación y Ejecución

### Requisitos Previos
- Node.js 14.0.0 o superior
- npm (incluido con Node.js)

### Pasos de Instalación
1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Inicializar base de datos:
   ```bash
   npm run init-db
   ```

3. Iniciar servidor web:
   ```bash
   npm start
   ```

4. Abrir navegador en: `http://localhost:3000`

## 📋 Scripts Disponibles
- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en modo desarrollo (con nodemon)
- `npm run init-db` - Inicializar base de datos SQLite

## 🔧 Características
- ✅ Aplicación web responsiva
- ✅ Base de datos SQLite local
- ✅ API REST completa
- ✅ Sistema de usuarios y autenticación
- ✅ Gestión de comandos OLT
- ✅ Módulos IMS y ACS
- ✅ Dashboard con métricas
- ✅ Progressive Web App (PWA)

## 🌐 Acceso
Una vez iniciado el servidor, acceder desde cualquier navegador moderno a `http://localhost:3000`

## 📁 Estructura de Archivos
```
web/
├── index.html              # Interfaz principal
├── server.js               # Servidor Node.js
├── package.json            # Configuración de dependencias
├── olt_system.db          # Base de datos SQLite
├── manifest.json          # Configuración PWA
├── sw.js                  # Service Worker
├── *.js                   # Módulos JavaScript
└── README.md              # Este archivo
```

## 📞 Soporte
Para soporte técnico, consultar la documentación en la pestaña "Ayuda" de la aplicación.

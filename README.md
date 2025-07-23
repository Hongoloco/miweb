# Sistema OLT Antel - ZTE C600 con Base de Datos

🌐 Sistema integral para la gestión de equipos ZTE C600 de la Unidad de Desarrollo Residenciales con persistencia de datos usando SQLite.

## 📋 Características

### ✨ Funcionalidades Principales
- **Base de datos SQLite local** - Persistencia de datos sin configuración compleja
- **API REST** - Comunicación entre frontend y backend
- **Gestión de OLTs** - CRUD completo de equipos OLT
- **Comandos dinámicos** - Variables reemplazables {shelf}/{slot}/{port}:{onuId}
- **Sistema de usuarios** - Autenticación y control de acceso
- **Logs de actividad** - Registro de todas las acciones del sistema
- **Búsqueda inteligente** - Búsqueda en tiempo real en la base de datos
- **Interfaz responsiva** - Funciona en desktop y móviles

### 🔧 Tecnologías
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js + Express
- **Base de datos:** SQLite3
- **Autenticación:** bcrypt para hash de contraseñas
- **CORS:** Habilitado para desarrollo

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm (viene con Node.js)

### 1. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 2. Inicializar la base de datos
\`\`\`bash
npm run init-db
\`\`\`

Este comando creará:
- Base de datos SQLite: `olt_system.db`
- Tablas necesarias (usuarios, olts, comandos, logs_actividad)
- Usuario por defecto: `alito` / `vinil28`
- OLT de ejemplo con comandos predefinidos

### 3. Importar comandos desde JSON (NUEVO)
```bash
npm run import-comandos
```

Este comando importará todos los comandos del archivo `ZTE C600-2025-07-22.json` a la base de datos. Los comandos incluyen:
- Factory Reset
- Ver la base de ONU's
- Configurar en modo bridge/router
- Ver estado de línea VoIP
- Ver IP de VoIP
- Y más comandos del repositorio

### 4. Iniciar el servidor
\`\`\`bash
npm start
\`\`\`

### 4. Acceder al sistema
Abrir navegador en: **http://localhost:3000**

## 📁 Estructura del Proyecto

```
miweb/
├── package.json                 # Configuración y dependencias
├── server.js                    # Servidor Express con API REST
├── init-database.js             # Script de inicialización de BD
├── import-comandos.js           # Script para importar comandos desde JSON
├── verify-comandos.js           # Script para verificar comandos importados
├── index.html                   # Interfaz principal con base de datos
├── ZTE C600-2025-07-22.json     # Archivo con comandos del repositorio
├── olt_system.db               # Base de datos SQLite (se crea automáticamente)
└── README.md                   # Este archivo
```

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor con nodemon (auto-restart)
- `npm run init-db` - Inicializa la base de datos con datos por defecto
- `npm run import-comandos` - Importa comandos desde el archivo JSON
- `node verify-comandos.js` - Verifica los comandos importados

## 🗄️ Estructura de la Base de Datos

### Tabla: usuarios
- `id` - ID único
- `username` - Nombre de usuario único
- `password_hash` - Contraseña hasheada
- `nombre_completo` - Nombre completo del usuario
- `email` - Correo electrónico
- `rol` - Rol del usuario (admin, operador)
- `activo` - Estado del usuario
- `fecha_creacion` - Timestamp de creación
- `ultimo_acceso` - Último acceso al sistema

### Tabla: olts
- `id` - ID único de la OLT
- `nombre` - Nombre descriptivo
- `shelf`, `slot`, `port`, `onu_id` - Parámetros de conexión
- `ip_address` - Dirección IP (opcional)
- `modelo` - Modelo del equipo
- `ubicacion` - Ubicación física
- `estado` - Estado (activa/inactiva)
- `fecha_creacion` - Timestamp de creación
- `fecha_modificacion` - Timestamp de última modificación

### Tabla: comandos
- `id` - ID único del comando
- `olt_id` - Referencia a la OLT
- `nombre` - Nombre del comando
- `descripcion` - Descripción detallada
- `comandos_json` - Array de comandos en formato JSON
- `categoria` - Categoría del comando
- `orden` - Orden de visualización
- `activo` - Estado del comando

### Tabla: logs_actividad
- `id` - ID único del log
- `usuario_id` - Referencia al usuario
- `accion` - Acción realizada
- `detalles` - Detalles adicionales
- `ip_address` - Dirección IP del usuario
- `fecha` - Timestamp de la acción

## 🔌 API REST Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión

### OLTs
- `GET /api/olts` - Obtener todas las OLTs
- `GET /api/olts/:id` - Obtener OLT específica con comandos
- `POST /api/olts` - Crear nueva OLT
- `PUT /api/olts/:id` - Actualizar OLT
- `DELETE /api/olts/:id` - Eliminar OLT (soft delete)

### Comandos
- `POST /api/comandos` - Crear nuevo comando
- `PUT /api/comandos/:id` - Actualizar comando
- `DELETE /api/comandos/:id` - Eliminar comando
- `GET /api/comandos/buscar?q=termino` - Buscar comandos

### Logs
- `GET /api/logs?limit=50` - Obtener logs de actividad

## 👤 Usuario por Defecto

**Username:** `alito`  
**Password:** `vinil28`  
**Rol:** `admin`

## 🔧 Variables Dinámicas en Comandos

Los comandos pueden usar las siguientes variables que se reemplazan automáticamente:

- `{shelf}` - Número de shelf
- `{slot}` - Número de slot  
- `{port}` - Número de puerto
- `{onuId}` - ID de la ONU

**Ejemplo:**
\`\`\`
pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}
restore factory
\`\`\`

Se convierte en:
\`\`\`
pon-onu-mng gpon_onu-1/13/4:38
restore factory
\`\`\`

## 📊 Comandos Predefinidos

El sistema viene con estos comandos configurados:

1. **Factory Reset** - Restaurar configuración de fábrica
2. **Ver base de ONUs** - Consultar ONUs conectadas
3. **Configurar modo bridge** - Cambiar a modo bridge con VLANs
4. **Volver a modo router** - Restaurar modo router
5. **Ver estado VoIP** - Consultar estado de líneas telefónicas
6. **Ver IP de VoIP** - Verificar asignación de IP telefónica

## 🔍 Búsqueda Inteligente

La búsqueda funciona en:
- Nombres de comandos
- Descripciones
- Contenido de los comandos
- Todas las OLTs simultáneamente

## 📝 Logs de Actividad

El sistema registra automáticamente:
- Inicios de sesión exitosos y fallidos
- Creación, edición y eliminación de OLTs
- Creación, edición y eliminación de comandos
- Dirección IP del usuario
- Timestamp de cada acción

## 🛠️ Comandos NPM Disponibles

- `npm start` - Iniciar servidor en modo producción
- `npm run dev` - Iniciar servidor con nodemon (desarrollo)
- `npm run init-db` - Inicializar base de datos

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Validación de datos en servidor
- Logs de seguridad para auditoría
- Soft delete para preservar datos
- Control de acceso por roles

## 🌐 Diferencias entre Versiones

### index.html (Original)
- Datos almacenados en JavaScript
- Sin persistencia
- Funciona sin servidor

### index-bd.html (Con Base de Datos)
- Datos en SQLite
- Persistencia completa
- Requiere servidor Node.js
- Sistema multiusuario
- Logs de actividad
- Búsqueda en BD

## 🚨 Troubleshooting

### Error: Cannot find module
\`\`\`bash
rm -rf node_modules
npm install
\`\`\`

### Base de datos corrupta
\`\`\`bash
rm olt_system.db
npm run init-db
\`\`\`

### Puerto en uso
Cambiar puerto en `server.js`:
\`\`\`javascript
const PORT = process.env.PORT || 3001; // Cambiar a 3001
\`\`\`

### Permisos de archivo
\`\`\`bash
chmod 644 olt_system.db
\`\`\`

## 📞 Soporte

Para soporte técnico o consultas:
- Revisar logs del servidor en consola
- Verificar logs de actividad en la interfaz
- Comprobar conexión a base de datos

## 📄 Licencia

MIT License - Uso libre para la Unidad de Desarrollo Residenciales de Antel.

---

**Versión:** 2.0  
**Última actualización:** Julio 2025  
**Desarrollado para:** Unidad de Desarrollo Residenciales - Antel  
**Tecnología:** Node.js + SQLite

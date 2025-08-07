# SISTEMA DE BASES DE DATOS POR USUARIO

## 📋 **Descripción del Sistema**

Este sistema implementa **aislamiento de datos por usuario** mediante bases de datos independientes, garantizando que cada usuario técnico tenga su propia información privada y solo el administrador pueda acceder a toda la información.

## 🏗️ **Arquitectura**

### **Base de Datos Principal**
- **Archivo**: `olt_system.db`
- **Acceso**: Solo el usuario **"alito"** (admin)
- **Contenido**: Todos los datos históricos y gestión de usuarios

### **Bases de Datos por Usuario**
- **Directorio**: `databases/`
- **Patrón**: `{username}_olt_system.db`
- **Acceso**: Solo el usuario propietario
- **Contenido**: Datos privados del usuario (tareas, comandos, configuraciones)

## 👥 **Roles y Permisos**

### **Admin ("alito")**
- ✅ Accede a la base de datos principal
- ✅ Ve todos los datos de todos los usuarios
- ✅ Puede crear/modificar/eliminar usuarios
- ✅ Puede ver estadísticas de todas las bases de datos
- ✅ Gestiona configuraciones globales

### **Usuario Técnico**
- ✅ Tiene su propia base de datos privada
- ✅ Solo ve sus propios datos
- ✅ Arranca con datos iniciales limpios
- ❌ No puede ver información de otros usuarios
- ❌ No puede acceder a gestión de usuarios

## 🔧 **Funcionamiento Técnico**

### **Inicialización de Usuario**
1. Al crear un usuario técnico se registra en la BD principal
2. Al hacer login por primera vez, se crea automáticamente su BD privada
3. Se inicializa con esquema completo y datos por defecto

### **Gestión de Conexiones**
- `UserDatabaseManager` gestiona las conexiones
- `getUserDatabase(username, role)` retorna la BD apropiada
- Conexiones se mantienen en caché para rendimiento

### **Aislamiento de Datos**
- Cada endpoint usa `getUserDatabase(req)` para obtener la BD correcta
- El sistema verifica automáticamente permisos por rol
- Los usuarios técnicos no pueden acceder a endpoints administrativos

## 📊 **Endpoints Administrativos**

### **Estadísticas de Bases de Datos**
```
GET /api/admin/database-stats
```
- Solo admin
- Retorna información de todas las BDs

### **Usuarios y sus Bases de Datos**
```
GET /api/admin/users-databases
```
- Solo admin
- Lista usuarios con info de sus BDs privadas

## 🚀 **Migración y Compatibilidad**

### **Usuario "alito" (Admin)**
- Mantiene acceso a todos los datos existentes
- No se afecta el flujo de trabajo actual
- Ve toda la información histórica

### **Nuevos Usuarios Técnicos**
- Empiezan con BD limpia
- Datos por defecto pre-configurados
- Categorías de tareas estándar

## 🔒 **Seguridad**

### **Aislamiento**
- Cada usuario solo accede a su BD
- Verificación de permisos en cada endpoint
- Sesiones independientes por usuario

### **Integridad**
- Transacciones para operaciones críticas
- Logs de actividad por usuario
- Respaldos automáticos

## 📁 **Estructura de Archivos**

```
web/
├── olt_system.db          # BD principal (admin)
├── databases/             # Directorio BDs usuarios
│   ├── tecnico1_olt_system.db
│   ├── tecnico2_olt_system.db
│   └── ...
├── user-database-manager.js  # Gestor principal
└── server.js              # Servidor con integración
```

## 🎯 **Casos de Uso**

### **Escenario 1: Admin "alito"**
1. Login → Accede a BD principal
2. Ve todas las tareas de todos los usuarios
3. Puede gestionar usuarios y configuraciones
4. Mantiene acceso a datos históricos

### **Escenario 2: Técnico "juan"**
1. Primera vez → Se crea `databases/juan_olt_system.db`
2. Login → Accede solo a su BD privada
3. Ve solo sus tareas y comandos
4. No puede ver datos de otros técnicos

## 🔧 **Comandos de Administración**

### **Ver estadísticas (solo admin)**
```javascript
fetch('/api/admin/database-stats')
```

### **Ver usuarios y BDs (solo admin)**
```javascript
fetch('/api/admin/users-databases')
```

## ⚡ **Optimizaciones**

- **Conexiones en caché**: Evita reconexiones constantes
- **Lazy loading**: BDs se crean solo cuando son necesarias
- **Índices automáticos**: Optimización de consultas
- **Limpieza automática**: Gestión de conexiones

## 🔮 **Futuras Mejoras**

1. **Backup automático** por usuario
2. **Métricas de uso** por BD
3. **Migración de datos** entre usuarios
4. **Compresión** de BDs inactivas
5. **Replicación** para alta disponibilidad

---

**Implementado**: Agosto 2025  
**Versión**: 3.1.0  
**Estado**: ✅ Productivo

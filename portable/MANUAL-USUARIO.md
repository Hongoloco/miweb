# 📖 Manual de Usuario - Sistema OLT Antel Portable

## 🚀 Inicio Rápido

### 🎯 Para Nuevos Usuarios
1. **Ejecutar instalador:**
   - Doble clic en `install.bat`
   - Esperar que termine la instalación
   - Se crearán automáticamente los accesos directos

2. **Ejecutar aplicación:**
   - Doble clic en `Ejecutar Sistema OLT Antel.bat`
   - La aplicación se abrirá automáticamente

### 🔑 Primer Acceso
- **Usuario:** `alito`
- **Contraseña:** `123456`
- **Cambiar contraseña** en Configuración → Cambiar Mi Contraseña

## 🖥️ Interfaz de la Aplicación

### 📋 Pestañas Principales
- **🏠 Inicio:** Dashboard del sistema y enlaces útiles
- **📋 Tareas:** Gestión de tareas y actividades
- **⚡ Comandos en OLT:** Gestión de equipos ZTE C600
- **📞 IMS Antel:** Comandos para gestión de abonados
- **🌍 ACS:** Auto Configuration Server para ONTs
- **⚙️ Configuración:** Administración de usuarios y sistema
- **❓ Ayuda:** Documentación y soporte

### 🛠️ Funciones Principales

#### 1. **Gestión de OLTs**
- **Crear nueva OLT:** Botón "Nueva OLT"
- **Seleccionar OLT:** Dropdown central
- **Configurar parámetros:** Shelf, Slot, Port, ONU
- **Agregar comandos:** Botón "Agregar Comando"
- **Guardar cambios:** Botón "Guardar en BD"

#### 2. **Comandos IMS**
- **Consultar abonados:** Usar plantillas EXP USRINF
- **Desregistrar usuarios:** Comandos CNL URCNL
- **Números personalizados:** Crear comandos específicos
- **Copiar comandos:** Botón copiar al portapapeles

#### 3. **Sistema ACS**
- **Accesos directos:** Enlaces a Producción, Stage, Maqueta
- **Gestión de modelos:** Cargar y administrar modelos ONT
- **Configuraciones:** Agregar nuevos modelos

#### 4. **Gestión de Tareas**
- **Nueva tarea:** Botón "Nueva Tarea"
- **Filtros:** Por estado, categoría, prioridad
- **Búsqueda:** Campo de búsqueda integrado
- **Estados:** Pendiente, Activa, Finalizada

#### 5. **Administración de Usuarios**
- **Crear usuarios:** Menú Gestión → Crear Usuario
- **Editar usuarios:** Botón editar en lista
- **Cambiar roles:** Admin, Usuario, Técnico
- **Gestionar descripciones:** Campo editable

## 🔧 Configuración Avanzada

### 📊 Base de Datos
- **Archivo:** `olt_system.db`
- **Ubicación:** Carpeta principal
- **Backup:** Copiar archivo regularmente
- **Restaurar:** Reemplazar archivo dañado

### 🌐 Configuración de Red
- **Puerto:** 3000 (automático)
- **Acceso:** Solo local (localhost)
- **Firewall:** Permitir si es necesario

### 👥 Gestión de Usuarios
- **Roles disponibles:**
  - **Admin:** Acceso completo
  - **Técnico:** Funciones técnicas
  - **Usuario:** Funciones básicas

## 📝 Procedimientos Comunes

### ✅ Agregar Nueva OLT
1. Ir a pestaña **Comandos en OLT**
2. Clic en **"Nueva OLT"**
3. Ingresar **nombre descriptivo**
4. Configurar **parámetros iniciales**
5. Clic en **"Guardar en BD"**

### ✅ Crear Comando Personalizado
1. Seleccionar **OLT** en dropdown
2. Clic en **"Agregar Comando"**
3. Completar **formulario:**
   - Nombre del comando
   - Descripción
   - Comando (usar variables {shelf}, {slot}, etc.)
   - Categoría
4. Clic en **"Agregar"**

### ✅ Consultar Abonado IMS
1. Ir a pestaña **IMS Antel**
2. En **"Comandos de Consulta"**
3. Usar **plantilla** o **comando específico**
4. Clic en **"Copiar"**
5. Pegar en **sistema IMS**

### ✅ Gestionar Tareas
1. Ir a pestaña **Tareas**
2. Clic en **"Nueva Tarea"**
3. Completar **información:**
   - Título
   - Descripción
   - Prioridad
   - Categoría
   - Fecha límite
4. Clic en **"Crear Tarea"**

## 🛡️ Seguridad y Mantenimiento

### 🔐 Buenas Prácticas
- **Cambiar contraseña** por defecto inmediatamente
- **No compartir** archivo de base de datos
- **Respaldar** datos regularmente
- **Actualizar** cuando esté disponible

### 🧹 Mantenimiento
- **Limpieza periódica:** Eliminar comandos obsoletos
- **Verificar logs:** Revisar actividad del sistema
- **Exportar datos:** Usar función de exportación
- **Optimizar BD:** Reiniciar aplicación periódicamente

### 📊 Monitoreo
- **Dashboard:** Métricas en tiempo real
- **Logs de actividad:** Configuración → Ver Logs
- **Estadísticas BD:** Configuración → Estadísticas

## 🆘 Solución de Problemas

### ❌ Aplicación no inicia
1. **Verificar Node.js** instalado
2. **Ejecutar como administrador**
3. **Verificar puerto 3000** libre
4. **Desactivar antivirus** temporalmente

### ❌ Base de datos corrupta
1. **Cerrar aplicación**
2. **Eliminar** `olt_system.db`
3. **Ejecutar** `npm run init-db`
4. **Reiniciar aplicación**

### ❌ Comandos no se guardan
1. **Verificar permisos** de escritura
2. **Revisar logs** de errores
3. **Reiniciar aplicación**
4. **Restaurar backup** si es necesario

### ❌ Error de conexión
1. **Verificar firewall** de Windows
2. **Comprobar antivirus**
3. **Reiniciar aplicación**
4. **Usar modo web** alternativo

## 📞 Soporte

### 🔍 Información de Debug
- **Versión:** Sistema OLT Antel v2.0
- **Tecnología:** Electron + Node.js + SQLite
- **Logs:** F12 → Console (en modo Electron)

### 📋 Reportar Problemas
1. **Descripción** detallada del error
2. **Pasos** para reproducir
3. **Captura** de pantalla
4. **Logs** de error (si están disponibles)

### 💡 Recursos Adicionales
- **README-PORTABLE.md:** Documentación técnica completa
- **Wiki Antel:** Documentación corporativa
- **Soporte interno:** Mesa de ayuda técnica

---

## 🎯 ¡Listo para Trabajar!

Tu Sistema OLT Antel portable está configurado y listo para gestionar toda la infraestructura de servicios residenciales. 

**¡Que tengas un excelente trabajo! 🚀**

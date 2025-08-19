# 🔒 PROTECCIÓN DE BASE DE DATOS ZTE C600 - USUARIO ALITO

## 📊 Estado actual (19 Agosto 2025 - LIMPIADO):
- ✅ Base de datos: `/workspaces/miweb/web/databases/alito_olt_system.db`
- ✅ OLTs ZTE C600: **1 unidad** (principal - limpiado de pruebas)
- ✅ Comandos ZTE: **10 comandos** específicos para ZTE C600
- ✅ Configuración principal: shelf:1, slot:13, port:4, onuId:38
- ✅ OLT principal: "ZTE C600 - Alito" (ID: 8, IP: 192.168.1.100)

## 🛡️ Medidas de protección implementadas:

### 1. **Base de datos separada por usuario**
- Cada técnico tiene su propia base de datos privada
- Los datos NO se borran al reiniciar el servidor
- Aislamiento completo entre usuarios

### 2. **Script de verificación automática**
- Archivo: `/workspaces/miweb/scripts/verificar-alito-zte.sh`
- Verifica integridad de datos cada vez que se ejecuta
- Restaura automáticamente si detecta pérdida de datos
- Crea respaldos automáticos

### 3. **Script de limpieza automática**
- Archivo: `/workspaces/miweb/scripts/limpiar-olts-prueba.sh`
- Elimina OLTs de prueba automáticamente
- Mantiene solo la OLT principal de alito
- Crea respaldos antes de cualquier limpieza

### 3. **Respaldo permanente**
- Ubicación: `/workspaces/miweb/backup/alito-zte-backup.db`
- Se actualiza automáticamente
- Contiene toda la configuración ZTE C600

## 🔧 Comandos de verificación:

```bash
# Verificar estado de la base de datos
/workspaces/miweb/scripts/verificar-alito-zte.sh

# Limpiar OLTs de prueba (mantener solo la principal)
/workspaces/miweb/scripts/limpiar-olts-prueba.sh

# Restaurar manualmente si es necesario
cd /workspaces/miweb/web && node restaurar-alito-zte.js

# Ver OLT principal de alito
sqlite3 /workspaces/miweb/web/databases/alito_olt_system.db "SELECT * FROM olts WHERE id = 8;"

# Ver comandos ZTE
sqlite3 /workspaces/miweb/web/databases/alito_olt_system.db "SELECT nombre FROM comandos WHERE olt_id = 8;"
```

## 📋 Inventario de comandos ZTE C600 de alito:
1. Factory Reset
2. Ver la base de ONU's  
3. Ver configuración de la ONU en la ONT
4. Volverla a Configurar en modo router (desde modo bridge)
5. Ver configuracion ONU
6. Ver estado de la linea VoiP
7. Ver IP de Voip
8. Configurar en modo bridge (desde modo router)
9. Configurar en modo bridge (desde modo router) (Copia)
10. Configurar en modo bridge (desde modo router) (Copia)

## ⚠️ IMPORTANTE:
**La base de datos ZTE C600 de alito NUNCA debe borrarse. Está protegida por:**
- Sistema de bases de datos por usuario
- Script de verificación automática
- Respaldos automáticos
- Documentación completa

## 🔄 Acceso:
- **Usuario**: alito
- **Contraseña**: vinilo28
- **Base de datos**: Privada e independiente

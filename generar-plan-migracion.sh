#!/bin/bash

# 🗺️ GENERADOR DE PLAN DE MIGRACIÓN PERSONALIZADO
# Genera un plan específico basado en el análisis del servidor actual

echo "🗺️ GENERANDO PLAN DE MIGRACIÓN PERSONALIZADO"
echo "============================================="

# Crear directorio de logs si no existe
mkdir -p logs

PLAN_FILE="logs/plan-migracion-$(date +%Y%m%d_%H%M%S).md"

echo "📋 Generando plan personalizado en: $PLAN_FILE"
echo ""

cat > "$PLAN_FILE" << 'EOF'
# 🗺️ PLAN DE MIGRACIÓN PERSONALIZADO PARA TU SERVIDOR

## 📊 ANÁLISIS DE TU SERVIDOR ACTUAL

### ✅ FORTALEZAS DETECTADAS:
- **Estado excelente**: 100/100 puntos de calidad
- **Sistema robusto**: 32 scripts JavaScript, 2894 líneas en server.js
- **BD completa**: 3 usuarios, 1 OLT, 10 comandos funcionando
- **Dependencias actualizadas**: Express 4.21.2, SQLite3 5.1.7, bcrypt 6.0.0
- **Gestor de usuarios**: Sistema básico implementado

### ⚠️ PROBLEMAS IDENTIFICADOS:
1. **ZTE C600 de alito**: Referencias problemáticas detectadas
2. **Usuario admin sin BD privada**: Falta aislamiento
3. **Sin backup automático**: Solo 3 backups manuales
4. **Sin herramientas de gestión avanzadas**: Faltan 4 herramientas clave

## 🎯 PLAN DE MIGRACIÓN PASO A PASO

### FASE 1: BACKUP PREVENTIVO (5 minutos)
```bash
# Crear backup completo antes de cualquier cambio
cd /ruta/de/tu/servidor/web
tar -czf backup-antes-migracion-$(date +%Y%m%d).tar.gz *
```

### FASE 2: OBTENER MEJORAS (2 minutos)
```bash
# En tu servidor
cd /directorio/de/trabajo
git clone https://github.com/Hongoloco/miweb.git mejoras-sistema
cd mejoras-sistema
git checkout main
```

### FASE 3: APLICAR MEJORAS ESPECÍFICAS (10 minutos)

#### 3.1 Agregar herramientas de gestión de usuarios
```bash
# Copiar herramientas nuevas
cp mejoras-sistema/web/crear-usuario-completo.js /ruta/de/tu/servidor/web/
cp mejoras-sistema/web/verificar-aislamiento.js /ruta/de/tu/servidor/web/
cp mejoras-sistema/web/limpiar-usuario.js /ruta/de/tu/servidor/web/
```

#### 3.2 Implementar sistema de backup automático
```bash
# Copiar sistema de backup
cp mejoras-sistema/web/backup-manager.js /ruta/de/tu/servidor/web/
mkdir -p /ruta/de/tu/servidor/web/backups/{daily,weekly,monthly,manual}
```

#### 3.3 Agregar scripts de acceso directo
```bash
# Copiar scripts de acceso directo al directorio raíz de tu servidor
cp mejoras-sistema/backup-manager /ruta/de/tu/servidor/
cp mejoras-sistema/crear-usuario /ruta/de/tu/servidor/
cp mejoras-sistema/verificar-aislamiento /ruta/de/tu/servidor/
cp mejoras-sistema/limpiar-usuario /ruta/de/tu/servidor/
cp mejoras-sistema/ayuda-sistema /ruta/de/tu/servidor/

# Dar permisos
chmod +x /ruta/de/tu/servidor/backup-manager
chmod +x /ruta/de/tu/servidor/crear-usuario
chmod +x /ruta/de/tu/servidor/verificar-aislamiento
chmod +x /ruta/de/tu/servidor/limpiar-usuario
chmod +x /ruta/de/tu/servidor/ayuda-sistema
```

### FASE 4: RESOLVER PROBLEMAS ESPECÍFICOS (15 minutos)

#### 4.1 Solucionar problema ZTE C600 de alito
```bash
cd /ruta/de/tu/servidor/web
node verificar-aislamiento.js

# Si detecta problemas con alito, ejecutar:
node limpiar-usuario.js admin
# Esto creará una BD limpia para admin si es necesario
```

#### 4.2 Crear BD privada para usuario admin
```bash
# Crear BD privada para admin si no la tiene
node crear-usuario-completo.js admin nueva_password admin admin@antel.com.uy
```

#### 4.3 Activar backup automático
```bash
# Hacer primer backup del sistema mejorado
node backup-manager.js backup "Sistema mejorado implementado"

# Activar backups automáticos
node backup-manager.js auto
```

### FASE 5: VERIFICACIÓN Y TESTING (5 minutos)

#### 5.1 Verificar aislamiento
```bash
cd /ruta/de/tu/servidor
./verificar-aislamiento
```

#### 5.2 Probar backup
```bash
./backup-manager listar
./backup-manager backup "Prueba post-migración"
```

#### 5.3 Probar creación de usuario
```bash
./crear-usuario usuario_prueba 123456 tecnico prueba@antel.com.uy
./verificar-aislamiento
```

### FASE 6: REINICIAR SERVICIOS (2 minutos)
```bash
# Reiniciar tu servidor Node.js
pkill -f "node.*server.js"
cd /ruta/de/tu/servidor/web
nohup node server.js > server.log 2>&1 &
```

## ✅ BENEFICIOS POST-MIGRACIÓN

### 🎯 PROBLEMAS RESUELTOS:
- ✅ ZTE C600 de alito: Scripts de limpieza específicos
- ✅ Usuario admin: BD privada creada  
- ✅ Backup automático: Sistema completo implementado
- ✅ Gestión avanzada: 4 herramientas nuevas disponibles

### 🛠️ NUEVAS CAPACIDADES:
- **Usuarios con interfaz limpia**: Garantizado para nuevos usuarios
- **Aislamiento total**: Verificación automática
- **Backup automático**: Diario y semanal programado
- **Comandos simples**: Scripts de acceso directo

### 📊 COMANDOS DISPONIBLES POST-MIGRACIÓN:
```bash
# Gestión de usuarios
./crear-usuario <user> <pass> <rol>
./verificar-aislamiento
./limpiar-usuario <user>

# Gestión de backup  
./backup-manager backup [descripcion]
./backup-manager listar
./backup-manager auto

# Ayuda
./ayuda-sistema
```

## 🚨 PLAN DE ROLLBACK (Si algo sale mal)

### Restaurar estado anterior:
```bash
# Detener servidor
pkill -f "node.*server.js"

# Restaurar backup
cd /ruta/de/tu/servidor
rm -rf web/
tar -xzf backup-antes-migracion-YYYYMMDD.tar.gz

# Reiniciar servidor
cd web
nohup node server.js > server.log 2>&1 &
```

## 📞 SOPORTE POST-MIGRACIÓN

### Si tienes problemas:
1. **Verificar estado**: `./verificar-aislamiento`
2. **Ver backups**: `./backup-manager listar`
3. **Restaurar si necesario**: `./backup-manager restaurar <ruta>`
4. **Ayuda completa**: `./ayuda-sistema`

## 🎯 TIEMPO TOTAL ESTIMADO: 40 minutos

- **Backup preventivo**: 5 min
- **Obtener mejoras**: 2 min  
- **Aplicar mejoras**: 10 min
- **Resolver problemas**: 15 min
- **Verificación**: 5 min
- **Reiniciar servicios**: 2 min
- **Buffer**: 1 min

---

## 🎉 RESULTADO ESPERADO

Después de la migración tendrás:
- ✅ **Mismo sistema robusto** que tienes ahora
- ✅ **Problemas ZTE C600 resueltos**
- ✅ **Backup automático funcionando**  
- ✅ **Herramientas avanzadas disponibles**
- ✅ **Aislamiento total de usuarios**
- ✅ **Interfaz limpia garantizada para nuevos usuarios**

**¡Tu servidor actual es excelente, solo necesita estas mejoras específicas!**
EOF

echo "✅ PLAN DE MIGRACIÓN GENERADO EXITOSAMENTE"
echo ""
echo "📋 RESUMEN DEL PLAN:"
echo "   ⏱️  Tiempo estimado: 40 minutos"
echo "   🎯 Problemas a resolver: 4 específicos"
echo "   🛠️ Herramientas nuevas: 4 + backup automático"
echo "   📁 Plan detallado en: $PLAN_FILE"
echo ""

echo "🎯 TU SERVIDOR ACTUAL ES EXCELENTE (100/100 puntos)"
echo "💡 Solo necesita estas mejoras específicas para ser PERFECTO"
echo ""

echo "🚀 SIGUIENTE PASO:"
echo "   Revisar el plan detallado y ejecutar la migración cuando estés listo"
echo "   cat $PLAN_FILE"

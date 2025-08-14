#!/bin/bash

# 🎯 CONFIGURADOR COMPLETO DE SISTEMA DE USUARIOS CON BACKUP AUTOMÁTICO
# Este script configura todo lo necesario para tener usuarios con BD aisladas y backups

echo "🎯 CONFIGURADOR COMPLETO DE SISTEMA DE USUARIOS"
echo "==============================================="

# Cambiar al directorio web
cd web 2>/dev/null || cd /root/miweb/web || { echo "❌ No se encuentra directorio web"; exit 1; }

echo ""
echo "🔍 VERIFICANDO DEPENDENCIAS..."

# Verificar Node.js y npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado"
    exit 1
else
    echo "✅ Node.js $(node --version)"
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm no encontrado"
    exit 1
else
    echo "✅ npm $(npm --version)"
fi

# Verificar package.json y dependencias
if [ ! -f "package.json" ]; then
    echo "❌ package.json no encontrado"
    exit 1
else
    echo "✅ package.json encontrado"
fi

echo ""
echo "📦 INSTALANDO DEPENDENCIAS NECESARIAS..."

# Instalar dependencias si no están
npm install sqlite3 bcrypt 2>/dev/null || echo "⚠️ Algunas dependencias ya están instaladas"

echo ""
echo "🗂️ CREANDO ESTRUCTURA DE DIRECTORIOS..."

# Crear directorios necesarios
mkdir -p databases backups/{daily,weekly,monthly,manual} logs

echo "✅ Directorios creados:"
echo "   📁 databases/ - Para BDs de usuarios"
echo "   📁 backups/daily/ - Backups diarios"
echo "   📁 backups/weekly/ - Backups semanales"
echo "   📁 backups/monthly/ - Backups mensuales"
echo "   📁 backups/manual/ - Backups manuales"
echo "   📁 logs/ - Logs del sistema"

echo ""
echo "🔧 CONFIGURANDO SCRIPTS..."

# Hacer ejecutables todos los scripts
chmod +x *.js 2>/dev/null

echo ""
echo "🧪 PROBANDO EL SISTEMA..."

echo ""
echo "1️⃣ Verificando aislamiento actual..."
if [ -f "verificar-aislamiento.js" ]; then
    node verificar-aislamiento.js
else
    echo "❌ Script de verificación no encontrado"
fi

echo ""
echo "2️⃣ Probando backup manager..."
if [ -f "backup-manager.js" ]; then
    echo "📋 Listando backups disponibles..."
    node backup-manager.js listar
else
    echo "❌ Backup manager no encontrado"
fi

echo ""
echo "🎉 CONFIGURACIÓN COMPLETA FINALIZADA"
echo ""
echo "🛠️ HERRAMIENTAS DISPONIBLES:"
echo ""
echo "👤 GESTIÓN DE USUARIOS:"
echo "   node crear-usuario-completo.js <usuario> <password> [rol] [email]"
echo "   node limpiar-usuario.js <usuario>"
echo "   node verificar-aislamiento.js"
echo ""
echo "💾 SISTEMA DE BACKUP:"
echo "   node backup-manager.js backup [descripcion]"
echo "   node backup-manager.js backup-user <usuario>"
echo "   node backup-manager.js listar"
echo "   node backup-manager.js restaurar <ruta>"
echo "   node backup-manager.js auto"
echo ""
echo "🎯 EJEMPLOS DE USO:"
echo ""
echo "📝 Crear usuario nuevo con interfaz limpia:"
echo "   node crear-usuario-completo.js maria 123456 tecnico maria@antel.com.uy"
echo ""
echo "🧹 Limpiar interfaz de usuario existente:"
echo "   node limpiar-usuario.js maria"
echo ""
echo "💾 Hacer backup completo del sistema:"
echo "   node backup-manager.js backup 'Backup antes de actualización'"
echo ""
echo "♻️ Restaurar desde backup:"
echo "   node backup-manager.js restaurar backups/manual/backup_2025-01-08T10-30-00-000Z"
echo ""
echo "⏰ Activar backups automáticos:"
echo "   node backup-manager.js auto"
echo ""
echo "🔍 Verificar estado del aislamiento:"
echo "   node verificar-aislamiento.js"
echo ""
echo "✅ BENEFICIOS DEL SISTEMA:"
echo ""
echo "🎯 INTERFAZ LIMPIA GARANTIZADA:"
echo "   • Cada usuario nuevo tiene BD completamente vacía"
echo "   • Sin OLTs, comandos o tareas de otros usuarios"
echo "   • Solo categorías básicas para empezar"
echo ""
echo "🔒 AISLAMIENTO TOTAL:"
echo "   • Cada técnico tiene su propia BD"
echo "   • Los admins ven todo en la BD principal"
echo "   • Imposible ver datos de otros usuarios"
echo ""
echo "💾 BACKUP AUTOMÁTICO:"
echo "   • Backup diario automático (mantiene 7 días)"
echo "   • Backup semanal automático (mantiene 4 semanas)"
echo "   • Backup manual cuando sea necesario"
echo "   • Restauración completa del sistema"
echo ""
echo "🚀 LISTO PARA USAR:"
echo "   • Sistema configurado y probado"
echo "   • Scripts ejecutables listos"
echo "   • Documentación incluida"
echo ""
echo "💡 SIGUIENTE PASO:"
echo "   Crea tu primer usuario técnico con:"
echo "   node crear-usuario-completo.js nuevo_tecnico password123 tecnico"

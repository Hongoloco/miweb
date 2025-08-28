# 🔒 GUÍA DE ACTUALIZACIÓN SEGURA CON PROTECCIÓN DE DATOS

## 🎯 ¿Qué problema resuelve esto?

Cuando trabajas en tu servidor con datos reales (OLTs, comandos, usuarios, etc.) y luego haces `git pull` para actualizar el código, **NO QUIERES PERDER TUS DATOS**.

Esta guía te asegura que **NUNCA** pierdas información, sin importar cuántas veces actualices el código.

---

## 🛡️ PROTECCIÓN AUTOMÁTICA

### 📋 ¿Qué se protege automáticamente?

✅ **Base de datos principal** (`web/olt_system.db`)  
✅ **Bases de datos de usuarios** (`web/databases/`)  
✅ **Backups automáticos** (`web/backups/`)  
✅ **Configuración personalizada** (`web/.env`)  
✅ **Cookies y sesiones** (`web/cookies.txt`)  

### 🚫 ¿Qué NO se sube a Git?

Los archivos de datos están en `.gitignore`, así que NUNCA se subirán:

```
# Archivos protegidos por .gitignore
*.db
web/databases/
web/backups/
web/cookies.txt
web/.env.production
```

---

## 🚀 MODO DE USO

### ✨ OPCIÓN 1: Actualización Automática (RECOMENDADA)

Simplemente ejecuta:

```bash
git pull && bash post-git-pull.sh
```

**¿Qué hace esto?**
1. 📦 Respalda automáticamente todos tus datos
2. ⬇️ Descarga las actualizaciones de código
3. 🔧 Instala dependencias nuevas si las hay
4. 📥 Restaura automáticamente todos tus datos
5. ✅ ¡Listo! Tu aplicación funciona con datos intactos

### 🛡️ OPCIÓN 2: Respaldo Manual + Actualización

Si quieres control total:

```bash
# 1. Hacer respaldo manual
bash backup-manual.sh

# 2. Actualizar código 
git pull

# 3. Restaurar datos automáticamente
bash post-git-pull.sh
```

---

## 📁 ESTRUCTURA DE PROTECCIÓN

```
miweb/
├── web/
│   ├── olt_system.db          ← Tu base de datos (PROTEGIDA)
│   ├── databases/             ← BDs de usuarios (PROTEGIDAS)
│   ├── backups/               ← Backups automáticos (PROTEGIDOS)
│   ├── cookies.txt            ← Sesiones (PROTEGIDAS)
│   └── .env                   ← Config personal (PROTEGIDA)
├── respaldos_manuales/        ← Respaldos manuales
├── post-git-pull.sh          ← Script de actualización segura
├── backup-manual.sh           ← Script de respaldo manual
└── .gitignore                ← Protección contra subida accidental
```

---

## 🆘 RESOLUCIÓN DE PROBLEMAS

### ❓ "No tengo datos que proteger aún"
- Perfecto, los scripts funcionan igual
- Cuando tengas datos, estarán protegidos automáticamente

### ❓ "¿Qué pasa si algo sale mal?"
- Los respaldos se guardan en `/tmp/miweb_backup_[fecha]`
- Restaura manualmente: `cp /tmp/miweb_backup_*/olt_system.db web/`

### ❓ "¿Puedo eliminar los respaldos temporales?"
```bash
# Ver respaldos temporales
ls /tmp/miweb_backup_*

# Eliminar respaldos antiguos (mayores a 7 días)
find /tmp -name "miweb_backup_*" -mtime +7 -exec rm -rf {} +
```

### ❓ "¿Cómo veo qué se respaldó?"
```bash
# Ejecutar respaldo manual (te muestra todo)
bash backup-manual.sh

# Ver el manifiesto del último respaldo
cat respaldos_manuales/backup_*/MANIFIESTO.txt
```

---

## 🎯 FLUJO DE TRABAJO RECOMENDADO

### 🏠 En tu servidor de producción:

```bash
# 1. Trabajar normalmente (agregar OLTs, comandos, etc.)

# 2. Cuando quieras actualizar código:
git pull && bash post-git-pull.sh

# 3. ¡Seguir trabajando! Tus datos están intactos
```

### 💻 En desarrollo:

```bash
# 1. Hacer cambios al código
# 2. Commit y push normalmente
git add .
git commit -m "Mejoras en importación"
git push

# Los datos de producción NUNCA se suben
```

---

## ✅ VERIFICACIÓN

Después de actualizar, verifica que todo está bien:

```bash
# 1. ¿Está tu base de datos?
ls -la web/olt_system.db

# 2. ¿Están tus backups?
ls -la web/backups/

# 3. ¿Funciona la aplicación?
cd web && npm start
```

---

## 🎉 BENEFICIOS

✅ **Cero pérdida de datos** - Nunca más perderás información  
✅ **Actualizaciones seguras** - Actualiza código sin miedo  
✅ **Respaldos automáticos** - Todo se respalda automáticamente  
✅ **Fácil de usar** - Un solo comando para todo  
✅ **Control total** - Scripts transparentes que puedes revisar  

---

## 💡 CONSEJOS EXTRAS

- **Usa siempre**: `git pull && bash post-git-pull.sh`
- **Respaldos manuales** cuando hagas cambios importantes
- **Revisa** `/tmp/miweb_backup_*` si algo sale mal
- **Mantén limpio** borrando respaldos temporales antiguos

¡Ahora puedes actualizar tu código sin preocuparte por perder datos! 🚀

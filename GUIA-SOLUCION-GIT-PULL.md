# 🚨 GUÍA DE SOLUCIÓN - GIT PULL NO REFLEJA CAMBIOS

## 🔍 PASO 1: DIAGNÓSTICO
Ejecuta primero en tu servidor:
```bash
./diagnosticar-servidor.sh
```

## ⚡ PASO 2: SOLUCIONES PROGRESIVAS

### 🟢 OPCIÓN 1: SOLUCIÓN SUAVE (Recomendada primero)
```bash
./forzar-actualizacion.sh
```
**¿Cuándo usar?**: Cuando sospechas problemas de cache o archivos no actualizados.
**Riesgo**: ⭐ Bajo
**Tiempo**: 2-3 minutos

### 🟡 OPCIÓN 2: SOLUCIÓN INTERMEDIA 
```bash
./reset-completo.sh
```
**¿Cuándo usar?**: Cuando la solución suave no funciona.
**Riesgo**: ⭐⭐ Medio (elimina cambios locales)
**Tiempo**: 3-5 minutos

### 🔴 OPCIÓN 3: SOLUCIÓN DRÁSTICA
```bash
./eliminar-y-reclonar.sh
```
**¿Cuándo usar?**: Cuando todo lo demás falla.
**Riesgo**: ⭐⭐⭐ Alto (elimina todo)
**Tiempo**: 5-10 minutos

## 🔧 CAUSAS COMUNES Y SOLUCIONES

### ❌ **Problema: Cache del navegador**
**Solución**: Presiona `Ctrl+F5` en el navegador

### ❌ **Problema: Archivos modificados localmente**
**Solución**: 
```bash
git stash  # Guarda cambios
git pull   # Actualiza
git stash pop  # Restaura cambios (opcional)
```

### ❌ **Problema: Conflictos de merge**
**Solución**:
```bash
git reset --hard origin/main  # Fuerza sincronización
```

### ❌ **Problema: Permisos de archivos**
**Solución**:
```bash
chmod +x *.sh
sudo chown -R $USER:$USER .
```

### ❌ **Problema: Base de datos no se actualiza**
**Solución**:
```bash
cd web
rm olt_system.db  # Elimina BD local
node init-database.js  # Recrea BD
```

### ❌ **Problema: Proceso Node.js colgado**
**Solución**:
```bash
pkill -f "node.*server"
npm start
```

## 🚀 PROCEDIMIENTO RECOMENDADO

### Para tu servidor de producción:

1. **Primero SIEMPRE**: Haz backup
```bash
cp -r proyecto proyecto_backup_$(date +%Y%m%d)
```

2. **Diagnóstica**:
```bash
./diagnosticar-servidor.sh
```

3. **Prueba solución suave**:
```bash
./forzar-actualizacion.sh
```

4. **Si no funciona, escalas a intermedia**:
```bash
./reset-completo.sh
```

5. **Solo como último recurso**:
```bash
./eliminar-y-reclonar.sh
```

## ⚠️ PREVENCIÓN FUTURA

Para evitar estos problemas:

1. **Nunca modificar archivos directamente en el servidor**
2. **Usar ramas para desarrollo**
3. **Hacer commits pequeños y frecuentes**
4. **Usar el script post-git-pull.sh después de cada pull**
5. **Verificar con verificar-deploy.sh**

## 🆘 SI TODO FALLA

Como último recurso, puedes descargar el ZIP del repositorio:

```bash
# Eliminar proyecto actual
rm -rf miweb

# Descargar ZIP fresco
wget https://github.com/Hongoloco/miweb/archive/main.zip
unzip main.zip
mv miweb-main miweb
cd miweb

# Configurar
chmod +x *.sh
cd web && npm install
node init-database.js
npm start
```

## 📞 CONTACTO DE EMERGENCIA

Si nada funciona, envía:
1. Salida de `./diagnosticar-servidor.sh`
2. Tu sistema operativo
3. Versión de Node.js (`node --version`)
4. Versión de Git (`git --version`)

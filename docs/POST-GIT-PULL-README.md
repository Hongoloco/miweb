# Instrucciones Post-Git-Pull

## Problema
Cuando se hace `git pull`, la base de datos local no se actualiza con las OLTs porque el archivo `olt_system.db` no se incluye en el control de versiones (es un archivo binario).

## Solución
Se ha creado un script `post-git-pull.sh` que restaura automáticamente la OLT ZTE C600 con sus 10 comandos y configura el usuario alito con la contraseña vinilo28.

## Pasos después de cada Git Pull

1. Ejecuta el script post-git-pull:
   ```bash
   ./post-git-pull.sh
   ```

2. Inicia el servidor:
   ```bash
   npm start
   ```

## Lo que hace el script
- Verifica si existe la base de datos, si no, la crea
- Restaura la OLT ZTE C600 si no existe
- Carga los 10 comandos desde el archivo JSON
- Configura la contraseña de alito como vinilo28
- Verifica que todo esté correcto

## Credenciales
- Usuario: alito
- Contraseña: vinilo28

## Nota
Si el script no funciona, puedes restablecer manualmente la base de datos:
```bash
cd web
rm olt_system.db
node init-database.js
node actualizar-password-vinilo28.js
```

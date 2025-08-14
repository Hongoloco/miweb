// 💾 SISTEMA DE BACKUP AUTOMÁTICO PARA BASES DE DATOS DE USUARIOS
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

class BackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, 'backups');
        this.databasesDir = path.join(__dirname, 'databases');
        this.mainDbPath = path.join(__dirname, 'olt_system.db');
        
        // Crear directorio de backups si no existe
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        
        // Crear subdirectorios organizados
        ['daily', 'weekly', 'monthly', 'manual'].forEach(tipo => {
            const dir = path.join(this.backupDir, tipo);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // 🔄 BACKUP COMPLETO DEL SISTEMA
    async backupCompleto(tipo = 'manual', descripcion = '') {
        console.log('\n💾 INICIANDO BACKUP COMPLETO DEL SISTEMA');
        console.log('=========================================');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, tipo, `backup_${timestamp}`);
        
        // Crear directorio para este backup
        fs.mkdirSync(backupPath, { recursive: true });

        const resultado = {
            timestamp,
            tipo,
            descripcion,
            archivos: [],
            usuarios: [],
            exito: true,
            errores: []
        };

        try {
            // 1. Backup de BD principal
            console.log('\n📊 Haciendo backup de BD principal...');
            await this.copiarArchivo(
                this.mainDbPath, 
                path.join(backupPath, 'olt_system.db')
            );
            resultado.archivos.push('olt_system.db');
            console.log('✅ BD principal respaldada');

            // 2. Backup de todas las BDs de usuarios
            console.log('\n👥 Haciendo backup de BDs de usuarios...');
            if (fs.existsSync(this.databasesDir)) {
                const archivosUsuarios = fs.readdirSync(this.databasesDir)
                    .filter(archivo => archivo.endsWith('_olt_system.db'));

                for (const archivo of archivosUsuarios) {
                    const origen = path.join(this.databasesDir, archivo);
                    const destino = path.join(backupPath, 'databases', archivo);
                    
                    // Crear directorio databases en backup
                    const dirDatabases = path.join(backupPath, 'databases');
                    if (!fs.existsSync(dirDatabases)) {
                        fs.mkdirSync(dirDatabases, { recursive: true });
                    }

                    await this.copiarArchivo(origen, destino);
                    resultado.archivos.push(`databases/${archivo}`);
                    
                    const username = archivo.replace('_olt_system.db', '');
                    resultado.usuarios.push(username);
                    
                    console.log(`✅ BD de usuario ${username} respaldada`);
                }
            }

            // 3. Backup de archivos críticos del sistema
            console.log('\n⚙️ Haciendo backup de archivos críticos...');
            const archivosCriticos = [
                'server.js',
                'user-database-manager.js',
                'package.json'
            ];

            for (const archivo of archivosCriticos) {
                const origen = path.join(__dirname, archivo);
                if (fs.existsSync(origen)) {
                    await this.copiarArchivo(
                        origen, 
                        path.join(backupPath, archivo)
                    );
                    resultado.archivos.push(archivo);
                    console.log(`✅ ${archivo} respaldado`);
                }
            }

            // 4. Crear manifiesto del backup
            const manifiesto = {
                ...resultado,
                fecha_creacion: new Date().toISOString(),
                ruta_backup: backupPath,
                version: '3.1.0',
                total_usuarios: resultado.usuarios.length,
                total_archivos: resultado.archivos.length
            };

            fs.writeFileSync(
                path.join(backupPath, 'manifiesto.json'),
                JSON.stringify(manifiesto, null, 2)
            );

            console.log('\n📋 Manifiesto del backup creado');
            console.log('\n✅ BACKUP COMPLETO FINALIZADO');
            console.log(`📂 Ubicación: ${backupPath}`);
            console.log(`👥 Usuarios respaldados: ${resultado.usuarios.length}`);
            console.log(`📁 Archivos respaldados: ${resultado.archivos.length}`);

            return manifiesto;

        } catch (error) {
            console.error('\n❌ ERROR EN BACKUP:', error);
            resultado.exito = false;
            resultado.errores.push(error.message);
            return resultado;
        }
    }

    // 🔧 BACKUP DE USUARIO INDIVIDUAL
    async backupUsuario(username, tipo = 'manual') {
        console.log(`\n💾 BACKUP INDIVIDUAL DE USUARIO: ${username}`);
        console.log('=====================================');

        const userDbPath = path.join(this.databasesDir, `${username}_olt_system.db`);
        
        if (!fs.existsSync(userDbPath)) {
            console.log('❌ BD del usuario no encontrada');
            return false;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(
            this.backupDir, 
            tipo, 
            `usuario_${username}_${timestamp}.db`
        );

        try {
            await this.copiarArchivo(userDbPath, backupPath);
            
            console.log(`✅ Backup de ${username} completado`);
            console.log(`📂 Ubicación: ${backupPath}`);
            
            return {
                usuario: username,
                timestamp,
                ruta: backupPath,
                exito: true
            };

        } catch (error) {
            console.error(`❌ Error en backup de ${username}:`, error);
            return false;
        }
    }

    // 🔄 RESTAURAR DESDE BACKUP
    async restaurarCompleto(rutaBackup) {
        console.log('\n♻️ INICIANDO RESTAURACIÓN COMPLETA');
        console.log('==================================');

        if (!fs.existsSync(rutaBackup)) {
            console.log('❌ Ruta de backup no encontrada');
            return false;
        }

        const manifiestoPath = path.join(rutaBackup, 'manifiesto.json');
        if (!fs.existsSync(manifiestoPath)) {
            console.log('❌ Manifiesto de backup no encontrado');
            return false;
        }

        const manifiesto = JSON.parse(fs.readFileSync(manifiestoPath, 'utf8'));
        
        try {
            console.log(`📋 Restaurando backup del ${manifiesto.fecha_creacion}`);
            console.log(`👥 Usuarios en backup: ${manifiesto.total_usuarios}`);

            // 1. Restaurar BD principal
            console.log('\n📊 Restaurando BD principal...');
            const bdPrincipalBackup = path.join(rutaBackup, 'olt_system.db');
            if (fs.existsSync(bdPrincipalBackup)) {
                await this.copiarArchivo(bdPrincipalBackup, this.mainDbPath);
                console.log('✅ BD principal restaurada');
            }

            // 2. Restaurar BDs de usuarios
            console.log('\n👥 Restaurando BDs de usuarios...');
            const databasesBackupDir = path.join(rutaBackup, 'databases');
            if (fs.existsSync(databasesBackupDir)) {
                const archivosUsuarios = fs.readdirSync(databasesBackupDir);
                
                for (const archivo of archivosUsuarios) {
                    const origen = path.join(databasesBackupDir, archivo);
                    const destino = path.join(this.databasesDir, archivo);
                    
                    await this.copiarArchivo(origen, destino);
                    
                    const username = archivo.replace('_olt_system.db', '');
                    console.log(`✅ BD de ${username} restaurada`);
                }
            }

            // 3. Restaurar archivos críticos
            console.log('\n⚙️ Restaurando archivos críticos...');
            const archivosCriticos = ['server.js', 'user-database-manager.js'];
            
            for (const archivo of archivosCriticos) {
                const origen = path.join(rutaBackup, archivo);
                if (fs.existsSync(origen)) {
                    await this.copiarArchivo(origen, path.join(__dirname, archivo));
                    console.log(`✅ ${archivo} restaurado`);
                }
            }

            console.log('\n✅ RESTAURACIÓN COMPLETA FINALIZADA');
            console.log('🔄 Es recomendable reiniciar el servidor');

            return true;

        } catch (error) {
            console.error('\n❌ ERROR EN RESTAURACIÓN:', error);
            return false;
        }
    }

    // 📅 PROGRAMAR BACKUPS AUTOMÁTICOS
    programarBackupsAutomaticos() {
        console.log('\n⏰ PROGRAMANDO BACKUPS AUTOMÁTICOS');
        console.log('==================================');

        // Backup diario a las 2:00 AM
        const backupDiario = setInterval(async () => {
            console.log('\n🌙 Ejecutando backup diario automático...');
            await this.backupCompleto('daily', 'Backup automático diario');
            this.limpiarBackupsAntiguos('daily', 7); // Mantener 7 días
        }, 24 * 60 * 60 * 1000); // 24 horas

        // Backup semanal los domingos
        const backupSemanal = setInterval(async () => {
            const ahora = new Date();
            if (ahora.getDay() === 0) { // Domingo
                console.log('\n📅 Ejecutando backup semanal automático...');
                await this.backupCompleto('weekly', 'Backup automático semanal');
                this.limpiarBackupsAntiguos('weekly', 4); // Mantener 4 semanas
            }
        }, 24 * 60 * 60 * 1000);

        console.log('✅ Backups automáticos programados');
        console.log('📅 Diario: Cada 24 horas (mantiene 7 días)');
        console.log('📅 Semanal: Domingos (mantiene 4 semanas)');

        return { backupDiario, backupSemanal };
    }

    // 🗑️ LIMPIAR BACKUPS ANTIGUOS
    limpiarBackupsAntiguos(tipo, mantenerDias) {
        const dirTipo = path.join(this.backupDir, tipo);
        
        if (!fs.existsSync(dirTipo)) return;

        const archivos = fs.readdirSync(dirTipo)
            .map(archivo => ({
                nombre: archivo,
                ruta: path.join(dirTipo, archivo),
                fecha: fs.statSync(path.join(dirTipo, archivo)).mtime
            }))
            .sort((a, b) => b.fecha - a.fecha);

        // Mantener solo los más recientes
        const paraEliminar = archivos.slice(mantenerDias);
        
        paraEliminar.forEach(archivo => {
            if (fs.lstatSync(archivo.ruta).isDirectory()) {
                fs.rmSync(archivo.ruta, { recursive: true, force: true });
            } else {
                fs.unlinkSync(archivo.ruta);
            }
            console.log(`🗑️ Backup antiguo eliminado: ${archivo.nombre}`);
        });
    }

    // 📋 LISTAR BACKUPS DISPONIBLES
    listarBackups() {
        console.log('\n📋 BACKUPS DISPONIBLES');
        console.log('======================');

        const tipos = ['daily', 'weekly', 'monthly', 'manual'];
        
        tipos.forEach(tipo => {
            const dirTipo = path.join(this.backupDir, tipo);
            
            if (!fs.existsSync(dirTipo)) return;

            const backups = fs.readdirSync(dirTipo)
                .filter(item => {
                    const itemPath = path.join(dirTipo, item);
                    return fs.lstatSync(itemPath).isDirectory() || item.endsWith('.db');
                })
                .map(item => {
                    const itemPath = path.join(dirTipo, item);
                    const stats = fs.statSync(itemPath);
                    return {
                        nombre: item,
                        fecha: stats.mtime,
                        tamaño: this.formatearTamaño(stats.size)
                    };
                })
                .sort((a, b) => b.fecha - a.fecha);

            if (backups.length > 0) {
                console.log(`\n📂 ${tipo.toUpperCase()}:`);
                backups.forEach(backup => {
                    console.log(`   📄 ${backup.nombre} (${backup.tamaño}) - ${backup.fecha.toLocaleString()}`);
                });
            }
        });
    }

    // 🔧 UTILIDADES
    async copiarArchivo(origen, destino) {
        return new Promise((resolve, reject) => {
            const dirDestino = path.dirname(destino);
            if (!fs.existsSync(dirDestino)) {
                fs.mkdirSync(dirDestino, { recursive: true });
            }

            const leer = fs.createReadStream(origen);
            const escribir = fs.createWriteStream(destino);

            leer.on('error', reject);
            escribir.on('error', reject);
            escribir.on('finish', resolve);

            leer.pipe(escribir);
        });
    }

    formatearTamaño(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const tamaños = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamaños[i];
    }
}

// Función de uso directo desde línea de comandos
async function main() {
    const backupManager = new BackupManager();
    
    if (process.argv.length < 3) {
        console.log('Uso del Backup Manager:');
        console.log('  node backup-manager.js backup [descripcion]  - Backup completo');
        console.log('  node backup-manager.js backup-user <usuario> - Backup de usuario');
        console.log('  node backup-manager.js listar               - Listar backups');
        console.log('  node backup-manager.js restaurar <ruta>     - Restaurar backup');
        console.log('  node backup-manager.js auto                 - Programar automáticos');
        process.exit(1);
    }

    const comando = process.argv[2];
    
    try {
        switch (comando) {
            case 'backup':
                const descripcion = process.argv[3] || 'Backup manual';
                await backupManager.backupCompleto('manual', descripcion);
                break;
                
            case 'backup-user':
                const usuario = process.argv[3];
                if (!usuario) {
                    console.log('❌ Especifica el nombre de usuario');
                    process.exit(1);
                }
                await backupManager.backupUsuario(usuario);
                break;
                
            case 'listar':
                backupManager.listarBackups();
                break;
                
            case 'restaurar':
                const ruta = process.argv[3];
                if (!ruta) {
                    console.log('❌ Especifica la ruta del backup');
                    process.exit(1);
                }
                await backupManager.restaurarCompleto(ruta);
                break;
                
            case 'auto':
                backupManager.programarBackupsAutomaticos();
                console.log('✅ Backups automáticos iniciados');
                break;
                
            default:
                console.log('❌ Comando no reconocido');
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = BackupManager;

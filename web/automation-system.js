/**
 * Sistema de Automatización y Tareas Programadas
 * Gestión de procesos automáticos para el sistema Desarrollo Residenciales
 */

class AutomationSystem {
    constructor() {
        this.scheduledTasks = new Map();
        this.automationRules = new Map();
        this.triggers = new Map();
        this.isRunning = false;
        
        this.init();
    }

    // Inicializar sistema de automatización
    init() {
        console.log('🤖 Inicializando sistema de automatización...');
        
        this.setupDefaultRules();
        this.setupTriggers();
        this.startScheduler();
        
        console.log('✅ Sistema de automatización inicializado');
    }

    // Configurar reglas de automatización por defecto
    setupDefaultRules() {
        // Backup automático diario
        this.automationRules.set('daily-backup', {
            name: 'Backup Diario',
            description: 'Crear respaldo automático de la base de datos',
            schedule: '0 2 * * *', // 2:00 AM todos los días
            enabled: true,
            action: this.performDatabaseBackup.bind(this),
            lastRun: null,
            runCount: 0
        });

        // Limpieza de logs semanales
        this.automationRules.set('weekly-cleanup', {
            name: 'Limpieza Semanal',
            description: 'Limpiar logs antiguos y datos temporales',
            schedule: '0 3 * * 0', // 3:00 AM todos los domingos
            enabled: true,
            action: this.performSystemCleanup.bind(this),
            lastRun: null,
            runCount: 0
        });

        // Verificación de OLTs cada hora
        this.automationRules.set('hourly-olt-check', {
            name: 'Verificación OLTs',
            description: 'Verificar estado de conexión de OLTs',
            schedule: '0 * * * *', // Cada hora
            enabled: true,
            action: this.checkOLTStatus.bind(this),
            lastRun: null,
            runCount: 0
        });

        // Reporte semanal de rendimiento
        this.automationRules.set('weekly-performance-report', {
            name: 'Reporte Semanal',
            description: 'Generar reporte de rendimiento semanal',
            schedule: '0 8 * * 1', // 8:00 AM todos los lunes
            enabled: true,
            action: this.generateWeeklyReport.bind(this),
            lastRun: null,
            runCount: 0
        });

        // Actualización de estadísticas cada 5 minutos
        this.automationRules.set('stats-update', {
            name: 'Actualización Estadísticas',
            description: 'Actualizar estadísticas del dashboard',
            schedule: '*/5 * * * *', // Cada 5 minutos
            enabled: true,
            action: this.updateDashboardStats.bind(this),
            lastRun: null,
            runCount: 0
        });
    }

    // Configurar triggers de eventos
    setupTriggers() {
        // Trigger cuando se crea una tarea crítica
        this.triggers.set('critical-task-created', {
            name: 'Tarea Crítica Creada',
            event: 'task-created',
            condition: (data) => data.priority === 'critica',
            action: this.handleCriticalTask.bind(this),
            enabled: true
        });

        // Trigger cuando un OLT se desconecta
        this.triggers.set('olt-disconnected', {
            name: 'OLT Desconectado',
            event: 'olt-status-change',
            condition: (data) => data.status === 'offline',
            action: this.handleOLTDisconnection.bind(this),
            enabled: true
        });

        // Trigger cuando se detectan errores frecuentes
        this.triggers.set('frequent-errors', {
            name: 'Errores Frecuentes',
            event: 'error-threshold-reached',
            condition: (data) => data.errorCount > 5,
            action: this.handleFrequentErrors.bind(this),
            enabled: true
        });

        // Trigger para tareas vencidas
        this.triggers.set('overdue-tasks', {
            name: 'Tareas Vencidas',
            event: 'task-overdue',
            condition: (data) => true,
            action: this.handleOverdueTasks.bind(this),
            enabled: true
        });
    }

    // Iniciar el scheduler principal
    startScheduler() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Verificar tareas cada minuto
        this.schedulerInterval = setInterval(() => {
            this.runScheduledTasks();
        }, 60000); // 1 minuto
        
        console.log('⏰ Scheduler de automatización iniciado');
    }

    // Detener el scheduler
    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.isRunning = false;
            console.log('⏹️ Scheduler de automatización detenido');
        }
    }

    // Ejecutar tareas programadas
    runScheduledTasks() {
        const now = new Date();
        
        this.automationRules.forEach((rule, id) => {
            if (!rule.enabled) return;
            
            if (this.shouldRunTask(rule, now)) {
                this.executeRule(id, rule);
            }
        });
    }

    // Verificar si una tarea debe ejecutarse
    shouldRunTask(rule, now) {
        // Implementación básica - en producción usar una librería como node-cron
        if (!rule.lastRun) return true;
        
        const lastRun = new Date(rule.lastRun);
        const timeDiff = now.getTime() - lastRun.getTime();
        
        // Interpretación básica de schedule (cron-like)
        if (rule.schedule.includes('*/5')) { // Cada 5 minutos
            return timeDiff >= 5 * 60 * 1000;
        }
        
        if (rule.schedule.includes('0 *')) { // Cada hora
            return timeDiff >= 60 * 60 * 1000;
        }
        
        if (rule.schedule.includes('0 2')) { // Diario a las 2 AM
            return timeDiff >= 24 * 60 * 60 * 1000 && now.getHours() === 2;
        }
        
        return false;
    }

    // Ejecutar una regla específica
    async executeRule(id, rule) {
        console.log(`🤖 Ejecutando automatización: ${rule.name}`);
        
        try {
            rule.lastRun = new Date().toISOString();
            rule.runCount++;
            
            await rule.action();
            
            console.log(`✅ Automatización completada: ${rule.name}`);
            
            // Notificar éxito si el sistema de notificaciones está disponible
            if (window.notificationSystem) {
                window.notificationSystem.info(
                    'Automatización Completada',
                    `${rule.name}: ${rule.description}`
                );
            }
            
        } catch (error) {
            console.error(`❌ Error en automatización ${rule.name}:`, error);
            
            // Notificar error
            if (window.notificationSystem) {
                window.notificationSystem.error(
                    'Error en Automatización',
                    `${rule.name}: ${error.message}`
                );
            }
        }
    }

    // Acciones de automatización específicas
    async performDatabaseBackup() {
        try {
            // Simular backup de base de datos
            console.log('💾 Iniciando backup de base de datos...');
            
            const backupData = {
                timestamp: new Date().toISOString(),
                tables: ['usuarios', 'tareas', 'olts', 'roles', 'comandos'],
                size: Math.floor(Math.random() * 1000) + 100 // KB simulados
            };
            
            // En producción, aquí se haría el backup real
            localStorage.setItem('last-backup', JSON.stringify(backupData));
            
            console.log('✅ Backup completado:', backupData);
            return backupData;
        } catch (error) {
            throw new Error(`Error en backup: ${error.message}`);
        }
    }

    async performSystemCleanup() {
        try {
            console.log('🧹 Iniciando limpieza del sistema...');
            
            // Limpiar cache expirado
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                const oldCaches = cacheNames.filter(name => 
                    name.includes('v1') || name.includes('old')
                );
                
                for (const cacheName of oldCaches) {
                    await caches.delete(cacheName);
                    console.log(`🗑️ Cache eliminado: ${cacheName}`);
                }
            }
            
            // Limpiar localStorage de datos temporales
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('temp_') || key.startsWith('cache_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            const cleanupResult = {
                cachesDeleted: oldCaches?.length || 0,
                localStorageItemsRemoved: keysToRemove.length,
                timestamp: new Date().toISOString()
            };
            
            console.log('✅ Limpieza completada:', cleanupResult);
            return cleanupResult;
        } catch (error) {
            throw new Error(`Error en limpieza: ${error.message}`);
        }
    }

    async checkOLTStatus() {
        try {
            console.log('📡 Verificando estado de OLTs...');
            
            const response = await fetch('/api/olts');
            const data = await response.json();
            
            if (data.success) {
                const olts = data.olts || [];
                const offlineOLTs = olts.filter(olt => 
                    olt.estado === 'offline' || olt.estado === 'desconectado'
                );
                
                if (offlineOLTs.length > 0) {
                    console.log(`⚠️ ${offlineOLTs.length} OLTs offline detectados`);
                    
                    // Notificar OLTs offline
                    if (window.notificationSystem) {
                        window.notificationSystem.warning(
                            'OLTs Offline',
                            `${offlineOLTs.length} equipos OLT no responden`
                        );
                    }
                }
                
                return {
                    total: olts.length,
                    online: olts.filter(olt => olt.estado === 'online').length,
                    offline: offlineOLTs.length,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            throw new Error(`Error verificando OLTs: ${error.message}`);
        }
    }

    async generateWeeklyReport() {
        try {
            console.log('📊 Generando reporte semanal...');
            
            if (window.reportsAndAnalytics) {
                const report = await window.reportsAndAnalytics.exportReport(
                    'system',
                    'json',
                    { periodo: '7d' }
                );
                
                console.log('✅ Reporte semanal generado');
                return report;
            }
        } catch (error) {
            throw new Error(`Error generando reporte: ${error.message}`);
        }
    }

    async updateDashboardStats() {
        try {
            // Actualizar estadísticas del dashboard
            if (window.dashboardCharts) {
                await window.dashboardCharts.refreshAllCharts();
            }
            
            // Actualizar contadores del dashboard
            this.updateSystemCounters();
            
            return { updated: true, timestamp: new Date().toISOString() };
        } catch (error) {
            throw new Error(`Error actualizando estadísticas: ${error.message}`);
        }
    }

    // Actualizar contadores del sistema
    async updateSystemCounters() {
        try {
            // Obtener estadísticas de tareas
            const tasksResponse = await fetch('/api/tareas/estadisticas');
            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                if (tasksData.success) {
                    const totalTareas = document.getElementById('total-tareas');
                    if (totalTareas) {
                        totalTareas.textContent = tasksData.estadisticas.activas || 0;
                    }
                }
            }
            
            // Obtener estadísticas de usuarios
            const usersResponse = await fetch('/api/usuarios');
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                if (usersData.success) {
                    const totalUsuarios = document.getElementById('total-usuarios');
                    if (totalUsuarios) {
                        const activeUsers = usersData.usuarios.filter(u => u.activo).length;
                        totalUsuarios.textContent = activeUsers;
                    }
                }
            }
        } catch (error) {
            console.error('Error actualizando contadores:', error);
        }
    }

    // Handlers para triggers de eventos
    async handleCriticalTask(data) {
        console.log('🚨 Tarea crítica detectada:', data);
        
        if (window.notificationSystem) {
            window.notificationSystem.critical(
                'Tarea Crítica Creada',
                `Se ha creado una tarea crítica: ${data.title}`,
                { persistent: true }
            );
        }
    }

    async handleOLTDisconnection(data) {
        console.log('📡 OLT desconectado:', data);
        
        if (window.notificationSystem) {
            window.notificationSystem.error(
                'OLT Desconectado',
                `El equipo ${data.name} se ha desconectado`,
                { persistent: true }
            );
        }
    }

    async handleFrequentErrors(data) {
        console.log('⚠️ Errores frecuentes detectados:', data);
        
        if (window.notificationSystem) {
            window.notificationSystem.warning(
                'Errores Frecuentes',
                `Se han detectado ${data.errorCount} errores en los últimos minutos`
            );
        }
    }

    async handleOverdueTasks(data) {
        console.log('⏰ Tareas vencidas detectadas:', data);
        
        if (window.notificationSystem) {
            window.notificationSystem.warning(
                'Tareas Vencidas',
                `Hay ${data.count} tareas vencidas que requieren atención`
            );
        }
    }

    // Trigger manual de evento
    triggerEvent(eventName, data) {
        this.triggers.forEach((trigger, id) => {
            if (trigger.event === eventName && trigger.enabled) {
                if (trigger.condition(data)) {
                    console.log(`🎯 Trigger activado: ${trigger.name}`);
                    trigger.action(data);
                }
            }
        });
    }

    // Gestión de reglas
    addAutomationRule(id, rule) {
        this.automationRules.set(id, {
            ...rule,
            lastRun: null,
            runCount: 0
        });
        console.log(`➕ Regla de automatización agregada: ${rule.name}`);
    }

    removeAutomationRule(id) {
        if (this.automationRules.delete(id)) {
            console.log(`➖ Regla de automatización eliminada: ${id}`);
        }
    }

    enableRule(id) {
        const rule = this.automationRules.get(id);
        if (rule) {
            rule.enabled = true;
            console.log(`✅ Regla habilitada: ${rule.name}`);
        }
    }

    disableRule(id) {
        const rule = this.automationRules.get(id);
        if (rule) {
            rule.enabled = false;
            console.log(`⏸️ Regla deshabilitada: ${rule.name}`);
        }
    }

    // Obtener estado del sistema
    getSystemStatus() {
        return {
            isRunning: this.isRunning,
            rulesCount: this.automationRules.size,
            triggersCount: this.triggers.size,
            enabledRules: Array.from(this.automationRules.values()).filter(r => r.enabled).length,
            enabledTriggers: Array.from(this.triggers.values()).filter(t => t.enabled).length,
            lastActivity: new Date().toISOString()
        };
    }

    // Obtener historial de ejecuciones
    getExecutionHistory() {
        return Array.from(this.automationRules.entries()).map(([id, rule]) => ({
            id,
            name: rule.name,
            lastRun: rule.lastRun,
            runCount: rule.runCount,
            enabled: rule.enabled,
            schedule: rule.schedule
        }));
    }
}

// Instancia global
window.automationSystem = new AutomationSystem();

console.log('🤖 Sistema de automatización cargado');

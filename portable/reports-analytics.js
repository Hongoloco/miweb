/**
 * Sistema de Reportes y Analytics
 * Análisis y generación de reportes para el sistema OLT Antel
 */

class ReportsAndAnalytics {
    constructor() {
        this.analytics = new Map();
        this.reportTemplates = new Map();
        this.scheduledReports = new Map();
        this.exportFormats = ['pdf', 'excel', 'csv', 'json'];
        
        this.init();
    }

    // Inicializar sistema de reportes
    async init() {
        console.log('📊 Inicializando sistema de reportes y analytics...');
        
        this.setupReportTemplates();
        this.initializeAnalytics();
        this.setupExportFunctions();
        
        console.log('✅ Sistema de reportes inicializado');
    }

    // Configurar plantillas de reportes
    setupReportTemplates() {
        // Reporte de tareas
        this.reportTemplates.set('tasks', {
            name: 'Reporte de Tareas',
            description: 'Análisis completo del estado y rendimiento de tareas',
            icon: '📋',
            fields: [
                'estado', 'prioridad', 'categoria', 'usuario_asignado', 
                'fecha_creacion', 'fecha_vencimiento', 'progreso', 'tiempo_estimado'
            ],
            filters: ['estado', 'prioridad', 'categoria', 'fecha_rango'],
            charts: ['status_distribution', 'priority_analysis', 'completion_trends'],
            generator: this.generateTasksReport.bind(this)
        });

        // Reporte de OLTs
        this.reportTemplates.set('olts', {
            name: 'Reporte de OLTs',
            description: 'Estado y rendimiento de equipos OLT',
            icon: '📡',
            fields: [
                'nombre', 'ip', 'modelo', 'estado', 'ubicacion', 
                'ultima_conexion', 'comandos_ejecutados', 'uptime'
            ],
            filters: ['estado', 'modelo', 'ubicacion'],
            charts: ['status_overview', 'model_distribution', 'uptime_analysis'],
            generator: this.generateOLTsReport.bind(this)
        });

        // Reporte de usuarios
        this.reportTemplates.set('users', {
            name: 'Reporte de Usuarios',
            description: 'Actividad y gestión de usuarios del sistema',
            icon: '👥',
            fields: [
                'username', 'rol', 'email', 'activo', 'ultimo_acceso', 
                'tareas_asignadas', 'comandos_ejecutados'
            ],
            filters: ['rol', 'activo', 'ultimo_acceso'],
            charts: ['role_distribution', 'activity_trends', 'usage_statistics'],
            generator: this.generateUsersReport.bind(this)
        });

        // Reporte de comandos
        this.reportTemplates.set('commands', {
            name: 'Reporte de Comandos',
            description: 'Análisis de uso y efectividad de comandos',
            icon: '⚡',
            fields: [
                'nombre', 'descripcion', 'categoria', 'olt_asociado', 
                'veces_ejecutado', 'tasa_exito', 'tiempo_promedio'
            ],
            filters: ['categoria', 'olt', 'periodo'],
            charts: ['usage_frequency', 'success_rates', 'performance_metrics'],
            generator: this.generateCommandsReport.bind(this)
        });

        // Reporte del sistema
        this.reportTemplates.set('system', {
            name: 'Reporte del Sistema',
            description: 'Rendimiento general y métricas del sistema',
            icon: '⚙️',
            fields: [
                'uptime', 'usuarios_activos', 'tareas_completadas', 
                'comandos_ejecutados', 'errores_registrados', 'uso_recursos'
            ],
            filters: ['periodo', 'tipo_metrica'],
            charts: ['system_performance', 'resource_usage', 'error_analysis'],
            generator: this.generateSystemReport.bind(this)
        });
    }

    // Inicializar analytics
    initializeAnalytics() {
        this.analytics.set('page_views', new Map());
        this.analytics.set('user_actions', new Map());
        this.analytics.set('command_usage', new Map());
        this.analytics.set('error_tracking', new Map());
        this.analytics.set('performance_metrics', new Map());
        
        // Configurar tracking automático
        this.setupAutoTracking();
    }

    // Configurar tracking automático
    setupAutoTracking() {
        // Track page views
        this.trackPageView(window.location.pathname);
        
        // Track user actions
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-track]')) {
                this.trackUserAction('click', event.target.dataset.track);
            }
        });
        
        // Track errors
        window.addEventListener('error', (event) => {
            this.trackError('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Track performance
        this.trackPerformanceMetrics();
    }

    // Tracking functions
    trackPageView(page) {
        const pageViews = this.analytics.get('page_views');
        const today = new Date().toISOString().split('T')[0];
        
        if (!pageViews.has(today)) {
            pageViews.set(today, new Map());
        }
        
        const dayViews = pageViews.get(today);
        dayViews.set(page, (dayViews.get(page) || 0) + 1);
    }

    trackUserAction(action, target) {
        const userActions = this.analytics.get('user_actions');
        const timestamp = Date.now();
        const userId = this.getCurrentUserId();
        
        if (!userActions.has(userId)) {
            userActions.set(userId, []);
        }
        
        userActions.get(userId).push({
            action,
            target,
            timestamp,
            page: window.location.pathname
        });
    }

    trackError(type, details) {
        const errorTracking = this.analytics.get('error_tracking');
        const timestamp = Date.now();
        
        if (!errorTracking.has(type)) {
            errorTracking.set(type, []);
        }
        
        errorTracking.get(type).push({
            ...details,
            timestamp,
            userId: this.getCurrentUserId(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }

    trackPerformanceMetrics() {
        const performanceMetrics = this.analytics.get('performance_metrics');
        
        // Navigation timing
        if (performance.timing) {
            const timing = performance.timing;
            const metrics = {
                page_load_time: timing.loadEventEnd - timing.navigationStart,
                dom_ready_time: timing.domContentLoadedEventEnd - timing.navigationStart,
                dns_lookup_time: timing.domainLookupEnd - timing.domainLookupStart,
                server_response_time: timing.responseEnd - timing.requestStart
            };
            
            performanceMetrics.set(Date.now(), metrics);
        }
    }

    // Generar reportes específicos
    async generateTasksReport(filters = {}) {
        try {
            const response = await fetch('/api/tareas');
            const data = await response.json();
            
            if (!data.success) throw new Error('Error obteniendo datos de tareas');
            
            let tasks = data.tareas || [];
            
            // Aplicar filtros
            if (filters.estado) {
                tasks = tasks.filter(task => task.estado === filters.estado);
            }
            if (filters.prioridad) {
                tasks = tasks.filter(task => task.prioridad === filters.prioridad);
            }
            if (filters.categoria) {
                tasks = tasks.filter(task => task.categoria === filters.categoria);
            }
            if (filters.fecha_rango) {
                const { inicio, fin } = filters.fecha_rango;
                tasks = tasks.filter(task => {
                    const taskDate = new Date(task.fecha_creacion);
                    return taskDate >= new Date(inicio) && taskDate <= new Date(fin);
                });
            }
            
            // Generar análisis
            const analysis = {
                total_tasks: tasks.length,
                by_status: this.groupBy(tasks, 'estado'),
                by_priority: this.groupBy(tasks, 'prioridad'),
                by_category: this.groupBy(tasks, 'categoria'),
                completion_rate: this.calculateCompletionRate(tasks),
                average_completion_time: this.calculateAverageCompletionTime(tasks),
                overdue_tasks: this.getOverdueTasks(tasks),
                productivity_metrics: this.calculateProductivityMetrics(tasks)
            };
            
            return {
                title: 'Reporte de Tareas',
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                summary: analysis,
                data: tasks,
                charts: await this.generateTasksCharts(tasks)
            };
            
        } catch (error) {
            console.error('Error generando reporte de tareas:', error);
            throw error;
        }
    }

    async generateOLTsReport(filters = {}) {
        try {
            const response = await fetch('/api/olts');
            const data = await response.json();
            
            if (!data.success) throw new Error('Error obteniendo datos de OLTs');
            
            let olts = data.olts || [];
            
            // Aplicar filtros
            if (filters.estado) {
                olts = olts.filter(olt => olt.estado === filters.estado);
            }
            if (filters.modelo) {
                olts = olts.filter(olt => olt.modelo === filters.modelo);
            }
            if (filters.ubicacion) {
                olts = olts.filter(olt => olt.ubicacion?.includes(filters.ubicacion));
            }
            
            // Generar análisis
            const analysis = {
                total_olts: olts.length,
                by_status: this.groupBy(olts, 'estado'),
                by_model: this.groupBy(olts, 'modelo'),
                by_location: this.groupBy(olts, 'ubicacion'),
                availability_rate: this.calculateAvailabilityRate(olts),
                performance_metrics: this.calculateOLTPerformanceMetrics(olts),
                maintenance_schedule: this.getMaintenanceSchedule(olts)
            };
            
            return {
                title: 'Reporte de OLTs',
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                summary: analysis,
                data: olts,
                charts: await this.generateOLTsCharts(olts)
            };
            
        } catch (error) {
            console.error('Error generando reporte de OLTs:', error);
            throw error;
        }
    }

    async generateUsersReport(filters = {}) {
        try {
            const response = await fetch('/api/usuarios');
            const data = await response.json();
            
            if (!data.success) throw new Error('Error obteniendo datos de usuarios');
            
            let users = data.usuarios || [];
            
            // Aplicar filtros
            if (filters.rol) {
                users = users.filter(user => user.rol === filters.rol);
            }
            if (filters.activo !== undefined) {
                users = users.filter(user => user.activo === filters.activo);
            }
            
            // Generar análisis
            const analysis = {
                total_users: users.length,
                active_users: users.filter(u => u.activo).length,
                by_role: this.groupBy(users, 'rol'),
                login_statistics: this.calculateLoginStatistics(users),
                activity_metrics: this.calculateUserActivityMetrics(users),
                security_metrics: this.calculateSecurityMetrics(users)
            };
            
            return {
                title: 'Reporte de Usuarios',
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                summary: analysis,
                data: users.map(u => ({ ...u, password: '[OCULTA]' })), // Ocultar contraseñas
                charts: await this.generateUsersCharts(users)
            };
            
        } catch (error) {
            console.error('Error generando reporte de usuarios:', error);
            throw error;
        }
    }

    // Funciones de análisis
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = item[key] || 'Sin especificar';
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }

    calculateCompletionRate(tasks) {
        const completed = tasks.filter(t => t.estado === 'finalizada').length;
        return tasks.length > 0 ? (completed / tasks.length * 100).toFixed(2) : 0;
    }

    calculateAverageCompletionTime(tasks) {
        const completedTasks = tasks.filter(t => t.estado === 'finalizada' && t.fecha_finalizacion);
        
        if (completedTasks.length === 0) return 0;
        
        const totalTime = completedTasks.reduce((sum, task) => {
            const created = new Date(task.fecha_creacion);
            const completed = new Date(task.fecha_finalizacion);
            return sum + (completed - created);
        }, 0);
        
        return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // días
    }

    getOverdueTasks(tasks) {
        const now = new Date();
        return tasks.filter(task => {
            return task.fecha_vencimiento && 
                   new Date(task.fecha_vencimiento) < now && 
                   task.estado !== 'finalizada';
        });
    }

    calculateProductivityMetrics(tasks) {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        const thisMonthTasks = tasks.filter(t => new Date(t.fecha_creacion) >= thisMonth);
        const lastMonthTasks = tasks.filter(t => {
            const date = new Date(t.fecha_creacion);
            return date >= lastMonth && date < thisMonth;
        });
        
        return {
            this_month: {
                created: thisMonthTasks.length,
                completed: thisMonthTasks.filter(t => t.estado === 'finalizada').length
            },
            last_month: {
                created: lastMonthTasks.length,
                completed: lastMonthTasks.filter(t => t.estado === 'finalizada').length
            }
        };
    }

    // Exportar reportes
    async exportReport(reportType, format, filters = {}) {
        console.log(`📄 Exportando reporte ${reportType} en formato ${format}...`);
        
        const template = this.reportTemplates.get(reportType);
        if (!template) {
            throw new Error('Tipo de reporte no encontrado');
        }
        
        const reportData = await template.generator(filters);
        
        switch (format.toLowerCase()) {
            case 'pdf':
                return this.exportToPDF(reportData);
            case 'excel':
                return this.exportToExcel(reportData);
            case 'csv':
                return this.exportToCSV(reportData);
            case 'json':
                return this.exportToJSON(reportData);
            default:
                throw new Error('Formato de exportación no soportado');
        }
    }

    exportToPDF(reportData) {
        // Implementación básica de exportación a PDF
        const content = this.generatePDFContent(reportData);
        
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        link.click();
        
        URL.revokeObjectURL(url);
        return { success: true, message: 'Reporte PDF generado' };
    }

    exportToExcel(reportData) {
        // Implementación básica de exportación a Excel (CSV con formato)
        const csvContent = this.generateCSVContent(reportData.data);
        
        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.xls`;
        link.click();
        
        URL.revokeObjectURL(url);
        return { success: true, message: 'Reporte Excel generado' };
    }

    exportToCSV(reportData) {
        const csvContent = this.generateCSVContent(reportData.data);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        return { success: true, message: 'Reporte CSV generado' };
    }

    exportToJSON(reportData) {
        const jsonContent = JSON.stringify(reportData, null, 2);
        
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportData.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        return { success: true, message: 'Reporte JSON generado' };
    }

    generateCSVContent(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    generatePDFContent(reportData) {
        // Implementación básica - en producción usar una librería como jsPDF
        return `
${reportData.title}
Generado: ${new Date(reportData.generated_at).toLocaleDateString()}

RESUMEN:
${JSON.stringify(reportData.summary, null, 2)}

DATOS:
${JSON.stringify(reportData.data, null, 2)}
        `;
    }

    // Programar reportes automáticos
    scheduleReport(reportType, schedule, filters = {}, recipients = []) {
        const scheduleId = `schedule_${Date.now()}`;
        
        this.scheduledReports.set(scheduleId, {
            reportType,
            schedule, // cron-like: '0 9 * * MON' para cada lunes a las 9 AM
            filters,
            recipients,
            created: new Date(),
            lastRun: null,
            nextRun: this.calculateNextRun(schedule)
        });
        
        console.log(`📅 Reporte programado: ${reportType} - ${schedule}`);
        return scheduleId;
    }

    calculateNextRun(schedule) {
        // Implementación básica - en producción usar una librería como node-cron
        const now = new Date();
        const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 día por defecto
        return nextRun;
    }

    // Utilidades
    getCurrentUserId() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            return currentUser.id || 'anonymous';
        } catch {
            return 'anonymous';
        }
    }

    // Generar gráficos para reportes
    async generateTasksCharts(tasks) {
        return {
            status_distribution: this.groupBy(tasks, 'estado'),
            priority_analysis: this.groupBy(tasks, 'prioridad'),
            category_breakdown: this.groupBy(tasks, 'categoria')
        };
    }

    async generateOLTsCharts(olts) {
        return {
            status_overview: this.groupBy(olts, 'estado'),
            model_distribution: this.groupBy(olts, 'modelo'),
            location_analysis: this.groupBy(olts, 'ubicacion')
        };
    }

    async generateUsersCharts(users) {
        return {
            role_distribution: this.groupBy(users, 'rol'),
            activity_status: this.groupBy(users, 'activo')
        };
    }

    // Obtener plantillas disponibles
    getAvailableReports() {
        return Array.from(this.reportTemplates.entries()).map(([key, template]) => ({
            id: key,
            name: template.name,
            description: template.description,
            icon: template.icon,
            fields: template.fields,
            filters: template.filters
        }));
    }

    // Obtener analytics
    getAnalytics(type, period = '7d') {
        const analytics = this.analytics.get(type);
        if (!analytics) return null;
        
        // Filtrar por período si es necesario
        const cutoff = this.getPeriodCutoff(period);
        
        // Procesar según el tipo de analítica
        switch (type) {
            case 'page_views':
                return this.processPageViewAnalytics(analytics, cutoff);
            case 'user_actions':
                return this.processUserActionAnalytics(analytics, cutoff);
            default:
                return analytics;
        }
    }

    getPeriodCutoff(period) {
        const now = Date.now();
        const periods = {
            '1d': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };
        
        return now - (periods[period] || periods['7d']);
    }

    processPageViewAnalytics(analytics, cutoff) {
        // Procesar vistas de página dentro del período
        const result = {};
        
        for (const [date, pageViews] of analytics) {
            if (new Date(date).getTime() >= cutoff) {
                result[date] = Object.fromEntries(pageViews);
            }
        }
        
        return result;
    }

    processUserActionAnalytics(analytics, cutoff) {
        const result = {};
        
        for (const [userId, actions] of analytics) {
            const filteredActions = actions.filter(action => action.timestamp >= cutoff);
            if (filteredActions.length > 0) {
                result[userId] = filteredActions;
            }
        }
        
        return result;
    }
}

// Instancia global
window.reportsAndAnalytics = new ReportsAndAnalytics();

console.log('📊 Sistema de reportes y analytics cargado');

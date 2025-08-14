/**
 * Sistema de Gráficos y Dashboards Avanzados
 * Gestión de visualizaciones para el sistema Desarrollo Residenciales
 */

class DashboardCharts {
    constructor() {
        this.charts = new Map();
        this.chartColors = {
            primary: '#007bff',
            secondary: '#6c757d',
            success: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8',
            light: '#f8f9fa',
            dark: '#343a40'
        };
        this.animationDuration = 1000;
    }

    // Inicializar todos los gráficos del dashboard
    async initializeDashboard() {
        console.log('📊 Inicializando dashboard con gráficos...');
        
        try {
            await Promise.all([
                this.createTasksChart(),
                this.createOLTStatusChart(),
                this.createPerformanceChart(),
                this.createUserActivityChart(),
                this.createCommandsChart()
            ]);
            
            console.log('✅ Dashboard con gráficos inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar dashboard:', error);
        }
    }

    // Gráfico de estado de tareas (Donut Chart)
    async createTasksChart() {
        const response = await fetch('/api/tareas/estadisticas');
        const data = await response.json();
        
        if (!data.success) return;
        
        const stats = data.estadisticas;
        const chartData = [
            { label: 'Pendientes', value: stats.pendientes || 0, color: this.chartColors.warning },
            { label: 'En Progreso', value: stats.activas || 0, color: this.chartColors.info },
            { label: 'Finalizadas', value: stats.finalizadas || 0, color: this.chartColors.success }
        ];

        this.createDonutChart('tasks-chart', chartData, 'Distribución de Tareas');
    }

    // Gráfico de estado de OLTs (Bar Chart)
    async createOLTStatusChart() {
        try {
            const response = await fetch('/api/olts');
            const data = await response.json();
            
            if (!data.success) return;
            
            const olts = data.olts || [];
            const statusCount = olts.reduce((acc, olt) => {
                const status = olt.estado || 'desconocido';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            const chartData = Object.entries(statusCount).map(([status, count]) => ({
                label: this.capitalizeFirst(status),
                value: count,
                color: this.getStatusColor(status)
            }));

            this.createBarChart('olt-status-chart', chartData, 'Estado de OLTs');
        } catch (error) {
            console.error('Error creando gráfico de OLTs:', error);
        }
    }

    // Gráfico de rendimiento del sistema (Line Chart)
    async createPerformanceChart() {
        // Simular datos de rendimiento temporal
        const now = new Date();
        const performanceData = [];
        
        for (let i = 23; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
            performanceData.push({
                time: timestamp.getHours() + ':00',
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                network: Math.random() * 100
            });
        }

        this.createLineChart('performance-chart', performanceData, 'Rendimiento del Sistema (24h)');
    }

    // Gráfico de actividad de usuarios (Area Chart)
    async createUserActivityChart() {
        try {
            const response = await fetch('/api/usuarios');
            const data = await response.json();
            
            if (!data.success) return;
            
            const users = data.usuarios || [];
            const activityData = users.reduce((acc, user) => {
                const rol = user.rol || 'sin_rol';
                acc[rol] = (acc[rol] || 0) + 1;
                return acc;
            }, {});

            const chartData = Object.entries(activityData).map(([rol, count]) => ({
                label: this.capitalizeFirst(rol),
                value: count,
                color: this.getRoleColor(rol)
            }));

            this.createPieChart('user-activity-chart', chartData, 'Distribución de Usuarios por Rol');
        } catch (error) {
            console.error('Error creando gráfico de actividad:', error);
        }
    }

    // Gráfico de comandos más utilizados
    async createCommandsChart() {
        // Simular datos de comandos más utilizados
        const commandsData = [
            { label: 'show version', value: 245, color: this.chartColors.primary },
            { label: 'show interface', value: 189, color: this.chartColors.info },
            { label: 'configure terminal', value: 167, color: this.chartColors.success },
            { label: 'show running-config', value: 134, color: this.chartColors.warning },
            { label: 'show logs', value: 98, color: this.chartColors.danger }
        ];

        this.createHorizontalBarChart('commands-chart', commandsData, 'Comandos Más Utilizados');
    }

    // Crear gráfico de donut
    createDonutChart(containerId, data, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const total = data.reduce((sum, item) => sum + item.value, 0);
        const radius = 80;
        const innerRadius = 50;
        const centerX = 120;
        const centerY = 120;

        let cumulativeAngle = 0;
        const paths = data.map(item => {
            const percentage = (item.value / total) * 100;
            const angle = (item.value / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            cumulativeAngle += angle;

            const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
            
            const x3 = centerX + innerRadius * Math.cos((endAngle - 90) * Math.PI / 180);
            const y3 = centerY + innerRadius * Math.sin((endAngle - 90) * Math.PI / 180);
            const x4 = centerX + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180);
            const y4 = centerY + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                'Z'
            ].join(' ');

            return { pathData, color: item.color, label: item.label, value: item.value, percentage };
        });

        container.innerHTML = `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <svg width="240" height="240" style="flex-shrink: 0;">
                        ${paths.map((path, index) => 
                            `<path d="${path.pathData}" fill="${path.color}" 
                                   style="transition: opacity 0.3s; cursor: pointer;"
                                   onmouseover="this.style.opacity=0.8" 
                                   onmouseout="this.style.opacity=1">
                                <title>${path.label}: ${path.value} (${path.percentage.toFixed(1)}%)</title>
                             </path>`
                        ).join('')}
                        <text x="${centerX}" y="${centerY}" text-anchor="middle" 
                              style="font-size: 24px; font-weight: bold; fill: #333;">
                            ${total}
                        </text>
                        <text x="${centerX}" y="${centerY + 20}" text-anchor="middle" 
                              style="font-size: 12px; fill: #666;">
                            Total
                        </text>
                    </svg>
                    <div class="chart-legend">
                        ${paths.map(path => 
                            `<div class="legend-item" style="display: flex; align-items: center; margin-bottom: 8px;">
                                <div style="width: 16px; height: 16px; background: ${path.color}; 
                                           border-radius: 3px; margin-right: 8px;"></div>
                                <span style="font-size: 14px;">${path.label}: <strong>${path.value}</strong></span>
                             </div>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Crear gráfico de barras
    createBarChart(containerId, data, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const maxValue = Math.max(...data.map(item => item.value));
        const chartHeight = 200;
        const barWidth = 40;
        const spacing = 20;
        const chartWidth = data.length * (barWidth + spacing);

        container.innerHTML = `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <svg width="${chartWidth + 60}" height="${chartHeight + 100}" style="overflow: visible;">
                    ${data.map((item, index) => {
                        const barHeight = (item.value / maxValue) * chartHeight;
                        const x = index * (barWidth + spacing) + 30;
                        const y = chartHeight - barHeight + 20;
                        
                        return `
                            <g>
                                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                                      fill="${item.color}" style="transition: all 0.3s;">
                                    <title>${item.label}: ${item.value}</title>
                                </rect>
                                <text x="${x + barWidth/2}" y="${chartHeight + 40}" 
                                      text-anchor="middle" style="font-size: 12px; fill: #666;">
                                    ${item.label}
                                </text>
                                <text x="${x + barWidth/2}" y="${y - 5}" 
                                      text-anchor="middle" style="font-size: 11px; font-weight: bold;">
                                    ${item.value}
                                </text>
                            </g>
                        `;
                    }).join('')}
                </svg>
            </div>
        `;
    }

    // Crear gráfico de líneas
    createLineChart(containerId, data, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const chartWidth = 400;
        const chartHeight = 200;
        const padding = 40;

        container.innerHTML = `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <svg width="${chartWidth + padding * 2}" height="${chartHeight + padding * 2}">
                    <defs>
                        <linearGradient id="cpuGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#007bff;stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:#007bff;stop-opacity:0" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Grid lines -->
                    ${[0, 25, 50, 75, 100].map(y => 
                        `<line x1="${padding}" y1="${padding + (chartHeight * (100-y) / 100)}" 
                               x2="${chartWidth + padding}" y2="${padding + (chartHeight * (100-y) / 100)}" 
                               stroke="#e9ecef" stroke-width="1"/>`
                    ).join('')}
                    
                    <!-- CPU Line -->
                    <polyline points="${data.map((point, index) => 
                        `${padding + (index * chartWidth / (data.length - 1))},${padding + chartHeight - (point.cpu * chartHeight / 100)}`
                    ).join(' ')}" 
                    fill="none" stroke="#007bff" stroke-width="2"/>
                    
                    <!-- Data points -->
                    ${data.map((point, index) => 
                        `<circle cx="${padding + (index * chartWidth / (data.length - 1))}" 
                                cy="${padding + chartHeight - (point.cpu * chartHeight / 100)}" 
                                r="3" fill="#007bff">
                            <title>CPU: ${point.cpu.toFixed(1)}% - ${point.time}</title>
                         </circle>`
                    ).join('')}
                    
                    <!-- Y-axis labels -->
                    ${[0, 25, 50, 75, 100].map(y => 
                        `<text x="${padding - 10}" y="${padding + (chartHeight * (100-y) / 100) + 4}" 
                               text-anchor="end" style="font-size: 12px; fill: #666;">${y}%</text>`
                    ).join('')}
                </svg>
            </div>
        `;
    }

    // Crear gráfico de pie
    createPieChart(containerId, data, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const total = data.reduce((sum, item) => sum + item.value, 0);
        const radius = 80;
        const centerX = 120;
        const centerY = 120;

        let cumulativeAngle = 0;
        const paths = data.map(item => {
            const angle = (item.value / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            cumulativeAngle += angle;

            const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');

            return { pathData, color: item.color, label: item.label, value: item.value };
        });

        container.innerHTML = `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <svg width="240" height="240">
                        ${paths.map(path => 
                            `<path d="${path.pathData}" fill="${path.color}" 
                                   style="transition: opacity 0.3s; cursor: pointer;"
                                   onmouseover="this.style.opacity=0.8" 
                                   onmouseout="this.style.opacity=1">
                                <title>${path.label}: ${path.value}</title>
                             </path>`
                        ).join('')}
                    </svg>
                    <div class="chart-legend">
                        ${paths.map(path => 
                            `<div class="legend-item" style="display: flex; align-items: center; margin-bottom: 8px;">
                                <div style="width: 16px; height: 16px; background: ${path.color}; 
                                           border-radius: 50%; margin-right: 8px;"></div>
                                <span style="font-size: 14px;">${path.label}: <strong>${path.value}</strong></span>
                             </div>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Crear gráfico de barras horizontales
    createHorizontalBarChart(containerId, data, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const maxValue = Math.max(...data.map(item => item.value));
        const barHeight = 30;
        const spacing = 10;
        const chartHeight = data.length * (barHeight + spacing);
        const chartWidth = 300;

        container.innerHTML = `
            <div class="chart-container">
                <h4 class="chart-title">${title}</h4>
                <svg width="${chartWidth + 200}" height="${chartHeight + 40}">
                    ${data.map((item, index) => {
                        const barWidth = (item.value / maxValue) * chartWidth;
                        const y = index * (barHeight + spacing) + 20;
                        
                        return `
                            <g>
                                <rect x="120" y="${y}" width="${barWidth}" height="${barHeight}" 
                                      fill="${item.color}" style="transition: all 0.3s;">
                                    <title>${item.label}: ${item.value}</title>
                                </rect>
                                <text x="115" y="${y + barHeight/2 + 4}" 
                                      text-anchor="end" style="font-size: 12px; fill: #333;">
                                    ${item.label}
                                </text>
                                <text x="${125 + barWidth}" y="${y + barHeight/2 + 4}" 
                                      style="font-size: 11px; font-weight: bold; fill: #333;">
                                    ${item.value}
                                </text>
                            </g>
                        `;
                    }).join('')}
                </svg>
            </div>
        `;
    }

    // Utilidades
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getStatusColor(status) {
        const colors = {
            'activo': this.chartColors.success,
            'inactivo': this.chartColors.danger,
            'mantenimiento': this.chartColors.warning,
            'desconocido': this.chartColors.secondary
        };
        return colors[status] || this.chartColors.secondary;
    }

    getRoleColor(role) {
        const colors = {
            'admin': this.chartColors.danger,
            'tecnico': this.chartColors.primary,
            'usuario': this.chartColors.info,
            'supervisor': this.chartColors.warning
        };
        return colors[role] || this.chartColors.secondary;
    }

    // Actualizar todos los gráficos
    async refreshAllCharts() {
        console.log('🔄 Actualizando todos los gráficos...');
        await this.initializeDashboard();
    }

    // Configurar actualizaciones automáticas
    startAutoRefresh(intervalMinutes = 5) {
        setInterval(() => {
            this.refreshAllCharts();
        }, intervalMinutes * 60 * 1000);
        
        console.log(`🔄 Auto-actualización configurada cada ${intervalMinutes} minutos`);
    }
}

// Instancia global
window.dashboardCharts = new DashboardCharts();

// Estilos CSS para los gráficos
const chartStyles = `
<style>
.chart-container {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid #e9ecef;
    margin-bottom: 20px;
}

.chart-title {
    color: #333;
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
}

.chart-legend {
    max-width: 200px;
}

.legend-item {
    transition: all 0.2s;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}

.legend-item:hover {
    background-color: #f8f9fa;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

@media (max-width: 768px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
    
    .chart-container {
        padding: 15px;
    }
    
    .chart-title {
        font-size: 14px;
    }
}
</style>
`;

// Inyectar estilos si no existen
if (!document.querySelector('#chart-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'chart-styles';
    styleElement.innerHTML = chartStyles;
    document.head.appendChild(styleElement);
}

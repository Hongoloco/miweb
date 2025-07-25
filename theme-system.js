/**
 * Sistema de Temas y Personalización
 * Gestión de temas, colores y configuración de interfaz
 */

class ThemeSystem {
    constructor() {
        this.currentTheme = 'light';
        this.themes = new Map();
        this.customProperties = new Map();
        this.userPreferences = this.loadUserPreferences();
        
        this.init();
    }

    // Inicializar sistema de temas
    init() {
        console.log('🎨 Inicializando sistema de temas...');
        
        this.setupDefaultThemes();
        this.setupCustomProperties();
        this.createThemeSelector();
        this.applyUserPreferences();
        this.setupEventListeners();
        
        console.log('✅ Sistema de temas inicializado');
    }

    // Configurar temas predefinidos
    setupDefaultThemes() {
        // Tema claro (por defecto)
        this.themes.set('light', {
            name: 'Claro',
            icon: '☀️',
            properties: {
                '--primary-color': '#007bff',
                '--secondary-color': '#6c757d',
                '--success-color': '#28a745',
                '--danger-color': '#dc3545',
                '--warning-color': '#ffc107',
                '--info-color': '#17a2b8',
                '--light-color': '#f8f9fa',
                '--dark-color': '#343a40',
                
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f8f9fa',
                '--bg-tertiary': '#e9ecef',
                
                '--text-primary': '#212529',
                '--text-secondary': '#6c757d',
                '--text-muted': '#adb5bd',
                
                '--border-color': '#dee2e6',
                '--border-light': '#e9ecef',
                '--border-dark': '#adb5bd',
                
                '--shadow-sm': '0 0.125rem 0.25rem rgba(0,0,0,0.075)',
                '--shadow': '0 0.5rem 1rem rgba(0,0,0,0.15)',
                '--shadow-lg': '0 1rem 3rem rgba(0,0,0,0.175)'
            }
        });

        // Tema oscuro
        this.themes.set('dark', {
            name: 'Oscuro',
            icon: '🌙',
            properties: {
                '--primary-color': '#0d6efd',
                '--secondary-color': '#6c757d',
                '--success-color': '#198754',
                '--danger-color': '#dc3545',
                '--warning-color': '#ffc107',
                '--info-color': '#0dcaf0',
                '--light-color': '#f8f9fa',
                '--dark-color': '#212529',
                
                '--bg-primary': '#1a1a1a',
                '--bg-secondary': '#2d2d2d',
                '--bg-tertiary': '#404040',
                
                '--text-primary': '#ffffff',
                '--text-secondary': '#adb5bd',
                '--text-muted': '#6c757d',
                
                '--border-color': '#495057',
                '--border-light': '#404040',
                '--border-dark': '#2d2d2d',
                
                '--shadow-sm': '0 0.125rem 0.25rem rgba(0,0,0,0.3)',
                '--shadow': '0 0.5rem 1rem rgba(0,0,0,0.4)',
                '--shadow-lg': '0 1rem 3rem rgba(0,0,0,0.5)'
            }
        });

        // Tema azul
        this.themes.set('blue', {
            name: 'Azul Profesional',
            icon: '💙',
            properties: {
                '--primary-color': '#004085',
                '--secondary-color': '#5a6c7d',
                '--success-color': '#155724',
                '--danger-color': '#721c24',
                '--warning-color': '#856404',
                '--info-color': '#0c5460',
                '--light-color': '#f1f8ff',
                '--dark-color': '#002752',
                
                '--bg-primary': '#f8fbff',
                '--bg-secondary': '#e7f3ff',
                '--bg-tertiary': '#cce7ff',
                
                '--text-primary': '#002752',
                '--text-secondary': '#004085',
                '--text-muted': '#5a6c7d',
                
                '--border-color': '#b8daff',
                '--border-light': '#cce7ff',
                '--border-dark': '#9fc9ff',
                
                '--shadow-sm': '0 0.125rem 0.25rem rgba(0,64,133,0.1)',
                '--shadow': '0 0.5rem 1rem rgba(0,64,133,0.2)',
                '--shadow-lg': '0 1rem 3rem rgba(0,64,133,0.3)'
            }
        });

        // Tema verde
        this.themes.set('green', {
            name: 'Verde Natural',
            icon: '🌿',
            properties: {
                '--primary-color': '#2d5a27',
                '--secondary-color': '#6c7b7d',
                '--success-color': '#155724',
                '--danger-color': '#721c24',
                '--warning-color': '#856404',
                '--info-color': '#0c5460',
                '--light-color': '#f8fff8',
                '--dark-color': '#1a3a15',
                
                '--bg-primary': '#f8fff8',
                '--bg-secondary': '#e8f5e8',
                '--bg-tertiary': '#d4edda',
                
                '--text-primary': '#1a3a15',
                '--text-secondary': '#2d5a27',
                '--text-muted': '#6c7b7d',
                
                '--border-color': '#c3e6cb',
                '--border-light': '#d4edda',
                '--border-dark': '#b8ddc0',
                
                '--shadow-sm': '0 0.125rem 0.25rem rgba(45,90,39,0.1)',
                '--shadow': '0 0.5rem 1rem rgba(45,90,39,0.2)',
                '--shadow-lg': '0 1rem 3rem rgba(45,90,39,0.3)'
            }
        });

        // Tema modo alto contraste
        this.themes.set('high-contrast', {
            name: 'Alto Contraste',
            icon: '⚫',
            properties: {
                '--primary-color': '#0000ff',
                '--secondary-color': '#808080',
                '--success-color': '#008000',
                '--danger-color': '#ff0000',
                '--warning-color': '#ffff00',
                '--info-color': '#00ffff',
                '--light-color': '#ffffff',
                '--dark-color': '#000000',
                
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f0f0f0',
                '--bg-tertiary': '#e0e0e0',
                
                '--text-primary': '#000000',
                '--text-secondary': '#404040',
                '--text-muted': '#808080',
                
                '--border-color': '#000000',
                '--border-light': '#404040',
                '--border-dark': '#000000',
                
                '--shadow-sm': '0 0.125rem 0.25rem rgba(0,0,0,0.5)',
                '--shadow': '0 0.5rem 1rem rgba(0,0,0,0.7)',
                '--shadow-lg': '0 1rem 3rem rgba(0,0,0,0.9)'
            }
        });
    }

    // Configurar propiedades personalizables
    setupCustomProperties() {
        this.customProperties.set('font-size', {
            name: 'Tamaño de Fuente',
            type: 'range',
            min: 12,
            max: 20,
            default: 14,
            unit: 'px',
            property: '--base-font-size'
        });

        this.customProperties.set('border-radius', {
            name: 'Bordes Redondeados',
            type: 'range',
            min: 0,
            max: 15,
            default: 6,
            unit: 'px',
            property: '--border-radius'
        });

        this.customProperties.set('spacing', {
            name: 'Espaciado',
            type: 'range',
            min: 0.5,
            max: 2,
            default: 1,
            unit: 'em',
            property: '--spacing-multiplier'
        });

        this.customProperties.set('animation-speed', {
            name: 'Velocidad de Animaciones',
            type: 'select',
            options: [
                { value: '0s', label: 'Sin animaciones' },
                { value: '0.15s', label: 'Rápido' },
                { value: '0.3s', label: 'Normal' },
                { value: '0.5s', label: 'Lento' }
            ],
            default: '0.3s',
            property: '--animation-duration'
        });

        this.customProperties.set('sidebar-width', {
            name: 'Ancho de Sidebar',
            type: 'range',
            min: 200,
            max: 400,
            default: 280,
            unit: 'px',
            property: '--sidebar-width'
        });
    }

    // Crear selector de temas en la interfaz
    createThemeSelector() {
        // Verificar si ya existe
        if (document.getElementById('theme-selector-container')) return;

        const container = document.createElement('div');
        container.id = 'theme-selector-container';
        container.innerHTML = `
            <div class="theme-selector-panel" id="theme-selector-panel">
                <div class="theme-panel-header">
                    <h4>🎨 Personalización</h4>
                    <button class="theme-panel-close" onclick="themeSystem.hideThemeSelector()">×</button>
                </div>
                
                <div class="theme-panel-content">
                    <div class="theme-section">
                        <h5>Tema</h5>
                        <div class="theme-options" id="theme-options">
                            ${Array.from(this.themes.entries()).map(([id, theme]) => `
                                <button class="theme-option ${id === this.currentTheme ? 'active' : ''}" 
                                        data-theme="${id}" onclick="themeSystem.applyTheme('${id}')">
                                    <span class="theme-icon">${theme.icon}</span>
                                    <span class="theme-name">${theme.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="theme-section">
                        <h5>Personalización</h5>
                        <div class="custom-properties" id="custom-properties">
                            ${Array.from(this.customProperties.entries()).map(([id, prop]) => `
                                <div class="property-control">
                                    <label for="prop-${id}">${prop.name}</label>
                                    ${this.createPropertyControl(id, prop)}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="theme-section">
                        <h5>Acciones</h5>
                        <div class="theme-actions">
                            <button class="btn btn-outline-primary btn-sm" onclick="themeSystem.exportTheme()">
                                📤 Exportar Configuración
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="themeSystem.importTheme()">
                                📥 Importar Configuración
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="themeSystem.resetToDefaults()">
                                🔄 Restaurar Valores
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <button class="theme-selector-toggle" id="theme-selector-toggle" 
                    onclick="themeSystem.toggleThemeSelector()" title="Personalizar Tema">
                🎨
            </button>
        `;

        document.body.appendChild(container);
        this.addThemeStyles();
    }

    // Crear control para propiedad personalizable
    createPropertyControl(id, property) {
        const currentValue = this.userPreferences.customProperties?.[id] || property.default;
        
        switch (property.type) {
            case 'range':
                return `
                    <div class="range-control">
                        <input type="range" id="prop-${id}" 
                               min="${property.min}" max="${property.max}" 
                               value="${currentValue}" step="0.1"
                               onchange="themeSystem.updateCustomProperty('${id}', this.value)">
                        <span class="range-value" id="prop-${id}-value">${currentValue}${property.unit}</span>
                    </div>
                `;
            case 'select':
                return `
                    <select id="prop-${id}" onchange="themeSystem.updateCustomProperty('${id}', this.value)">
                        ${property.options.map(option => `
                            <option value="${option.value}" ${option.value === currentValue ? 'selected' : ''}>
                                ${option.label}
                            </option>
                        `).join('')}
                    </select>
                `;
            default:
                return `<input type="text" id="prop-${id}" value="${currentValue}" 
                               onchange="themeSystem.updateCustomProperty('${id}', this.value)">`;
        }
    }

    // Agregar estilos CSS para el selector de temas
    addThemeStyles() {
        if (document.getElementById('theme-selector-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'theme-selector-styles';
        styles.textContent = `
            .theme-selector-toggle {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: var(--primary-color);
                color: white;
                font-size: 20px;
                cursor: pointer;
                box-shadow: var(--shadow);
                z-index: 9998;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .theme-selector-toggle:hover {
                transform: scale(1.1);
                box-shadow: var(--shadow-lg);
            }

            .theme-selector-panel {
                position: fixed;
                top: 80px;
                left: 20px;
                width: 320px;
                max-height: 80vh;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                box-shadow: var(--shadow-lg);
                z-index: 9999;
                transform: translateX(-100%);
                opacity: 0;
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .theme-selector-panel.show {
                transform: translateX(0);
                opacity: 1;
            }

            .theme-panel-header {
                background: var(--bg-secondary);
                padding: 15px 20px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .theme-panel-header h4 {
                margin: 0;
                color: var(--text-primary);
                font-size: 16px;
            }

            .theme-panel-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--text-secondary);
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }

            .theme-panel-close:hover {
                background: var(--bg-tertiary);
            }

            .theme-panel-content {
                padding: 20px;
                max-height: calc(80vh - 70px);
                overflow-y: auto;
            }

            .theme-section {
                margin-bottom: 25px;
            }

            .theme-section h5 {
                margin: 0 0 15px 0;
                color: var(--text-primary);
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .theme-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .theme-option {
                background: var(--bg-secondary);
                border: 2px solid var(--border-color);
                border-radius: 8px;
                padding: 12px 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                font-size: 12px;
            }

            .theme-option:hover {
                border-color: var(--primary-color);
                transform: translateY(-2px);
            }

            .theme-option.active {
                border-color: var(--primary-color);
                background: var(--primary-color);
                color: white;
            }

            .theme-icon {
                font-size: 20px;
            }

            .theme-name {
                font-weight: 500;
            }

            .custom-properties {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .property-control {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .property-control label {
                font-size: 13px;
                font-weight: 500;
                color: var(--text-secondary);
            }

            .range-control {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .range-control input[type="range"] {
                flex-grow: 1;
                height: 6px;
                border-radius: 3px;
                background: var(--bg-tertiary);
                outline: none;
                -webkit-appearance: none;
            }

            .range-control input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--primary-color);
                cursor: pointer;
            }

            .range-value {
                font-size: 12px;
                color: var(--text-muted);
                min-width: 50px;
                text-align: right;
            }

            .property-control select,
            .property-control input[type="text"] {
                padding: 8px 12px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-size: 13px;
            }

            .theme-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .theme-actions button {
                font-size: 12px;
                padding: 8px 12px;
                justify-content: flex-start;
            }

            @media (max-width: 768px) {
                .theme-selector-panel {
                    width: calc(100vw - 40px);
                    left: 20px;
                    right: 20px;
                }
                
                .theme-options {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Aplicar tema
    applyTheme(themeId) {
        const theme = this.themes.get(themeId);
        if (!theme) return;

        console.log(`🎨 Aplicando tema: ${theme.name}`);

        const root = document.documentElement;
        
        // Aplicar propiedades del tema
        Object.entries(theme.properties).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Actualizar tema actual
        this.currentTheme = themeId;
        
        // Actualizar selector visual
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === themeId);
        });

        // Aplicar propiedades personalizadas del usuario
        this.applyCustomProperties();

        // Guardar preferencias
        this.saveUserPreferences();

        // Emitir evento de cambio de tema
        this.emitThemeChange(themeId);
    }

    // Aplicar propiedades personalizadas
    applyCustomProperties() {
        const root = document.documentElement;
        const customProps = this.userPreferences.customProperties || {};

        this.customProperties.forEach((property, id) => {
            const value = customProps[id] || property.default;
            const finalValue = property.unit ? `${value}${property.unit}` : value;
            root.style.setProperty(property.property, finalValue);
        });
    }

    // Actualizar propiedad personalizada
    updateCustomProperty(id, value) {
        const property = this.customProperties.get(id);
        if (!property) return;

        // Actualizar valor en preferencias
        if (!this.userPreferences.customProperties) {
            this.userPreferences.customProperties = {};
        }
        this.userPreferences.customProperties[id] = value;

        // Aplicar cambio visual
        const root = document.documentElement;
        const finalValue = property.unit ? `${value}${property.unit}` : value;
        root.style.setProperty(property.property, finalValue);

        // Actualizar display del valor
        if (property.type === 'range') {
            const valueDisplay = document.getElementById(`prop-${id}-value`);
            if (valueDisplay) {
                valueDisplay.textContent = `${value}${property.unit}`;
            }
        }

        // Guardar preferencias
        this.saveUserPreferences();

        console.log(`🎨 Propiedad actualizada: ${property.name} = ${finalValue}`);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Detectar cambios en preferencias del sistema
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addListener((e) => {
                if (this.userPreferences.autoTheme) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T para toggle theme selector
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleThemeSelector();
            }
        });
    }

    // Toggle selector de temas
    toggleThemeSelector() {
        const panel = document.getElementById('theme-selector-panel');
        panel.classList.toggle('show');
    }

    // Ocultar selector de temas
    hideThemeSelector() {
        const panel = document.getElementById('theme-selector-panel');
        panel.classList.remove('show');
    }

    // Aplicar preferencias del usuario
    applyUserPreferences() {
        const savedTheme = this.userPreferences.theme || 'light';
        this.applyTheme(savedTheme);
        
        // Aplicar propiedades personalizadas
        this.applyCustomProperties();
    }

    // Cargar preferencias del usuario
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('themePreferences');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error cargando preferencias de tema:', error);
            return {};
        }
    }

    // Guardar preferencias del usuario
    saveUserPreferences() {
        try {
            this.userPreferences.theme = this.currentTheme;
            this.userPreferences.lastUpdated = new Date().toISOString();
            
            localStorage.setItem('themePreferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('Error guardando preferencias de tema:', error);
        }
    }

    // Exportar configuración de tema
    exportTheme() {
        const config = {
            theme: this.currentTheme,
            customProperties: this.userPreferences.customProperties || {},
            exported: new Date().toISOString(),
            version: '2.0'
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `olt-antel-theme-${this.currentTheme}-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        if (window.showSuccess) {
            window.showSuccess('Configuración Exportada', 'El archivo de configuración se ha descargado correctamente');
        }
    }

    // Importar configuración de tema
    importTheme() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    if (config.theme && this.themes.has(config.theme)) {
                        this.applyTheme(config.theme);
                    }
                    
                    if (config.customProperties) {
                        this.userPreferences.customProperties = config.customProperties;
                        this.applyCustomProperties();
                        this.updateCustomPropertyControls();
                    }
                    
                    this.saveUserPreferences();
                    
                    if (window.showSuccess) {
                        window.showSuccess('Configuración Importada', 'La configuración se ha aplicado correctamente');
                    }
                } catch (error) {
                    console.error('Error importando configuración:', error);
                    if (window.showError) {
                        window.showError('Error de Importación', 'El archivo no tiene un formato válido');
                    }
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Actualizar controles de propiedades personalizadas
    updateCustomPropertyControls() {
        this.customProperties.forEach((property, id) => {
            const control = document.getElementById(`prop-${id}`);
            const value = this.userPreferences.customProperties?.[id] || property.default;
            
            if (control) {
                control.value = value;
                
                if (property.type === 'range') {
                    const valueDisplay = document.getElementById(`prop-${id}-value`);
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value}${property.unit}`;
                    }
                }
            }
        });
    }

    // Restaurar valores por defecto
    resetToDefaults() {
        if (confirm('¿Está seguro de que desea restaurar la configuración por defecto?')) {
            this.userPreferences = {};
            this.applyTheme('light');
            this.updateCustomPropertyControls();
            this.saveUserPreferences();
            
            if (window.showInfo) {
                window.showInfo('Configuración Restaurada', 'Se han restaurado los valores por defecto');
            }
        }
    }

    // Emitir evento de cambio de tema
    emitThemeChange(themeId) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: themeId,
                themeName: this.themes.get(themeId)?.name,
                customProperties: this.userPreferences.customProperties
            }
        });
        
        window.dispatchEvent(event);
    }

    // Obtener tema actual
    getCurrentTheme() {
        return {
            id: this.currentTheme,
            name: this.themes.get(this.currentTheme)?.name,
            properties: this.themes.get(this.currentTheme)?.properties
        };
    }

    // Verificar si el modo oscuro está activo
    isDarkMode() {
        return this.currentTheme === 'dark' || this.currentTheme === 'high-contrast';
    }

    // Obtener color primario actual
    getPrimaryColor() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color').trim();
    }
}

// Instancia global
window.themeSystem = new ThemeSystem();

// Event listener para detectar cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeSystem.init();
    });
} else {
    // Si el DOM ya está cargado, inicializar inmediatamente
    setTimeout(() => window.themeSystem.init(), 100);
}

console.log('🎨 Sistema de temas cargado');

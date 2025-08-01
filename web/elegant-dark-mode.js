// MODO OSCURO ELEGANTE Y COORDINADO
console.log('🎨 Cargando modo oscuro elegante...');

function applyElegantDarkMode() {
    console.log('🌙 Aplicando modo oscuro elegante...');
    
    // Limpiar todos los estilos anteriores
    const oldStyles = document.querySelectorAll('#ultra-dark-mode, #light-mode-restore, #clean-dark-styles');
    oldStyles.forEach(style => style.remove());
    
    // Crear el nuevo sistema de modo oscuro elegante
    const elegantDarkCSS = document.createElement('style');
    elegantDarkCSS.id = 'elegant-dark-mode';
    elegantDarkCSS.innerHTML = `
        /* PALETA DE COLORES OSCUROS ELEGANTE */
        body.elegant-dark {
            /* Fondos - gradiente suave de grises */
            --bg-primary: #1e1e1e;
            --bg-secondary: #2a2a2a;
            --bg-tertiary: #363636;
            --bg-quaternary: #424242;
            
            /* Textos - escala de blancos y grises */
            --text-primary: #ffffff;
            --text-secondary: #e0e0e0;
            --text-muted: #b0b0b0;
            --text-disabled: #808080;
            
            /* Bordes - tonos coordinados */
            --border-primary: #4a4a4a;
            --border-secondary: #5a5a5a;
            --border-light: #3a3a3a;
            
            /* Colores de acción - más suaves en oscuro */
            --primary-dark: #4dabf7;
            --success-dark: #51cf66;
            --warning-dark: #ffd43b;
            --danger-dark: #ff6b6b;
            --info-dark: #74c0fc;
            
            /* Sombras para modo oscuro */
            --shadow-dark: 0 2px 8px rgba(0, 0, 0, 0.4);
            --shadow-dark-lg: 0 4px 16px rgba(0, 0, 0, 0.6);
            
            /* Aplicar variables globalmente */
            background: var(--bg-primary) !important;
            color: var(--text-primary) !important;
        }
        
        /* ===== HEADER Y NAVEGACIÓN ===== */
        body.elegant-dark .header,
        body.elegant-dark .main-header {
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%) !important;
            border-bottom: 1px solid var(--border-primary) !important;
            box-shadow: var(--shadow-dark) !important;
        }
        
        body.elegant-dark .header-title,
        body.elegant-dark .header-subtitle {
            color: var(--text-primary) !important;
        }
        
        /* ===== PESTAÑAS ===== */
        body.elegant-dark .tabs {
            background: var(--bg-secondary) !important;
            border-bottom: 1px solid var(--border-primary) !important;
        }
        
        body.elegant-dark .tab {
            background: var(--bg-secondary) !important;
            color: var(--text-secondary) !important;
            border-color: var(--border-light) !important;
            transition: all 0.3s ease !important;
        }
        
        body.elegant-dark .tab:hover {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            transform: translateY(-1px) !important;
        }
        
        body.elegant-dark .tab.active {
            background: var(--primary-dark) !important;
            color: #ffffff !important;
            border-color: var(--primary-dark) !important;
            box-shadow: 0 2px 8px rgba(77, 171, 247, 0.3) !important;
        }
        
        /* ===== CONTENIDO PRINCIPAL Y PESTAÑAS ===== */
        body.elegant-dark .tab-content,
        body.elegant-dark .config-section,
        body.elegant-dark .content,
        body.elegant-dark .main-content,
        body.elegant-dark .panel,
        body.elegant-dark .section {
            background: var(--bg-secondary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-primary) !important;
            border-radius: 8px !important;
            box-shadow: var(--shadow-dark) !important;
        }
        
        /* ===== TODO EL CONTENIDO INTERNO ===== */
        body.elegant-dark .tab-content *,
        body.elegant-dark .config-section *,
        body.elegant-dark .content *,
        body.elegant-dark .main-content * {
            color: var(--text-primary) !important;
        }
        
        /* ===== CONTENEDORES Y DIVS ===== */
        body.elegant-dark div,
        body.elegant-dark .container,
        body.elegant-dark .row,
        body.elegant-dark .col,
        body.elegant-dark .form-group,
        body.elegant-dark .input-group,
        body.elegant-dark .card-body,
        body.elegant-dark .panel-body {
            background: transparent !important;
            color: var(--text-primary) !important;
        }
        
        /* ===== TABLAS ===== */
        body.elegant-dark table,
        body.elegant-dark .table {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-primary) !important;
        }
        
        body.elegant-dark th,
        body.elegant-dark td,
        body.elegant-dark .table th,
        body.elegant-dark .table td {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-primary) !important;
        }
        
        body.elegant-dark thead th,
        body.elegant-dark .table thead th {
            background: var(--bg-quaternary) !important;
            color: var(--text-primary) !important;
        }
        
        /* ===== LISTAS ===== */
        body.elegant-dark ul,
        body.elegant-dark ol,
        body.elegant-dark li {
            color: var(--text-primary) !important;
        }
        
        /* ===== ELEMENTOS DE COMANDO ESPECÍFICOS ===== */
        body.elegant-dark .command,
        body.elegant-dark .comando-item,
        body.elegant-dark .comando-individual,
        body.elegant-dark .comando-personalizado,
        body.elegant-dark .olt-command,
        body.elegant-dark .ims-command-group,
        body.elegant-dark .ims-custom-commands,
        body.elegant-dark .resultado {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-primary) !important;
        }
        
        /* ===== HOVER STATES PARA COMANDOS ===== */
        body.elegant-dark .command:hover,
        body.elegant-dark .comando-item:hover,
        body.elegant-dark .comando-individual:hover,
        body.elegant-dark .comando-personalizado:hover,
        body.elegant-dark .ims-command-group:hover,
        body.elegant-dark .ims-custom-commands:hover {
            background: var(--bg-quaternary) !important;
            border-color: var(--border-secondary) !important;
            box-shadow: var(--shadow-dark) !important;
        }
        
        /* ===== CONTROLES DE COMANDO ===== */
        body.elegant-dark .comando-controls {
            background: var(--bg-quaternary) !important;
            border: 1px solid var(--border-secondary) !important;
        }
        
        /* ===== GRUPOS DE COMANDOS IMS ===== */
        body.elegant-dark .ims-command-group summary,
        body.elegant-dark .ims-command-group[open] summary {
            background: var(--bg-quaternary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-secondary) !important;
        }
        
        /* ===== CONTENEDORES DE COMANDOS ===== */
        body.elegant-dark .commands-container,
        body.elegant-dark .command-list,
        body.elegant-dark .comando-container,
        body.elegant-dark .commands-section,
        body.elegant-dark #comandos-container {
            background: var(--bg-secondary) !important;
            color: var(--text-primary) !important;
        }
        
        /* ===== ELEMENTOS CON ESTILOS INLINE ===== */
        body.elegant-dark div[style*="background: #f8f9fa"],
        body.elegant-dark div[style*="background:#f8f9fa"],
        body.elegant-dark .comando-individual[style*="background: #f8f9fa"],
        body.elegant-dark .comando-individual[style*="background:#f8f9fa"] {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-primary) !important;
        }
        
        /* ===== OVERRIDE FUERTE PARA ELEMENTOS INLINE ===== */
        body.elegant-dark * {
            color: inherit !important;
        }
        
        body.elegant-dark div[style],
        body.elegant-dark span[style],
        body.elegant-dark p[style] {
            background-color: transparent !important;
            color: var(--text-primary) !important;
        }
        
        /* ===== DRAG & DROP ===== */
        body.elegant-dark .comando-item.dragging {
            background: var(--bg-quaternary) !important;
            opacity: 0.7 !important;
        }
        
        body.elegant-dark .comando-item.drag-over {
            border-top-color: var(--primary-dark) !important;
        }
        
        /* ===== ÁREAS DE TEXTO ESPECÍFICAS ===== */
        body.elegant-dark .resultado textarea,
        body.elegant-dark .command-output,
        body.elegant-dark .output-area,
        body.elegant-dark pre,
        body.elegant-dark code {
            background: var(--bg-quaternary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-secondary) !important;
        }
        
        /* ===== FORMULARIOS ===== */
        body.elegant-dark input,
        body.elegant-dark textarea,
        body.elegant-dark select {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-secondary) !important;
            border-radius: 6px !important;
        }
        
        body.elegant-dark input:focus,
        body.elegant-dark textarea:focus,
        body.elegant-dark select:focus {
            background: var(--bg-quaternary) !important;
            border-color: var(--primary-dark) !important;
            box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.25) !important;
        }
        
        /* ===== BOTONES ===== */
        body.elegant-dark .btn:not(.btn-primary):not(.btn-danger):not(.btn-success):not(.btn-warning) {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-secondary) !important;
        }
        
        body.elegant-dark .btn:not(.btn-primary):not(.btn-danger):not(.btn-success):not(.btn-warning):hover {
            background: var(--bg-quaternary) !important;
            transform: translateY(-1px) !important;
            box-shadow: var(--shadow-dark) !important;
        }
        
        body.elegant-dark .btn-primary {
            background: var(--primary-dark) !important;
            border-color: var(--primary-dark) !important;
        }
        
        body.elegant-dark .btn-success {
            background: var(--success-dark) !important;
            border-color: var(--success-dark) !important;
        }
        
        body.elegant-dark .btn-warning {
            background: var(--warning-dark) !important;
            border-color: var(--warning-dark) !important;
            color: #000000 !important;
        }
        
        body.elegant-dark .btn-danger {
            background: var(--danger-dark) !important;
            border-color: var(--danger-dark) !important;
        }
        
        /* ===== TARJETAS Y PANELES ===== */
        body.elegant-dark .card,
        body.elegant-dark .panel,
        body.elegant-dark .command {
            background: var(--bg-tertiary) !important;
            border: 1px solid var(--border-primary) !important;
            color: var(--text-primary) !important;
            border-radius: 8px !important;
            box-shadow: var(--shadow-dark) !important;
        }
        
        /* ===== LOGIN ===== */
        body.elegant-dark .login-container {
            background: var(--bg-secondary) !important;
            border: 1px solid var(--border-primary) !important;
            box-shadow: var(--shadow-dark-lg) !important;
            color: var(--text-primary) !important;
        }
        
        body.elegant-dark .login-input {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-secondary) !important;
        }
        
        /* ===== INFO DE USUARIO ===== */
        body.elegant-dark .user-info {
            background: var(--bg-secondary) !important;
            border: 1px solid var(--border-primary) !important;
            color: var(--text-primary) !important;
            border-radius: 8px !important;
            box-shadow: var(--shadow-dark) !important;
        }
        
        body.elegant-dark #userDisplay {
            color: var(--text-primary) !important;
            font-weight: 600 !important;
        }
        
        /* ===== TEXTOS ESPECÍFICOS Y ETIQUETAS ===== */
        body.elegant-dark h1,
        body.elegant-dark h2,
        body.elegant-dark h3,
        body.elegant-dark h4,
        body.elegant-dark h5,
        body.elegant-dark h6 {
            color: var(--text-primary) !important;
        }
        
        body.elegant-dark p,
        body.elegant-dark span,
        body.elegant-dark label,
        body.elegant-dark strong,
        body.elegant-dark b,
        body.elegant-dark em,
        body.elegant-dark i,
        body.elegant-dark small {
            color: var(--text-secondary) !important;
        }
        
        body.elegant-dark .text-muted,
        body.elegant-dark .login-subtitle,
        body.elegant-dark .muted {
            color: var(--text-muted) !important;
        }
        
        /* ===== OVERRIDE FORZADO PARA TODO ===== */
        body.elegant-dark * {
            border-color: var(--border-primary) !important;
        }
        
        body.elegant-dark *:not(input):not(textarea):not(select):not(button):not(.btn) {
            background-color: transparent !important;
        }
        
        /* ===== OVERRIDE AGRESIVO PARA ESTILOS INLINE ===== */
        body.elegant-dark div,
        body.elegant-dark span,
        body.elegant-dark p {
            background-color: transparent !important;
            color: var(--text-primary) !important;
        }
        
        /* ===== FUNCIÓN JAVASCRIPT ADICIONAL PARA REMOVER ESTILOS INLINE ===== */
        body.elegant-dark .loading {
            background: var(--bg-secondary) !important;
            color: var(--text-primary) !important;
        }
        
        /* ===== OVERRIDE PARA ELEMENTOS FORZADOS ===== */
        body.elegant-dark .dark-override {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-primary) !important;
        }
        
        /* ===== ALERTAS Y NOTIFICACIONES ===== */
        body.elegant-dark .alert,
        body.elegant-dark .notification,
        body.elegant-dark .message {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-secondary) !important;
        }
        
        /* ===== MODALES Y POPUPS ===== */
        body.elegant-dark .modal,
        body.elegant-dark .popup,
        body.elegant-dark .dropdown-menu {
            background: var(--bg-secondary) !important;
            color: var(--text-primary) !important;
            border-color: var(--border-primary) !important;
        }
        
        /* ===== ELEMENTOS ESPECÍFICOS DE LA APLICACIÓN ===== */
        body.elegant-dark .olt-info,
        body.elegant-dark .abonado-info,
        body.elegant-dark .command-form,
        body.elegant-dark .resultado-container,
        body.elegant-dark .stats-container {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-primary) !important;
        }
        
        /* ===== ESTADÍSTICAS ===== */
        body.elegant-dark .stat-card {
            background: var(--bg-tertiary) !important;
            border: 1px solid var(--border-primary) !important;
            border-radius: 12px !important;
            box-shadow: var(--shadow-dark) !important;
        }
        
        /* ===== EFECTOS DE HOVER GLOBALES ===== */
        body.elegant-dark .tab-content:hover,
        body.elegant-dark .config-section:hover {
            border-color: var(--border-secondary) !important;
            box-shadow: var(--shadow-dark-lg) !important;
        }
        
        /* ===== SCROLLBARS ===== */
        body.elegant-dark ::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
        }
        
        body.elegant-dark ::-webkit-scrollbar-track {
            background: var(--bg-primary) !important;
        }
        
        body.elegant-dark ::-webkit-scrollbar-thumb {
            background: var(--bg-quaternary) !important;
            border-radius: 4px !important;
        }
        
        body.elegant-dark ::-webkit-scrollbar-thumb:hover {
            background: var(--border-secondary) !important;
        }
    `;
    
    document.head.appendChild(elegantDarkCSS);
    document.body.classList.add('elegant-dark');
    
    // Remover estilos inline problemáticos
    removeInlineStyles();
    
    // Aplicar forzado de comandos
    if (typeof forceCommandsDarkMode === 'function') {
        forceCommandsDarkMode();
    }
    
    // Actualizar botón de tema
    const themeBtn = document.querySelector('.theme-toggle-btn');
    if (themeBtn) {
        themeBtn.innerHTML = '☀️';
        themeBtn.title = 'Cambiar a modo claro';
        themeBtn.style.background = 'var(--bg-tertiary)';
        themeBtn.style.color = 'var(--text-primary)';
        themeBtn.style.border = '1px solid var(--border-primary)';
    }
    
    localStorage.setItem('elegantDarkMode', 'true');
    console.log('✅ Modo oscuro elegante aplicado');
}

function removeElegantDarkMode() {
    console.log('☀️ Removiendo modo oscuro elegante...');
    
    // Remover estilos
    const elegantStyles = document.getElementById('elegant-dark-mode');
    if (elegantStyles) {
        elegantStyles.remove();
    }
    
    document.body.classList.remove('elegant-dark');
    
    // Remover forzado de comandos
    if (typeof removeForceCommandsDarkMode === 'function') {
        removeForceCommandsDarkMode();
    }
    
    // Actualizar botón
    const themeBtn = document.querySelector('.theme-toggle-btn');
    if (themeBtn) {
        themeBtn.innerHTML = '🌙';
        themeBtn.title = 'Cambiar a modo oscuro';
        themeBtn.style.background = '';
        themeBtn.style.color = '';
        themeBtn.style.border = '';
    }
    
    localStorage.setItem('elegantDarkMode', 'false');
    console.log('✅ Modo claro restaurado');
}

function toggleElegantDarkMode() {
    if (document.body.classList.contains('elegant-dark')) {
        removeElegantDarkMode();
    } else {
        applyElegantDarkMode();
    }
}

// Cargar preferencia guardada
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('elegantDarkMode') === 'true') {
        setTimeout(applyElegantDarkMode, 500);
    }
});

// Exportar funciones
window.applyElegantDarkMode = applyElegantDarkMode;
window.removeElegantDarkMode = removeElegantDarkMode;
window.toggleElegantDarkMode = toggleElegantDarkMode;

// Función para remover estilos inline problemáticos
function removeInlineStyles() {
    console.log('🧹 Removiendo estilos inline problemáticos...');
    
    // Remover backgrounds blancos inline
    const elementsWithWhiteBg = document.querySelectorAll('[style*="background: #f8f9fa"], [style*="background:#f8f9fa"], [style*="background-color: #f8f9fa"], [style*="background-color:#f8f9fa"]');
    elementsWithWhiteBg.forEach(el => {
        const style = el.getAttribute('style');
        if (style) {
            // Remover solo la parte del background, mantener otros estilos
            const newStyle = style
                .replace(/background\s*:\s*#f8f9fa\s*;?/gi, '')
                .replace(/background-color\s*:\s*#f8f9fa\s*;?/gi, '');
            el.setAttribute('style', newStyle);
        }
    });
    
    // Forzar clase oscura en elementos específicos
    const comandoElements = document.querySelectorAll('.comando-individual, #comandos-container, .command');
    comandoElements.forEach(el => {
        el.classList.add('dark-override');
    });
    
    console.log('✅ Estilos inline removidos');
}

console.log('✅ Modo oscuro elegante cargado');
console.log('🎯 Funciones disponibles:');
console.log('- applyElegantDarkMode() - Aplicar modo elegante');
console.log('- removeElegantDarkMode() - Quitar modo oscuro');
console.log('- toggleElegantDarkMode() - Alternar elegante');

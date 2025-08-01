// SISTEMA AVANZADO DE ADAPTACIÓN DE COLORES PARA MODO OSCURO
console.log('🎨 Cargando sistema de adaptación de colores...');

// Mapeo de colores para modo oscuro - colores más claros y visibles
const COLOR_MAPPINGS = {
    // Colores problemáticos -> Colores visibles en oscuro
    '#666': '#b0b0b0',      // Gris oscuro -> Gris claro
    '#555': '#c0c0c0',      // Gris muy oscuro -> Gris claro
    '#999': '#a0a0a0',      // Gris medio -> Gris claro
    '#6c757d': '#a0a6ad',   // Gris bootstrap -> Gris claro
    '#333': '#d0d0d0',      // Casi negro -> Gris muy claro
    '#000': '#ffffff',      // Negro -> Blanco
    '#212529': '#ffffff',   // Dark bootstrap -> Blanco
    
    // Colores de acción - versiones más brillantes
    '#2e7d32': '#66bb6a',   // Verde oscuro -> Verde claro
    '#ef6c00': '#ff9800',   // Naranja oscuro -> Naranja claro
    '#7b1fa2': '#ba68c8',   // Púrpura oscuro -> Púrpura claro
    '#e91e63': '#f06292',   // Rosa oscuro -> Rosa claro
    '#dc3545': '#ef5350',   // Rojo oscuro -> Rojo claro
    '#28a745': '#66bb6a',   // Verde bootstrap -> Verde claro
    '#007bff': '#42a5f5',   // Azul bootstrap -> Azul claro
    '#17a2b8': '#26c6da',   // Cyan -> Cyan claro
    '#ffc107': '#ffeb3b',   // Amarillo -> Amarillo más brillante
    
    // Bordes y fondos
    '#dee2e6': '#4a4a4a',   // Borde claro -> Borde oscuro
    '#e9ecef': '#5a5a5a',   // Fondo claro -> Fondo oscuro
    '#f8f9fa': '#2a2a2a',   // Fondo muy claro -> Fondo oscuro
};

// Función para convertir color a versión oscura
function convertToLightColor(color) {
    // Normalizar el color (quitar espacios, convertir a lowercase)
    const normalizedColor = color.trim().toLowerCase();
    
    // Buscar mapeo directo
    if (COLOR_MAPPINGS[normalizedColor]) {
        return COLOR_MAPPINGS[normalizedColor];
    }
    
    // Si es un color rgb, convertir a hex y buscar
    if (normalizedColor.startsWith('rgb')) {
        const hex = rgbToHex(normalizedColor);
        if (COLOR_MAPPINGS[hex]) {
            return COLOR_MAPPINGS[hex];
        }
    }
    
    // Para colores no mapeados, intentar hacerlos más claros
    return brightenColor(normalizedColor);
}

// Convertir RGB a HEX
function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);
    if (result && result.length >= 3) {
        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    return rgb;
}

// Hacer un color más brillante/claro
function brightenColor(color) {
    if (color.startsWith('#')) {
        // Para colores hex, aumentar brillo
        const hex = color.slice(1);
        if (hex.length === 3 || hex.length === 6) {
            let r, g, b;
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else {
                r = parseInt(hex.slice(0, 2), 16);
                g = parseInt(hex.slice(2, 4), 16);
                b = parseInt(hex.slice(4, 6), 16);
            }
            
            // Aumentar brillo (hacer más claro)
            r = Math.min(255, r + 60);
            g = Math.min(255, g + 60);
            b = Math.min(255, b + 60);
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
    }
    
    // Para otros colores, devolver un gris claro por defecto
    return '#c0c0c0';
}

// Función para adaptar botones con colores inline
function adaptInlineButtonColors() {
    const buttons = document.querySelectorAll('button[style], input[type="button"][style], input[type="submit"][style], .btn[style]');
    
    buttons.forEach(button => {
        const style = button.getAttribute('style') || '';
        const onclick = button.getAttribute('onclick') || '';
        const textContent = button.textContent?.toLowerCase() || '';
        let newStyle = style;
        
        // Detectar si es un botón crítico por su función
        const isDeleteButton = onclick.includes('eliminar') || onclick.includes('delete') || 
                              textContent.includes('eliminar') || textContent.includes('borrar') ||
                              textContent.includes('delete') || button.classList.contains('btn-danger');
        
        const isSuccessButton = onclick.includes('guardar') || onclick.includes('save') || 
                               onclick.includes('confirmar') || onclick.includes('aceptar') ||
                               textContent.includes('guardar') || textContent.includes('confirmar') ||
                               button.classList.contains('btn-success');
        
        const isPrimaryButton = onclick.includes('crear') || onclick.includes('nuevo') ||
                               textContent.includes('crear') || textContent.includes('nuevo') ||
                               button.classList.contains('btn-primary');
        
        // Convertir background-color
        const bgColorRegex = /background-color:\s*([^;]+)/gi;
        let bgMatch;
        while ((bgMatch = bgColorRegex.exec(style)) !== null) {
            const originalBg = bgMatch[1].trim();
            let newBg;
            
            // Aplicar colores específicos para botones críticos
            if (isDeleteButton && (originalBg.includes('red') || originalBg.includes('#dc3545'))) {
                newBg = '#ef5350'; // Rojo visible para eliminar
            } else if (isSuccessButton && (originalBg.includes('green') || originalBg.includes('#28a745'))) {
                newBg = '#66bb6a'; // Verde para confirmar
            } else if (isPrimaryButton && (originalBg.includes('blue') || originalBg.includes('#007bff'))) {
                newBg = '#42a5f5'; // Azul para acciones primarias
            } else {
                newBg = convertButtonBackground(originalBg);
            }
            
            if (newBg !== originalBg) {
                newStyle = newStyle.replace(bgMatch[0], `background-color: ${newBg}`);
            }
        }
        
        // Convertir background (sin -color)
        const bgRegex = /(?<!-)background:\s*([^;]+)/gi;
        let match;
        while ((match = bgRegex.exec(style)) !== null) {
            const originalBg = match[1].trim();
            // Solo si es un color simple, no un gradiente
            if (!originalBg.includes('gradient') && !originalBg.includes('url(')) {
                let newBg;
                
                // Aplicar colores específicos para botones críticos
                if (isDeleteButton && (originalBg.includes('red') || originalBg.includes('#dc3545'))) {
                    newBg = '#ef5350';
                } else if (isSuccessButton && (originalBg.includes('green') || originalBg.includes('#28a745'))) {
                    newBg = '#66bb6a';
                } else if (isPrimaryButton && (originalBg.includes('blue') || originalBg.includes('#007bff'))) {
                    newBg = '#42a5f5';
                } else {
                    newBg = convertButtonBackground(originalBg);
                }
                
                if (newBg !== originalBg) {
                    newStyle = newStyle.replace(match[0], `background: ${newBg}`);
                }
            }
        }
        
        // Convertir color del texto - asegurar contraste
        const colorRegex = /color:\s*([^;]+)/gi;
        let colorMatch;
        while ((colorMatch = colorRegex.exec(style)) !== null) {
            const originalColor = colorMatch[1].trim();
            let newColor;
            
            // Para botones críticos, asegurar texto blanco si el fondo es oscuro
            if (isDeleteButton || isSuccessButton || isPrimaryButton) {
                newColor = '#ffffff'; // Texto blanco para mejor contraste
            } else {
                newColor = convertToLightColor(originalColor);
            }
            
            if (newColor !== originalColor) {
                newStyle = newStyle.replace(colorMatch[0], `color: ${newColor}`);
            }
        }
        
        // Convertir border-color si existe
        const borderColorRegex = /border-color:\s*([^;]+)/gi;
        let borderMatch;
        while ((borderMatch = borderColorRegex.exec(style)) !== null) {
            const originalBorder = borderMatch[1].trim();
            const newBorder = convertButtonBackground(originalBorder);
            if (newBorder !== originalBorder) {
                newStyle = newStyle.replace(borderMatch[0], `border-color: ${newBorder}`);
            }
        }
        
        if (newStyle !== style) {
            button.setAttribute('style', newStyle);
            const buttonType = isDeleteButton ? 'ELIMINAR' : isSuccessButton ? 'CONFIRMAR' : isPrimaryButton ? 'PRIMARIO' : 'NORMAL';
            console.log(`🔘 Botón ${buttonType} adaptado: ${button.textContent?.slice(0, 20)}...`);
        }
    });
}

// Función específica para convertir colores de fondo de botones
function convertButtonBackground(color) {
    const normalizedColor = color.toLowerCase().trim();
    
    // Mapeo específico para botones críticos - mantener colores importantes
    const criticalButtonColorMap = {
        // Rojos para eliminación/peligro - mantener visibles pero adaptados
        '#dc3545': '#ef5350',  // Bootstrap danger
        '#d32f2f': '#f44336',  // Material red
        '#c62828': '#ef5350',  // Material red dark
        'red': '#ef5350',
        'crimson': '#ef5350',
        '#ff0000': '#ff5252',
        
        // Verdes para éxito/confirmar
        '#28a745': '#66bb6a',  // Bootstrap success
        '#2e7d32': '#4caf50',  // Material green
        '#388e3c': '#66bb6a',  // Material green dark
        'green': '#66bb6a',
        '#008000': '#4caf50',
        
        // Azules para acciones primarias
        '#007bff': '#42a5f5',  // Bootstrap primary
        '#1976d2': '#2196f3',  // Material blue
        '#0d47a1': '#42a5f5',  // Material blue dark
        'blue': '#42a5f5',
        '#0000ff': '#2196f3',
        
        // Naranjas para advertencias
        '#ffc107': '#ffb74d',  // Bootstrap warning
        '#ff9800': '#ffb74d',  // Material orange
        '#f57c00': '#ffb74d',  // Material orange dark
        'orange': '#ffb74d',
        '#ffa500': '#ffb74d',
        
        // Info/Cyan
        '#17a2b8': '#26c6da',  // Bootstrap info
        '#00bcd4': '#26c6da',  // Material cyan
        '#0097a7': '#26c6da',  // Material cyan dark
        
        // Grises secundarios
        '#6c757d': '#90a4ae',  // Bootstrap secondary
        '#424242': '#616161',  // Material grey
        '#343a40': '#607d8b',  // Bootstrap dark
        
        // Púrpuras
        'purple': '#ba68c8',
        '#9c27b0': '#ba68c8',  // Material purple
        '#7b1fa2': '#ba68c8',  // Material purple dark
    };
    
    // Verificar mapeo crítico primero
    if (criticalButtonColorMap[normalizedColor]) {
        return criticalButtonColorMap[normalizedColor];
    }
    
    // Si no hay mapeo específico, usar la función general
    return convertToLightColor(color);
}

// Función principal para adaptar colores
function adaptColorsForDarkMode() {
    console.log('🌙 Adaptando colores para modo oscuro...');
    
    // Buscar todos los elementos con colores inline
    const elementsWithInlineColors = document.querySelectorAll('*[style*="color:"]');
    
    elementsWithInlineColors.forEach(element => {
        const style = element.getAttribute('style');
        if (style) {
            // Buscar y reemplazar colores
            const colorRegex = /color:\s*([^;]+)/gi;
            let match;
            let newStyle = style;
            
            while ((match = colorRegex.exec(style)) !== null) {
                const originalColor = match[1].trim();
                const newColor = convertToLightColor(originalColor);
                
                if (newColor !== originalColor) {
                    newStyle = newStyle.replace(match[0], `color: ${newColor}`);
                    console.log(`🎨 Color cambiado: ${originalColor} → ${newColor}`);
                }
            }
            
            if (newStyle !== style) {
                element.setAttribute('style', newStyle);
            }
        }
    });
    
    // Adaptar botones con backgrounds inline
    adaptInlineButtonColors();
    
    // Crear CSS adicional para elementos específicos
    const adaptiveCSS = document.createElement('style');
    adaptiveCSS.id = 'adaptive-colors-dark';
    adaptiveCSS.innerHTML = `
        /* Adaptación automática de colores para modo oscuro */
        body.elegant-dark [style*="color: #666"],
        body.elegant-dark [style*="color:#666"] {
            color: #b0b0b0 !important;
        }
        
        body.elegant-dark [style*="color: #555"],
        body.elegant-dark [style*="color:#555"] {
            color: #c0c0c0 !important;
        }
        
        body.elegant-dark [style*="color: #999"],
        body.elegant-dark [style*="color:#999"] {
            color: #a0a0a0 !important;
        }
        
        body.elegant-dark [style*="color: #6c757d"],
        body.elegant-dark [style*="color:#6c757d"] {
            color: #a0a6ad !important;
        }
        
        /* Colores de acción más brillantes */
        body.elegant-dark [style*="color: #2e7d32"],
        body.elegant-dark [style*="color:#2e7d32"] {
            color: #66bb6a !important;
        }
        
        body.elegant-dark [style*="color: #ef6c00"],
        body.elegant-dark [style*="color:#ef6c00"] {
            color: #ff9800 !important;
        }
        
        body.elegant-dark [style*="color: #7b1fa2"],
        body.elegant-dark [style*="color:#7b1fa2"] {
            color: #ba68c8 !important;
        }
        
        body.elegant-dark [style*="color: #e91e63"],
        body.elegant-dark [style*="color:#e91e63"] {
            color: #f06292 !important;
        }
        
        /* Variables CSS adaptadas */
        body.elegant-dark {
            --primary-color: #42a5f5;
            --success-color: #66bb6a;
            --danger-color: #ef5350;
            --warning-color: #ffeb3b;
            --info-color: #26c6da;
            --secondary-color: #a0a6ad;
        }
        
        /* Botones de cerrar modales */
        body.elegant-dark button[style*="color: #666"] {
            color: #b0b0b0 !important;
        }
        
        /* ===== BOTONES MEJORADOS PARA MODO OSCURO ===== */
        body.elegant-dark .btn,
        body.elegant-dark button {
            border-color: var(--border-secondary) !important;
        }
        
        /* Botones críticos que deben mantener su color */
        body.elegant-dark button[onclick*="eliminar"],
        body.elegant-dark button[onclick*="Eliminar"],
        body.elegant-dark button[onclick*="borrar"],
        body.elegant-dark button[onclick*="delete"],
        body.elegant-dark .btn-danger,
        body.elegant-dark button[style*="background: #dc3545"],
        body.elegant-dark button[style*="background:#dc3545"],
        body.elegant-dark button[style*="background: red"],
        body.elegant-dark button[style*="background:red"] {
            background: #ef5350 !important;
            color: #ffffff !important;
            border-color: #ef5350 !important;
        }
        
        body.elegant-dark button[onclick*="eliminar"]:hover,
        body.elegant-dark button[onclick*="Eliminar"]:hover,
        body.elegant-dark button[onclick*="borrar"]:hover,
        body.elegant-dark button[onclick*="delete"]:hover,
        body.elegant-dark .btn-danger:hover {
            background: #f44336 !important;
            border-color: #f44336 !important;
        }
        
        /* Botones de éxito/confirmar */
        body.elegant-dark button[onclick*="guardar"],
        body.elegant-dark button[onclick*="save"],
        body.elegant-dark button[onclick*="confirmar"],
        body.elegant-dark button[onclick*="aceptar"],
        body.elegant-dark .btn-success,
        body.elegant-dark button[style*="background: #28a745"],
        body.elegant-dark button[style*="background:#28a745"],
        body.elegant-dark button[style*="background: green"],
        body.elegant-dark button[style*="background:green"] {
            background: #66bb6a !important;
            color: #ffffff !important;
            border-color: #66bb6a !important;
        }
        
        body.elegant-dark button[onclick*="guardar"]:hover,
        body.elegant-dark button[onclick*="save"]:hover,
        body.elegant-dark .btn-success:hover {
            background: #4caf50 !important;
            border-color: #4caf50 !important;
        }
        
        /* Botones primarios */
        body.elegant-dark .btn-primary,
        body.elegant-dark button[style*="background: #007bff"],
        body.elegant-dark button[style*="background:#007bff"],
        body.elegant-dark button[style*="background: blue"],
        body.elegant-dark button[style*="background:blue"] {
            background: #42a5f5 !important;
            color: #ffffff !important;
            border-color: #42a5f5 !important;
        }
        
        body.elegant-dark .btn-primary:hover {
            background: #2196f3 !important;
            border-color: #2196f3 !important;
        }
        
        /* Botones de información */
        body.elegant-dark .btn-info,
        body.elegant-dark button[style*="background: #17a2b8"],
        body.elegant-dark button[style*="background:#17a2b8"] {
            background: #26c6da !important;
            color: #ffffff !important;
            border-color: #26c6da !important;
        }
        
        /* Botones de advertencia */
        body.elegant-dark .btn-warning,
        body.elegant-dark button[style*="background: #ffc107"],
        body.elegant-dark button[style*="background:#ffc107"],
        body.elegant-dark button[style*="background: orange"],
        body.elegant-dark button[style*="background:orange"] {
            background: #ffb74d !important;
            color: #000000 !important;
            border-color: #ffb74d !important;
        }
        
        /* Botones neutros */
        body.elegant-dark .btn:not(.btn-primary):not(.btn-success):not(.btn-danger):not(.btn-warning):not(.btn-info):not(.btn-secondary) {
            background: var(--bg-tertiary) !important;
            color: var(--text-primary) !important;
            border: 1px solid var(--border-secondary) !important;
        }
        
        body.elegant-dark .btn:hover {
            filter: brightness(1.1) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
        }
        
        /* Enlaces que parecen botones */
        body.elegant-dark a.btn {
            color: #ffffff !important;
        }
        
        /* Reglas para iconos específicos */
        body.elegant-dark button:contains("🗑️"),
        body.elegant-dark button[title*="Eliminar"],
        body.elegant-dark button[title*="eliminar"] {
            background: #ef5350 !important;
            color: #ffffff !important;
        }
    `;
    
    document.head.appendChild(adaptiveCSS);
    console.log('✅ CSS adaptativo aplicado');
    
    // Asegurar que los botones críticos mantengan sus colores
    setTimeout(() => {
        enforceButtonColors();
    }, 200);
}

// Función para forzar colores en botones críticos después de cargas dinámicas
function enforceButtonColors() {
    console.log('🔧 Forzando colores en botones críticos...');
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll(`
        button[onclick*="eliminar"], 
        button[onclick*="Eliminar"], 
        button[onclick*="borrar"], 
        button[onclick*="delete"],
        button[title*="Eliminar"],
        button[title*="eliminar"]
    `);
    
    deleteButtons.forEach(btn => {
        if (document.body.classList.contains('elegant-dark')) {
            const currentStyle = btn.getAttribute('style') || '';
            if (!currentStyle.includes('background: #ef5350') && !currentStyle.includes('background:#ef5350')) {
                // Preservar otros estilos pero forzar el color
                const newStyle = currentStyle.replace(/background[^;]*;?/gi, '') + 
                               '; background: #ef5350 !important; color: #ffffff !important; border-color: #ef5350 !important';
                btn.setAttribute('style', newStyle);
                console.log(`🗑️ Botón eliminar forzado: ${btn.textContent?.slice(0, 15)}...`);
            }
        }
    });
    
    // Botones de éxito/guardar
    const successButtons = document.querySelectorAll(`
        button[onclick*="guardar"], 
        button[onclick*="save"], 
        button[onclick*="confirmar"], 
        button[onclick*="aceptar"]
    `);
    
    successButtons.forEach(btn => {
        if (document.body.classList.contains('elegant-dark')) {
            const currentStyle = btn.getAttribute('style') || '';
            if (!currentStyle.includes('background: #66bb6a') && !currentStyle.includes('background:#66bb6a')) {
                const newStyle = currentStyle.replace(/background[^;]*;?/gi, '') + 
                               '; background: #66bb6a !important; color: #ffffff !important; border-color: #66bb6a !important';
                btn.setAttribute('style', newStyle);
                console.log(`✅ Botón éxito forzado: ${btn.textContent?.slice(0, 15)}...`);
            }
        }
    });
}

// Función para restaurar colores originales
function restoreOriginalColors() {
    console.log('☀️ Restaurando colores originales...');
    
    // Remover CSS adaptativo
    const adaptiveCSS = document.getElementById('adaptive-colors-dark');
    if (adaptiveCSS) {
        adaptiveCSS.remove();
    }
    
    // Nota: Los colores inline ya fueron cambiados, 
    // sería necesario recargar la página para restaurarlos completamente
    console.log('✅ CSS adaptativo removido');
}

// Integrar con el sistema de modo oscuro existente
document.addEventListener('DOMContentLoaded', function() {
    // Interceptar las funciones de modo oscuro
    const originalApplyElegantDarkMode = window.applyElegantDarkMode;
    const originalRemoveElegantDarkMode = window.removeElegantDarkMode;
    
    if (originalApplyElegantDarkMode) {
        window.applyElegantDarkMode = function() {
            originalApplyElegantDarkMode();
            setTimeout(() => {
                adaptColorsForDarkMode();
                enforceButtonColors();
            }, 100);
        };
    }
    
    if (originalRemoveElegantDarkMode) {
        window.removeElegantDarkMode = function() {
            restoreOriginalColors();
            originalRemoveElegantDarkMode();
        };
    }
    
    // Observador para detectar cambios dinámicos en el DOM
    const observer = new MutationObserver((mutations) => {
        let needsUpdate = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Verificar si se agregaron botones
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'BUTTON' || node.querySelector('button')) {
                            needsUpdate = true;
                        }
                    }
                });
            }
        });
        
        // Si se agregaron botones y estamos en modo oscuro, actualizar colores
        if (needsUpdate && document.body.classList.contains('elegant-dark')) {
            setTimeout(() => {
                adaptInlineButtonColors();
                enforceButtonColors();
            }, 50);
        }
    });
    
    // Observar cambios en el cuerpo del documento
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Exportar funciones
window.adaptColorsForDarkMode = adaptColorsForDarkMode;
window.restoreOriginalColors = restoreOriginalColors;
window.convertToLightColor = convertToLightColor;
window.enforceButtonColors = enforceButtonColors;

console.log('🎨 Sistema de adaptación de colores cargado');
console.log('🛠️ Funciones disponibles:');
console.log('- adaptColorsForDarkMode() - Adaptar colores manualmente');
console.log('- restoreOriginalColors() - Restaurar colores');
console.log('- convertToLightColor(color) - Convertir un color específico');
console.log('- enforceButtonColors() - Forzar colores en botones críticos');
console.log('🔍 Observer activo para detectar cambios dinámicos en botones');

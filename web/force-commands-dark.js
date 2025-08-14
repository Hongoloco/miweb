// FORZAR MODO OSCURO PARA COMANDOS SOLO CUANDO SE ACTIVE
console.log('🚨 Script de comandos oscuros cargado (no automático)...');

function forceCommandsDarkMode() {
    console.log('💥 Aplicando modo oscuro FORZADO a comandos...');
    
    // Crear CSS ultra-agresivo
    const forceCSS = document.createElement('style');
    forceCSS.id = 'force-commands-dark';
    forceCSS.innerHTML = `
        /* FORZAR TODO LOS COMANDOS */
        .comando-individual,
        .command,
        .comando-item,
        .comando-personalizado,
        #comandos-container,
        .ims-command-group,
        .ims-custom-commands {
            background: #2a2a2a !important;
            color: #ffffff !important;
            border: 1px solid #4a4a4a !important;
        }
        
        /* FORZAR ELEMENTOS CON ESTILOS INLINE */
        div[style*="background: #f8f9fa"],
        div[style*="background:#f8f9fa"] {
            background: #2a2a2a !important;
            color: #ffffff !important;
        }
        
        /* FORZAR TODO EL CONTENIDO DE PESTAÑAS */
        .tab-content,
        .tab-content * {
            background: transparent !important;
            color: #ffffff !important;
        }
        
        /* FORZAR CONTENEDORES */
        .tab-content {
            background: #1e1e1e !important;
        }
    `;
    
    document.head.appendChild(forceCSS);
    
    // Remover estilos inline directamente
    const elementsWithInlineStyles = document.querySelectorAll('[style*="background"]');
    elementsWithInlineStyles.forEach(el => {
        if (el.style.background && el.style.background.includes('#f8f9fa')) {
            el.style.background = '#2a2a2a';
            el.style.color = '#ffffff';
        }
        if (el.style.backgroundColor && el.style.backgroundColor.includes('#f8f9fa')) {
            el.style.backgroundColor = '#2a2a2a';
            el.style.color = '#ffffff';
        }
    });
    
    // Agregar clase forzada
    document.body.classList.add('force-dark-commands');
    
    console.log('✅ Modo oscuro FORZADO aplicado a comandos');
}

function removeForceCommandsDarkMode() {
    console.log('☀️ Removiendo modo oscuro FORZADO de comandos...');
    
    // Remover CSS forzado
    const forceCSS = document.getElementById('force-commands-dark');
    if (forceCSS) {
        forceCSS.remove();
    }
    
    // Remover clase forzada
    document.body.classList.remove('force-dark-commands');
    
    // Restaurar estilos originales inline
    const elementsWithDarkStyles = document.querySelectorAll('[style*="background: #2a2a2a"], [style*="background-color: #2a2a2a"]');
    elementsWithDarkStyles.forEach(el => {
        if (el.style.background && el.style.background.includes('#2a2a2a')) {
            el.style.background = '#f8f9fa';
            el.style.color = '#212529';
        }
        if (el.style.backgroundColor && el.style.backgroundColor.includes('#2a2a2a')) {
            el.style.backgroundColor = '#f8f9fa';
            el.style.color = '#212529';
        }
    });
    
    console.log('✅ Modo oscuro FORZADO removido de comandos');
}

// Exportar funciones
window.forceCommandsDarkMode = forceCommandsDarkMode;
window.removeForceCommandsDarkMode = removeForceCommandsDarkMode;

console.log('🔥 Script de comandos cargado. NO se ejecuta automáticamente.');

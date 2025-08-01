// Script de prueba para forzar colores de emojis
(function() {
    console.log('🔧 Iniciando script de prueba de emojis...');
    
    // Crear CSS específico para emojis
    const style = document.createElement('style');
    style.textContent = `
        /* FORZAR COLORES DE EMOJIS - MÁXIMA PRIORIDAD */
        body.dark-theme .preserve-emoji,
        body.dark-theme [data-emoji="true"],
        body.dark-theme span:contains("👁️"),
        body.dark-theme span:contains("✏️"),
        body.dark-theme span:contains("🗑️"),
        body.dark-theme *:contains("👁️"),
        body.dark-theme *:contains("✏️"),
        body.dark-theme *:contains("🗑️") {
            color: transparent !important;
            text-shadow: 0 0 0 currentColor !important;
            font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important;
        }
        
        /* Método alternativo usando background */
        .emoji-override {
            background: linear-gradient(transparent, transparent);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent !important;
        }
    `;
    document.head.appendChild(style);
    
    // Función para procesar emojis específicos
    function forceEmojiDisplay() {
        const emojis = ['👁️', '✏️', '🗑️', '➕', '🔄', '📋', '💾', '❌', '⚠️', '📊', '📡', '🌐', '🔧', '💬', '📝'];
        
        emojis.forEach(emoji => {
            // Buscar todos los elementos que contienen este emoji
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        return node.textContent.includes(emoji) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                },
                false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            textNodes.forEach(textNode => {
                const text = textNode.textContent;
                if (text.includes(emoji)) {
                    // Crear un elemento span con el emoji
                    const span = document.createElement('span');
                    span.style.cssText = `
                        color: initial !important;
                        filter: none !important;
                        -webkit-filter: none !important;
                        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important;
                        background-color: transparent !important;
                    `;
                    span.textContent = emoji;
                    span.className = 'preserve-emoji emoji-override';
                    span.setAttribute('data-emoji', 'true');
                    
                    // Reemplazar el emoji en el texto
                    const newText = text.replace(emoji, `<!--EMOJI_PLACEHOLDER-->`);
                    textNode.textContent = newText;
                    
                    // Insertar el span donde estaba el emoji
                    const placeholder = document.createTextNode('<!--EMOJI_PLACEHOLDER-->');
                    textNode.parentNode.replaceChild(placeholder, textNode);
                    placeholder.parentNode.replaceChild(span, placeholder);
                    
                    // Restaurar el texto restante
                    if (newText !== '<!--EMOJI_PLACEHOLDER-->') {
                        const remainingText = document.createTextNode(newText.replace('<!--EMOJI_PLACEHOLDER-->', ''));
                        span.parentNode.insertBefore(remainingText, span.nextSibling);
                    }
                    
                    console.log(`✅ Emoji ${emoji} procesado y protegido`);
                }
            });
        });
    }
    
    // Ejecutar inmediatamente
    forceEmojiDisplay();
    
    // Ejecutar después de un delay
    setTimeout(forceEmojiDisplay, 500);
    
    console.log('✅ Script de prueba completado');
})();

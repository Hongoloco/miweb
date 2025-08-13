// Script para debuggear el problema de carga de OLTs en el frontend
console.log('🔍 INICIANDO DEBUG DE FRONTEND');

// Simular la llamada exacta que hace el frontend
async function debugFrontend() {
    console.log('1. 🧪 Probando llamada a /api/olts...');
    
    try {
        const response = await fetch('/api/olts', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('2. 📊 Response status:', response.status);
        console.log('3. 📊 Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            console.error('❌ Response no OK:', response.status, response.statusText);
            return;
        }
        
        const data = await response.json();
        console.log('4. 📊 Response data:', data);
        
        if (data && data.success) {
            console.log('✅ API funciona correctamente');
            console.log('📡 OLTs encontradas:', data.olts?.length || 0);
            
            if (data.olts && data.olts.length > 0) {
                console.log('🎯 Detalles de OLTs:');
                data.olts.forEach((olt, index) => {
                    console.log(`   ${index + 1}. ${olt.nombre} (${olt.id}) - Estado: ${olt.estado}`);
                });
            } else {
                console.log('⚠️ No hay OLTs en la respuesta');
            }
        } else {
            console.error('❌ API retorna success: false', data.message);
        }
        
    } catch (error) {
        console.error('💥 Error en la llamada:', error);
    }
}

// Verificar si el usuario está logueado (directamente probando OLTs)
async function verificarLogin() {
    console.log('🔐 Verificando acceso a API...');
    
    try {
        const response = await fetch('/api/olts', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('✅ Acceso a API autorizado');
            return true;
        } else if (response.status === 401 || response.status === 403) {
            console.log('⚠️ No autorizado - necesita login');
            return false;
        } else {
            console.log('⚠️ Respuesta inesperada:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error verificando acceso:', error);
        return false;
    }
}

// Función principal
async function iniciarDebug() {
    console.log('🚀 Iniciando debug completo...');
    
    const logueado = await verificarLogin();
    if (!logueado) {
        console.log('🔑 Intentando login automático con alito...');
        
        try {
            const loginResponse = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'alito',
                    password: '123'
                })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                console.log('✅ Login exitoso:', loginData);
            } else {
                console.error('❌ Error en login');
                return;
            }
        } catch (error) {
            console.error('💥 Error en login:', error);
            return;
        }
    }
    
    // Ahora probar la carga de OLTs
    await debugFrontend();
}

// Ejecutar debug al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarDebug);
} else {
    iniciarDebug();
}

/**
 * Service Worker Principal para PWA
 * Desarrollo Residenciales v2.0
 */

const CACHE_NAME = 'olt-antel-pwa-v2.1';
const DATA_CACHE_NAME = 'olt-antel-data-v2.1';
const BACKGROUND_SYNC_TAG = 'background-sync';

// Recursos para cachear
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/dashboard-charts.js',
    '/notification-system.js',
    '/reports-analytics.js',
    '/favicon.ico'
];

// URLs de datos que se cachean dinámicamente
const DATA_URLS = [
    '/api/tareas',
    '/api/usuarios',
    '/api/olts',
    '/api/roles',
    '/api/tareas/estadisticas'
];

// ===== INSTALACIÓN DEL SERVICE WORKER =====
self.addEventListener('install', (event) => {
    console.log('⚙️ PWA Service Worker instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Pre-cacheando archivos de la app...');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                console.log('✅ Archivos pre-cacheados correctamente');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Error en pre-cache:', error);
            })
    );
});

// ===== ACTIVACIÓN DEL SERVICE WORKER =====
self.addEventListener('activate', (event) => {
    console.log('🔄 PWA Service Worker activando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                            console.log('🧹 Eliminando cache obsoleto:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ PWA Service Worker activado');
                return self.clients.claim();
            })
    );
});

// ===== INTERCEPTAR PETICIONES =====
self.addEventListener('fetch', (event) => {
    // Solo manejar peticiones GET
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    
    // Manejar peticiones de datos de API
    if (DATA_URLS.some(dataUrl => url.pathname.startsWith(dataUrl))) {
        event.respondWith(handleDataRequest(event.request));
        return;
    }
    
    // Manejar peticiones de archivos estáticos
    event.respondWith(handleStaticRequest(event.request));
});

// ===== MANEJO DE PETICIONES DE DATOS =====
async function handleDataRequest(request) {
    try {
        // Estrategia: Network First con fallback a Cache
        const response = await fetch(request);
        
        if (response.status === 200) {
            // Guardar en cache si la respuesta es exitosa
            const cache = await caches.open(DATA_CACHE_NAME);
            cache.put(request.url, response.clone());
            console.log('💾 Datos cacheados:', request.url);
        }
        
        return response;
    } catch (error) {
        console.log('📡 Red no disponible, usando cache:', request.url);
        
        // Si falla la red, intentar obtener de cache
        const cache = await caches.open(DATA_CACHE_NAME);
        const cachedResponse = await cache.match(request.url);
        
        if (cachedResponse) {
            // Agregar header para indicar que viene de cache
            const modifiedResponse = new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: {
                    ...cachedResponse.headers,
                    'X-Cache-Status': 'HIT'
                }
            });
            return modifiedResponse;
        }
        
        // Si no hay cache, devolver respuesta offline
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Datos no disponibles sin conexión',
                offline: true
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Cache-Status': 'MISS'
                }
            }
        );
    }
}

// ===== MANEJO DE PETICIONES ESTÁTICAS =====
async function handleStaticRequest(request) {
    try {
        // Estrategia: Cache First con fallback a Network
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📦 Servido desde cache:', request.url);
            return cachedResponse;
        }
        
        // Si no está en cache, obtener de red y cachear
        const response = await fetch(request);
        
        if (response.status === 200) {
            cache.put(request, response.clone());
            console.log('💾 Archivo cacheado:', request.url);
        }
        
        return response;
    } catch (error) {
        console.log('❌ Error obteniendo recurso:', request.url);
        
        // Para navegación, devolver index.html desde cache
        if (request.mode === 'navigate') {
            const cache = await caches.open(CACHE_NAME);
            return cache.match('/index.html');
        }
        
        // Para otros recursos, devolver error
        return new Response('Recurso no disponible sin conexión', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ===== SINCRONIZACIÓN EN BACKGROUND =====
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync iniciado:', event.tag);
    
    if (event.tag === BACKGROUND_SYNC_TAG) {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        console.log('🔄 Ejecutando sincronización en background...');
        
        // Obtener datos pendientes del IndexedDB (si los hay)
        const pendingData = await getPendingData();
        
        if (pendingData.length > 0) {
            for (const data of pendingData) {
                try {
                    await syncDataToServer(data);
                    await removePendingData(data.id);
                    console.log('✅ Datos sincronizados:', data.id);
                } catch (error) {
                    console.error('❌ Error sincronizando datos:', error);
                }
            }
        }
        
        // Actualizar caches de datos
        await updateDataCaches();
        
        console.log('✅ Sincronización en background completada');
    } catch (error) {
        console.error('❌ Error en sincronización background:', error);
    }
}

// ===== MANEJO DE MENSAJES =====
self.addEventListener('message', (event) => {
    console.log('💬 Mensaje recibido en SW:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.source.postMessage({
                    type: 'CACHE_STATUS_RESPONSE',
                    status: status
                });
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.source.postMessage({
                    type: 'CACHE_CLEARED'
                });
            });
            break;
            
        case 'FORCE_UPDATE':
            forceUpdate().then(() => {
                event.source.postMessage({
                    type: 'UPDATE_COMPLETED'
                });
            });
            break;
            
        case 'STORE_OFFLINE_DATA':
            storeOfflineData(data).then(() => {
                event.source.postMessage({
                    type: 'OFFLINE_DATA_STORED'
                });
            });
            break;
    }
});

// ===== FUNCIONES AUXILIARES =====

async function getCacheStatus() {
    try {
        const appCache = await caches.open(CACHE_NAME);
        const dataCache = await caches.open(DATA_CACHE_NAME);
        
        const appKeys = await appCache.keys();
        const dataKeys = await dataCache.keys();
        
        return {
            app_cache_size: appKeys.length,
            data_cache_size: dataKeys.length,
            total_cached: appKeys.length + dataKeys.length,
            last_updated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error obteniendo estado de cache:', error);
        return { error: error.message };
    }
}

async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('🧹 Todos los caches eliminados');
    } catch (error) {
        console.error('Error limpiando caches:', error);
    }
}

async function forceUpdate() {
    try {
        // Eliminar caches actuales
        await clearAllCaches();
        
        // Re-cachear archivos
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(FILES_TO_CACHE);
        
        console.log('🔄 Actualización forzada completada');
    } catch (error) {
        console.error('Error en actualización forzada:', error);
    }
}

async function updateDataCaches() {
    try {
        const cache = await caches.open(DATA_CACHE_NAME);
        
        for (const url of DATA_URLS) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    console.log('💾 Cache de datos actualizado:', url);
                }
            } catch (error) {
                console.log('⚠️ No se pudo actualizar cache para:', url);
            }
        }
    } catch (error) {
        console.error('Error actualizando caches de datos:', error);
    }
}

// ===== FUNCIONES PARA DATOS OFFLINE =====

async function storeOfflineData(data) {
    // Implementación básica - en producción usar IndexedDB
    try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const response = new Response(JSON.stringify(data));
        await cache.put(`/offline-data/${Date.now()}`, response);
        console.log('💾 Datos offline almacenados');
    } catch (error) {
        console.error('Error almacenando datos offline:', error);
    }
}

async function getPendingData() {
    // Implementación básica - devolver array vacío
    // En producción, obtener de IndexedDB
    return [];
}

async function syncDataToServer(data) {
    // Implementación básica para sincronizar datos
    const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('Error sincronizando con servidor');
    }
    
    return response.json();
}

async function removePendingData(id) {
    // Implementación básica - en producción usar IndexedDB
    console.log('Datos pendientes removidos:', id);
}

// ===== MANEJO DE ACTUALIZACIONES =====
self.addEventListener('beforeinstallprompt', (event) => {
    console.log('💡 Prompt de instalación disponible');
    event.preventDefault();
    
    // Notificar a la app principal
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'INSTALL_PROMPT_AVAILABLE'
            });
        });
    });
});

// ===== LOGS DE INICIO =====
console.log('🚀 PWA Service Worker cargado correctamente');
console.log('📦 Cache principal:', CACHE_NAME);
console.log('💾 Cache de datos:', DATA_CACHE_NAME);
console.log('🔄 Background sync habilitado');

// Notificar a clientes que el SW está listo
self.clients.matchAll().then(clients => {
    clients.forEach(client => {
        client.postMessage({
            type: 'SW_READY',
            cacheName: CACHE_NAME
        });
    });
});

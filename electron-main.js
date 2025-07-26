const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Variables globales
let mainWindow;
let serverProcess;
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Configuración de la aplicación
app.setName('Sistema OLT Antel');

function createWindow() {
    // Crear la ventana del navegador
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        // icon: path.join(__dirname, 'icons', 'app-icon.png'), // Opcional: agregar icono
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
        },
        titleBarStyle: 'default',
        show: false // No mostrar hasta que esté listo
    });

    // Configurar el menú de la aplicación
    createMenu();

    // Cargar la aplicación web local
    loadApplication();

    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Maximizar ventana al inicio (opcional)
        // mainWindow.maximize();
    });

    // Manejar el cierre de la ventana
    mainWindow.on('closed', () => {
        mainWindow = null;
        stopServer();
    });

    // Manejar enlaces externos
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Evitar navegación a sitios externos
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== SERVER_URL) {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });
}

function createMenu() {
    const template = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Recargar Aplicación',
                    accelerator: 'F5',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.reload();
                        }
                    }
                },
                {
                    label: 'Abrir DevTools',
                    accelerator: 'F12',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.openDevTools();
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Salir',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom + 1);
                        }
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        if (mainWindow) {
                            const currentZoom = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(currentZoom - 1);
                        }
                    }
                },
                {
                    label: 'Zoom Reset',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                        }
                    }
                }
            ]
        },
        {
            label: 'Servidor',
            submenu: [
                {
                    label: 'Reiniciar Servidor',
                    click: async () => {
                        await restartServer();
                    }
                },
                {
                    label: 'Estado del Servidor',
                    click: () => {
                        const status = serverProcess ? 'Ejecutándose' : 'Detenido';
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Estado del Servidor',
                            message: `Servidor: ${status}\nPuerto: ${SERVER_PORT}\nURL: ${SERVER_URL}`
                        });
                    }
                }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Acerca de',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Acerca de Sistema OLT Antel',
                            message: 'Sistema OLT Antel v2.0\nPlataforma integral para gestión de servicios residenciales',
                            detail: 'Desarrollado para Antel - Gestión de OLT, IMS y ACS'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function startServer() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Iniciando servidor Node.js...');
        
        // Verificar si el archivo server.js existe
        const serverPath = path.join(__dirname, 'server.js');
        if (!fs.existsSync(serverPath)) {
            reject(new Error('Archivo server.js no encontrado'));
            return;
        }

        // Iniciar el servidor
        serverProcess = spawn('node', ['server.js'], {
            cwd: __dirname,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let serverReady = false;

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('Server:', output);
            
            // Detectar cuando el servidor esté listo
            if (output.includes('Servidor iniciado en puerto') || output.includes('Server started')) {
                if (!serverReady) {
                    serverReady = true;
                    resolve();
                }
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error('Server Error:', data.toString());
        });

        serverProcess.on('error', (error) => {
            console.error('Error starting server:', error);
            reject(error);
        });

        serverProcess.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
            serverProcess = null;
        });

        // Timeout de 10 segundos para el inicio del servidor
        setTimeout(() => {
            if (!serverReady) {
                reject(new Error('Server start timeout'));
            }
        }, 10000);
    });
}

function stopServer() {
    if (serverProcess) {
        console.log('🛑 Deteniendo servidor...');
        serverProcess.kill();
        serverProcess = null;
    }
}

async function restartServer() {
    stopServer();
    
    try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
        await startServer();
        
        if (mainWindow) {
            mainWindow.reload();
        }
        
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Servidor Reiniciado',
            message: 'El servidor se ha reiniciado correctamente'
        });
    } catch (error) {
        dialog.showErrorBox('Error', `No se pudo reiniciar el servidor: ${error.message}`);
    }
}

async function loadApplication() {
    try {
        // Esperar a que el servidor esté listo
        await waitForServer();
        
        // Cargar la aplicación
        await mainWindow.loadURL(SERVER_URL);
        
    } catch (error) {
        console.error('Error loading application:', error);
        
        // Mostrar página de error
        mainWindow.loadFile(path.join(__dirname, 'error.html'));
    }
}

function waitForServer(maxAttempts = 30) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkServer = () => {
            const http = require('http');
            
            const req = http.get(SERVER_URL, (res) => {
                resolve();
            });
            
            req.on('error', () => {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(new Error('Server not responding'));
                } else {
                    setTimeout(checkServer, 1000);
                }
            });
            
            req.setTimeout(1000);
        };
        
        checkServer();
    });
}

// Eventos de la aplicación
app.whenReady().then(async () => {
    try {
        await startServer();
        createWindow();
    } catch (error) {
        console.error('Error starting application:', error);
        dialog.showErrorBox('Error de Inicio', `No se pudo iniciar la aplicación: ${error.message}`);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    stopServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    stopServer();
});

// Manejo de errores no capturadas
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

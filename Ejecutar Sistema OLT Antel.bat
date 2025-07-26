@echo off
echo ========================================
echo   Ejecutando Sistema OLT Antel 
echo   Aplicacion de Escritorio (Electron)
echo ========================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

echo 🚀 Iniciando aplicacion...
echo.

REM Verificar si electron está instalado
if not exist "node_modules\electron" (
    echo ❌ Electron no está instalado
    echo 📦 Ejecute: npm install
    pause
    exit /b 1
)

REM Ejecutar aplicación Electron
call npm run electron

echo.
echo 👋 Aplicacion cerrada
pause

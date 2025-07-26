@echo off
echo ========================================
echo   Sistema OLT Antel - Modo Web
echo   Acceso via Navegador Web
echo ========================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

echo 🌐 Iniciando servidor web...
echo 📡 Puerto: 3000
echo 🔗 URL: http://localhost:3000
echo.
echo ⏹️ Para detener: Ctrl+C
echo.

REM Iniciar servidor
call npm start

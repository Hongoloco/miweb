@echo off
echo =====================================================
echo      Sistema OLT Antel - Instalador Rápido
echo =====================================================
echo.

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Verificar dependencias
call :check_nodejs
call :check_npm

REM Instalar dependencias
echo 📦 Instalando dependencias del proyecto...
call npm install
if %errorlevel% neq 0 goto :error

REM Inicializar base de datos
echo 🗄️ Configurando base de datos...
if not exist "olt_system.db" (
    call npm run init-db
    if %errorlevel% neq 0 goto :error
)

REM Crear shortcuts
echo 🔗 Creando accesos directos...
call :create_shortcuts

echo.
echo ✅ ¡Instalación completada exitosamente!
echo.
echo 🚀 Para ejecutar la aplicación:
echo    • Doble clic en "Ejecutar Sistema OLT Antel.bat"
echo    • O usar: npm run electron
echo.
echo 💡 Para crear versión portable:
echo    • Ejecutar: build-portable.bat
echo.
pause
goto :end

:check_nodejs
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no está instalado
    echo 📥 Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js detectado
goto :eof

:check_npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: npm no está disponible
    pause
    exit /b 1
)
echo ✅ npm detectado
goto :eof

:create_shortcuts
echo @echo off > "Ejecutar Sistema OLT Antel.bat"
echo cd /d "%%~dp0" >> "Ejecutar Sistema OLT Antel.bat"
echo echo Iniciando Sistema OLT Antel... >> "Ejecutar Sistema OLT Antel.bat"
echo npm run electron >> "Ejecutar Sistema OLT Antel.bat"

echo @echo off > "Ejecutar en Modo Web.bat"
echo cd /d "%%~dp0" >> "Ejecutar en Modo Web.bat"
echo echo Iniciando servidor web... >> "Ejecutar en Modo Web.bat"
echo echo Abrir en navegador: http://localhost:3000 >> "Ejecutar en Modo Web.bat"
echo npm start >> "Ejecutar en Modo Web.bat"
goto :eof

:error
echo.
echo ❌ Error durante la instalación
echo 🔧 Intenta ejecutar como administrador
echo 🌐 Verifica tu conexión a internet
echo.
pause
exit /b 1

:end

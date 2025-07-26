@echo off
echo =====================================================
echo    Sistema OLT Antel - Creador de Version Portable
echo =====================================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no está instalado
    echo 📥 Descarga Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

REM Verificar si npm está disponible
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: npm no está disponible
    pause
    exit /b 1
)

echo ✅ npm detectado
echo.

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas correctamente
echo.

REM Inicializar base de datos si no existe
if not exist "olt_system.db" (
    echo 🗄️ Inicializando base de datos...
    call npm run init-db
    if %errorlevel% neq 0 (
        echo ❌ Error al inicializar la base de datos
        pause
        exit /b 1
    )
    echo ✅ Base de datos inicializada
    echo.
)

REM Crear directorio de iconos si no existe
if not exist "icons" (
    mkdir icons
    echo 📁 Directorio icons creado
)

REM Construir aplicación portable
echo 🏗️ Construyendo aplicación portable...
call npm run build-portable
if %errorlevel% neq 0 (
    echo ❌ Error al construir la aplicación portable
    pause
    exit /b 1
)

echo.
echo ✅ ¡Aplicación portable creada exitosamente!
echo 📁 Ubicación: dist\
echo.

REM Mostrar archivos generados
if exist "dist" (
    echo 📄 Archivos generados:
    dir /b dist\*.exe 2>nul
    echo.
)

echo 🎉 Proceso completado
echo.
echo 💡 Instrucciones:
echo    1. Ve a la carpeta 'dist'
echo    2. Ejecuta el archivo .exe portable
echo    3. No necesitas instalar nada más
echo.
pause

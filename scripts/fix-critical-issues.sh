#!/bin/bash

# 🔧 SCRIPT DE CORRECCIÓN DE PROBLEMAS CRÍTICOS
# Archivo: fix-critical-issues.sh

echo "🔧 Iniciando corrección de problemas críticos..."

# 1. Crear archivo de variables de entorno si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
# Variables de entorno para el sistema OLT Antel
NODE_ENV=development
PORT=3000

# Session Secret - CAMBIAR EN PRODUCCIÓN
SESSION_SECRET=$(openssl rand -hex 64)

# Base de datos
DB_PATH=./olt_system.db

# Configuración de logs
LOG_LEVEL=info
LOG_DIR=./logs

# Configuración de seguridad
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF
    echo "✅ Archivo .env creado"
else
    echo "ℹ️ Archivo .env ya existe"
fi

# 2. Crear directorio de logs si no existe
if [ ! -d "logs" ]; then
    mkdir -p logs
    echo "✅ Directorio logs creado"
fi

# 3. Instalar dependencias faltantes si no están
echo "📦 Verificando dependencias..."
npm list helmet > /dev/null 2>&1 || npm install helmet
npm list compression > /dev/null 2>&1 || npm install compression
npm list rate-limiter-flexible > /dev/null 2>&1 || npm install rate-limiter-flexible
npm list winston > /dev/null 2>&1 || npm install winston
echo "✅ Dependencias verificadas"

# 4. Crear backup de archivos antes de modificar
echo "💾 Creando backup de archivos críticos..."
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
cp index.html index.html.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creado"

# 5. Verificar estructura de directorios
echo "📁 Verificando estructura de directorios..."
mkdir -p public/js/modules
mkdir -p public/js/components
mkdir -p public/css
mkdir -p tests
echo "✅ Estructura de directorios verificada"

# 6. Crear archivo de configuración de ESLint
if [ ! -f ".eslintrc.js" ]; then
    echo "📝 Creando configuración ESLint..."
    cat > .eslintrc.js << 'EOF'
module.exports = {
    env: {
        browser: true,
        node: true,
        es2021: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'no-undef': 'error',
        'prefer-const': 'warn',
        'no-var': 'warn'
    },
    globals: {
        'mostrarNotificacion': 'readonly',
        'mostrarAlert': 'readonly',
        'mostrarConfirmacion': 'readonly',
        'SecurityUtils': 'readonly'
    }
};
EOF
    echo "✅ ESLint configurado"
fi

# 7. Crear archivo .gitignore actualizado
if [ ! -f ".gitignore" ]; then
    echo "📝 Creando .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite
*.sqlite3

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Backup files
*.backup.*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Build output
dist/
build/
public/js/bundle.js
public/css/bundle.css
EOF
    echo "✅ .gitignore creado"
fi

# 8. Crear script de testing básico
if [ ! -f "tests/basic.test.js" ]; then
    echo "📝 Creando tests básicos..."
    cat > tests/basic.test.js << 'EOF'
const request = require('supertest');
const app = require('../server');

describe('Servidor básico', () => {
    test('Debe responder en la ruta principal', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    test('API de usuarios debe requerir autenticación', async () => {
        const response = await request(app).get('/api/usuarios');
        expect(response.status).toBe(401);
    });
});
EOF
    echo "✅ Tests básicos creados"
fi

# 9. Crear script de health check
cat > health-check.js << 'EOF'
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Servidor funcionando correctamente');
        process.exit(0);
    } else {
        console.log(`❌ Servidor respondió con código ${res.statusCode}`);
        process.exit(1);
    }
});

req.on('error', (err) => {
    console.log(`❌ Error conectando al servidor: ${err.message}`);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Timeout conectando al servidor');
    req.destroy();
    process.exit(1);
});

req.end();
EOF

echo "✅ Health check creado"

# 10. Actualizar package.json con nuevos scripts
echo "📝 Actualizando package.json..."
npm pkg set scripts.lint="eslint *.js"
npm pkg set scripts.test="jest"
npm pkg set scripts.health="node health-check.js"
npm pkg set scripts.security-audit="npm audit && node security-check.js"

echo ""
echo "🎉 ¡Corrección de problemas críticos completada!"
echo ""
echo "📋 Próximos pasos recomendados:"
echo "   1. Revisar el archivo .env y cambiar las variables según necesidad"
echo "   2. Ejecutar: npm run lint"
echo "   3. Ejecutar: npm run test"
echo "   4. Implementar las mejoras de seguridad sugeridas"
echo "   5. Modularizar el código JavaScript"
echo ""
echo "🔍 Archivos importantes creados:"
echo "   - .env (variables de entorno)"
echo "   - utils-security.js (funciones de seguridad)"
echo "   - .eslintrc.js (configuración de linting)"
echo "   - tests/basic.test.js (tests básicos)"
echo "   - health-check.js (verificación de salud)"
echo ""
echo "⚠️ IMPORTANTE: Revisar REPORTE-AUDITORIA-WEB.md para más detalles"

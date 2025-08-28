#!/bin/bash

echo "🧪 SCRIPT DE PRUEBA DE IMPORTACIÓN"
echo "================================="

# Configurar variables
BASE_URL="http://localhost:3000"
COOKIE_JAR="test_cookies.txt"
IMPORT_FILE="ejemplo_import_correcto.json"

echo ""
echo "📋 Paso 1: Verificar que el servidor esté funcionando..."
if curl -s "$BASE_URL" > /dev/null; then
    echo "✅ Servidor funcionando correctamente"
else
    echo "❌ Error: El servidor no está respondiendo"
    exit 1
fi

echo ""
echo "🔐 Paso 2: Iniciar sesión..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"alito","password":"123"}' \
    "$BASE_URL/api/login")

echo "Respuesta del login: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Login exitoso"
else
    echo "❌ Error en login"
    echo "Intentando con usuario admin..."
    
    LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' \
        "$BASE_URL/api/login")
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Login exitoso con admin"
    else
        echo "❌ Error en ambos logins"
        exit 1
    fi
fi

echo ""
echo "📤 Paso 3: Probar exportación..."
EXPORT_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/export/olts-commands")
echo "Respuesta exportación: $(echo "$EXPORT_RESPONSE" | head -c 200)..."

echo ""
echo "📥 Paso 4: Probar importación..."
if [ -f "$IMPORT_FILE" ]; then
    echo "Archivo a importar: $IMPORT_FILE"
    echo "Contenido (primeras líneas):"
    head -5 "$IMPORT_FILE"
    echo ""
    
    IMPORT_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST \
        -F "file=@$IMPORT_FILE" \
        -F "overwrite=true" \
        "$BASE_URL/api/import/olts-commands")
    
    echo "Respuesta importación: $IMPORT_RESPONSE"
    
    if echo "$IMPORT_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Importación exitosa"
    else
        echo "❌ Error en importación"
        echo "Detalle del error:"
        echo "$IMPORT_RESPONSE" | jq . 2>/dev/null || echo "$IMPORT_RESPONSE"
    fi
else
    echo "❌ Error: Archivo $IMPORT_FILE no encontrado"
    exit 1
fi

echo ""
echo "🧹 Limpieza..."
rm -f "$COOKIE_JAR"

echo ""
echo "✅ Prueba completada"

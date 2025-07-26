# Iconos para la Aplicación

## 📁 Archivos de Iconos Requeridos

Para que la aplicación se vea profesional, coloca los siguientes archivos en esta carpeta:

### 🖼️ Iconos Principales
- `app-icon.png` - Icono principal (256x256 px)
- `app-icon.ico` - Icono de Windows (.ico format)

### 📏 Tamaños Recomendados
- **16x16** - Icono pequeño
- **32x32** - Icono estándar  
- **48x48** - Icono mediano
- **128x128** - Icono grande
- **256x256** - Icono alta resolución

## 🎨 Crear Iconos

### Opción 1: Herramientas Online
- [ICO Convert](https://icoconvert.com/) - Convertir PNG a ICO
- [Favicon Generator](https://favicon.io/) - Crear iconos web
- [App Icon Generator](https://appicon.co/) - Múltiples tamaños

### Opción 2: Herramientas Locales
- **GIMP** (Gratis)
- **Photoshop** 
- **Paint.NET** (Windows)

### Opción 3: Usar Icono por Defecto
Si no tienes iconos personalizados, la aplicación usará el icono por defecto de Electron.

## 🏗️ Construcción sin Iconos
La aplicación se puede construir sin iconos personalizados. Electron usará su icono por defecto.

Para deshabilitar la referencia al icono en `electron-main.js`, comenta esta línea:
```javascript
// icon: path.join(__dirname, 'icons', 'app-icon.png'),
```

## 🎯 Diseño Sugerido
Para un icono de Sistema OLT Antel:
- **Colores:** Azul Antel (#007bbf), blanco
- **Elementos:** Red, conexiones, torre de telecomunicaciones
- **Estilo:** Moderno, limpio, profesional
- **Fondo:** Transparente o azul degradado

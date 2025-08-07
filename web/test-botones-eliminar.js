// PRUEBA: Generación de HTML para botones de eliminar

console.log('🧪 PROBANDO GENERACIÓN DE BOTONES DE ELIMINAR');
console.log('=' + '='.repeat(50));

// Datos de prueba - usuarios reales del sistema
const usuariosPrueba = [
    {"id":1,"username":"alito","nombre_completo":"El rey de los enanos","email":"jgallomartinez@antel.com.uy","rol":"admin","activo":1},
    {"id":2,"username":"admin","nombre_completo":"Administrador del Sistema","email":"admin@localhost","rol":"administrador","activo":1},
    {"id":4,"username":"Yoyi","nombre_completo":"La yoyi","email":"yoyi@antel.com.uy","rol":"tecnico","activo":1},
    {"id":5,"username":"aser","nombre_completo":"aser","email":null,"rol":"tecnico","activo":1},
    {"id":7,"username":"usuario_prueba","nombre_completo":"Usuario de Prueba","email":"prueba@test.com","rol":"tecnico","activo":1}
];

function getRolIcon(rol) {
    switch(rol) {
        case 'admin': return '👑';
        case 'administrador': return '👑';
        case 'tecnico': return '🔧';
        default: return '👤';
    }
}

console.log('\n🔍 ANÁLISIS DE CADA USUARIO:');

usuariosPrueba.forEach(usuario => {
    const tieneBotonEliminar = usuario.username !== 'alito';
    console.log(`\nUsuario: ${usuario.username} (${usuario.rol})`);
    console.log(`ID: ${usuario.id}`);
    console.log(`¿Debería tener botón eliminar? ${tieneBotonEliminar ? 'SÍ ✅' : 'NO ❌ (protegido)'}`);
    
    if (tieneBotonEliminar) {
        console.log(`HTML del botón: onclick="eliminarUsuario(${usuario.id}, '${usuario.username}')"`);
    }
});

console.log('\n🔧 GENERANDO HTML COMPLETO DE PRUEBA:');

const htmlGenerado = usuariosPrueba.map(usuario => {
    const botonHTML = usuario.username !== 'alito' ? `
        <button class="btn btn-danger" onclick="eliminarUsuario(${usuario.id}, '${usuario.username}')" 
                style="font-size: 12px; padding: 6px 12px; background: #dc3545; color: white;">
            🗑️ Eliminar
        </button>
    ` : `
        <span style="font-size: 11px; color: #999; padding: 6px;">👑 Admin principal</span>
    `;
    
    return `
    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${getRolIcon(usuario.rol)} ${usuario.username}</strong>
                <div style="font-size: 12px; color: #666;">
                    ID: ${usuario.id} | Rol: ${usuario.rol} | Email: ${usuario.email || 'Sin email'}
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="editarUsuario(${usuario.id})" style="background: #17a2b8; color: white; border: none; padding: 6px 12px; border-radius: 4px;">
                    ✏️ Editar
                </button>
                ${botonHTML}
            </div>
        </div>
    </div>`;
}).join('');

console.log('\n📝 HTML GENERADO:');
console.log(htmlGenerado.substring(0, 500) + '...');

console.log('\n📋 RESUMEN:');
console.log(`• Total usuarios: ${usuariosPrueba.length}`);
console.log(`• Con botón eliminar: ${usuariosPrueba.filter(u => u.username !== 'alito').length}`);
console.log(`• Protegidos: ${usuariosPrueba.filter(u => u.username === 'alito').length}`);

console.log('\n🎯 USUARIOS QUE DEBERÍAN TENER BOTÓN ELIMINAR:');
usuariosPrueba.filter(u => u.username !== 'alito').forEach(u => {
    console.log(`• ${u.username} (ID: ${u.id}, Rol: ${u.rol})`);
});

console.log('\n💡 SI NO VES LOS BOTONES EN LA WEB:');
console.log('1. Abre F12 → Console en el navegador');
console.log('2. Ve a Configuración → Gestión de Usuarios');
console.log('3. Ejecuta: console.log(document.getElementById("users-grid").innerHTML)');
console.log('4. Verifica si el HTML contiene los botones eliminar');
console.log('5. Si no aparecen, ejecuta: cargarUsuarios()');

console.log('\n🚀 COMANDO PARA PROBAR EN EL NAVEGADOR:');
console.log('Pega esto en la consola del navegador (F12):');
console.log(`
// Verificar si los usuarios se están cargando
fetch('/api/usuarios')
  .then(r => r.json())
  .then(data => {
    console.log('Usuarios recibidos:', data);
    if (data.success) {
      data.usuarios.forEach(u => {
        console.log(\`\${u.username} - Botón eliminar: \${u.username !== 'alito' ? 'SÍ' : 'NO'}\`);
      });
    }
  });
`);

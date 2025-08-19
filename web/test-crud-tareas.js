/*
 Prueba E2E de tareas con aislamiento por usuario.
 Ejecuta: node test-crud-tareas.js
*/

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function httpJson(method, path, body, cookie) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { 'Cookie': cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });
  const text = await res.text();
  const setCookie = res.headers.get('set-cookie') || '';
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, json, setCookie };
}

async function ensureTecnicoDemo(adminCookie) {
  // Crear usuario tecnico_demo si no existe
  const { status, json } = await httpJson('POST', '/api/usuarios', {
    username: 'tecnico_demo',
    password: 'demo1234',
    nombre_completo: 'Técnico Demo',
    email: 'demo@example.com',
    rol: 'tecnico',
    activo: true
  }, adminCookie);
  if (status === 200 && json.success) {
    console.log('✔ tecnico_demo creado');
  } else if (status === 400) {
    console.log('ℹ tecnico_demo ya existe');
  } else if (status === 403) {
    throw new Error('No autorizado para crear usuarios (se requiere admin)');
  }
}

async function login(username, password) {
  const { status, json, setCookie } = await httpJson('POST', '/api/login', { username, password });
  if (status !== 200 || !json.success) throw new Error(`Login fallido para ${username}: ${json.message || status}`);
  const cookie = setCookie?.split(';')[0] || '';
  return { cookie, user: json.user };
}

async function main() {
  console.log('== HEALTH ==');
  const health = await httpJson('GET', '/api/database/status');
  console.log(health.status, health.json?.tables ? 'OK' : health.json);

  // Login admin y asegurar tecnico_demo
  console.log('\n== LOGIN ADMIN ==');
  const admin = await login('admin', 'admin123');
  await ensureTecnicoDemo(admin.cookie);

  // Login tecnico_demo
  console.log('\n== LOGIN TECNICO ==');
  const demo = await login('tecnico_demo', 'demo1234');

  // Crear tarea
  console.log('\n== CREAR TAREA (DEMO) ==');
  const create = await httpJson('POST', '/api/tareas', {
    titulo: 'Tarea demo',
    descripcion: 'hecha por demo',
    prioridad: 'alta',
    categoria: 'General'
  }, demo.cookie);
  console.log(create.status, create.json);
  if (!create.json?.tarea?.id) throw new Error('No se creó la tarea');
  const tareaId = create.json.tarea.id;

  // Listar tareas demo
  console.log('\n== LISTAR TAREAS (DEMO) ==');
  const listDemo = await httpJson('GET', '/api/tareas', undefined, demo.cookie);
  console.log(listDemo.status, Array.isArray(listDemo.json?.tareas) ? listDemo.json.tareas.length : listDemo.json);

  // Borrar tarea
  console.log('\n== BORRAR TAREA (DEMO) ==');
  const del = await httpJson('DELETE', `/api/tareas/${tareaId}`, undefined, demo.cookie);
  console.log(del.status, del.json);

  // Listar final demo
  console.log('\n== LISTAR FINAL (DEMO) ==');
  const listDemo2 = await httpJson('GET', '/api/tareas', undefined, demo.cookie);
  console.log(listDemo2.status, Array.isArray(listDemo2.json?.tareas) ? listDemo2.json.tareas.length : listDemo2.json);

  // Login alito y listar
  console.log('\n== LOGIN ALITO ==');
  const alito = await login('alito', 'vinilo28');
  console.log('\n== LISTAR TAREAS (ALITO) ==');
  const listAlito = await httpJson('GET', '/api/tareas', undefined, alito.cookie);
  console.log(listAlito.status, Array.isArray(listAlito.json?.tareas) ? listAlito.json.tareas.length : listAlito.json);
}

main().catch(err => {
  console.error('❌ Error en prueba:', err.message);
  process.exit(1);
});

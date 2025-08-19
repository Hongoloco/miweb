// Restaurar usuario "alito" con contraseña "vinilo28" y su OLT ZTE C600
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const mainDbPath = path.join(__dirname, 'olt_system.db');
const userDbDir = path.join(__dirname, 'databases');
const alitoDbPath = path.join(userDbDir, 'alito_olt_system.db');
const zteJsonPath = path.join(__dirname, '..', 'docs', 'ZTE C600-2025-07-22.json');

function ensureDirs() {
  if (!fs.existsSync(userDbDir)) fs.mkdirSync(userDbDir, { recursive: true });
}

async function upsertAlitoInMain() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(mainDbPath);
    const passwordHash = bcrypt.hashSync('vinilo28', 10);

    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre_completo TEXT,
        email TEXT UNIQUE,
        rol TEXT DEFAULT 'usuario',
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultimo_acceso DATETIME,
        configuraciones TEXT
      )`);

      db.run(
        `INSERT INTO usuarios (username, password_hash, nombre_completo, email, rol, activo)
         VALUES ('alito', ?, 'Alito', 'alito@antel.com.uy', 'tecnico', 1)
         ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash, rol='tecnico', activo=1`,
        [passwordHash],
        function (err) {
          if (err) return reject(err);
          db.get(`SELECT id FROM usuarios WHERE username='alito'`, (err, row) => {
            db.close();
            if (err) return reject(err);
            resolve(row?.id || null);
          });
        }
      );
    });
  });
}

function ensureUserDbSchema(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS categorias_tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        color TEXT,
        icono TEXT,
        activa INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS olts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        ip TEXT NOT NULL,
        puerto INTEGER DEFAULT 23,
        modelo TEXT,
        ubicacion TEXT,
        activo INTEGER DEFAULT 1,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultima_conexion DATETIME,
        configuracion TEXT
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS comandos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        comando TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT DEFAULT 'general',
        parametros TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        activo INTEGER DEFAULT 1,
        orden_display INTEGER DEFAULT 0,
        tipo_comando TEXT DEFAULT 'manual',
        olt_id INTEGER
      )`, (err) => (err ? reject(err) : resolve()));
    });
  });
}

function importZteToUserDb(db) {
  const hasJson = fs.existsSync(zteJsonPath);
  const config = { shelf: 1, slot: 13, port: 4, onuId: 38 };

  return new Promise((resolve, reject) => {
    const oltNombre = 'ZTE C600 - Alito';

    db.serialize(() => {
      // Eliminar OLT existente con ese nombre
      db.run(`DELETE FROM comandos WHERE olt_id IN (SELECT id FROM olts WHERE nombre=?)`, [oltNombre]);
      db.run(`DELETE FROM olts WHERE nombre=?`, [oltNombre]);

      const ip = '192.168.1.100';
      const ubicacion = 'Central Antel';

      db.run(
        `INSERT INTO olts (nombre, ip, puerto, modelo, ubicacion, activo, configuracion)
         VALUES (?, ?, 22, 'ZTE C600', ?, 1, ?)`,
        [oltNombre, ip, ubicacion, JSON.stringify(config)],
        function (err) {
          if (err) return reject(err);
          const oltId = this.lastID;

          if (hasJson) {
            try {
              const data = JSON.parse(fs.readFileSync(zteJsonPath, 'utf8'));
              const comandos = Array.isArray(data.comandos) ? data.comandos : [];
              let idx = 0;
              for (const cmd of comandos) {
                const lineas = (cmd.lines || [])
                  .map((l) => String(l).trim())
                  .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'));
                const comandoTexto = lineas.join('\n');
                db.run(
                  `INSERT INTO comandos (nombre, comando, descripcion, categoria, parametros, olt_id, activo, orden_display)
                   VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
                  [
                    cmd.summary || 'Comando ZTE',
                    comandoTexto,
                    'Comando ZTE C600',
                    'zte_c600',
                    JSON.stringify({ shelf: '{shelf}', slot: '{slot}', port: '{port}', onuId: '{onuId}' }),
                    oltId,
                    ++idx,
                  ]
                );
              }
              return resolve({ oltId, comandos: idx, fuente: 'json' });
            } catch (e) {
              // fallback a básicos
            }
          }

          // Básicos si no hay JSON
          const basicos = [
            ['Ver base de ONUs', `show gpon onu baseinfo gpon_olt-{shelf}/{slot}/{port}`],
            ['Estado de ONU específica', `show gpon onu state gpon_olt-{shelf}/{slot}/{port}:{onuId}`],
            ['Información de ONU', `show gpon onu info gpon_olt-{shelf}/{slot}/{port}:{onuId}`],
            ['Factory Reset ONU', `pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\nrestore factory\nexit`],
            ['Configurar modo Bridge', `pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\nvlan port eth_0/1 mode transparent\nvlan port eth_0/2 mode transparent\nvlan port eth_0/3 mode transparent\nvlan port eth_0/4 mode transparent\nexit`],
            ['Configurar modo Router', `pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\ndhcp-ip ethuni eth_0/1 from-onu\ndhcp-ip ethuni eth_0/2 from-onu\ndhcp-ip ethuni eth_0/3 from-onu\ndhcp-ip ethuni eth_0/4 from-onu\nexit`],
            ['Ver configuración VoIP', `show gpon remote-onu voip-config gpon_onu-{shelf}/{slot}/{port}:{onuId}`],
            ['Estado línea VoIP', `show gpon remote-onu voip-linestatus gpon_onu-{shelf}/{slot}/{port}:{onuId}`],
            ['Reiniciar ONU', `pon-onu-mng gpon_onu-{shelf}/{slot}/{port}:{onuId}\nreboot\nexit`],
            ['Ver estadísticas puerto', `show interface gpon_olt-{shelf}/{slot}/{port} statistics`],
          ];

          let i = 0;
          for (const [nombre, comando] of basicos) {
            db.run(
              `INSERT INTO comandos (nombre, comando, descripcion, categoria, parametros, olt_id, activo, orden_display)
               VALUES (?, ?, ?, 'zte_c600', ?, ?, 1, ?)`,
              [
                nombre,
                comando,
                'Comando ZTE C600',
                JSON.stringify({ shelf: '{shelf}', slot: '{slot}', port: '{port}', onuId: '{onuId}' }),
                oltId,
                ++i,
              ]
            );
          }
          resolve({ oltId, comandos: i, fuente: 'basicos' });
        }
      );
    });
  });
}

async function insertDefaultCategories(db) {
  return new Promise((resolve) => {
    const categorias = [
      ['OLT', '#ff6b6b', '🖥️'],
      ['IMS', '#4ecdc4', '📞'],
      ['ACS', '#45b7d1', '⚙️'],
      ['Mantenimiento', '#f9ca24', '🔧'],
      ['Soporte', '#6c5ce7', '🎧'],
      ['General', '#007bff', '📋'],
    ];
    const stmt = db.prepare('INSERT OR IGNORE INTO categorias_tareas (nombre, color, icono, activa) VALUES (?, ?, ?, 1)');
    categorias.forEach(([n, c, i]) => stmt.run(n, c, i));
    stmt.finalize(() => resolve());
  });
}

async function main() {
  try {
    console.log('🔧 Restaurando usuario alito y OLT ZTE C600...');
    ensureDirs();

    const alitoId = await upsertAlitoInMain();
    console.log(`👤 Usuario alito listo (ID en principal: ${alitoId ?? 'desconocido'})`);

    const userDb = new sqlite3.Database(alitoDbPath);
    await ensureUserDbSchema(userDb);
    await insertDefaultCategories(userDb);

    const res = await importZteToUserDb(userDb);

    userDb.close();

    console.log('\n📊 Resultado:');
    console.log(`   OLT creada para alito (ID local: ${res.oltId})`);
    console.log(`   Comandos insertados: ${res.comandos} (fuente: ${res.fuente})`);
    console.log('\n🎯 Credenciales: alito / vinilo28');
    console.log('🌐 URL: http://localhost:3000');
    console.log('ℹ️  Si no ves la OLT, inicia sesión como alito y recarga (Ctrl+F5).');
  } catch (e) {
    console.error('❌ Error en restauración:', e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

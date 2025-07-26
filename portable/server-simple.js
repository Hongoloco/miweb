const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(__dirname));

// Base de datos en memoria (para evitar SQLite nativo)
let database = {
  olts: [],
  comandos: [],
  usuarios: [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ],
  activity_logs: []
};

// Archivo de base de datos JSON
const DB_FILE = path.join(__dirname, 'database.json');

// Cargar base de datos desde archivo si existe
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      database = JSON.parse(data);
      console.log('✅ Base de datos cargada desde archivo');
    }
  } catch (error) {
    console.log('⚠️ Error cargando base de datos, usando valores por defecto');
  }
}

// Guardar base de datos a archivo
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
  } catch (error) {
    console.log('❌ Error guardando base de datos:', error.message);
  }
}

// Cargar base de datos al iniciar
loadDatabase();

// Rutas API

// OLTs
app.get('/api/olts', (req, res) => {
  res.json(database.olts);
});

app.post('/api/olts', (req, res) => {
  const { nombre, shelf, slot, port, onuId } = req.body;
  const newOlt = {
    id: Date.now(),
    nombre,
    shelf: parseInt(shelf),
    slot: parseInt(slot),
    port: parseInt(port),
    onuId: parseInt(onuId),
    created_at: new Date().toISOString()
  };
  database.olts.push(newOlt);
  saveDatabase();
  res.json(newOlt);
});

app.put('/api/olts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const olt = database.olts.find(o => o.id === id);
  if (olt) {
    Object.assign(olt, req.body);
    saveDatabase();
    res.json(olt);
  } else {
    res.status(404).json({ error: 'OLT no encontrada' });
  }
});

app.delete('/api/olts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = database.olts.findIndex(o => o.id === id);
  if (index !== -1) {
    database.olts.splice(index, 1);
    saveDatabase();
    res.json({ message: 'OLT eliminada' });
  } else {
    res.status(404).json({ error: 'OLT no encontrada' });
  }
});

// Comandos
app.get('/api/comandos', (req, res) => {
  const { olt_id } = req.query;
  let comandos = database.comandos;
  if (olt_id) {
    comandos = comandos.filter(c => c.olt_id === parseInt(olt_id));
  }
  res.json(comandos);
});

app.post('/api/comandos', (req, res) => {
  const { olt_id, nombre, descripcion, comando } = req.body;
  const newComando = {
    id: Date.now(),
    olt_id: parseInt(olt_id),
    nombre,
    descripcion,
    comando,
    created_at: new Date().toISOString()
  };
  database.comandos.push(newComando);
  saveDatabase();
  res.json(newComando);
});

app.delete('/api/comandos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = database.comandos.findIndex(c => c.id === id);
  if (index !== -1) {
    database.comandos.splice(index, 1);
    saveDatabase();
    res.json({ message: 'Comando eliminado' });
  } else {
    res.status(404).json({ error: 'Comando no encontrado' });
  }
});

// Usuarios
app.get('/api/usuarios', (req, res) => {
  const users = database.usuarios.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role,
    created_at: u.created_at
  }));
  res.json(users);
});

// Estadísticas
app.get('/api/stats', (req, res) => {
  res.json({
    total_olts: database.olts.length,
    total_comandos: database.comandos.length,
    total_usuarios: database.usuarios.length,
    total_logs: database.activity_logs.length
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Base de datos: ${DB_FILE}`);
  console.log(`📊 Estado: ${database.olts.length} OLTs, ${database.comandos.length} comandos`);
});

module.exports = app;

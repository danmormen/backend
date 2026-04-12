/* const express = require('express');
const app = express();
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')()); 

require('./src/routes/Usuarios')(app);

//rutas jwt
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);


app.get('/', (req, res) => {
  res.send('¡Backend funcionando perfectamente en mi mini Mac!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
*/

// 1. Cargar variables de entorno lo antes posible
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
// Usar el puerto del entorno o el 3000 por defecto
const port = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Permite peticiones de tu frontend en Angular

// ==========================================
// IMPORTACIÓN DE RUTAS
// ==========================================
const usuariosRouter = require('./src/routes/Usuarios');
const authRouter = require('./src/routes/authRoutes');

// ==========================================
// DEFINICIÓN DE RUTAS
// ==========================================
app.use('/api/usuarios', usuariosRouter);
app.use('/api/auth', authRouter);

// Ruta base para comprobar que el backend vive
app.get('/', (req, res) => {
  res.send('Backend de PonteGuapa funcionando correctamente 💅');
});

// Ruta de prueba que tenías al final (movida antes del listen)
app.post('/test', (req, res) => {
    console.log('Body recibido en test:', req.body);
    res.json(req.body);
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});

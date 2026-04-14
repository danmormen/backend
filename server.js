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
// 1. Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS mejorada para permitir el Token (Authorization)
app.use(cors({
    origin: '*', // En producción, cambia '*' por la URL de tu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Ruta base
app.get('/', (req, res) => {
  res.send('Backend de PonteGuapa funcionando correctamente');
});

// Ruta de prueba
app.post('/test', (req, res) => {
    console.log('Body recibido en test:', req.body);
    res.json(req.body);
});

// ==========================================
// MANEJO DE ERRORES (IMPORTANTE)
// ==========================================
// Si una ruta no existe
app.use((req, res, next) => {
    res.status(404).json({ message: "La ruta solicitada no existe" });
});

// Error general del servidor
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err.stack);
    res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
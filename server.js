// ==========================================
// 1. Cargar variables de entorno
// ==========================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// 2. MIDDLEWARES GLOBALES
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==========================================
// 3. IMPORTACIÓN DE RUTAS
// ==========================================
const usuariosRouter = require('./src/routes/Usuarios');
const authRouter = require('./src/routes/authRoutes');
const serviciosRouter = require('./src/routes/servicios');
const horariosRouter = require('./src/routes/horarios');
const promocionesRouter = require('./src/routes/promociones'); // <--- AÑADIDO

// ==========================================
// 4. DEFINICIÓN DE RUTAS (ENDPOINTS)
// ==========================================
app.use('/api/usuarios', usuariosRouter);
app.use('/api/auth', authRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/horarios', horariosRouter);
app.use('/api/promociones', promocionesRouter); // <--- AÑADIDO

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend de PonteGuapa funcionando correctamente');
});

// ==========================================
// 5. MANEJO DE ERRORES (404 y 500)
// ==========================================
app.use((req, res, next) => {
    res.status(404).json({ message: "La ruta solicitada no existe" });
});

app.use((err, req, res, next) => {
    console.error('Error detectado:', err.stack);
    res.status(500).json({ 
        error: 'Algo salió mal en el servidor',
        message: err.message 
    });
});

// ==========================================
// 6. INICIO DEL SERVIDOR
// ==========================================
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log(`📅 Rutas de horarios listas en http://localhost:${port}/api/horarios`);
  console.log(`🎉 Rutas de promociones listas en http://localhost:${port}/api/promociones`);
});
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
// Permite que el servidor entienda JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS para permitir peticiones desde el Frontend
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
const horariosRouter = require('./src/routes/horarios'); // <--- IMPORTADO CORRECTAMENTE

// ==========================================
// 4. DEFINICIÓN DE RUTAS (ENDPOINTS)
// ==========================================
app.use('/api/usuarios', usuariosRouter);
app.use('/api/auth', authRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/horarios', horariosRouter); // <--- REGISTRADO CORRECTAMENTE

// Ruta de prueba para verificar que el servidor responde
app.get('/', (req, res) => {
  res.send('Backend de PonteGuapa funcionando correctamente');
});

// ==========================================
// 5. MANEJO DE ERRORES (404 y 500)
// ==========================================

// Manejo de Rutas No Encontradas (404)
// Si llegamos aquí es porque ninguna de las rutas de arriba coincidió
app.use((req, res, next) => {
    res.status(404).json({ message: "La ruta solicitada no existe" });
});

// Manejo de Errores Internos del Servidor (500)
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
});
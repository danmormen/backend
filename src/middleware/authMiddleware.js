const jwt = require('jsonwebtoken');
const db = require('../config/DBconfig');

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_super_secreta_123';

const protect = (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Verificamos usuario. Nota: eliminamos el filtro "activo = 1" temporalmente 
        // solo para descartar que sea un problema de cuenta desactivada.
        db.query('SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?', [decoded.id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error en el servidor' });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: 'Usuario no encontrado' });
            }
            
            // Forzamos el rol a minúsculas para evitar errores de comparación
            const usuario = results[0];
            usuario.rol = usuario.rol.toLowerCase(); 
            
            req.usuario = usuario;
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

const adminOnly = (req, res, next) => {
    // Validamos en minúsculas siempre
    if (req.usuario && req.usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            message: `Acceso denegado. Tu rol actual es: ${req.usuario ? req.usuario.rol : 'ninguno'}` 
        });
    }
};

const estilistaOnly = (req, res, next) => {
    if (req.usuario && (req.usuario.rol === 'estilista' || req.usuario.rol === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado' });
    }
};

module.exports = { protect, adminOnly, estilistaOnly };
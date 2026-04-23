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

        db.query('SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?', [decoded.id], (err, results) => {
            if (err) {
                console.error("Error en DB durante validación de token:", err);
                return res.status(500).json({ message: 'Error en el servidor' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ message: 'Usuario no encontrado o sesión expirada' });
            }
            
            const usuario = results[0];
            
            // Normalización segura
            usuario.rol = usuario.rol ? usuario.rol.toLowerCase() : ''; 
            
            // Asignamos a req.user
            req.user = usuario; 
            next();
        });
    } catch (error) {
        console.error("Error al verificar token JWT:", error.message);
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

const adminOnly = (req, res, next) => {
    // CAMBIO DE SEGURIDAD: Verificamos primero si req.user existe antes de leer .rol
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        // Evitamos que el servidor se caiga si req.user es undefined
        const userRol = req.user ? req.user.rol : 'desconocido';
        return res.status(403).json({ 
            message: `Acceso denegado. Se requiere rol de administrador. Tu rol actual: ${userRol}` 
        });
    }
};

const estilistaOnly = (req, res, next) => {
    if (req.user && (req.user.rol === 'estilista' || req.user.rol === 'admin')) {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Debes ser estilista o administrador.' });
    }
};

module.exports = { protect, adminOnly, estilistaOnly };
const jwt = require('jsonwebtoken');
const db = require('../config/DBconfig');

// Usamos la variable de entorno, o un fallback temporal para desarrollo
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_super_secreta_123';

const protect = (req, res, next) => {
    let token;
    
    // 1. Extraemos el token del header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, token no proporcionado' });
    }

    try {
        // 2. Verificamos que el token sea válido (esto falla si expiró o fue manipulado)
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Buscamos al usuario en la DB para confirmar que sigue activo
        db.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = ? AND activo = 1', [decoded.id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error en el servidor al verificar usuario' });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: 'Usuario no válido o cuenta desactivada' });
            }
            
            // Adjuntamos el usuario al request para que las siguientes rutas/middlewares lo usen
            req.usuario = results[0];
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado, se requiere rol de administrador' });
    }
};

const estilistaOnly = (req, res, next) => {
    // Permite el paso tanto a estilistas como a administradores
    if (req.usuario && (req.usuario.rol === 'estilista' || req.usuario.rol === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado, se requiere rol de estilista' });
    }
};

// Ya no exportamos el JWT_SECRET, mantenemos este archivo enfocado solo en middlewares
module.exports = { protect, adminOnly, estilistaOnly };
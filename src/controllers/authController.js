const db = require('../config/DBconfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generarToken = (id, rol) => {
    return jwt.sign({ id, rol }, JWT_SECRET, { expiresIn: '7d' });
};

const registrar = async (req, res) => {
    console.log('Body recibido:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    const { nombre, email, password, telefono } = req.body;
    
    db.query('SELECT id FROM usuarios WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO usuarios (nombre, email, password, telefono, rol, activo) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [nombre, email, hashedPassword, telefono, 'cliente', 1], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error al crear usuario' });
            }
            const token = generarToken(result.insertId, 'cliente');
            res.status(201).json({
                id: result.insertId,
                nombre,
                email,
                rol: 'cliente',
                token
            });
        });
    });
};

const login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const usuario = results[0];
        
        if (!usuario.activo) {
            return res.status(401).json({ message: 'Cuenta desactivada, contacte al administrador' });
        }
        
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const token = generarToken(usuario.id, usuario.rol);
        res.json({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            token
        });
    });
};

const perfil = (req, res) => {
    res.json(req.usuario);
};

module.exports = { registrar, login, perfil };
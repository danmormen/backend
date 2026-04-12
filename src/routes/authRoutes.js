const express = require('express');
const { body } = require('express-validator');
const { registrar, login, perfil } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const validarRegistro = [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('telefono').optional().isLength({ min: 8 }).withMessage('Teléfono inválido')
];

router.post('/registro', validarRegistro, registrar);
router.post('/login', login);
router.get('/perfil', protect, perfil);

module.exports = router;
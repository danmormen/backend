const db = require('../config/DBconfig');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { enviarBienvenida } = require('../config/emailServices'); // ← Importa el servicio

const secretKey = process.env.JWT_SECRET || 'fallback_secreto_por_si_acaso_123';

// ── Dominios de correo permitidos ─────────────────────────────────────────
const DOMINIOS_PERMITIDOS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
  'icloud.com', 'live.com', 'msn.com', 'protonmail.com'
];

const validarDominioEmail = (email) => {
  const dominio = email.split('@')[1]?.toLowerCase();
  return DOMINIOS_PERMITIDOS.includes(dominio);
};

const generarToken = (id, rol) => {
  return jwt.sign({ id, rol }, secretKey, { expiresIn: '7d' });
};

const registrar = async (req, res) => {
  console.log('Body recibido:', req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }

  const { nombre, apellido, email, password, fechaNacimiento } = req.body;

  // ── Validación de dominio ──────────────────────────────────────────────
  if (!validarDominioEmail(email)) {
    return res.status(400).json({ 
      message: 'Por favor usa un correo válido (Gmail, Outlook, Yahoo, etc.).' 
    });
  }

  const nombreCompleto = `${nombre} ${apellido}`;
  const [dia, mes, anio] = fechaNacimiento.split('/');
  const fechaSQL = `${anio}-${mes}-${dia}`;

  db.query('SELECT id FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
    if (results.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = 'INSERT INTO usuarios (nombre, email, password, fecha_nacimiento, rol, activo, requiere_cambio) VALUES (?, ?, ?, ?, ?, ?, 0)';

      db.query(sql, [nombreCompleto, email, hashedPassword, fechaSQL, 'cliente', 1], async (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error al crear usuario' });
        }

        const token = generarToken(result.insertId, 'cliente');

        // ── Enviar correo de bienvenida (no bloqueante) ────────────────
        enviarBienvenida(nombre, email).catch(err => 
          console.error('Error al enviar correo de bienvenida:', err)
        );

        res.status(201).json({
          id: result.insertId,
          nombre: nombreCompleto,
          email,
          rol: 'cliente',
          token,
          requiere_cambio: 0
        });
      });
    } catch (error) {
      console.error('Error al hashear la contraseña:', error);
      res.status(500).json({ message: 'Error interno al procesar el registro' });
    }
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
      token,
      requiere_cambio: usuario.requiere_cambio
    });
  });
};

const perfil = (req, res) => {
  res.json(req.usuario);
};

module.exports = { registrar, login, perfil };
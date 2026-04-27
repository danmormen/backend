const express = require('express');
const router  = express.Router();
const db      = require('../config/DBconfig');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { enviarNotificacion } = require('../config/emailServices');

// Todas las rutas requieren ser admin
router.use(protect, adminOnly);

// ══════════════════════════════════════════════════════════════════
// GET /api/notificaciones/total-clientes
// Devuelve el total de clientes activos para el alcance estimado
// ══════════════════════════════════════════════════════════════════
router.get('/total-clientes', (req, res) => {
  db.query(
    "SELECT COUNT(*) as total FROM usuarios WHERE rol = 'cliente' AND activo = 1",
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al contar clientes.' });
      res.json({ total: results[0].total });
    }
  );
});

// ══════════════════════════════════════════════════════════════════
// GET /api/notificaciones/lista-clientes
// Devuelve nombre, email e id de todos los clientes activos
// Se usa para el dropdown de cliente específico
// ══════════════════════════════════════════════════════════════════
router.get('/lista-clientes', (req, res) => {
  const sql = `SELECT id, nombre, email 
               FROM usuarios 
               WHERE rol = 'cliente' AND activo = 1 
               ORDER BY nombre ASC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener clientes.' });
    res.json(results);
  });
});

// ══════════════════════════════════════════════════════════════════
// GET /api/notificaciones/historial
// Devuelve las últimas 20 notificaciones enviadas
// ══════════════════════════════════════════════════════════════════
router.get('/historial', (req, res) => {
  const sql = `SELECT * FROM notificaciones 
               WHERE tipo = 'sistema' 
               ORDER BY created_at DESC 
               LIMIT 20`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener historial.' });
    res.json(results);
  });
});

// ══════════════════════════════════════════════════════════════════
// DELETE /api/notificaciones/historial
// Elimina todas las notificaciones del historial tipo sistema
// ══════════════════════════════════════════════════════════════════
router.delete('/historial', (req, res) => {
  db.query("DELETE FROM notificaciones WHERE tipo = 'sistema'", (err) => {
    if (err) {
      console.error('Error al limpiar historial:', err);
      return res.status(500).json({ error: 'Error al limpiar el historial.' });
    }
    res.json({ message: 'Historial limpiado correctamente.' });
  });
});

// ══════════════════════════════════════════════════════════════════
// POST /api/notificaciones/enviar
// Envía notificación por correo según el tipo de destinatario:
//   todos      → todos los clientes activos
//   citas      → clientes con cita programada hoy
//   especifico → un cliente por su correo
// ══════════════════════════════════════════════════════════════════
router.post('/enviar', async (req, res) => {
  const {
    destinatario,
    correoEspecifico,
    asunto,
    mensaje,
    imagenUrl,
    posicionImagen,
    mensajeCierre
  } = req.body;

  if (!asunto || !mensaje) {
    return res.status(400).json({ error: 'Asunto y mensaje son obligatorios.' });
  }

  let sqlClientes = '';
  let params      = [];
  let etiqueta    = '';

  if (destinatario === 'todos') {
    sqlClientes = "SELECT id, nombre, email FROM usuarios WHERE rol = 'cliente' AND activo = 1";
    etiqueta    = 'Todos los clientes';

  } else if (destinatario === 'citas') {
    sqlClientes = `
      SELECT DISTINCT u.id, u.nombre, u.email
      FROM usuarios u
      INNER JOIN citas c ON c.usuario_id = u.id
      WHERE DATE(c.fecha) = CURDATE() AND u.activo = 1`;
    etiqueta = 'Clientes con citas hoy';

  } else if (destinatario === 'especifico') {
    if (!correoEspecifico) {
      return res.status(400).json({ error: 'El correo específico es obligatorio.' });
    }
    sqlClientes = "SELECT id, nombre, email FROM usuarios WHERE email = ? AND activo = 1";
    params      = [correoEspecifico];
    etiqueta    = `Individual: ${correoEspecifico}`;

  } else {
    return res.status(400).json({ error: 'Tipo de destinatario inválido.' });
  }

  db.query(sqlClientes, params, async (err, clientes) => {
    if (err) {
      console.error('Error al obtener clientes:', err);
      return res.status(500).json({ error: 'Error al obtener destinatarios.' });
    }

    if (clientes.length === 0) {
      return res.status(404).json({ error: 'No se encontraron destinatarios.' });
    }

    let enviados  = 0;
    const errores = [];

    for (const cliente of clientes) {
      try {
        await enviarNotificacion(
          cliente.nombre,
          cliente.email,
          asunto,
          mensaje,
          imagenUrl      || null,
          posicionImagen || 'medio',
          mensajeCierre  || null
        );
        enviados++;
      } catch (err) {
        console.error(`Error al enviar a ${cliente.email}:`, err);
        errores.push(cliente.email);
      }
    }

    // Guarda en historial
    const sqlHistorial = `INSERT INTO notificaciones 
      (usuario_id, titulo, mensaje, tipo, imagen_url, destinatarios, enviados) 
      VALUES (?, ?, ?, 'sistema', ?, ?, ?)`;

    db.query(sqlHistorial, [
      req.user.id,
      asunto,
      mensaje,
      imagenUrl || null,
      etiqueta,
      enviados
    ], (err) => {
      if (err) console.error('Error al guardar en historial:', err);
    });

    res.json({
      message: 'Notificación enviada correctamente.',
      enviados,
      errores: errores.length > 0 ? errores : null
    });
  });
});

module.exports = router;
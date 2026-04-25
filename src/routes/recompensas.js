const express = require('express');
const router = express.Router();
const db = require('../config/DBconfig');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ══════════════════════════════════════════════════════════════════
// GET /api/recompensas
// PÚBLICO: Obtiene todas las recompensas del catálogo
// ══════════════════════════════════════════════════════════════════
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM catalogo_recompensas ORDER BY puntos_requeridos ASC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al obtener recompensas:', err);
      return res.status(500).json({ error: 'Error al obtener las recompensas.' });
    }
    res.json(results);
  });
});

// ══════════════════════════════════════════════════════════════════
// GET /api/recompensas/mis-puntos
// PROTEGIDO: Solo requiere estar autenticado (no admin)
// Obtiene los puntos del usuario autenticado
// ══════════════════════════════════════════════════════════════════
router.get('/mis-puntos', protect, (req, res) => {
  const usuarioId = req.user.id; // ← req.user (no req.usuario)

  db.query('SELECT puntos FROM puntos_usuario WHERE usuario_id = ?', [usuarioId], (err, results) => {
    if (err) {
      console.error('Error al obtener puntos:', err);
      return res.status(500).json({ error: 'Error al obtener los puntos.' });
    }
    const puntos = results.length > 0 ? results[0].puntos : 0;
    res.json({ puntos });
  });
});

// ══════════════════════════════════════════════════════════════════
// A partir de aquí solo administradores autenticados
// ══════════════════════════════════════════════════════════════════
router.use(protect, adminOnly);

// ══════════════════════════════════════════════════════════════════
// POST /api/recompensas
// Crear una nueva recompensa en el catálogo
// ══════════════════════════════════════════════════════════════════
router.post('/', (req, res) => {
  const { nombre, descripcion, puntos_requeridos } = req.body;

  if (!nombre || !puntos_requeridos) {
    return res.status(400).json({ error: 'El nombre y los puntos requeridos son obligatorios.' });
  }
  if (puntos_requeridos <= 0) {
    return res.status(400).json({ error: 'Los puntos requeridos deben ser mayor a 0.' });
  }

  const sql = 'INSERT INTO catalogo_recompensas (nombre, descripcion, puntos_requeridos) VALUES (?, ?, ?)';
  db.query(sql, [nombre, descripcion, puntos_requeridos], (err, result) => {
    if (err) {
      console.error('Error al crear recompensa:', err);
      return res.status(500).json({ error: 'Error al crear la recompensa.' });
    }
    res.status(201).json({ message: 'Recompensa creada', id: result.insertId });
  });
});

// ══════════════════════════════════════════════════════════════════
// PUT /api/recompensas/admin/puntos
// Agregar o quitar puntos a un usuario manualmente
// ══════════════════════════════════════════════════════════════════
router.put('/admin/puntos', (req, res) => {
  const { usuario_id, puntos } = req.body;

  if (!usuario_id || puntos === undefined) {
    return res.status(400).json({ error: 'usuario_id y puntos son obligatorios.' });
  }

  db.query('SELECT id, puntos FROM puntos_usuario WHERE usuario_id = ?', [usuario_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error en el servidor.' });
    }

    if (results.length > 0) {
      // Ya tiene registro — actualiza los puntos
      const nuevosPuntos = Math.max(0, results[0].puntos + puntos);
      db.query('UPDATE puntos_usuario SET puntos = ? WHERE usuario_id = ?', [nuevosPuntos, usuario_id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar puntos.' });
        res.json({ message: 'Puntos actualizados', puntos: nuevosPuntos });
      });
    } else {
      // No tiene registro — crea uno nuevo
      const puntosIniciales = Math.max(0, puntos);
      db.query('INSERT INTO puntos_usuario (usuario_id, puntos) VALUES (?, ?)', [usuario_id, puntosIniciales], (err) => {
        if (err) return res.status(500).json({ error: 'Error al crear puntos.' });
        res.json({ message: 'Puntos creados', puntos: puntosIniciales });
      });
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// PUT /api/recompensas/:id
// Actualizar una recompensa existente
// ══════════════════════════════════════════════════════════════════
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, puntos_requeridos, activo } = req.body;

  const sql = `UPDATE catalogo_recompensas SET
    nombre = ?, descripcion = ?, puntos_requeridos = ?, activo = ?
    WHERE id = ?`;

  db.query(sql, [nombre, descripcion, puntos_requeridos, activo, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar recompensa:', err);
      return res.status(500).json({ error: 'Error al actualizar la recompensa.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Recompensa no encontrada.' });
    }
    res.json({ message: 'Actualizado' });
  });
});

// ══════════════════════════════════════════════════════════════════
// DELETE /api/recompensas/:id
// Eliminar una recompensa del catálogo
// ══════════════════════════════════════════════════════════════════
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM catalogo_recompensas WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar recompensa:', err);
      return res.status(500).json({ error: 'Error al eliminar la recompensa.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Recompensa no encontrada.' });
    }
    res.json({ message: 'Eliminado' });
  });
});

module.exports = router;
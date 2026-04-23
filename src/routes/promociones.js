const express = require('express');
const router = express.Router();
const db = require('../config/DBconfig');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * GET /api/promociones
 * PÚBLICO: Obtiene todas las promociones registradas.
 */
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM promociones ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener promociones:", err);
      return res.status(500).json({ error: 'Error al obtener la lista de promociones.' });
    }
    res.json(results);
  });
});

/**
 * Solo administradores autenticados pueden realizar las siguientes operaciones.
 */
router.use(protect, adminOnly);

/**
 * POST /api/promociones
 * Crear una nueva promoción.
 */
router.post('/', (req, res) => {
  const { titulo, descripcion, codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, limite_usos } = req.body;

  if (!titulo || !codigo || !valor_descuento || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (título, código, descuento y fechas).' });
  }

  const sql = `INSERT INTO promociones 
    (titulo, descripcion, codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, limite_usos) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [titulo, descripcion, codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, limite_usos];

  db.query(sql, values, (err, result) => {
    if (err) {
      // ← Código de cupón duplicado
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El código de cupón ya está en uso. Por favor usa uno diferente.' });
      }
      console.error("Error al insertar promoción:", err);
      return res.status(500).json({ error: 'Error al crear la promoción en la base de datos.' });
    }
    res.status(201).json({ message: 'Creado', id: result.insertId });
  });
});

/**
 * PUT /api/promociones/:id
 * Actualizar una promoción existente.
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, activo, limite_usos } = req.body;

  const sql = `UPDATE promociones SET 
    titulo=?, descripcion=?, codigo=?, tipo_descuento=?, valor_descuento=?, 
    fecha_inicio=?, fecha_fin=?, activo=?, limite_usos=? 
    WHERE id=?`;
  const values = [titulo, descripcion, codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, activo, limite_usos, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      // ← Código duplicado también al editar
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El código de cupón ya está en uso por otra promoción.' });
      }
      console.error("Error al actualizar promoción:", err);
      return res.status(500).json({ error: 'Error al actualizar la promoción.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Promoción no encontrada.' });
    }
    res.json({ message: 'Actualizado' });
  });
});

/**
 * DELETE /api/promociones/:id
 * Eliminar una promoción de la base de datos.
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM promociones WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar promoción:", err);
      return res.status(500).json({ error: 'Error al eliminar la promoción.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'La promoción no existe.' });
    }
    res.json({ message: 'Eliminado' });
  });
});

module.exports = router;
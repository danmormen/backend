const express = require('express');
const router = express.Router();
const db = require('../config/DBconfig'); // Configuración de la base de datos
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Middleware para proteger rutas

// Middleware para proteger todas las rutas de este archivo
router.use(protect);
router.use(adminOnly);

/**
 * GET /api/recompensas - Obtener todas las recompensas
 */
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM recompensas ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener recompensas:", err);
            return res.status(500).json({ error: 'Error al obtener las recompensas.' });
        }
        res.json(results);
    });
});

/**
 * GET /api/recompensas/:id - Obtener una recompensa específica
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM recompensas WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener la recompensa:", err);
            return res.status(500).json({ error: 'Error al obtener la recompensa.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Recompensa no encontrada.' });
        }
        res.json(results[0]);
    });
});

/**
 * POST /api/recompensas - Crear una nueva recompensa
 */
router.post('/', (req, res) => {
    const { titulo, descripcion, puntos, estado = 'Activa' } = req.body;

    // Validar los datos de entrada
    if (!titulo || !descripcion || !puntos) {
        return res.status(400).json({ error: 'Título, descripción y puntos son obligatorios.' });
    }

    const sql = `
        INSERT INTO recompensas (titulo, descripcion, puntos, estado, created_at) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    const values = [titulo.trim(), descripcion.trim(), puntos, estado];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error al crear la recompensa:", err);
            return res.status(500).json({ error: 'Error al crear la recompensa.' });
        }
        res.status(201).json({ message: 'Recompensa creada con éxito.', id: result.insertId });
    });
});

/**
 * PUT /api/recompensas/:id - Actualizar una recompensa
 */
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, puntos, estado } = req.body;

    // Validar los datos de entrada
    if (!titulo || !descripcion || !puntos) {
        return res.status(400).json({ error: 'Título, descripción y puntos son obligatorios.' });
    }

    const sql = `
        UPDATE recompensas 
        SET titulo = ?, descripcion = ?, puntos = ?, estado = ? 
        WHERE id = ?
    `;
    const values = [titulo.trim(), descripcion.trim(), puntos, estado, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error al actualizar la recompensa:", err);
            return res.status(500).json({ error: 'Error al actualizar la recompensa.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recompensa no encontrada.' });
        }
        res.json({ message: 'Recompensa actualizada con éxito.' });
    });
});

/**
 * DELETE /api/recompensas/:id - Eliminar una recompensa
 */
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM recompensas WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar la recompensa:", err);
            return res.status(500).json({ error: 'Error al eliminar la recompensa.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recompensa no encontrada.' });
        }
        res.json({ message: 'Recompensa eliminada con éxito.' });
    });
});

module.exports = router;
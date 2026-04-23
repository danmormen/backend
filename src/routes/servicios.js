const express = require('express');
const router = express.Router();
const db = require('../config/DBconfig');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * GET /api/servicios
 * PÚBLICO: Traemos todos para el Admin (activos e inactivos)
 */
router.get('/', (req, res) => {
    // Quitamos el "WHERE activo = 1" para que tú como admin veas TODOS en tu gestión
    const sql = 'SELECT * FROM servicios ORDER BY categoria, nombre ASC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener servicios:", err);
            return res.status(500).json({ error: 'Error al obtener la lista.' });
        }
        res.json(results);
    });
});

// A partir de aquí, seguridad
router.use(protect, adminOnly);

router.post('/', (req, res) => {
    const { nombre, descripcion, duracion, precio, categoria, imagen } = req.body;
    if (!nombre || !duracion || !precio) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    const sql = `INSERT INTO servicios (nombre, descripcion, duracion, precio, categoria, imagen) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [nombre, descripcion, duracion, precio, categoria, imagen], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear.' });
        res.status(201).json({ message: 'Creado', id: result.insertId });
    });
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, duracion, precio, categoria, imagen, activo } = req.body;
    const sql = `UPDATE servicios SET nombre=?, descripcion=?, duracion=?, precio=?, categoria=?, imagen=?, activo=? WHERE id=?`;
    db.query(sql, [nombre, descripcion, duracion, precio, categoria, imagen, activo, id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar.' });
        res.json({ message: 'Actualizado' });
    });
});

router.delete('/:id', (req, res) => {
    db.query('DELETE FROM servicios WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar.' });
        res.json({ message: 'Eliminado' });
    });
});

module.exports = router;
/* const sql = require("../config/DBconfig");
module.exports = (app) => {
    app.get('/usuarios', (req, res) => {
        sql.query(
            "SELECT * FROM usuarios",
            (err, results) => {
                if (err) {
                    console.error("Error obteniendo personas:", err);
                    res.status(500).json({ error: "Error al obtener personas" });
                } else {
                    res.json(results);
                }
            }
        );
    });

    app.post('/personas', (req, res) => {
        sql.query(`INSERT INTO usuario(nombre, fecha_nacimiento) VALUES ('${req.body.nombre}', '${req.body.fecha}')`, (err, result) => {
            if (err) {
                console.error("Error Guardando la persona", err);
            } else {
                res.json({mensaje: "Insercion exitosa"}); // Send query result as response
                //console.dir(result.recordset);
            }
        }); 
    });



}
    */

const express = require('express');
const router = express.Router();
const db = require('../config/DBconfig');   // ← ruta correcta
const bcrypt = require('bcryptjs');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación y rol admin
router.use(protect);
router.use(adminOnly);

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', (req, res) => {
    db.query('SELECT id, nombre, email, telefono, rol, activo, created_at FROM usuarios', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(results);
    });
});

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT id, nombre, email, telefono, rol, activo, created_at FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener usuario' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(results[0]);
    });
});

// POST /api/usuarios - Crear un nuevo usuario (admin puede asignar rol)
router.post('/', async (req, res) => {
    let { nombre, email, password, telefono, rol = 'cliente', activo = 1 } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, email, password' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO usuarios (nombre, email, password, telefono, rol, activo) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [nombre, email, hashedPassword, telefono, rol, activo], (err, result) => {
            if (err) {
                console.error(err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'El email ya está registrado' });
                }
                return res.status(500).json({ error: 'Error al crear usuario' });
            }
            res.status(201).json({ message: 'Usuario creado correctamente', id: result.insertId });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/usuarios/:id - Actualizar usuario completo
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, email, telefono, rol, activo } = req.body;
    const sql = 'UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, rol = ?, activo = ? WHERE id = ?';
    db.query(sql, [nombre, email, telefono, rol, activo, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al actualizar' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario actualizado' });
    });
});

// PATCH /api/usuarios/:id - Actualizar parcialmente
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const allowed = ['nombre', 'email', 'telefono', 'rol', 'activo'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
        if (updates[key] !== undefined) {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    }
    if (fields.length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    values.push(id);
    const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al actualizar' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario actualizado parcialmente' });
    });
});

// PATCH /api/usuarios/:id/cambiar-password - Cambiar contraseña
router.patch('/:id/cambiar-password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al cambiar contraseña' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Contraseña actualizada' });
    });
});

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al eliminar' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado' });
    });
});

module.exports = router;
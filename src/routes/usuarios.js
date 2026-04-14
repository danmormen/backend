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
const db = require('../config/DBconfig');
const bcrypt = require('bcryptjs');
const { protect, adminOnly } = require('../middleware/authMiddleware');


// Formato de fecha AAAA-MM-DD 
const formatearFecha = (fecha) => {
    if (!fecha) return null;
    // Si viene de Angular como "YYYY-MM-DDT00:00:00", extraemos solo la parte de la fecha
    if (typeof fecha === 'string' && fecha.includes('T')) {
        return fecha.split('T')[0];
    }
    return fecha; 
};


// rutas usuario

// token válido
router.use(protect);

/**
 * PATCH /api/usuarios/:id/cambiar-password
 * Esta ruta está antes de adminOnly para que Estilistas y Admins puedan usarla.
 */
router.patch('/:id/cambiar-password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    
    // Seguridad: Un estilista solo puede cambiarse su propia clave. El admin puede cambiar cualquiera.
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: 'No tienes permiso para actualizar esta contraseña.' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Actualizamos la clave y reseteamos el flag de cambio obligatorio
        const sql = 'UPDATE usuarios SET password = ?, requiere_cambio = 0 WHERE id = ?';
        
        db.query(sql, [hashedPassword, id], (err, result) => {
            if (err) {
                console.error("Error SQL en cambio-password:", err);
                return res.status(500).json({ error: 'Error al actualizar la contraseña en la base de datos.' });
            }
            res.json({ message: 'Contraseña actualizada correctamente.' });
        });
    } catch (e) {
        console.error("Error en servidor:", e);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// -------------------------------------------
// RUTAS EXCLUSIVAS PARA ADMINISTRADORES

router.use(adminOnly);


 // GET /api/usuarios - Obtener lista de personal (Admins y Estilistas)
 
router.get('/', (req, res) => {
    const sql = `
        SELECT id, nombre, email, telefono, rol, especialidad, direccion, fecha_nacimiento, avatar, activo, requiere_cambio, created_at 
        FROM usuarios 
        WHERE LOWER(rol) IN ('admin', 'estilista')
        ORDER BY nombre ASC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error SQL al obtener usuarios:", err);
            return res.status(500).json({ error: 'Error al obtener la lista de personal.' });
        }
        res.json(results);
    });
});

/**
 * GET /api/usuarios/:id - Obtener un usuario específico
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT id, nombre, email, telefono, rol, especialidad, direccion, fecha_nacimiento, avatar, activo, requiere_cambio FROM usuarios WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener usuario.' });
        if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        res.json(results[0]);
    });
});

/**
 * POST /api/usuarios - Crear nuevo usuario (Admin/Estilista)
 */
router.post('/', async (req, res) => {
    let { 
        nombre, email, password, telefono, 
        rol = 'estilista', especialidad, direccion, 
        fecha_nacimiento, avatar, activo = 1 
    } = req.body;
    
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const fechaSQL = formatearFecha(fecha_nacimiento);
        
        // Insertamos con requiere_cambio = 1 para que al primer login deban cambiarla
        const sql = `
            INSERT INTO usuarios 
            (nombre, email, password, telefono, rol, especialidad, direccion, fecha_nacimiento, avatar, activo, requiere_cambio) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;
        
        const values = [
            nombre.trim(), 
            email.trim(), 
            hashedPassword, 
            telefono || null, 
            rol, 
            especialidad || null, 
            direccion || null, 
            fechaSQL, 
            avatar || null, 
            activo
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Error SQL al crear usuario:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
                }
                return res.status(500).json({ error: 'Error al guardar el usuario.' });
            }
            res.status(201).json({ message: 'Usuario creado con éxito.', id: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

/**
 * PUT /api/usuarios/:id - Actualizar usuario completo
 */
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, email, telefono, rol, especialidad, direccion, fecha_nacimiento, avatar, activo } = req.body;
    
    const fechaSQL = formatearFecha(fecha_nacimiento);
    
    const sql = `
        UPDATE usuarios 
        SET nombre = ?, email = ?, telefono = ?, rol = ?, especialidad = ?, direccion = ?, fecha_nacimiento = ?, avatar = ?, activo = ? 
        WHERE id = ?
    `;
    
    const values = [
        nombre.trim(), 
        email.trim(), 
        telefono || null, 
        rol, 
        especialidad || null, 
        direccion || null, 
        fechaSQL, 
        avatar || null, 
        activo, 
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error SQL al actualizar:", err);
            return res.status(500).json({ error: 'No se pudo actualizar el usuario.' });
        }
        res.json({ message: 'Usuario actualizado correctamente.' });
    });
});

/**
 * DELETE /api/usuarios/:id - Eliminar usuario
 */
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error("Error SQL al eliminar:", err);
            return res.status(500).json({ error: 'No se pudo eliminar el usuario.' });
        }
        res.json({ message: 'Usuario eliminado correctamente.' });
    });
});

module.exports = router;
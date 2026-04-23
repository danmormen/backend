const express = require('express');
const router = express.Router();
const db = require('../config/DBconfig');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ==========================================
// 1. OBTENER MI PROPIO HORARIO (GET) 
// IMPORTANTE: Esta ruta debe ir ARRIBA de cualquier ruta con :id
// ==========================================
router.get('/mi-horario', protect, (req, res) => {
    const usuarioId = req.user.id; // Extraído del token por el middleware protect

    const sql = `
        SELECT dia_semana, hora_inicio, hora_fin, es_descanso 
        FROM empleados_horarios 
        WHERE empleado_id = ?
        ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
    `;

    db.query(sql, [usuarioId], (err, results) => {
        if (err) {
            console.error("Error SQL en mi-horario:", err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Aún no tienes un horario asignado.' });
        }

        res.json(results);
    });
});

// ==========================================
// 2. OBTENER TODOS LOS HORARIOS (ADMIN)
// ==========================================
router.get('/', protect, (req, res) => {
    const sql = `
        SELECT 
            u.id, u.nombre, u.email,
            h.dia_semana, h.hora_inicio, h.hora_fin, h.es_descanso
        FROM usuarios u
        INNER JOIN empleados_horarios h ON u.id = h.empleado_id
        WHERE u.rol IN ('estilista', 'admin') AND u.activo = 1
        ORDER BY u.nombre, 
        FIELD(h.dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const empleados = {};
        results.forEach(row => {
            if (!empleados[row.id]) {
                empleados[row.id] = {
                    id: row.id,
                    nombre: row.nombre,
                    email: row.email,
                    horarios: [],
                    totalHoras: 0,
                    diasLaborables: 0,
                    diasDescanso: 0
                };
            }
            
            const esDescanso = row.es_descanso === 1 || row.es_descanso === true;
            
            const h = {
                dia: row.dia_semana,
                inicio: row.hora_inicio,
                fin: row.hora_fin,
                descanso: esDescanso
            };
            
            if (esDescanso) {
                empleados[row.id].diasDescanso += 1;
            } else {
                empleados[row.id].diasLaborables += 1;
                if (row.hora_inicio && row.hora_fin) {
                    const [h1, m1] = row.hora_inicio.split(':').map(Number);
                    const [h2, m2] = row.hora_fin.split(':').map(Number);
                    const diferencia = h2 - h1 + (m2 - m1) / 60;
                    empleados[row.id].totalHoras += diferencia > 0 ? diferencia : 0;
                }
            }
            empleados[row.id].horarios.push(h);
        });

        const respuesta = Object.values(empleados).map(emp => ({
            ...emp,
            totalHoras: Math.round(emp.totalHoras * 10) / 10
        }));

        res.json(respuesta);
    });
});

// ==========================================
// 3. GUARDAR O ACTUALIZAR (POST)
// ==========================================
router.post('/save', protect, adminOnly, (req, res) => {
    const { empleado_id, horarios } = req.body;

    if (!empleado_id || !horarios || !Array.isArray(horarios)) {
        return res.status(400).json({ error: 'Datos insuficientes.' });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Error al iniciar transacción.' });

        const queries = horarios.map(h => {
            return new Promise((resolve, reject) => {
                const esDescanso = h.descanso ? 1 : 0;
                const inicio = (h.descanso || !h.inicio) ? null : h.inicio;
                const fin = (h.descanso || !h.fin) ? null : h.fin;

                const sql = `
                    INSERT INTO empleados_horarios (empleado_id, dia_semana, hora_inicio, hora_fin, es_descanso)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        hora_inicio = VALUES(hora_inicio), 
                        hora_fin = VALUES(hora_fin), 
                        es_descanso = VALUES(es_descanso)
                `;
                
                db.query(sql, [empleado_id, h.dia, inicio, fin, esDescanso], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        Promise.all(queries)
            .then(() => {
                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ error: 'Error en Commit' }));
                    res.json({ message: 'Horario guardado correctamente.' });
                });
            })
            .catch(err => {
                db.rollback(() => {
                    res.status(500).json({ error: 'Error DB', details: err.sqlMessage });
                });
            });
    });
});

// ==========================================
// 4. ELIMINAR HORARIO COMPLETO (DELETE)
// ESTA RUTA SIEMPRE AL FINAL
// ==========================================
router.delete('/:id', protect, adminOnly, (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM empleados_horarios WHERE empleado_id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error al eliminar:", err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.json({ 
            message: 'Horario eliminado con éxito.',
            affectedRows: result.affectedRows 
        });
    });
});

module.exports = router;
const express = require('express');
const { createGoal, getGoals, getGoal, updateGoal, deleteGoal } = require('../controllers/goalsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/goals
router.post('/', createGoal);

// GET /api/goals
router.get('/', getGoals);

// GET /api/goals/:id
router.get('/:id', getGoal);

// PUT /api/goals/:id
router.put('/:id', updateGoal);

// DELETE /api/goals/:id
router.delete('/:id', deleteGoal);

module.exports = router;
// Obtener todas las metas del usuario con estadísticas
router.get('/goals', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT sg.*, 
                   ROUND((sg.current_amount / sg.target_amount) * 100, 2) as progress_percentage,
                   DATEDIFF(sg.target_date, CURRENT_DATE) as days_remaining
            FROM savings_goals sg 
            WHERE sg.user_id = ? AND sg.status != 'deleted'
            ORDER BY sg.created_at DESC
        `;
        
        const goals = await db.query(query, [req.userId]);
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener metas' });
    }
});

// Obtener estadísticas del usuario
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const query = `CALL GetUserSavingsStats(?)`;
        const stats = await db.query(query, [req.userId]);
        res.json(stats[0][0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});
const express = require('express');
const { createEntry, getEntries, deleteEntry } = require('../controllers/entriesController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Entries routes funcionando',
    timestamp: new Date().toISOString()
  });
});


router.use(authMiddleware);

// POST /api/entries 
router.post('/', createEntry);

// GET /api/entries 
router.get('/', getEntries);

// DELETE /api/entries/:id 
router.delete('/:id', deleteEntry);

module.exports = router;
// Obtener entradas del usuario
router.get('/entries', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT se.*, sg.title as goal_title 
            FROM savings_entries se
            LEFT JOIN savings_goals sg ON se.goal_id = sg.id
            WHERE se.user_id = ?
            ORDER BY se.entry_date DESC
            LIMIT 50
        `;
        
        const entries = await db.query(query, [req.userId]);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener entradas' });
    }
});
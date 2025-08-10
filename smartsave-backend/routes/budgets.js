const express = require('express');
const { 
    createBudget, 
    getBudgets, 
    getCurrentBudget, 
    updateBudget, 
    deleteBudget 
} = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/budgets 
router.post('/', createBudget);

// GET /api/budgets 
router.get('/', getBudgets);

// GET /api/budgets/current 
router.get('/current', getCurrentBudget);

// PUT /api/budgets/:id 
router.put('/:id', updateBudget);

// DELETE /api/budgets/:id 
router.delete('/:id', deleteBudget);

module.exports = router;
const db = require('../config/database');
const { DateTime } = require('luxon');

// Crear nuevo presupuesto
const createBudget = async (req, res) => {
    const { amount, month, year } = req.body;
    const userId = req.user.userId;

    if (!amount || !month || !year) {
        return res.status(400).json({ message: 'Cantidad, mes y año son requeridos' });
    }

    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un número positivo' });
    }

    const monthStr = month.toString().padStart(2, '0');
    const monthYear = `${year}-${monthStr}`;

    try {
        const [existing] = await db.promise().query(
            'SELECT id FROM monthly_budgets WHERE user_id = ? AND month_year = ?',
            [userId, monthYear]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Ya existe un presupuesto para este mes y año' });
        }

        const [result] = await db.promise().query(
            `INSERT INTO monthly_budgets (user_id, month_year, total_income, total_expenses)
             VALUES (?, ?, ?, ?)`,
            [userId, monthYear, amount, 0]
        );

        res.status(201).json({
            message: 'Presupuesto creado exitosamente',
            budget: {
                id: result.insertId,
                month_year: monthYear,
                total_income: amount,
                total_expenses: 0,
                available_for_savings: amount
            }
        });

    } catch (error) {
        console.error('Error creando presupuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

// Obtener todos los presupuestos del usuario
const getBudgets = async (req, res) => {
    const userId = req.user.userId;

    try {
        const [budgets] = await db.promise().query(
            `SELECT id, month_year, total_income, total_expenses,
                    available_for_savings, created_at, updated_at
             FROM monthly_budgets
             WHERE user_id = ?
             ORDER BY month_year DESC`,
            [userId]
        );

        const formattedBudgets = budgets.map(budget => {
            const [year, month] = budget.month_year.split('-');
            return {
                id: budget.id,
                amount: parseFloat(budget.total_income),
                month: parseInt(month),
                year: parseInt(year),
                month_year: budget.month_year,
                total_income: parseFloat(budget.total_income),
                total_expenses: parseFloat(budget.total_expenses),
                available_for_savings: parseFloat(budget.available_for_savings),
                createdAt: budget.created_at,
                created_at: budget.created_at
            };
        });

        res.json({
            success: true,
            budgets: formattedBudgets
        });

    } catch (error) {
        console.error('Error obteniendo presupuestos:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

// Obtener presupuesto actual (mes actual)
const getCurrentBudget = async (req, res) => {
    const userId = req.user.userId;
    const currentMonth = DateTime.now().toFormat('yyyy-LL');

    try {
        const [budgets] = await db.promise().query(
            `SELECT id, month_year, total_income, total_expenses,
                    available_for_savings, created_at
             FROM monthly_budgets
             WHERE user_id = ? AND month_year = ?`,
            [userId, currentMonth]
        );

        if (budgets.length === 0) {
            return res.json({
                success: true,
                budget: {
                    month_year: currentMonth,
                    total_income: 0,
                    total_expenses: 0,
                    available_for_savings: 0,
                    exists: false
                }
            });
        }

        const budget = budgets[0];
        res.json({
            success: true,
            budget: {
                ...budget,
                available_for_savings: budget.total_income - budget.total_expenses,
                exists: true
            }
        });

    } catch (error) {
        console.error('Error obteniendo presupuesto actual:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

// Actualizar presupuesto
const updateBudget = async (req, res) => {
    const { id } = req.params;
    const { amount, total_income, total_expenses } = req.body;
    const userId = req.user.userId;

    try {
        const [existing] = await db.promise().query(
            'SELECT id FROM monthly_budgets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Presupuesto no encontrado' });
        }

        let updateFields = [];
        let updateValues = [];

        if (amount !== undefined) {
            updateFields.push('total_income = ?');
            updateValues.push(amount);
        }

        if (total_income !== undefined) {
            updateFields.push('total_income = ?');
            updateValues.push(total_income);
        }

        if (total_expenses !== undefined) {
            updateFields.push('total_expenses = ?');
            updateValues.push(total_expenses);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No hay datos para actualizar' });
        }

        updateValues.push(id, userId);

        const [result] = await db.promise().query(
            `UPDATE monthly_budgets
             SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Presupuesto no encontrado' });
        }

        const [updated] = await db.promise().query(
            `SELECT id, month_year, total_income, total_expenses,
                    available_for_savings, updated_at
             FROM monthly_budgets
             WHERE id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Presupuesto actualizado exitosamente',
            budget: {
                ...updated[0],
                available_for_savings: updated[0].total_income - updated[0].total_expenses
            }
        });

    } catch (error) {
        console.error('Error actualizando presupuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

// Eliminar presupuesto
const deleteBudget = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const [result] = await db.promise().query(
            'DELETE FROM monthly_budgets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Presupuesto no encontrado' });
        }

        res.json({
            success: true,
            message: 'Presupuesto eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando presupuesto:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

module.exports = {
    createBudget,
    getBudgets,
    getCurrentBudget,
    updateBudget,
    deleteBudget
};

const db = require('../config/database');

// Crear una nueva meta
const createGoal = async (req, res) => {
  const userId = req.user.userId;
  const {
    title,
    description = '',
    target_amount,
    target_date = null,
    category = 'general',
    currency = 'USD'
  } = req.body;

  if (!title || !target_amount) {
    return res.status(400).json({ error: 'Se requiere título y monto objetivo' });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO savings_goals (user_id, title, description, target_amount, target_date, category, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description, target_amount, target_date, category, currency]
    );

    res.status(201).json({ message: 'Meta creada exitosamente', goal_id: result.insertId });
  } catch (error) {
    console.error('Error creando meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener todas las metas de un usuario
const getGoals = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [goals] = await db.promise().query(
      `SELECT *, 
        ROUND((current_amount / target_amount) * 100, 2) AS progress 
       FROM savings_goals 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(goals);
  } catch (error) {
    console.error('Error obteniendo metas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una meta específica
const getGoal = async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;

  try {
    const [goals] = await db.promise().query(
      `SELECT *, 
        ROUND((current_amount / target_amount) * 100, 2) AS progress 
       FROM savings_goals 
       WHERE id = ? AND user_id = ?`,
      [goalId, userId]
    );

    if (goals.length === 0) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    res.json(goals[0]);
  } catch (error) {
    console.error('Error obteniendo la meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar una meta existente
const updateGoal = async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;
  const {
    title,
    description,
    target_amount,
    current_amount,  // Cambiado de saved_amount a current_amount
    target_date,
    category,
    currency
  } = req.body;

  try {
    const [result] = await db.promise().query(
      `UPDATE savings_goals 
       SET title = ?, description = ?, target_amount = ?, current_amount = ?, 
           target_date = ?, category = ?, currency = ? 
       WHERE id = ? AND user_id = ?`,
      [title, description, target_amount, current_amount, target_date, category, currency, goalId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Meta no encontrada o no pertenece al usuario' });
    }

    const [updatedGoal] = await db.promise().query(
      `SELECT *, 
        ROUND((current_amount / target_amount) * 100, 2) AS progress 
       FROM savings_goals 
       WHERE id = ? AND user_id = ?`,
      [goalId, userId]
    );

    res.json(updatedGoal[0]);
  } catch (error) {
    console.error('Error actualizando la meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar una meta
const deleteGoal = async (req, res) => {
  const userId = req.user.userId;
  const goalId = req.params.id;

  try {
    const [result] = await db.promise().query(
      `DELETE FROM savings_goals WHERE id = ? AND user_id = ?`,
      [goalId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Meta no encontrada o no pertenece al usuario' });
    }

    res.json({ message: 'Meta eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando la meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal
};
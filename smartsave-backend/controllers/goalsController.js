const db = require('../config/database');

// Crear una nueva meta
const createGoal = async (req, res) => {
  console.log('=== CREATE GOAL DEBUG ===');
  console.log('req.userId:', req.userId);
  console.log('req.user:', req.user);
  console.log('req.body:', req.body);
  
  const userId = req.userId; // Cambiado de req.user.userId a req.userId
  const {
    title,
    description = '',
    target_amount,
    target_date, // Removido el valor por defecto null
    category = 'general',
  } = req.body;

  console.log('Parsed data:', {
    userId,
    title,
    description,
    target_amount,
    target_date,
    category
  });

  // Validación actualizada para incluir target_date como requerido
  if (!title || !target_amount || !target_date) {
    console.log('Validation failed: missing required fields');
    return res.status(400).json({ 
      error: 'Se requiere título, monto objetivo y fecha objetivo' 
    });
  }

  if (!userId) {
    console.log('Validation failed: missing userId');
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    console.log('Executing database query...');
    const [result] = await db.promise().query(
      `INSERT INTO savings_goals (user_id, title, description, target_amount, target_date, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, description, target_amount, target_date, category]
    );

    console.log('Database result:', result);
    res.status(201).json({ message: 'Meta creada exitosamente', goal_id: result.insertId });
  } catch (error) {
    console.error('Error creando meta:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

// Obtener todas las metas de un usuario
const getGoals = async (req, res) => {
  const userId = req.userId; // Cambiado de req.user.userId a req.userId

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
  const userId = req.userId; // Cambiado de req.user.userId a req.userId
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
  const userId = req.userId; // Cambiado de req.user.userId a req.userId
  const goalId = req.params.id;
  const {
    title,
    description,
    target_amount,
    current_amount,
    target_date,
    category,
  } = req.body;

  try {
    const [result] = await db.promise().query(
      `UPDATE savings_goals 
       SET title = ?, description = ?, target_amount = ?, current_amount = ?, 
           target_date = ?, category = ? 
       WHERE id = ? AND user_id = ?`,
      [title, description, target_amount, current_amount, target_date, category, goalId, userId]
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
  const userId = req.userId; // Cambiado de req.user.userId a req.userId
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
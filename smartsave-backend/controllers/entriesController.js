// controllers/entriesController.js
const db = require('../config/database');

// Crear un nuevo aporte
const createEntry = async (req, res) => {
  const { goal_id, amount, notes, entry_date } = req.body; 
  const userId = req.user.userId;

  console.log('Datos recibidos:', { goal_id, amount, notes, entry_date, userId });

  // Validación del monto
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ 
      error: 'El monto es requerido y debe ser mayor a 0' 
    });
  }

  try {
  
    let cleanGoalId = null;
    if (goal_id !== null && goal_id !== undefined && goal_id !== '' && goal_id !== 'null') {
      cleanGoalId = parseInt(goal_id);
      if (isNaN(cleanGoalId)) {
        return res.status(400).json({ error: 'ID de meta inválido' });
      }
    }

    console.log('goal_id limpio:', cleanGoalId);


    if (cleanGoalId !== null) {
      const [goals] = await db.promise().query(
        'SELECT id, status, title FROM savings_goals WHERE id = ? AND user_id = ?',
        [cleanGoalId, userId]
      );
      
      if (goals.length === 0) {
        return res.status(404).json({ error: 'Meta no encontrada' });
      }
      
      if (goals[0].status !== 'active') {
        return res.status(400).json({ 
          error: 'Solo se pueden agregar aportes a metas activas' 
        });
      }
    }

    // Usar la fecha proporcionada o la fecha actual
    const finalEntryDate = entry_date || new Date().toISOString().split('T')[0];

    // Insertar el aporte - AGREGAMOS entry_date AL QUERY
    const [result] = await db.promise().query(
      'INSERT INTO savings_entries (goal_id, user_id, amount, entry_date, notes) VALUES (?, ?, ?, ?, ?)',
      [cleanGoalId, userId, parseFloat(amount), finalEntryDate, notes || null]
    );

    console.log('Aporte insertado con ID:', result.insertId);

    res.status(201).json({
      message: 'Aporte registrado exitosamente',
      entry: {
        id: result.insertId,
        goal_id: cleanGoalId,
        user_id: userId,
        amount: parseFloat(amount),
        entry_date: finalEntryDate, 
        notes: notes || null,
        created_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error creando aporte:', error);
    
    // Manejar errores específicos de MySQL
    if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
      return res.status(400).json({ 
        error: 'Error en los datos: Campo requerido faltante' 
      });
    }
    
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ 
        error: 'Error en los datos: Campo no puede ser nulo' 
      });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: 'La meta seleccionada no existe' 
      });
    }

    res.status(500).json({ 
      error: 'Error interno del servidor: ' + error.message 
    });
  }
};

// Obtener todas las entradas del usuario
const getEntries = async (req, res) => {
  const userId = req.user.userId;
  const { goal_id, limit = 50, offset = 0, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT 
        se.id, 
        se.goal_id, 
        se.amount, 
        se.notes, 
        se.entry_date,
        se.created_at,
        sg.title as goal_title,
        sg.status as goal_status,
        sg.category as goal_category
      FROM savings_entries se 
      LEFT JOIN savings_goals sg ON se.goal_id = sg.id 
      WHERE se.user_id = ?
    `;
    
    let params = [userId];

    // Filtro por meta específica
    if (goal_id && !isNaN(goal_id)) {
      if (goal_id === '0' || goal_id === 'null') {
        query += ' AND se.goal_id IS NULL';
      } else {
        query += ' AND se.goal_id = ?';
        params.push(parseInt(goal_id));
      }
    }

    // Filtro por fecha
    if (start_date) {
      query += ' AND DATE(se.entry_date) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND DATE(se.entry_date) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY se.entry_date DESC, se.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [entries] = await db.promise().query(query, params);

    // Obtener el total de registros para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM savings_entries WHERE user_id = ?';
    let countParams = [userId];
    
    if (goal_id && !isNaN(goal_id)) {
      if (goal_id === '0' || goal_id === 'null') {
        countQuery += ' AND goal_id IS NULL';
      } else {
        countQuery += ' AND goal_id = ?';
        countParams.push(parseInt(goal_id));
      }
    }

    if (start_date) {
      countQuery += ' AND DATE(entry_date) >= ?';
      countParams.push(start_date);
    }
    
    if (end_date) {
      countQuery += ' AND DATE(entry_date) <= ?';
      countParams.push(end_date);
    }

    const [countResult] = await db.promise().query(countQuery, countParams);
    const total = countResult[0].total;

    // Obtener estadísticas adicionales
    const [statsResult] = await db.promise().query(`
      SELECT 
        COUNT(*) as total_entries,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN goal_id IS NULL THEN amount ELSE 0 END), 0) as personal_amount,
        COALESCE(SUM(CASE WHEN goal_id IS NOT NULL THEN amount ELSE 0 END), 0) as goals_amount
      FROM savings_entries 
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      count: entries.length,
      total: total,
      stats: statsResult[0],
      entries: entries.map(entry => ({
        ...entry,
        amount: parseFloat(entry.amount)
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + entries.length) < total
      }
    });

  } catch (error) {
    console.error('Error obteniendo aportes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una entrada específica
const getEntryById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID de entrada inválido' });
  }

  try {
    const [entries] = await db.promise().query(`
      SELECT 
        se.id, 
        se.goal_id, 
        se.amount, 
        se.notes, 
        se.entry_date,
        se.created_at,
        se.updated_at,
        sg.title as goal_title,
        sg.status as goal_status,
        sg.category as goal_category,
        sg.target_amount,
        sg.current_amount
      FROM savings_entries se 
      LEFT JOIN savings_goals sg ON se.goal_id = sg.id 
      WHERE se.id = ? AND se.user_id = ?
    `, [parseInt(id), userId]);

    if (entries.length === 0) {
      return res.status(404).json({ error: 'Aporte no encontrado' });
    }

    res.json({
      success: true,
      entry: {
        ...entries[0],
        amount: parseFloat(entries[0].amount),
        target_amount: entries[0].target_amount ? parseFloat(entries[0].target_amount) : null,
        current_amount: entries[0].current_amount ? parseFloat(entries[0].current_amount) : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo aporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar una entrada
const updateEntry = async (req, res) => {
  const { id } = req.params;
  const { amount, notes, goal_id, entry_date } = req.body; // AGREGAMOS entry_date
  const userId = req.user.userId;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID de entrada inválido' });
  }

  if (amount !== undefined && (isNaN(amount) || parseFloat(amount) <= 0)) {
    return res.status(400).json({ 
      error: 'El monto debe ser un número válido mayor a 0' 
    });
  }

  try {
    // Verificar que la entrada existe y pertenece al usuario
    const [existingEntries] = await db.promise().query(
      'SELECT goal_id FROM savings_entries WHERE id = ? AND user_id = ?',
      [parseInt(id), userId]
    );

    if (existingEntries.length === 0) {
      return res.status(404).json({ error: 'Aporte no encontrado' });
    }

    // Si se va a cambiar goal_id, validar
    if (goal_id !== undefined) {
      let cleanGoalId = null;
      if (goal_id !== null && goal_id !== undefined && goal_id !== '' && goal_id !== 'null') {
        cleanGoalId = parseInt(goal_id);
        if (isNaN(cleanGoalId)) {
          return res.status(400).json({ error: 'ID de meta inválido' });
        }
        
        // Verificar que la meta existe y está activa
        const [goals] = await db.promise().query(
          'SELECT id, status FROM savings_goals WHERE id = ? AND user_id = ?',
          [cleanGoalId, userId]
        );
        
        if (goals.length === 0) {
          return res.status(404).json({ error: 'Meta no encontrada' });
        }
        
        if (goals[0].status !== 'active') {
          return res.status(400).json({ 
            error: 'Solo se pueden asignar aportes a metas activas' 
          });
        }
      }
    }

    // Construir query de actualización dinámicamente
    let updateFields = [];
    let updateParams = [];

    if (amount !== undefined) {
      updateFields.push('amount = ?');
      updateParams.push(parseFloat(amount));
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes || null);
    }

    if (goal_id !== undefined) {
      let cleanGoalId = null;
      if (goal_id !== null && goal_id !== '' && goal_id !== 'null') {
        cleanGoalId = parseInt(goal_id);
      }
      updateFields.push('goal_id = ?');
      updateParams.push(cleanGoalId);
    }

    // AGREGAMOS MANEJO DE entry_date
    if (entry_date !== undefined) {
      updateFields.push('entry_date = ?');
      updateParams.push(entry_date);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(parseInt(id), userId);

    const [result] = await db.promise().query(`
      UPDATE savings_entries 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND user_id = ?
    `, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Aporte no encontrado' });
    }

    res.json({
      success: true,
      message: 'Aporte actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando aporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar una entrada
const deleteEntry = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'ID de entrada inválido' });
  }

  try {
    const [result] = await db.promise().query(
      'DELETE FROM savings_entries WHERE id = ? AND user_id = ?',
      [parseInt(id), userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Aporte no encontrado' });
    }

    res.json({
      success: true,
      message: 'Aporte eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error eliminando aporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener estadísticas de entradas del usuario
const getEntriesStats = async (req, res) => {
  const userId = req.user.userId;
  const { period = 'month' } = req.query; // month, quarter, year

  try {
    let dateCondition = '';
    switch(period) {
      case 'week':
        dateCondition = 'AND entry_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 WEEK)';
        break;
      case 'month':
        dateCondition = 'AND entry_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)';
        break;
      case 'quarter':
        dateCondition = 'AND entry_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)';
        break;
      case 'year':
        dateCondition = 'AND entry_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)';
        break;
      default:
        dateCondition = 'AND entry_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)';
    }

    const [stats] = await db.promise().query(`
      SELECT 
        COUNT(*) as total_entries,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as avg_amount,
        COALESCE(MIN(amount), 0) as min_amount,
        COALESCE(MAX(amount), 0) as max_amount,
        COUNT(DISTINCT goal_id) as goals_count,
        SUM(CASE WHEN goal_id IS NULL THEN amount ELSE 0 END) as personal_savings,
        SUM(CASE WHEN goal_id IS NOT NULL THEN amount ELSE 0 END) as goal_savings
      FROM savings_entries 
      WHERE user_id = ? ${dateCondition}
    `, [userId]);

    // Estadísticas por categoría
    const [categoryStats] = await db.promise().query(`
      SELECT 
        COALESCE(sg.category, 'personal') as category,
        COUNT(se.id) as entries_count,
        SUM(se.amount) as total_amount
      FROM savings_entries se
      LEFT JOIN savings_goals sg ON se.goal_id = sg.id
      WHERE se.user_id = ? ${dateCondition}
      GROUP BY COALESCE(sg.category, 'personal')
      ORDER BY total_amount DESC
    `, [userId]);

    // Tendencia mensual (últimos 6 meses)
    const [monthlyTrend] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(entry_date, '%Y-%m') as month,
        COUNT(*) as entries_count,
        SUM(amount) as total_amount
      FROM savings_entries 
      WHERE user_id = ? AND entry_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(entry_date, '%Y-%m')
      ORDER BY month DESC
    `, [userId]);

    res.json({
      success: true,
      period: period,
      general_stats: {
        ...stats[0],
        total_amount: parseFloat(stats[0].total_amount),
        avg_amount: parseFloat(stats[0].avg_amount),
        min_amount: parseFloat(stats[0].min_amount),
        max_amount: parseFloat(stats[0].max_amount),
        personal_savings: parseFloat(stats[0].personal_savings),
        goal_savings: parseFloat(stats[0].goal_savings)
      },
      category_stats: categoryStats.map(cat => ({
        ...cat,
        total_amount: parseFloat(cat.total_amount)
      })),
      monthly_trend: monthlyTrend.map(month => ({
        ...month,
        total_amount: parseFloat(month.total_amount)
      }))
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getEntriesStats
};
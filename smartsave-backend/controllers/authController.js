const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
  const { email, password, name, preferred_currency = 'USD', timezone = 'UTC' } = req.body;

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await db.promise().query(
      'INSERT INTO users (email, password_hash, name, preferred_currency, timezone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, preferred_currency, timezone]
    );

    // Crear preferencias por defecto
    await db.promise().query(
      'INSERT INTO user_preferences (user_id) VALUES (?)',
      [result.insertId]
    );

    // Generar token
    const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: result.insertId,
        email,
        name,
        preferred_currency,
        timezone
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último login
    await db.promise().query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferred_currency: user.preferred_currency,
        timezone: user.timezone
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT id, email, name, preferred_currency, timezone, created_at FROM users WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { register, login, getProfile };
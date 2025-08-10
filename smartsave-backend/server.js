
const express = require('express');
const cors = require('cors');
const path = require('path'); 
require('dotenv').config();

const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budgets');
const goalRoutes = require('./routes/goals');
const entryRoutes = require('./routes/entries');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8080',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'smartsave-frontend')));


app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/entries', entryRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SmartSave API funcionando!' });
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'smartsave-frontend', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
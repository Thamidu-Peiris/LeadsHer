const express = require('express');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Error handler (must have 4 args so Express treats it as error middleware)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
});

module.exports = app;

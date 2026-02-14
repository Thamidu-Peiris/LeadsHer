require('dotenv').config({ path: process.env.DOTENV_PATH || '../../.env' });
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

connectDB();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

const PORT = process.env.AUTH_SERVICE_PORT || 5001;
app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));

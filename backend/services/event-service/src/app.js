const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');

const app = express();

app.use(express.json());

const uploadsRoot = path.join(__dirname, '../uploads');
fs.mkdirSync(path.join(uploadsRoot, 'events'), { recursive: true });
app.use('/uploads', express.static(uploadsRoot));

app.use(helmet());

const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'event-service' });
});

module.exports = app;

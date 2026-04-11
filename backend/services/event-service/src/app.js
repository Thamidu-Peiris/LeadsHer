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

/** JSON errors so clients (axios) can read `message`; do not use `err.status` (string) as HTTP code. */
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ status: 'fail', message: err.message || 'Validation failed' });
  }
  const sc = err.statusCode;
  const code = typeof sc === 'number' && sc >= 400 && sc < 600 ? sc : 500;
  const message =
    code === 500 && !err.isOperational ? 'Something went wrong' : err.message || 'Request failed';
  const bodyStatus = String(code).startsWith('5') ? 'error' : 'fail';
  res.status(code).json({ status: bodyStatus, message });
});

module.exports = app;

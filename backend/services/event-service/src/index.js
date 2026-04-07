const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Serve uploads before helmet so responses are not tagged with Cross-Origin-Resource-Policy:
// same-origin (helmet default). Otherwise the SPA on another origin cannot show cover images.
const uploadsRoot = path.join(__dirname, '../uploads');
fs.mkdirSync(path.join(uploadsRoot, 'events'), { recursive: true });
app.use('/uploads', express.static(uploadsRoot));

app.use(helmet());

// Routes
const eventRoutes = require('./routes/eventRoutes');

app.use('/api/events', eventRoutes);

app.get('/api/events/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'event-service' });
});

// Start Server
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Event Service running on port ${PORT}`);
  });
};

start();

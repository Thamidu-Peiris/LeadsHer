const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/leadsher-event')
  .then(() => console.log('✅ Event Service connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
const eventRoutes = require('./routes/eventRoutes');

app.use('/api/events', eventRoutes);

app.get('/api/events/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'event-service' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Event Service running on port ${PORT}`);
});

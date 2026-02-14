require('dotenv').config({ path: process.env.DOTENV_PATH || '../../.env' });
const express = require('express');
const connectDB = require('./config/db');

const mentorRoutes = require('./routes/mentors');
const mentorshipRequestRoutes = require('./routes/mentorshipRequests');
const mentorshipRoutes = require('./routes/mentorships');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ service: 'mentorship-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes - mentorship requests MUST be mounted before mentorship to avoid route conflicts
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentorship/requests', mentorshipRequestRoutes);
app.use('/api/mentorship', mentorshipRoutes);

const PORT = process.env.PORT || 5003;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Mentorship service running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

module.exports = app;

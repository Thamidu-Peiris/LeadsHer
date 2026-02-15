const express = require('express');

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

module.exports = app;

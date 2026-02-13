require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const mentorRoutes = require('./routes/mentors');
const mentorshipRequestRoutes = require('./routes/mentorshipRequests');
const mentorshipRoutes = require('./routes/mentorships');
const storyRoutes = require('./routes/stories');


connectDB();

// Ensure uploads directory exists for story images
const uploadsDir = path.join(__dirname, 'uploads', 'stories');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentorship/requests', mentorshipRequestRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/stories', storyRoutes);

// Root route - avoid "Cannot GET /" when visiting http://localhost:5000/
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'LeadsHer API',
    message: 'Amplifying women\'s leadership through storytelling and mentorship',
    version: '1.0',
    docs: {
      health: '/api/health',
      auth: '/api/auth',
      mentors: '/api/mentors',
      mentorship: '/api/mentorship',
      stories: '/api/stories',
    },
  });
});


// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Chrome DevTools requests this; respond so DevTools don't log 404/CSP errors
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(200).json({});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

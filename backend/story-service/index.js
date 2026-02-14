require('dotenv').config({ path: process.env.DOTENV_PATH || '../../.env' });
const path = require('path');
const fs = require('fs');
const express = require('express');
const connectDB = require('./config/db');
const storyRoutes = require('./routes/stories');

connectDB();

const uploadsDir = path.join(__dirname, 'uploads', 'stories');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/stories', storyRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'story-service' }));

const PORT = process.env.STORY_SERVICE_PORT || 5002;
app.listen(PORT, () => console.log(`Story service running on port ${PORT}`));

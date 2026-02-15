const path = require('path');
const fs = require('fs');
const express = require('express');
const storyRoutes = require('./routes/stories');

const uploadsDir = path.join(__dirname, '../uploads/stories');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/stories', storyRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'story-service' }));

module.exports = app;

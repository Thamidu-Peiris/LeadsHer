const express = require('express');
const forumRoutes = require('./routes/forum');

const app = express();
app.use(express.json());

app.use('/api/forum', forumRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'forum-service' }));

module.exports = app;

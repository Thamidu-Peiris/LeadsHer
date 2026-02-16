const path = require('path');
const fs = require('fs');
const express = require('express');
const resourceRoutes = require('./routes/resources');

const uploadsDir = path.join(__dirname, '../uploads/resources');
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/resources', resourceRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'resource-service' }));

module.exports = app;

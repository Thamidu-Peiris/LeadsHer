require('dotenv').config({ path: process.env.DOTENV_PATH || '../../../.env' });
const { start } = require('./server');

start();

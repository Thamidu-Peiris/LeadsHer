const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5006;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Event Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
};

start();

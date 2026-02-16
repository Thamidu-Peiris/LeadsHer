const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 5001;
  app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
};

module.exports = { start };

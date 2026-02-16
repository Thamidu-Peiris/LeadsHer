const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  const PORT = process.env.RESOURCE_SERVICE_PORT || 5004;
  app.listen(PORT, () => console.log(`Resource service running on port ${PORT}`));
};

module.exports = { start };

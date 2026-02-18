const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || process.env.FORUM_SERVICE_PORT || 5005;
  app.listen(PORT, () => console.log(`Forum service running on port ${PORT}`));
};

module.exports = { start };

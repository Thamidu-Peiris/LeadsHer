const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || process.env.STORY_SERVICE_PORT || 5002;
  app.listen(PORT, () => console.log(`Story service running on port ${PORT}`));
};

module.exports = { start };

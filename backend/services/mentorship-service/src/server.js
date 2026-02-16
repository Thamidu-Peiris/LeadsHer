const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || process.env.MENTORSHIP_SERVICE_PORT || 5003;
  app.listen(PORT, () => {
    console.log(`Mentorship service running on port ${PORT}`);
  });
};

module.exports = { start, app };

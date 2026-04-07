const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('[db] MONGODB_URI is not set. Add it to your environment variables.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    mongoose.connection.on('error', (err) => {
      console.error('[db] MongoDB runtime error:', err.message);
    });
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

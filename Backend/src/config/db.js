import dns from 'dns';
import mongoose from 'mongoose';

// Configure reliable DNS servers for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fallback to default system DNS if setServers is restricted
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('FATAL: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'medisync_ai',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB connected successfully: database -> ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

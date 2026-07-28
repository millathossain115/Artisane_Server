import dns from 'node:dns';
import mongoose from 'mongoose';
import config from '../config/index.js';
import AppError from '../errors/appError.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);
mongoose.set('bufferCommands', false);

let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!config.database_url) {
    throw new AppError(500, 'DATABASE_URL is not configured');
  }

  connectionPromise ??= mongoose
    .connect(config.database_url, {
      connectTimeoutMS: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 10000),
      maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE || 10),
      serverSelectionTimeoutMS: Number(
        process.env.DATABASE_SERVER_SELECTION_TIMEOUT_MS || 10000,
      ),
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

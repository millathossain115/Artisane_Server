import type { RequestHandler } from 'express';
import { connectToDatabase } from '../utils/database.js';

const ensureDatabaseConnected: RequestHandler = async (_req, _res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
};

export default ensureDatabaseConnected;

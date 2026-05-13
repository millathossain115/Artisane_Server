import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV || 'development',
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET || 'jwt-access-secret',
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret',
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

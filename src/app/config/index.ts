import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV || 'development',
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
};

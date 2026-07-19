import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV || 'development',
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:5173',
  courier: {
    sync_interval_ms: Number(process.env.COURIER_SYNC_INTERVAL_MS || 900000),
    redx: {
      api_key: process.env.REDX_API_KEY,
      base_url: process.env.REDX_BASE_URL,
    },
    steadfast: {
      api_key: process.env.STEADFAST_API_KEY,
      secret_key: process.env.STEADFAST_SECRET_KEY,
      base_url: process.env.STEADFAST_BASE_URL,
    },
    pathao: {
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      base_url: process.env.PATHAO_BASE_URL,
    },
  },
  sslcommerz: {
    store_id: process.env.SSLCOMMERZ_STORE_ID,
    store_password: process.env.SSLCOMMERZ_STORE_PASSWORD,
    is_live: process.env.SSLCOMMERZ_IS_LIVE === 'true',
  },
};

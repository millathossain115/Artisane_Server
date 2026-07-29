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
  frontend_url:
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173',
  password_reset_expires_minutes: Number(
    process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15,
  ),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
    password: process.env.SUPER_ADMIN_PASSWORD,
    phone: process.env.SUPER_ADMIN_PHONE,
    reset_password: process.env.SUPER_ADMIN_RESET_PASSWORD === 'true',
  },
  google: {
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  courier: {
    sync_interval_ms: Number(process.env.COURIER_SYNC_INTERVAL_MS || 900000),
    steadfast: {
      api_key: process.env.STEADFAST_API_KEY,
      secret_key: process.env.STEADFAST_SECRET_KEY,
      base_url:
        process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1',
      districts_path:
        process.env.STEADFAST_DISTRICTS_PATH || '/police_stations',
      zones_path: process.env.STEADFAST_ZONES_PATH || '/police_stations',
    },
  },
  delivery: {
    steadfast_webhook_secret: process.env.STEADFAST_WEBHOOK_SECRET,
  },
  sslcommerz: {
    store_id: process.env.SSLCOMMERZ_STORE_ID,
    store_password: process.env.SSLCOMMERZ_STORE_PASSWORD,
    is_live: process.env.SSLCOMMERZ_IS_LIVE === 'true',
  },
};

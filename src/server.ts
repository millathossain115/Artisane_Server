import mongoose from 'mongoose';
import dns from 'node:dns';
import app from './app.js';
import config from './app/config/index.js';

// Force Google DNS to fix SRV lookup issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function main() {
  try {
    if (!config.database_url) {
      console.error('DATABASE_URL is not defined in .env');
      process.exit(1);
    }

    await mongoose.connect(config.database_url as string);
    console.log('🟢 Database connected successfully');

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });
  } catch (err) {
    console.error('🔴 Failed to connect to database:', err);
  }
}

main();

import app from './app.js';
import config from './app/config/index.js';
import { connectToDatabase } from './app/utils/database.js';
import { ShippingPoller } from './app/modules/shipping/shipping.poller.js';

async function main() {
  try {
    await connectToDatabase();
    console.log('🟢 Database connected successfully');

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
      ShippingPoller.startCourierStatusSync();
    });
  } catch (err) {
    console.error('🔴 Failed to connect to database:', err);
  }
}

main();

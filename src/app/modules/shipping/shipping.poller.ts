import config from '../../config/index.js';
import { OrderServices } from '../order/order.service.js';

let courierSyncTimer: ReturnType<typeof setInterval> | null = null;

const getSyncInterval = () => {
  const interval = Number(config.courier.sync_interval_ms);

  if (!Number.isFinite(interval) || interval < 60000) {
    return 900000;
  }

  return interval;
};

const runCourierStatusSync = async () => {
  try {
    await OrderServices.syncPendingShipmentsIntoDB();
  } catch (error) {
    console.error('Courier status sync failed:', error);
  }
};

const startCourierStatusSync = () => {
  if (courierSyncTimer) {
    return;
  }

  courierSyncTimer = setInterval(() => {
    void runCourierStatusSync();
  }, getSyncInterval());
};

export const ShippingPoller = {
  runCourierStatusSync,
  startCourierStatusSync,
};

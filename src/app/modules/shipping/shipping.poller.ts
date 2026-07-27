import config from '../../config/index.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
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
    const result = await OrderServices.syncPendingShipmentsIntoDB();

    await ActivityLogServices.recordActivity({
      action: 'shipment.scheduled_sync',
      actorRole: 'system',
      metadata: result,
      module: 'shipping',
      severity: result.failed ? 'medium' : 'low',
      source: 'scheduler',
      status: result.failed ? 'warning' : 'success',
      summary: `Scheduled shipment sync scanned ${result.scanned} orders`,
      targetType: 'shipment',
    });
  } catch (error) {
    await ActivityLogServices.recordActivity({
      action: 'shipment.scheduled_sync_failed',
      actorRole: 'system',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      module: 'shipping',
      severity: 'medium',
      source: 'scheduler',
      status: 'failed',
      summary: 'Scheduled shipment sync failed',
      targetType: 'shipment',
    });
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

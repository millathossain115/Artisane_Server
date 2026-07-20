import AppError from '../../errors/appError.js';
import config from '../../config/index.js';
import { ORDER_STATUS } from '../order/order.constant.js';
import type { IOrder, TCourierProvider } from '../order/order.interface.js';
import type {
  TCreateSteadfastOrderPayload,
  TCreateSteadfastOrderResult,
  TCourierStatusResult,
  TNormalizedCourierStatus,
  TShippingProviderAdapter,
  TSyncOrderStatus,
} from './shipping.interface.js';

const COURIER_STATUS_ALIASES: Record<TNormalizedCourierStatus, string[]> = {
  cancelled: ['cancelled', 'canceled'],
  delivered: ['delivered', 'complete', 'completed', 'delivered_to_customer'],
  failed: ['failed', 'delivery_failed', 'hold', 'lost'],
  in_transit: ['in_transit', 'transit', 'on_the_way'],
  out_for_delivery: ['out_for_delivery', 'ofd'],
  pending_pickup: ['pending_pickup', 'ready_for_pickup', 'assigned'],
  picked_up: ['picked_up', 'picked', 'pickup_done'],
  returned: ['returned', 'return', 'rto', 'return_to_origin'],
  shipment_created: ['shipment_created', 'created', 'consignment_created'],
  unknown: ['unknown'],
};

const normalizeCourierStatus = (value: unknown): TNormalizedCourierStatus => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_');

  for (const [status, aliases] of Object.entries(COURIER_STATUS_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return status as TNormalizedCourierStatus;
    }
  }

  return 'unknown';
};

const extractStatusValue = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const record = payload as Record<string, unknown>;
  const data = record.data;

  if (data && typeof data === 'object') {
    const dataRecord = data as Record<string, unknown>;

    return (
      dataRecord.status ??
      dataRecord.delivery_status ??
      dataRecord.consignment_status ??
      dataRecord.current_status ??
      record.status
    );
  }

  return (
    record.status ??
    record.delivery_status ??
    record.consignment_status ??
    record.current_status
  );
};

const requireConfigValue = (value: string | undefined, label: string) => {
  if (!value) {
    throw new AppError(500, `${label} is not configured`);
  }

  return value;
};

const getSteadfastBaseUrl = () => {
  return requireConfigValue(
    config.courier.steadfast.base_url,
    'STEADFAST_BASE_URL',
  ).replace(/\/$/, '');
};

const getSteadfastHeaders = (contentType?: string) => {
  return {
    'Api-Key': requireConfigValue(
      config.courier.steadfast.api_key,
      'STEADFAST_API_KEY',
    ),
    'Secret-Key': requireConfigValue(
      config.courier.steadfast.secret_key,
      'STEADFAST_SECRET_KEY',
    ),
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
};

const fetchCourierStatus = async (
  provider: TCourierProvider,
  url: string,
  headers: Record<string, string>,
) => {
  const response = await fetch(url, {
    headers,
    method: 'GET',
  });

  if (!response.ok) {
    throw new AppError(
      response.status >= 500 ? 502 : response.status,
      `${provider} shipment status sync failed`,
    );
  }

  const raw = (await response.json()) as unknown;

  return {
    courierStatus: normalizeCourierStatus(extractStatusValue(raw)),
    courierStatusRaw: raw,
  };
};

const steadfastAdapter: TShippingProviderAdapter = {
  provider: 'steadfast',
  getShipmentStatus: async (order: IOrder) => {
    const trackingCode = requireConfigValue(order.trackingCode, 'Tracking code');

    return fetchCourierStatus(
      'steadfast',
      `${getSteadfastBaseUrl()}/status_by_trackingcode/${encodeURIComponent(trackingCode)}`,
      getSteadfastHeaders(),
    );
  },
};

const getPayloadRecord = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const record = payload as Record<string, unknown>;

  if (record.data && typeof record.data === 'object') {
    return record.data as Record<string, unknown>;
  }

  return record;
};

const getStringValue = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
};

const buildSteadfastTrackingUrl = (trackingCode: string) => {
  return `https://steadfast.com.bd/track/consignment/${encodeURIComponent(
    trackingCode,
  )}`;
};

const createSteadfastOrder = async (
  payload: TCreateSteadfastOrderPayload,
): Promise<TCreateSteadfastOrderResult> => {
  const response = await fetch(`${getSteadfastBaseUrl()}/create_order`, {
    body: JSON.stringify(payload),
    headers: getSteadfastHeaders('application/json'),
    method: 'POST',
  });
  const raw = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      typeof raw === 'object' &&
      raw &&
      'message' in raw &&
      typeof raw.message === 'string'
        ? raw.message
        : 'Steadfast shipment creation failed';

    throw new AppError(response.status >= 500 ? 502 : response.status, message);
  }

  const record = getPayloadRecord(raw);
  const consignmentId = getStringValue(record, 'consignment_id');
  const trackingCode = getStringValue(record, 'tracking_code');

  if (!consignmentId || !trackingCode) {
    throw new AppError(502, 'Steadfast did not return shipment tracking data');
  }

  return {
    consignmentId,
    trackingCode,
    trackingUrl:
      getStringValue(record, 'tracking_url') ||
      buildSteadfastTrackingUrl(trackingCode),
    courierStatus: getStringValue(record, 'status') || 'shipment_created',
    raw,
  };
};

const adapterMap: Record<TCourierProvider, TShippingProviderAdapter> = {
  steadfast: steadfastAdapter,
};

const getProviderAdapter = (provider?: TCourierProvider) => {
  if (!provider) {
    throw new AppError(400, 'Courier provider is required');
  }

  return adapterMap[provider];
};

const mapCourierStatusToOrderStatus = (
  courierStatus: TNormalizedCourierStatus,
): TSyncOrderStatus | null => {
  if (
    courierStatus === 'cancelled' ||
    courierStatus === 'failed' ||
    courierStatus === 'returned'
  ) {
    return ORDER_STATUS.cancelled;
  }

  if (courierStatus === 'delivered') {
    return ORDER_STATUS.delivered;
  }

  if (
    courierStatus === 'picked_up' ||
    courierStatus === 'in_transit' ||
    courierStatus === 'out_for_delivery'
  ) {
    return ORDER_STATUS.shipped;
  }

  if (
    courierStatus === 'shipment_created' ||
    courierStatus === 'pending_pickup' ||
    courierStatus === 'unknown'
  ) {
    return ORDER_STATUS.processing;
  }

  return null;
};

const getShipmentStatus = async (order: IOrder): Promise<TCourierStatusResult> => {
  const adapter = getProviderAdapter(order.courierProvider);

  return adapter.getShipmentStatus(order);
};

export const ShippingServices = {
  createSteadfastOrder,
  getShipmentStatus,
  mapCourierStatusToOrderStatus,
  normalizeCourierStatus,
};

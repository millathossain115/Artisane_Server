export const ORDER_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  unpaid: 'unpaid',
  paid: 'paid',
  failed: 'failed',
  refunded: 'refunded',
} as const;

export const PAYMENT_METHOD = {
  cod: 'cod',
  sslcommerz: 'sslcommerz',
  bkash: 'bkash',
  nagad: 'nagad',
  rocket: 'rocket',
} as const;

export const COURIER_PROVIDER = {
  steadfast: 'steadfast',
} as const;

export const ORDER_STATUS_TRANSITIONS = {
  pending: [ORDER_STATUS.confirmed, ORDER_STATUS.cancelled],
  confirmed: [ORDER_STATUS.processing, ORDER_STATUS.cancelled],
  processing: [ORDER_STATUS.shipped, ORDER_STATUS.cancelled],
  shipped: [ORDER_STATUS.delivered],
  delivered: [],
  cancelled: [],
} as const;

export const CANCELLABLE_ORDER_STATUSES = [
  ORDER_STATUS.pending,
  ORDER_STATUS.confirmed,
  ORDER_STATUS.processing,
] as const;

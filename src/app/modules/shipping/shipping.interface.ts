import type { IOrder, TCourierProvider } from '../order/order.interface.js';

export type TNormalizedCourierStatus =
  | 'cancelled'
  | 'delivered'
  | 'failed'
  | 'in_transit'
  | 'out_for_delivery'
  | 'pending_pickup'
  | 'picked_up'
  | 'returned'
  | 'shipment_created'
  | 'unknown';

export type TSyncOrderStatus = 'delivered' | 'processing' | 'shipped';

export type TCourierStatusResult = {
  courierStatus: TNormalizedCourierStatus;
  courierStatusRaw: unknown;
};

export type TShippingProviderAdapter = {
  provider: TCourierProvider;
  getShipmentStatus: (order: IOrder) => Promise<TCourierStatusResult>;
};

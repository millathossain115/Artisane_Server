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

export type TSyncOrderStatus =
  | 'cancelled'
  | 'delivered'
  | 'processing'
  | 'shipped';

export type TCourierStatusResult = {
  courierStatus: TNormalizedCourierStatus;
  courierStatusRaw: unknown;
};

export type TCreateSteadfastOrderPayload = {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  alternative_phone?: string;
  recipient_email?: string;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: number;
};

export type TCreateSteadfastOrderResult = {
  consignmentId: string;
  trackingCode: string;
  trackingUrl: string;
  courierStatus: string;
  raw: unknown;
};

export type TShippingProviderAdapter = {
  provider: TCourierProvider;
  getShipmentStatus: (order: IOrder) => Promise<TCourierStatusResult>;
};

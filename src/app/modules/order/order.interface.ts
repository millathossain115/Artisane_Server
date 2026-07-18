import type { Types } from 'mongoose';
import type {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_STATUS,
} from './order.constant.js';

export type TOrderStatus = keyof typeof ORDER_STATUS;
export type TPaymentStatus = keyof typeof PAYMENT_STATUS;
export type TPaymentMethod = keyof typeof PAYMENT_METHOD;

export interface IOrderItem {
  product: Types.ObjectId;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  shippingAddress: string;
  contactPhone: string;
  paymentMethod?: TPaymentMethod;
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
  notes?: string;
  isDeleted?: boolean;
}

export interface ICreateOrderItemPayload {
  product: string;
  quantity: number;
}

export interface ICreateOrderPayload {
  items: ICreateOrderItemPayload[];
  shippingAddress: string;
  contactPhone: string;
  paymentMethod: TPaymentMethod;
  notes?: string;
}

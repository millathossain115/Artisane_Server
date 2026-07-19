import { Schema, model } from 'mongoose';
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from './order.constant.js';
import type { IOrder, IOrderItem } from './order.interface.js';

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    productSlug: {
      type: String,
      required: [true, 'Product slug is required'],
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order items are required'],
      validate: {
        validator: (value: IOrderItem[]) => value.length > 0,
        message: 'At least one order item is required',
      },
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    shippingAddress: {
      type: String,
      required: [true, 'Shipping address is required'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.keys(PAYMENT_METHOD),
      default: PAYMENT_METHOD.cod,
      required: [true, 'Payment method is required'],
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    sslcommerzSessionKey: {
      type: String,
      trim: true,
    },
    sslcommerzValidationId: {
      type: String,
      trim: true,
    },
    bankTransactionId: {
      type: String,
      trim: true,
    },
    cardType: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      enum: Object.keys(ORDER_STATUS),
      default: ORDER_STATUS.pending,
    },
    paymentStatus: {
      type: String,
      enum: Object.keys(PAYMENT_STATUS),
      default: PAYMENT_STATUS.unpaid,
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Order = model<IOrder>('Order', orderSchema);

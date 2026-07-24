import { randomUUID } from 'node:crypto'
import { Schema, model } from 'mongoose'
import type { IPaymentLog } from './paymentLog.interface.js';

export type TPaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled' | 'Refunded'

export interface IPaymentLogDocument extends IPaymentLog {
  _id: string
}

const paymentLogSchema = new Schema<IPaymentLog>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    transactionId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    paymentMethod: { type: String, required: true },
    publicRef: {
      type: String,
      default: () => randomUUID(),
      index: true,
      sparse: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Cancelled', 'Refunded'],
      required: true,
      index: true,
    },
    gatewayResponse: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
    ipAddress: { type: String },
  },
  {
    timestamps: true,
  },
)

paymentLogSchema.index({ createdAt: -1 })
paymentLogSchema.index({ orderId: 1 })

export const PaymentLog = model<IPaymentLog>('PaymentLog', paymentLogSchema)

import { Types } from 'mongoose'

export type TPaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled' | 'Refunded'

export interface IPaymentLog {
  _id?: string
  orderId: Types.ObjectId | string
  userId?: Types.ObjectId | string
  transactionId: string
  amount: number
  currency?: string
  paymentMethod: string
  publicRef?: string
  status: TPaymentStatus
  gatewayResponse?: Record<string, unknown>
  errorMessage?: string
  ipAddress?: string
  createdAt?: Date
  updatedAt?: Date
}

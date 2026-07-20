import { z } from 'zod';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from './order.constant.js';

const createOrderValidationSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().trim().min(1, { message: 'Product is required' }),
        quantity: z
          .number()
          .int()
          .min(1, { message: 'Quantity must be at least 1' }),
      }),
    )
    .min(1, { message: 'At least one order item is required' }),
  shippingAddress: z
    .string()
    .trim()
    .min(1, { message: 'Shipping address is required' })
    .max(500, { message: 'Shipping address cannot exceed 500 characters' }),
  contactPhone: z
    .string()
    .trim()
    .min(7, { message: 'Contact phone must be at least 7 characters' })
    .max(20, { message: 'Contact phone cannot exceed 20 characters' }),
  paymentMethod: z.enum(Object.keys(PAYMENT_METHOD) as [string, ...string[]]),
  notes: z
    .string()
    .trim()
    .max(1000, { message: 'Notes cannot exceed 1000 characters' })
    .optional(),
});

const updateOrderStatusValidationSchema = z
  .object({
    orderStatus: z
      .enum(Object.keys(ORDER_STATUS) as [string, ...string[]])
      .optional(),
    paymentStatus: z
      .enum(Object.keys(PAYMENT_STATUS) as [string, ...string[]])
      .optional(),
  })
  .refine(
    (value) =>
      value.orderStatus !== undefined || value.paymentStatus !== undefined,
    {
      message: 'At least one of orderStatus or paymentStatus is required',
    },
  );

const createShipmentValidationSchema = z
  .object({
    alternativePhone: z
      .string()
      .trim()
      .max(20, { message: 'Alternative phone cannot exceed 20 characters' })
      .optional(),
    deliveryType: z.number().int().min(0).max(1).optional(),
    itemDescription: z
      .string()
      .trim()
      .max(250, { message: 'Item description cannot exceed 250 characters' })
      .optional(),
    note: z
      .string()
      .trim()
      .max(250, { message: 'Note cannot exceed 250 characters' })
      .optional(),
    recipientEmail: z
      .string()
      .trim()
      .email({ message: 'Recipient email must be valid' })
      .optional(),
    totalLot: z.number().int().min(1).optional(),
  })
  .default({});

export const OrderValidations = {
  createOrderValidationSchema,
  createShipmentValidationSchema,
  updateOrderStatusValidationSchema,
};

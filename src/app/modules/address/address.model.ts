import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';

export interface IAddress {
  user: Types.ObjectId;
  label: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
}

export type AddressDocument = Document & IAddress;

const addressSchema = new Schema<AddressDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true, default: 'Home' },
    recipientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'Bangladesh' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = model<AddressDocument>('Address', addressSchema);

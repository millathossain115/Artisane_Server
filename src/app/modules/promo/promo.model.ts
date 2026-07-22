import { Schema, model } from 'mongoose';
import type { Document } from 'mongoose';

export interface IPromoBanner {
  title: string;
  code: string;
  description?: string;
  endsAt: Date;
  isActive: boolean;
  buttonText?: string;
  buttonLink?: string;
}

export type PromoBannerDocument = Document & IPromoBanner;

const promoBannerSchema = new Schema<PromoBannerDocument>(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true, default: '' },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    buttonText: { type: String, trim: true, default: 'Shop Now' },
    buttonLink: { type: String, trim: true, default: '/products' },
  },
  { timestamps: true }
);

export const PromoBanner = model<PromoBannerDocument>('PromoBanner', promoBannerSchema);

import { Schema, model } from 'mongoose';
import type { Document } from 'mongoose';

export interface IPromoBanner {
  title: string;
  code: string;
  discountPercent: number;
  description?: string;
  endsAt: Date;
  flashSaleEndsAt?: Date;
  isActive: boolean;
  enableAutoDiscount?: boolean;
  enableVoucher?: boolean;
  buttonText?: string;
  buttonLink?: string;

  // Distinct Voucher / Flash Banner properties
  autoDiscountPercent?: number;
  voucherCode?: string;
  voucherDiscountPercent?: number;
  voucherEndsAt?: Date;
  voucherTitle?: string;
  voucherDescription?: string;
  voucherButtonText?: string;
  voucherButtonLink?: string;
}

export type PromoBannerDocument = Document & IPromoBanner;

const promoBannerSchema = new Schema<PromoBannerDocument>(
  {
    title: { type: String, required: true, trim: true, default: 'Special Store-Wide Flash Deal' },
    code: { type: String, required: true, trim: true, uppercase: true, default: 'ARTISANE10' },
    discountPercent: { type: Number, required: true, min: 0, max: 100, default: 10 },
    description: { type: String, trim: true, default: 'Special flash deal on all craft kits and supplies' },
    endsAt: { type: Date, required: true },
    flashSaleEndsAt: { type: Date },
    isActive: { type: Boolean, default: true },
    enableAutoDiscount: { type: Boolean, default: true },
    enableVoucher: { type: Boolean, default: true },
    buttonText: { type: String, trim: true, default: 'Shop Starter Kits' },
    buttonLink: { type: String, trim: true, default: '/products' },

    autoDiscountPercent: { type: Number, default: 10 },
    voucherCode: { type: String, trim: true, uppercase: true, default: 'ARTISANE10' },
    voucherDiscountPercent: { type: Number, default: 15 },
    voucherEndsAt: { type: Date },
    voucherTitle: { type: String, trim: true, default: 'Exclusive Coupon Voucher' },
    voucherDescription: { type: String, trim: true, default: 'Use coupon code at checkout for extra savings' },
    voucherButtonText: { type: String, trim: true, default: 'Claim Voucher' },
    voucherButtonLink: { type: String, trim: true, default: '/products' },
  },
  { timestamps: true }
);

export const PromoBanner = model<PromoBannerDocument>('PromoBanner', promoBannerSchema);

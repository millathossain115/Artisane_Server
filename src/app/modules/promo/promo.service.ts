import { PromoBanner } from './promo.model.js';
import type { IPromoBanner } from './promo.model.js';

export const getActivePromo = async () => {
  const promo = await PromoBanner.findOne({ isActive: true }).sort({ updatedAt: -1 });
  return promo;
};

export const upsertPromo = async (payload: Partial<IPromoBanner>) => {
  const existing = await PromoBanner.findOne().sort({ updatedAt: -1 });

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  const created = await PromoBanner.create({
    title: payload.title || 'Special Flash Offer',
    code: payload.code || 'ARTISANE10',
    description: payload.description || 'Limited time discount on selected items!',
    endsAt: payload.endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: payload.isActive ?? true,
    buttonText: payload.buttonText || 'Shop Now',
    buttonLink: payload.buttonLink || '/products',
  });

  return created;
};

export const PromoService = {
  getActivePromo,
  upsertPromo,
};

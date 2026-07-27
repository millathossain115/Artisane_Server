import type { IActivityLogContext } from '../activityLog/activityLog.interface.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import { PromoBanner } from './promo.model.js';
import type { IPromoBanner } from './promo.model.js';

export const getActivePromo = async () => {
  const promo = await PromoBanner.findOne().sort({ updatedAt: -1 });
  return promo;
};

export const upsertPromo = async (
  payload: Partial<IPromoBanner>,
  activityContext?: IActivityLogContext,
) => {
  const existing = await PromoBanner.findOne().sort({ updatedAt: -1 });

  if (existing) {
    const before = existing.toObject();
    Object.assign(existing, payload);
    await existing.save();
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'promo.updated',
      changes: ActivityLogServices.buildActivityChanges(before, existing, [
        'title',
        'code',
        'discountPercent',
        'description',
        'endsAt',
        'isActive',
        'buttonText',
        'buttonLink',
      ]),
      module: 'promo',
      severity: 'low',
      status: 'success',
      summary: `Promo banner ${existing.title} was updated`,
      targetId: existing._id.toString(),
      targetLabel: existing.title,
      targetType: 'promo',
    });
    return existing;
  }

  const created = await PromoBanner.create({
    title: payload.title || 'Special Flash Offer',
    code: payload.code || 'ARTISANE10',
    discountPercent: payload.discountPercent ?? 10,
    description: payload.description || 'Limited time discount on selected items!',
    endsAt: payload.endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: payload.isActive ?? true,
    buttonText: payload.buttonText || 'Shop Now',
    buttonLink: payload.buttonLink || '/products',
  });

  await ActivityLogServices.recordActivity({
    ...activityContext,
    action: 'promo.created',
    module: 'promo',
    severity: 'low',
    status: 'success',
    summary: `Promo banner ${created.title} was created`,
    targetId: created._id.toString(),
    targetLabel: created.title,
    targetType: 'promo',
  });

  return created;
};

export const PromoService = {
  getActivePromo,
  upsertPromo,
};

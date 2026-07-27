import type { IActivityLogContext } from '../activityLog/activityLog.interface.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import type { IHomeHeroContent, IHomeHeroSlide } from './homeContent.model.js';
import { HomeHeroContent } from './homeContent.model.js';

export type HomeHeroContentPayload = {
  autoplaySeconds?: number;
  fadeMs?: number;
  isActive?: boolean;
  slides?: Array<Partial<IHomeHeroSlide>>;
};

const defaultSlide: IHomeHeroSlide = {
  eyebrow: 'New in the atelier',
  title: 'Artisane',
  description:
    'Shop stocked kits, tools, and craft materials from the latest marketplace edit.',
  imageAlt: 'Living room with abstract wall painting',
  primaryButtonText: 'Shop products',
  primaryButtonLink: '/products',
  secondaryButtonText: 'Browse categories',
  secondaryButtonLink: '/categories',
  isActive: true,
  sortOrder: 0,
};

const normalizeSlide = (
  slide: Partial<IHomeHeroSlide>,
  index: number,
): IHomeHeroSlide => ({
  eyebrow: slide.eyebrow || defaultSlide.eyebrow,
  title: slide.title || defaultSlide.title,
  description: slide.description || defaultSlide.description,
  ...(slide.image ? { image: slide.image } : {}),
  imageAlt: slide.imageAlt || defaultSlide.imageAlt,
  primaryButtonText: slide.primaryButtonText || defaultSlide.primaryButtonText,
  primaryButtonLink: slide.primaryButtonLink || defaultSlide.primaryButtonLink,
  secondaryButtonText:
    slide.secondaryButtonText || defaultSlide.secondaryButtonText,
  secondaryButtonLink:
    slide.secondaryButtonLink || defaultSlide.secondaryButtonLink,
  isActive: slide.isActive ?? true,
  sortOrder: slide.sortOrder ?? index,
});

const normalizeHeroPayload = (
  payload: HomeHeroContentPayload,
): IHomeHeroContent => ({
  isActive: payload.isActive ?? true,
  autoplaySeconds: payload.autoplaySeconds ?? 5,
  fadeMs: payload.fadeMs ?? 800,
  slides: (payload.slides?.length ? payload.slides : [defaultSlide])
    .slice(0, 5)
    .map(normalizeSlide)
    .sort((firstSlide, secondSlide) => firstSlide.sortOrder - secondSlide.sortOrder),
});

const getHomeHero = async () => {
  const hero = await HomeHeroContent.findOne().sort({ updatedAt: -1 });
  return hero;
};

const upsertHomeHero = async (
  payload: HomeHeroContentPayload,
  activityContext?: IActivityLogContext,
) => {
  const normalizedPayload = normalizeHeroPayload(payload);
  const existingHero = await HomeHeroContent.findOne().sort({ updatedAt: -1 });

  if (existingHero) {
    const before = existingHero.toObject();
    Object.assign(existingHero, normalizedPayload);
    await existingHero.save();
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'home_content.updated',
      changes: ActivityLogServices.buildActivityChanges(before, existingHero, [
        'isActive',
        'autoplaySeconds',
        'fadeMs',
        'slides',
      ]),
      module: 'home_content',
      severity: 'low',
      status: 'success',
      summary: 'Home hero content was updated',
      targetId: existingHero._id.toString(),
      targetLabel: 'Home hero',
      targetType: 'home_hero',
    });
    return existingHero;
  }

  const createdHero = await HomeHeroContent.create(normalizedPayload);
  await ActivityLogServices.recordActivity({
    ...activityContext,
    action: 'home_content.created',
    module: 'home_content',
    severity: 'low',
    status: 'success',
    summary: 'Home hero content was created',
    targetId: createdHero._id.toString(),
    targetLabel: 'Home hero',
    targetType: 'home_hero',
  });
  return createdHero;
};

export const HomeContentServices = {
  getHomeHero,
  upsertHomeHero,
};

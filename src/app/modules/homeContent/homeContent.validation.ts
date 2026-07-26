import { z } from 'zod';

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const heroSlideSchema = z.object({
  eyebrow: optionalTrimmedString(80),
  title: optionalTrimmedString(120),
  description: optionalTrimmedString(320),
  image: optionalTrimmedString(1000),
  imageAlt: optionalTrimmedString(160),
  primaryButtonText: optionalTrimmedString(60),
  primaryButtonLink: optionalTrimmedString(300),
  secondaryButtonText: optionalTrimmedString(60),
  secondaryButtonLink: optionalTrimmedString(300),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

const updateHomeHeroValidationSchema = z.object({
  isActive: z.boolean().optional(),
  autoplaySeconds: z.number().int().min(1).max(10).optional(),
  fadeMs: z.number().int().min(300).max(1500).optional(),
  slides: z.array(heroSlideSchema).max(5).optional(),
});

export const HomeContentValidations = {
  updateHomeHeroValidationSchema,
};

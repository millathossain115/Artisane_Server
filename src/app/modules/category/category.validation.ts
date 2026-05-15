import { z } from 'zod';

const optionalImageUrlSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' && value.trim() === '') {
      return undefined;
    }

    return value;
  },
  z.string().trim().url({ message: 'Image must be a valid URL' }).optional(),
);

const createCategoryValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Category name is required' })
    .max(100, { message: 'Category name cannot exceed 100 characters' }),
  slug: z
    .string()
    .trim()
    .min(1, { message: 'Category slug is required' })
    .max(100, { message: 'Category slug cannot exceed 100 characters' })
    .transform((value: string) => value.toLowerCase()),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Description cannot exceed 500 characters' })
    .optional(),
  image: optionalImageUrlSchema,
  isDeleted: z.boolean().optional(),
});

export const CategoryValidations = {
  createCategoryValidationSchema,
};

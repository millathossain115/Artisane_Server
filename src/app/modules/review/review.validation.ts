import { z } from 'zod';

const createReviewValidationSchema = z.object({
  product: z.string().trim().min(1, { message: 'Product is required' }),
  rating: z
    .number()
    .min(1, { message: 'Rating must be at least 1' })
    .max(5, { message: 'Rating cannot be more than 5' }),
  comment: z
    .string()
    .trim()
    .max(1000, { message: 'Comment cannot exceed 1000 characters' })
    .optional(),
});

const updateReviewValidationSchema = z.object({
  rating: z
    .number()
    .min(1, { message: 'Rating must be at least 1' })
    .max(5, { message: 'Rating cannot be more than 5' })
    .optional(),
  comment: z
    .string()
    .trim()
    .max(1000, { message: 'Comment cannot exceed 1000 characters' })
    .optional(),
});

const updateReviewVisibilityValidationSchema = z.object({
  isHidden: z.boolean(),
});

export const ReviewValidations = {
  createReviewValidationSchema,
  updateReviewValidationSchema,
  updateReviewVisibilityValidationSchema,
};

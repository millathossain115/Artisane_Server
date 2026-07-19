import { z } from 'zod';

const createWishlistValidationSchema = z.object({
  product: z.string().trim().min(1, { message: 'Product is required' }),
});

export const WishlistValidations = {
  createWishlistValidationSchema,
};

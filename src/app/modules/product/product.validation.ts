import { z } from 'zod';

const createProductValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Product name is required' })
    .max(150, { message: 'Product name cannot exceed 150 characters' }),
  slug: z
    .string()
    .trim()
    .min(1, { message: 'Product slug is required' })
    .max(150, { message: 'Product slug cannot exceed 150 characters' })
    .transform((value: string) => value.toLowerCase()),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description cannot exceed 2000 characters' })
    .optional(),
  price: z.number().min(0, { message: 'Price cannot be negative' }),
  stock: z.number().int().min(0, { message: 'Stock cannot be negative' }),
  category: z.string().trim().min(1, { message: 'Category is required' }),
  brand: z
    .string()
    .trim()
    .max(100, { message: 'Brand cannot exceed 100 characters' })
    .optional(),
  images: z.array(z.url({ message: 'Each image must be a valid URL' })).optional(),
  isDeleted: z.boolean().optional(),
});

export const ProductValidations = {
  createProductValidationSchema,
};

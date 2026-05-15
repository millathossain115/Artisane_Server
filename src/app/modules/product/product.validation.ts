import { z } from 'zod';

const optionalImageUrlsSchema = z.preprocess(
  (value) => {
    if (Array.isArray(value) && value.length === 0) {
      return undefined;
    }

    return value;
  },
  z
    .array(z.string().trim().url({ message: 'Each image must be a valid URL' }))
    .optional(),
);

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
  images: optionalImageUrlsSchema,
  isDeleted: z.boolean().optional(),
});

const updateProductValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Product name cannot be empty' })
    .max(150, { message: 'Product name cannot exceed 150 characters' })
    .optional(),
  slug: z
    .string()
    .trim()
    .min(1, { message: 'Product slug cannot be empty' })
    .max(150, { message: 'Product slug cannot exceed 150 characters' })
    .transform((value: string) => value.toLowerCase())
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description cannot exceed 2000 characters' })
    .optional(),
  price: z.number().min(0, { message: 'Price cannot be negative' }).optional(),
  stock: z
    .number()
    .int()
    .min(0, { message: 'Stock cannot be negative' })
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, { message: 'Category is required' })
    .optional(),
  brand: z
    .string()
    .trim()
    .max(100, { message: 'Brand cannot exceed 100 characters' })
    .optional(),
  images: optionalImageUrlsSchema,
  isDeleted: z.boolean().optional(),
});

export const ProductValidations = {
  createProductValidationSchema,
  updateProductValidationSchema,
};

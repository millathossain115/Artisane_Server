import { z } from 'zod';

const createUserValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(50, { message: 'Name cannot exceed 50 characters' }),
  email: z
    .email({ message: 'Please provide a valid email address' })
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number cannot exceed 20 characters' })
    .optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const UserValidations = {
  createUserValidationSchema,
};

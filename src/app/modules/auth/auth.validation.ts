import { USER_ROLE } from '../user/user.constant.js';
import { z } from 'zod';

const registerUserValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(50, { message: 'Name cannot exceed 50 characters' }),
  email: z
    .string()
    .email({ message: 'Please provide a valid email address' })
    .trim()
    .transform((value: string) => value.toLowerCase()),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(100, { message: 'Password cannot exceed 100 characters' }),
  phone: z
    .string()
    .trim()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number cannot exceed 20 characters' })
    .optional(),
  role: z.enum(Object.keys(USER_ROLE) as [string, ...string[]]).optional(),
});

const loginUserValidationSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please provide a valid email address' })
    .trim()
    .transform((value: string) => value.toLowerCase()),
  password: z.string().min(1, { message: 'Password is required' }),
});

const updateMyProfileValidationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Name cannot be empty' })
      .max(50, { message: 'Name cannot exceed 50 characters' })
      .optional(),
    phone: z
      .string()
      .trim()
      .max(20, { message: 'Phone number cannot exceed 20 characters' })
      .optional(),
    address: z
      .string()
      .trim()
      .max(200, { message: 'Address cannot exceed 200 characters' })
      .optional(),
    city: z
      .string()
      .trim()
      .max(80, { message: 'City cannot exceed 80 characters' })
      .optional(),
    postalCode: z
      .string()
      .trim()
      .max(20, { message: 'Postal code cannot exceed 20 characters' })
      .optional(),
    avatar: z
      .string()
      .trim()
      .max(300, { message: 'Avatar cannot exceed 300 characters' })
      .optional(),
  })
  .strict();

export const AuthValidations = {
  registerUserValidationSchema,
  loginUserValidationSchema,
  updateMyProfileValidationSchema,
};

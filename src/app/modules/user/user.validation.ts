import { USER_ROLE, USER_STATUS } from './user.constant.js';
import { z } from 'zod';
import {
  isMediumPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../../utils/passwordPolicy.js';

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
  password: z
    .string()
    .min(8, { message: PASSWORD_POLICY_MESSAGE })
    .max(100, { message: PASSWORD_POLICY_MESSAGE })
    .refine(isMediumPassword, { message: PASSWORD_POLICY_MESSAGE }),
  phone: z
    .string()
    .trim()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number cannot exceed 20 characters' })
    .optional(),
  role: z.enum(Object.keys(USER_ROLE) as [string, ...string[]]).optional(),
  status: z.enum(Object.keys(USER_STATUS) as [string, ...string[]]).optional(),
  isDeleted: z.boolean().optional(),
});

const updateUserValidationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name cannot be empty' })
    .max(50, { message: 'Name cannot exceed 50 characters' })
    .optional(),
  email: z
    .email({ message: 'Please provide a valid email address' })
    .trim()
    .toLowerCase()
    .optional(),
  phone: z
    .string()
    .trim()
    .min(7, { message: 'Phone number must be at least 7 characters' })
    .max(20, { message: 'Phone number cannot exceed 20 characters' })
    .optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  avatar: z.string().trim().optional(),
  role: z.enum(Object.keys(USER_ROLE) as [string, ...string[]]).optional(),
  status: z.enum(Object.keys(USER_STATUS) as [string, ...string[]]).optional(),
  isDeleted: z.boolean().optional(),
});

export const UserValidations = {
  createUserValidationSchema,
  updateUserValidationSchema,
};

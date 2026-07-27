import { z } from 'zod';

const genderValidationSchema = z.enum([
  'female',
  'male',
  'other',
  'prefer_not_to_say',
]);

const dateOfBirthValidationSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string' || !value.trim()) {
      return undefined;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate;
  },
  z.date({ message: 'Date of birth must be a valid date' }).optional(),
);

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
});

const loginUserValidationSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please provide a valid email address' })
    .trim()
    .transform((value: string) => value.toLowerCase()),
  password: z.string().min(1, { message: 'Password is required' }),
});

const googleAuthValidationSchema = z.object({
  credential: z
    .string()
    .trim()
    .min(1, { message: 'Google credential is required' }),
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
    alternativePhone: z
      .string()
      .trim()
      .max(20, {
        message: 'Alternative phone number cannot exceed 20 characters',
      })
      .optional(),
    dateOfBirth: dateOfBirthValidationSchema,
    gender: genderValidationSchema.optional(),
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
  googleAuthValidationSchema,
  updateMyProfileValidationSchema,
};

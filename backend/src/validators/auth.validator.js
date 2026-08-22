const { z } = require('zod');

// Phone number regex pattern supporting international format (optional)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * User Registration Input Validation Schema
 */
const registerSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(1, 'First name cannot be empty'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(1, 'Last name cannot be empty'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address format')
      .toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(8, 'Confirm password must be at least 8 characters long'),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    bio: z.string().trim().optional(),
    language: z.string().trim().optional().default('en'),
    profileImage: z.string().trim().url('Profile image must be a valid URL').optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * User Login Input Validation Schema
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

module.exports = {
  registerSchema,
  loginSchema,
};

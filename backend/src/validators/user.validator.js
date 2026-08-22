const { z } = require('zod');

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * User Profile Update Validation Schema
 */
const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').optional(),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  language: z.string().trim().optional(),
  profileImage: z.string().trim().url('Profile image must be a valid URL').optional().or(z.literal('')),
});

/**
 * User Password Change Validation Schema
 */
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password cannot be empty'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters long'),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmNewPassword) {
        return data.newPassword === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: 'New passwords do not match',
      path: ['confirmNewPassword'],
    }
  );

/**
 * City ID Parameter Validation Schema
 */
const cityIdParamSchema = z.object({
  cityId: z
    .string({ required_error: 'City ID is required' })
    .uuid('City ID must be a valid UUID'),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  cityIdParamSchema,
};

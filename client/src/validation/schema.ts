import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string(),
})
.refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// User login schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Video upload schema
export const videoUploadSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title is too long'),
  description: z
    .string()
    .min(5, 'Description must be at least 5 characters')
    .max(500, 'Description is too long'),
  file: z
    .instanceof(File)
    .refine(file => file.size > 0, 'Please select a file')
    .refine(
      file => file.size <= 1024 * 1024 * 1024, 
      'File size cannot exceed 1GB'
    )
    .refine(
      file => file.type.startsWith('video/'), 
      'File must be a video'
    ),
});

// Types based on zod schemas
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type VideoUploadFormData = z.infer<typeof videoUploadSchema>;
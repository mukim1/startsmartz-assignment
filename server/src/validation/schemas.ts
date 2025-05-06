import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = registerSchema;

// Video validation schemas
export const createVideoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  filename: z.string(),
  size: z.number().positive().int().max(1024 * 1024 * 1024, 'File size cannot exceed 1GB'),
});

export const initUploadSchema = z.object({
  ...createVideoSchema.shape,
  contentType: z.string(),
  parts: z.number().int().positive(),
});

export const getUploadUrlSchema = z.object({
  videoId: z.string(),
  partNumber: z.coerce.number().int().positive(),
});

export const completePartSchema = z.object({
  videoId: z.string(),
  partNumber: z.number().int().positive(),
  etag: z.string(),
});

export const completeUploadSchema = z.object({
  videoId: z.string(),
});

export const deleteVideoSchema = z.object({
  videoId: z.string(),
});

// Types based on zod schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type InitUploadInput = z.infer<typeof initUploadSchema>;
export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>;
export type CompletePartInput = z.infer<typeof completePartSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
export type DeleteVideoInput = z.infer<typeof deleteVideoSchema>;
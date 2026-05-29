import { z } from 'zod';

export const LoginRequest = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const SessionUser = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  fullName: z.string(),
  email: z.string().nullable(),
  employeeId: z.number().int().positive().nullable(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});
export type SessionUser = z.infer<typeof SessionUser>;

export const LoginResponse = z.object({
  token: z.string(),
  user: SessionUser,
});
export type LoginResponse = z.infer<typeof LoginResponse>;

export const BootstrapRequest = z.object({
  fullName: z.string().min(1),
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/, 'Letters, digits, dot, underscore, hyphen only'),
  password: z.string().min(8, 'Min 8 characters'),
});
export type BootstrapRequest = z.infer<typeof BootstrapRequest>;

export const ChangePasswordRequest = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequest>;

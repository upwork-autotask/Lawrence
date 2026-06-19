import { z } from 'zod';

export const LoginInput = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const BootstrapInput = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof LoginInput>;
export type BootstrapInput = z.infer<typeof BootstrapInput>;

export type MeResponse = {
  id: string;
  username: string;
  fullName: string;
  roleName: string;
  employeeId: string | null;
  permissions: string[];
};

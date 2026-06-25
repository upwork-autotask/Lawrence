import { z } from 'zod';
import { optStr, optUuid, expectedUpdatedAt, ListQuery } from './common';

export const UserCreate = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().uuid('A role is required'),
  employeeId: optUuid,
});

export const UserUpdate = z.object({
  fullName: optStr,
  roleId: z.preprocess((v) => (v === '' ? undefined : v), z.string().uuid().optional()),
  employeeId: optUuid,
  isActive: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.coerce.boolean().optional(),
  ),
  /** Optional password reset; blank means keep the current one. */
  password: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().min(8, 'Password must be at least 8 characters').optional(),
  ),
  expectedUpdatedAt,
});

export const UserListQuery = ListQuery;

export type UserCreate = z.infer<typeof UserCreate>;
export type UserUpdate = z.infer<typeof UserUpdate>;

/** JSON shape returned to the client. NEVER includes passwordHash. */
export type UserRow = {
  id: string;
  username: string;
  fullName: string;
  roleName: string;
  isActive: boolean;
  employeeId: string | null;
  updatedAt: string;
};

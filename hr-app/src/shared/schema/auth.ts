import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { pk, auditColumns } from './common';

export const users = sqliteTable(
  'users',
  {
    id: pk(),
    username: text('username').notNull(),
    email: text('email'),
    fullName: text('full_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    employeeId: integer('employee_id'),
    lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
    ...auditColumns,
  },
  (t) => ({
    usernameIdx: uniqueIndex('users_username_unique').on(t.username),
  }),
);

export const roles = sqliteTable(
  'roles',
  {
    id: pk(),
    name: text('name').notNull(),
    description: text('description'),
    isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
    ...auditColumns,
  },
  (t) => ({
    nameIdx: uniqueIndex('roles_name_unique').on(t.name),
  }),
);

export const rolePermissions = sqliteTable(
  'role_permissions',
  {
    id: pk(),
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(),
    ...auditColumns,
  },
  (t) => ({
    rolePermIdx: uniqueIndex('role_permissions_role_perm_unique').on(t.roleId, t.permission),
  }),
);

export const userRoles = sqliteTable(
  'user_roles',
  {
    id: pk(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    ...auditColumns,
  },
  (t) => ({
    userRoleIdx: uniqueIndex('user_roles_user_role_unique').on(t.userId, t.roleId),
  }),
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: pk(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
    ...auditColumns,
  },
  (t) => ({
    tokenIdx: uniqueIndex('sessions_token_hash_unique').on(t.tokenHash),
    userIdx: index('sessions_user_id_idx').on(t.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type Session = typeof sessions.$inferSelect;

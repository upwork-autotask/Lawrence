import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { pk, auditColumns } from './common';

/** Roles. Maps from legacy `LoginDetails` Admin/Editor/User flags into named roles. */
export const roles = pgTable(
  'roles',
  {
    id: pk(),
    name: text('name').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    ...auditColumns,
  },
  (t) => ({ nameIdx: uniqueIndex('roles_name_unique').on(t.name) }),
);

/** Permission catalogue. Strings of the form `<resource>.<action>[.<scope>]`. */
export const permissions = pgTable(
  'permissions',
  {
    id: pk(),
    key: text('key').notNull(),
    description: text('description'),
    ...auditColumns,
  },
  (t) => ({ keyIdx: uniqueIndex('permissions_key_unique').on(t.key) }),
);

/** Role → permission grants. */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: pk(),
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
    ...auditColumns,
  },
  (t) => ({ rolePermIdx: uniqueIndex('role_permissions_unique').on(t.roleId, t.permissionId) }),
);

/** Login accounts. Maps from legacy `LoginDetails`. */
export const users = pgTable(
  'users',
  {
    id: pk(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    email: text('email'),
    roleId: uuid('role_id').notNull().references(() => roles.id),
    employeeId: uuid('employee_id'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...auditColumns,
  },
  (t) => ({ usernameIdx: uniqueIndex('users_username_unique').on(t.username) }),
);

/** Server-side sessions so logout truly revokes a bearer token. */
export const sessions = pgTable('sessions', {
  id: pk(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  userAgent: text('user_agent'),
  ip: text('ip'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;

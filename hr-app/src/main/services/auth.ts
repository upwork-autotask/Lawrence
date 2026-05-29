import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import { users, roles, rolePermissions, userRoles, sessions, auditLog } from '@shared/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import type { SessionUser } from '@shared/ipc/auth';
import { getOrInitJwtSecret } from './secret';
import log from 'electron-log/main';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export async function bootstrapSuperAdmin(input: {
  fullName: string;
  username: string;
  password: string;
}): Promise<{ token: string; user: SessionUser }> {
  const db = getDb();
  const existing = db.select({ id: users.id }).from(users).limit(1).all();
  if (existing.length > 0) {
    throw Object.assign(new Error('Already bootstrapped'), { code: 'CONFLICT' });
  }
  const passwordHash = await bcrypt.hash(input.password, 12);

  const superAdmin = db.select().from(roles).where(eq(roles.name, 'super_admin')).get();
  if (!superAdmin) throw new Error('Roles not seeded');

  const userId = await mutate<number>((tx) => {
    const u = tx.insert(users).values({
      username: input.username,
      fullName: input.fullName,
      passwordHash,
      isActive: true,
    }).returning().get();

    tx.insert(userRoles).values({ userId: u.id, roleId: superAdmin.id }).run();

    return {
      result: u.id,
      envelope: {
        entity: 'users', entityId: u.id, op: 'insert',
        payload: { username: u.username, fullName: u.fullName },
        baseVersion: 0, userId: u.id, after: { id: u.id, username: u.username },
      },
    };
  });

  return loginAfterCreate(userId);
}

export async function login(username: string, password: string): Promise<{ token: string; user: SessionUser }> {
  const db = getDb();
  const u = db.select().from(users).where(eq(users.username, username)).get();
  if (!u || !u.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHENTICATED' });
  }
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) {
    db.insert(auditLog).values({
      userId: u.id, action: 'fail', entity: 'users', entityId: u.id,
      afterJson: JSON.stringify({ reason: 'bad_password' }),
    }).run();
    throw Object.assign(new Error('Invalid credentials'), { code: 'UNAUTHENTICATED' });
  }

  db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id)).run();
  db.insert(auditLog).values({
    userId: u.id, action: 'login', entity: 'users', entityId: u.id,
  }).run();

  return await issueSession(u.id);
}

export async function loginAfterCreate(userId: number) {
  return issueSession(userId);
}

async function issueSession(userId: number): Promise<{ token: string; user: SessionUser }> {
  const db = getDb();
  const secret = getOrInitJwtSecret();
  const token = jwt.sign({ uid: userId }, secret, { expiresIn: '12h', algorithm: 'HS256' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  }).run();

  const u = db.select().from(users).where(eq(users.id, userId)).get();
  if (!u) throw new Error('User vanished');

  const roleRows = db
    .select({ name: roles.name, id: roles.id })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId))
    .all();

  const roleIds = roleRows.map((r) => r.id);
  const permsRows = roleIds.length
    ? db.select({ p: rolePermissions.permission })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleIds[0]!))  // simple: union across roles
        .all()
    : [];

  // Union across all roles
  const unionPerms = new Set<string>();
  for (const rid of roleIds) {
    const rows = db.select({ p: rolePermissions.permission })
      .from(rolePermissions).where(eq(rolePermissions.roleId, rid)).all();
    rows.forEach((r) => unionPerms.add(r.p));
  }

  const user: SessionUser = {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email ?? null,
    employeeId: u.employeeId ?? null,
    roles: roleRows.map((r) => r.name),
    permissions: [...unionPerms],
  };

  log.info(`Issued session for ${u.username}`);
  return { token, user };
}

export function revokeSession(token: string): void {
  const db = getDb();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  db.update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)))
    .run();
}

export function findActiveSessionByToken(token: string): { userId: number } | null {
  const db = getDb();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = db.select({ userId: sessions.userId, expiresAt: sessions.expiresAt, revokedAt: sessions.revokedAt })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
    .get();
  return row ? { userId: row.userId } : null;
}

export async function buildSessionUser(userId: number): Promise<SessionUser> {
  const { user } = await issueSession(userId);
  return user;
}

export function hasAnyUser(): boolean {
  const db = getDb();
  return db.select({ id: users.id }).from(users).limit(1).all().length > 0;
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
  const db = getDb();
  const u = db.select().from(users).where(eq(users.id, userId)).get();
  if (!u) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  const ok = await bcrypt.compare(currentPassword, u.passwordHash);
  if (!ok) throw Object.assign(new Error('Current password incorrect'), { code: 'UNAUTHENTICATED' });
  const hash = await bcrypt.hash(newPassword, 12);
  db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, userId)).run();
}

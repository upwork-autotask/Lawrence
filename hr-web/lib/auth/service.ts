import { createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { getDb, type Db } from '../db/client';
import { users, roles, sessions } from '../db/schema';
import { Errors } from '../api/errors';
import { hashPassword, verifyPassword } from './password';
import { signToken } from './jwt';
import { SESSION_TTL_SECONDS } from './session';
import { ensureRbacSeeded } from './seed-rbac';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function usersExist(): Promise<boolean> {
  const db = await getDb();
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  return count > 0;
}

export type LoginResult = {
  token: string;
  expiresAt: Date;
  user: { id: string; username: string; fullName: string; roleName: string };
};

async function issueSession(db: Db, userId: string, meta: { ip?: string; userAgent?: string }): Promise<LoginResult & { roleName: string }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const [session] = await db
    .insert(sessions)
    .values({ userId, tokenHash: 'pending', expiresAt, ip: meta.ip, userAgent: meta.userAgent })
    .returning({ id: sessions.id });
  const token = await signToken({ sub: userId, sid: session.id }, SESSION_TTL_SECONDS);
  await db.update(sessions).set({ tokenHash: sha256(token) }).where(eq(sessions.id, session.id));
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

  const [u] = await db
    .select({ id: users.id, username: users.username, fullName: users.fullName, roleName: roles.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  return { token, expiresAt, user: u, roleName: u.roleName };
}

export async function login(username: string, password: string, meta: { ip?: string; userAgent?: string }): Promise<LoginResult> {
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!u || !u.isActive) throw Errors.unauthorized('Invalid username or password');
  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) throw Errors.unauthorized('Invalid username or password');
  return issueSession(db, u.id, meta);
}

export async function logout(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
}

/** First-run: create the initial super_admin. Fails if any user already exists. */
export async function bootstrap(
  input: { fullName: string; username: string; password: string },
  meta: { ip?: string; userAgent?: string },
): Promise<LoginResult> {
  const db = await getDb();
  await ensureRbacSeeded(db);
  if (await usersExist()) throw Errors.badRequest('System already initialised');

  const [adminRole] = await db.select().from(roles).where(eq(roles.name, 'super_admin')).limit(1);
  const passwordHash = await hashPassword(input.password);
  const [u] = await db
    .insert(users)
    .values({ username: input.username, fullName: input.fullName, passwordHash, roleId: adminRole.id })
    .returning({ id: users.id });
  return issueSession(db, u.id, meta);
}

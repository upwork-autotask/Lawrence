import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, auditLog } from '@/lib/db/schema';
import { GET as usersGET, POST as usersPOST } from '@/app/api/users/route';
import { PATCH as userPATCH } from '@/app/api/users/[id]/route';
import { GET as rolesGET } from '@/app/api/roles/route';
import type { Db } from '@/lib/db/client';

type Init = { method?: string; token?: string; body?: unknown };
function req(url: string, init: Init = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('users API (RBAC admin)', () => {
  let db: Db;
  let token: string;
  beforeEach(async () => {
    db = await makeTestDb();
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {});
    token = res.token;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const r = await usersGET(req('/api/users'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('lists roles for the dropdown', async () => {
    const r = await rolesGET(req('/api/roles', { token }), undefined as never);
    expect(r.status).toBe(200);
    const items = (await r.json()).value.items as { name: string }[];
    expect(items.find((i) => i.name === 'hr_officer')).toBeTruthy();
  });

  it('creates a user, allows login, never exposes the hash, supports reset + role change', async () => {
    const [officer] = await db.select().from(roles).where(eq(roles.name, 'hr_officer'));
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));

    // Create
    const create = await usersPOST(
      req('/api/users', {
        method: 'POST', token,
        body: { fullName: 'Jane Doe', username: 'jane', password: 'initialpass1', roleId: officer.id },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const created = (await create.json()).value;
    expect(created.id).toBeTruthy();
    expect(created.passwordHash).toBeUndefined();

    // The new user can log in
    const newLogin = await login('jane', 'initialpass1', {});
    expect(newLogin.token).toBeTruthy();

    // List — no passwordHash anywhere
    const list = await usersGET(req('/api/users', { token }), undefined as never);
    expect(list.status).toBe(200);
    const listed = (await list.json()).value;
    expect(listed.total).toBe(2); // admin + jane
    for (const u of listed.items) expect(u.passwordHash).toBeUndefined();

    // Update role + reset password (optimistic lock with correct token)
    const upd = await userPATCH(
      req(`/api/users/${created.id}`, {
        method: 'PATCH', token,
        body: { roleId: viewer.id, password: 'newpassword2', expectedUpdatedAt: created.updatedAt },
      }),
      params(created.id),
    );
    expect(upd.status).toBe(200);
    const updated = (await upd.json()).value;
    expect(updated.passwordHash).toBeUndefined();

    // New password works; old does not
    const reLogin = await login('jane', 'newpassword2', {});
    expect(reLogin.token).toBeTruthy();
    await expect(login('jane', 'initialpass1', {})).rejects.toThrow();

    // Audit rows for the user never contain a password hash
    const entries = await db.select().from(auditLog).where(eq(auditLog.entityType, 'user'));
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      const blob = JSON.stringify({ before: e.before, after: e.after });
      expect(blob).not.toContain('passwordHash');
      expect(blob).not.toContain('$2'); // bcrypt hash prefix
    }
  });

  it('returns 409 on a stale optimistic-lock token', async () => {
    const [officer] = await db.select().from(roles).where(eq(roles.name, 'hr_officer'));
    const create = await usersPOST(
      req('/api/users', {
        method: 'POST', token,
        body: { fullName: 'Stale User', username: 'stale', password: 'password123', roleId: officer.id },
      }),
      undefined as never,
    );
    const created = (await create.json()).value;
    const stale = await userPATCH(
      req(`/api/users/${created.id}`, {
        method: 'PATCH', token,
        body: { fullName: 'X', expectedUpdatedAt: new Date(0).toISOString() },
      }),
      params(created.id),
    );
    expect(stale.status).toBe(409);
  });

  it('forbids a viewer (no users.manage) with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await usersGET(req('/api/users', { token: vl.token }), undefined as never);
    expect(r.status).toBe(403);
  });
});

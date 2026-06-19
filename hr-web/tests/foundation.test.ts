import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { ensureRbacSeeded } from '@/lib/auth/seed-rbac';
import { bootstrap, login, usersExist } from '@/lib/auth/service';
import { loadActor } from '@/lib/auth/session';
import { roles } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import type { Db } from '@/lib/db/client';

const META = {};

describe('foundation: auth + rbac', () => {
  let db: Db;
  beforeEach(async () => {
    db = await makeTestDb();
  });

  it('starts with no users', async () => {
    expect(await usersExist()).toBe(false);
  });

  it('bootstraps a super_admin, then logs in', async () => {
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, META);
    expect(res.user.username).toBe('admin');
    expect(res.token).toBeTruthy();
    expect(await usersExist()).toBe(true);

    const ok = await login('admin', 'password123', META);
    expect(ok.user.roleName).toBe('super_admin');

    await expect(login('admin', 'wrong-password', META)).rejects.toMatchObject({ status: 401 });
    await expect(login('nobody', 'password123', META)).rejects.toMatchObject({ status: 401 });
  });

  it('refuses a second bootstrap', async () => {
    await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, META);
    await expect(
      bootstrap({ fullName: 'Two', username: 'two', password: 'password123' }, META),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('seeds every role and grants super_admin all permissions', async () => {
    await ensureRbacSeeded(db);
    const roleRows = await db.select().from(roles);
    const names = roleRows.map((r) => r.name).sort();
    expect(names).toEqual(['employee', 'hr_admin', 'hr_officer', 'line_manager', 'super_admin', 'viewer']);
  });

  it('resolves an actor with the full permission set', async () => {
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, META);
    const actor = await loadActor(db, res.user.id);
    expect(actor).not.toBeNull();
    expect(actor!.permissions.has(Permissions.EmployeeWrite)).toBe(true);
    expect(actor!.permissions.size).toBe(Object.values(Permissions).length);
  });

  it('idempotent rbac seed (safe to run twice)', async () => {
    await ensureRbacSeeded(db);
    await ensureRbacSeeded(db);
    const roleRows = await db.select().from(roles).where(eq(roles.name, 'hr_admin'));
    expect(roleRows).toHaveLength(1);
  });
});

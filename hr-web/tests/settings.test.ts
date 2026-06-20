import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, orgSettings } from '@/lib/db/schema';
import { GET as settingsGET, PUT as settingsPUT } from '@/app/api/settings/route';
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

describe('settings API (full handler stack)', () => {
  let db: Db;
  let token: string;
  beforeEach(async () => {
    db = await makeTestDb();
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {});
    token = res.token;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const r = await settingsGET(req('/api/settings'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('returns an empty record when no settings exist', async () => {
    const r = await settingsGET(req('/api/settings', { token }), undefined as never);
    expect(r.status).toBe(200);
    expect((await r.json()).value).toEqual({});
  });

  it('upserts entries, persists them, and updates in place (no duplicates)', async () => {
    const put = await settingsPUT(
      req('/api/settings', {
        method: 'PUT',
        token,
        body: { entries: [{ key: 'orgName', value: 'Acme' }, { key: 'smtpHost', value: 'mail.acme.test' }] },
      }),
      undefined as never,
    );
    expect(put.status).toBe(200);
    expect((await put.json()).value).toMatchObject({ orgName: 'Acme', smtpHost: 'mail.acme.test' });

    // Persisted across a fresh GET
    const get = await settingsGET(req('/api/settings', { token }), undefined as never);
    expect((await get.json()).value).toMatchObject({ orgName: 'Acme', smtpHost: 'mail.acme.test' });

    // Updating an existing key changes its value, not a duplicate row
    const upd = await settingsPUT(
      req('/api/settings', { method: 'PUT', token, body: { entries: [{ key: 'orgName', value: 'Acme Corp' }] } }),
      undefined as never,
    );
    expect(upd.status).toBe(200);
    expect((await upd.json()).value.orgName).toBe('Acme Corp');

    const rows = await db.select().from(orgSettings).where(eq(orgSettings.key, 'orgName'));
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe('Acme Corp');
  });

  it('forbids a viewer (no write permission) with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await settingsPUT(
      req('/api/settings', { method: 'PUT', token: vl.token, body: { entries: [{ key: 'orgName', value: 'x' }] } }),
      undefined as never,
    );
    expect(r.status).toBe(403);
  });
});

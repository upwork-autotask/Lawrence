import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, employees } from '@/lib/db/schema';
import { GET as listGET, POST as listPOST } from '@/app/api/trainings/route';
import { PATCH as onePATCH, DELETE as oneDELETE } from '@/app/api/trainings/[id]/route';
import { POST as internalPOST } from '@/app/api/training-internal/route';
import type { Db } from '@/lib/db/client';

type Init = { method?: string; token?: string; body?: unknown };
function req(url: string, init: Init = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method: init.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(init.token ? { authorization: `Bearer ${init.token}` } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('training API (full handler stack)', () => {
  let db: Db;
  let token: string;
  beforeEach(async () => {
    db = await makeTestDb();
    token = (await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {})).token;
  });

  it('rejects unauthenticated requests with 401', async () => {
    expect((await listGET(req('/api/trainings'), undefined as never)).status).toBe(401);
  });

  it('creates, lists, updates (optimistic lock), assigns, and deletes', async () => {
    const create = await listPOST(
      req('/api/trainings', { method: 'POST', token, body: { name: 'Forklift Safety', kind: 'internal' } }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const t = (await create.json()).value;

    const list = await listGET(req('/api/trainings', { token }), undefined as never);
    expect((await list.json()).value.total).toBe(1);

    const stale = await onePATCH(
      req(`/api/trainings/${t.id}`, { method: 'PATCH', token, body: { name: 'X', expectedUpdatedAt: new Date(0).toISOString() } }),
      params(t.id),
    );
    expect(stale.status).toBe(409);

    const upd = await onePATCH(
      req(`/api/trainings/${t.id}`, { method: 'PATCH', token, body: { name: 'Forklift Safety L2', expectedUpdatedAt: t.updatedAt } }),
      params(t.id),
    );
    expect(upd.status).toBe(200);
    expect((await upd.json()).value.name).toBe('Forklift Safety L2');

    // Assign the course to an employee (internal training)
    const [emp] = await db.insert(employees).values({ employeeNumber: 'E1', firstName: 'Sipho', surname: 'Dlamini' }).returning();
    const assign = await internalPOST(
      req('/api/training-internal', { method: 'POST', token, body: { trainingId: t.id, employeeId: emp.id } }),
      undefined as never,
    );
    expect(assign.status).toBe(201);

    const del = await oneDELETE(req(`/api/trainings/${t.id}`, { method: 'DELETE', token }), params(t.id));
    expect(del.status).toBe(200);
  });

  it('returns 422 on invalid input', async () => {
    const r = await listPOST(req('/api/trainings', { method: 'POST', token, body: { name: '' } }), undefined as never);
    expect(r.status).toBe(422);
    expect((await r.json()).error.code).toBe('VALIDATION');
  });

  it('forbids a viewer with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({ username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id });
    const vl = await login('view', 'password123', {});
    const r = await listPOST(req('/api/trainings', { method: 'POST', token: vl.token, body: { name: 'X', kind: 'internal' } }), undefined as never);
    expect(r.status).toBe(403);
  });
});

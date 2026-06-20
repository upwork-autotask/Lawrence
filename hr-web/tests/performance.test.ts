import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, employees, kpiCategories, kpis } from '@/lib/db/schema';
import { GET as listGET, POST as listPOST } from '@/app/api/performance/route';
import { PATCH as onePATCH, DELETE as oneDELETE } from '@/app/api/performance/[id]/route';
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

describe('performance API (full handler stack)', () => {
  let db: Db;
  let token: string;
  let employeeId: string;
  let kpiId: string;

  beforeEach(async () => {
    db = await makeTestDb();
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {});
    token = res.token;

    const [emp] = await db
      .insert(employees)
      .values({ employeeNumber: 'E1', firstName: 'Thandi', surname: 'Mbeki' })
      .returning();
    employeeId = emp.id;

    const [cat] = await db.insert(kpiCategories).values({ name: 'Delivery' }).returning();
    const [kpi] = await db.insert(kpis).values({ categoryId: cat.id, name: 'On-time delivery' }).returning();
    kpiId = kpi.id;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const r = await listGET(req('/api/performance'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('creates, lists, updates (optimistic lock), and soft-deletes', async () => {
    const create = await listPOST(
      req('/api/performance', {
        method: 'POST',
        token,
        body: {
          employeeId,
          kpiId,
          periodYear: 2026,
          targetValue: 95,
          actualValue: 90,
          score: 4,
          weight: 2,
          managerComments: 'Solid',
        },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const created = (await create.json()).value;
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('draft');
    expect(created.periodYear).toBe(2026);

    const list = await listGET(req('/api/performance', { token }), undefined as never);
    expect((await list.json()).value.total).toBe(1);

    // Stale concurrency token → 409
    const stale = await onePATCH(
      req(`/api/performance/${created.id}`, {
        method: 'PATCH',
        token,
        body: { score: 5, expectedUpdatedAt: new Date(0).toISOString() },
      }),
      params(created.id),
    );
    expect(stale.status).toBe(409);

    // Correct token → 200
    const upd = await onePATCH(
      req(`/api/performance/${created.id}`, {
        method: 'PATCH',
        token,
        body: { score: 5, status: 'approved', expectedUpdatedAt: created.updatedAt },
      }),
      params(created.id),
    );
    expect(upd.status).toBe(200);
    const updated = (await upd.json()).value;
    expect(updated.score).toBe(5);
    expect(updated.status).toBe('approved');

    const del = await oneDELETE(req(`/api/performance/${created.id}`, { method: 'DELETE', token }), params(created.id));
    expect(del.status).toBe(200);

    const list2 = await listGET(req('/api/performance', { token }), undefined as never);
    expect((await list2.json()).value.total).toBe(0); // soft-deleted rows are filtered out
  });

  it('returns 422 with field errors on invalid input', async () => {
    const r = await listPOST(
      req('/api/performance', { method: 'POST', token, body: { employeeId, periodYear: 2026 } }),
      undefined as never,
    );
    expect(r.status).toBe(422);
    const body = await r.json();
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields.kpiId).toBeTruthy();
  });

  it('forbids a viewer (no write permission) with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await listPOST(
      req('/api/performance', {
        method: 'POST',
        token: vl.token,
        body: { employeeId, kpiId, periodYear: 2026 },
      }),
      undefined as never,
    );
    expect(r.status).toBe(403);
  });
});

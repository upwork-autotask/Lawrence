import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, employees, expenseCategories } from '@/lib/db/schema';
import { GET as listGET, POST as listPOST } from '@/app/api/expenses/route';
import { PATCH as onePATCH, DELETE as oneDELETE } from '@/app/api/expenses/[id]/route';
import { POST as approvePOST } from '@/app/api/expenses/[id]/approve/route';
import { POST as carPOST, GET as carGET } from '@/app/api/car-scheme/route';
import { DELETE as carDELETE } from '@/app/api/car-scheme/[id]/route';
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

describe('expenses API (full handler stack)', () => {
  let db: Db;
  let token: string;
  let employeeId: string;
  let categoryId: string;

  beforeEach(async () => {
    db = await makeTestDb();
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {});
    token = res.token;

    const [emp] = await db
      .insert(employees)
      .values({ employeeNumber: 'E1', firstName: 'Thandi', surname: 'Mbeki' })
      .returning();
    employeeId = emp.id;

    const [cat] = await db.insert(expenseCategories).values({ name: 'Travel' }).returning();
    categoryId = cat.id;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const r = await listGET(req('/api/expenses'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('creates, lists, updates (optimistic lock), and soft-deletes an expense; creates a car-scheme record', async () => {
    const create = await listPOST(
      req('/api/expenses', {
        method: 'POST',
        token,
        body: {
          employeeId,
          categoryId,
          expenseDate: '2026-07-01',
          amount: 250.5,
          description: 'Taxi fare',
        },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const created = (await create.json()).value;
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('draft');
    expect(created.currency).toBe('ZAR');

    const list = await listGET(req('/api/expenses', { token }), undefined as never);
    expect((await list.json()).value.total).toBe(1);

    // Stale concurrency token → 409
    const stale = await onePATCH(
      req(`/api/expenses/${created.id}`, {
        method: 'PATCH',
        token,
        body: { amount: 300, expectedUpdatedAt: new Date(0).toISOString() },
      }),
      params(created.id),
    );
    expect(stale.status).toBe(409);

    // Correct token → 200
    const upd = await onePATCH(
      req(`/api/expenses/${created.id}`, {
        method: 'PATCH',
        token,
        body: { amount: 300, expectedUpdatedAt: created.updatedAt },
      }),
      params(created.id),
    );
    expect(upd.status).toBe(200);
    expect((await upd.json()).value.amount).toBe(300);

    // Car scheme: create + list filtered by employee
    const car = await carPOST(
      req('/api/car-scheme', {
        method: 'POST',
        token,
        body: { employeeId, registration: 'CA 123-456', makeModel: 'Toyota Corolla', monthlyAllowance: 4500 },
      }),
      undefined as never,
    );
    expect(car.status).toBe(201);
    const carRow = (await car.json()).value;
    expect(carRow.status).toBe('active');

    const carList = await carGET(req(`/api/car-scheme?employeeId=${employeeId}`, { token }), undefined as never);
    expect((await carList.json()).value.total).toBe(1);

    const carDel = await carDELETE(req(`/api/car-scheme/${carRow.id}`, { method: 'DELETE', token }), params(carRow.id));
    expect(carDel.status).toBe(200);

    const del = await oneDELETE(req(`/api/expenses/${created.id}`, { method: 'DELETE', token }), params(created.id));
    expect(del.status).toBe(200);

    const list2 = await listGET(req('/api/expenses', { token }), undefined as never);
    expect((await list2.json()).value.total).toBe(0); // soft-deleted rows are filtered out
  });

  it('returns 422 with field errors on invalid input', async () => {
    const r = await listPOST(
      req('/api/expenses', { method: 'POST', token, body: { categoryId, amount: 100 } }),
      undefined as never,
    );
    expect(r.status).toBe(422);
    const body = await r.json();
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields.employeeId).toBeTruthy();
  });

  it('computes the VAT breakdown and total from costExVat + vatRate', async () => {
    const create = await listPOST(
      req('/api/expenses', {
        method: 'POST',
        token,
        body: { employeeId, categoryId, expenseDate: '2026-07-01', costExVat: 100, vatRate: 15 },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const c = (await create.json()).value;
    expect(c.costExVat).toBe(100);
    expect(c.vatRate).toBe(15);
    expect(c.vatAmount).toBe(15);
    expect(c.amount).toBe(115); // VAT-inclusive total

    // Patching the rate recomputes the total
    const upd = await onePATCH(
      req(`/api/expenses/${c.id}`, {
        method: 'PATCH',
        token,
        body: { vatRate: 0, expectedUpdatedAt: c.updatedAt },
      }),
      params(c.id),
    );
    expect(upd.status).toBe(200);
    const u = (await upd.json()).value;
    expect(u.vatAmount).toBe(0);
    expect(u.amount).toBe(100);
  });

  it('approves a claim: sets manager status, signatory and overall status', async () => {
    const create = await listPOST(
      req('/api/expenses', {
        method: 'POST',
        token,
        body: { employeeId, categoryId, expenseDate: '2026-07-02', amount: 500, status: 'submitted' },
      }),
      undefined as never,
    );
    const c = (await create.json()).value;
    expect(c.managerStatus).toBe('pending');

    const appr = await approvePOST(
      req(`/api/expenses/${c.id}/approve`, {
        method: 'POST',
        token,
        body: { decision: 'approved', approvedBy: 'Roxanne', expectedUpdatedAt: c.updatedAt },
      }),
      params(c.id),
    );
    expect(appr.status).toBe(201);
    const a = (await appr.json()).value;
    expect(a.managerStatus).toBe('approved');
    expect(a.status).toBe('approved');
    expect(a.approvedBy).toBe('Roxanne');
    expect(a.signedOn).toBeTruthy();
  });

  it('register: returns totalAmount and filters by manager status + date range', async () => {
    for (const [date, amount, mgr] of [
      ['2026-07-01', 100, false],
      ['2026-08-15', 200, true],
      ['2026-09-30', 400, true],
    ] as const) {
      const cr = await listPOST(
        req('/api/expenses', { method: 'POST', token, body: { employeeId, expenseDate: date, amount } }),
        undefined as never,
      );
      const row = (await cr.json()).value;
      if (mgr) {
        await approvePOST(
          req(`/api/expenses/${row.id}/approve`, {
            method: 'POST', token, body: { decision: 'approved', expectedUpdatedAt: row.updatedAt },
          }),
          params(row.id),
        );
      }
    }

    // All three
    const all = await listGET(req('/api/expenses', { token }), undefined as never);
    const allBody = (await all.json()).value;
    expect(allBody.total).toBe(3);
    expect(allBody.totalAmount).toBe(700);

    // Approved only
    const appr = await listGET(req('/api/expenses?managerStatus=approved', { token }), undefined as never);
    const apprBody = (await appr.json()).value;
    expect(apprBody.total).toBe(2);
    expect(apprBody.totalAmount).toBe(600);

    // Date range Aug–Sep
    const ranged = await listGET(req('/api/expenses?from=2026-08-01&to=2026-09-01', { token }), undefined as never);
    const rangedBody = (await ranged.json()).value;
    expect(rangedBody.total).toBe(1);
    expect(rangedBody.totalAmount).toBe(200);
  });

  it('forbids a viewer (no write permission) with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await listPOST(
      req('/api/expenses', {
        method: 'POST',
        token: vl.token,
        body: { employeeId, categoryId, expenseDate: '2026-07-01', amount: 100 },
      }),
      undefined as never,
    );
    expect(r.status).toBe(403);
  });
});

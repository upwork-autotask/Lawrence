import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, employees } from '@/lib/db/schema';
import { GET as listGET, POST as listPOST } from '@/app/api/development/route';
import { PATCH as onePATCH, DELETE as oneDELETE } from '@/app/api/development/[id]/route';
import { GET as qualsGET, POST as qualsPOST } from '@/app/api/dev-quals/route';
import { GET as skillsGET, POST as skillsPOST } from '@/app/api/dev-skills/route';
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

describe('development API (full handler stack)', () => {
  let db: Db;
  let token: string;
  let employeeId: string;

  beforeEach(async () => {
    db = await makeTestDb();
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {});
    token = res.token;

    const [emp] = await db
      .insert(employees)
      .values({ employeeNumber: 'E1', firstName: 'Thandi', surname: 'Mbeki' })
      .returning();
    employeeId = emp.id;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const r = await listGET(req('/api/development'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('creates, lists, adds children, updates (optimistic lock), and soft-deletes', async () => {
    const create = await listPOST(
      req('/api/development', {
        method: 'POST',
        token,
        body: { employeeId, planYear: 2026, summary: 'Grow into a senior role', targetCompletionDate: '2026-12-31' },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const created = (await create.json()).value;
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('draft');
    expect(created.planYear).toBe(2026);

    const list = await listGET(req('/api/development', { token }), undefined as never);
    expect((await list.json()).value.total).toBe(1);

    // Add a qualification child
    const qual = await qualsPOST(
      req('/api/dev-quals', {
        method: 'POST',
        token,
        body: { planId: created.id, qualificationName: 'BCom Honours', institution: 'UCT', cost: 50000 },
      }),
      undefined as never,
    );
    expect(qual.status).toBe(201);
    const createdQual = (await qual.json()).value;
    expect(createdQual.qualificationName).toBe('BCom Honours');

    const qualList = await qualsGET(req(`/api/dev-quals?planId=${created.id}`, { token }), undefined as never);
    expect((await qualList.json()).value.total).toBe(1);

    // Add a skill child
    const skill = await skillsPOST(
      req('/api/dev-skills', {
        method: 'POST',
        token,
        body: { planId: created.id, skillName: 'Leadership', currentLevel: 2, targetLevel: 4 },
      }),
      undefined as never,
    );
    expect(skill.status).toBe(201);
    const createdSkill = (await skill.json()).value;
    expect(createdSkill.targetLevel).toBe(4);

    const skillList = await skillsGET(req(`/api/dev-skills?planId=${created.id}`, { token }), undefined as never);
    expect((await skillList.json()).value.total).toBe(1);

    // Stale concurrency token → 409
    const stale = await onePATCH(
      req(`/api/development/${created.id}`, {
        method: 'PATCH',
        token,
        body: { status: 'in_progress', expectedUpdatedAt: new Date(0).toISOString() },
      }),
      params(created.id),
    );
    expect(stale.status).toBe(409);

    // Correct token → 200
    const upd = await onePATCH(
      req(`/api/development/${created.id}`, {
        method: 'PATCH',
        token,
        body: { status: 'in_progress', expectedUpdatedAt: created.updatedAt },
      }),
      params(created.id),
    );
    expect(upd.status).toBe(200);
    expect((await upd.json()).value.status).toBe('in_progress');

    const del = await oneDELETE(req(`/api/development/${created.id}`, { method: 'DELETE', token }), params(created.id));
    expect(del.status).toBe(200);

    const list2 = await listGET(req('/api/development', { token }), undefined as never);
    expect((await list2.json()).value.total).toBe(0); // soft-deleted rows are filtered out
  });

  it('returns 422 with field errors on invalid input', async () => {
    const r = await listPOST(
      req('/api/development', { method: 'POST', token, body: { summary: 'No employee or year' } }),
      undefined as never,
    );
    expect(r.status).toBe(422);
    const body = await r.json();
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields.employeeId).toBeTruthy();
    expect(body.error.fields.planYear).toBeTruthy();
  });

  it('forbids a viewer (no write permission) with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await listPOST(
      req('/api/development', {
        method: 'POST',
        token: vl.token,
        body: { employeeId, planYear: 2026 },
      }),
      undefined as never,
    );
    expect(r.status).toBe(403);
  });
});

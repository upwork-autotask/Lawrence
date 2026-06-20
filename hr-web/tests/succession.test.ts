import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, employees } from '@/lib/db/schema';
import { GET as rolesGET, POST as rolesPOST } from '@/app/api/critical-roles/route';
import { PATCH as rolePATCH, DELETE as roleDELETE } from '@/app/api/critical-roles/[id]/route';
import { POST as skillsPOST } from '@/app/api/critical-skills/route';
import { GET as skillsGET } from '@/app/api/critical-skills/route';
import { POST as candidatesPOST, GET as candidatesGET } from '@/app/api/succession-candidates/route';
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

describe('succession API (full handler stack)', () => {
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
    const r = await rolesGET(req('/api/critical-roles'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('creates, lists, adds skill + candidate children, optimistic-locks, and soft-deletes', async () => {
    const create = await rolesPOST(
      req('/api/critical-roles', {
        method: 'POST',
        token,
        body: {
          title: 'Chief Engineer',
          incumbentEmployeeId: employeeId,
          riskLevel: 'high',
          reason: 'Single point of failure',
        },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const created = (await create.json()).value;
    expect(created.id).toBeTruthy();
    expect(created.riskLevel).toBe('high');
    expect(created.status).toBe('open');

    const list = await rolesGET(req('/api/critical-roles', { token }), undefined as never);
    expect((await list.json()).value.total).toBe(1);

    // Add a critical skill child
    const skill = await skillsPOST(
      req('/api/critical-skills', {
        method: 'POST',
        token,
        body: { criticalRoleId: created.id, skillName: 'Hydraulics', importance: 'essential' },
      }),
      undefined as never,
    );
    expect(skill.status).toBe(201);

    const skills = await skillsGET(
      req(`/api/critical-skills?criticalRoleId=${created.id}`, { token }),
      undefined as never,
    );
    expect((await skills.json()).value.total).toBe(1);

    // Add a candidate child
    const candidate = await candidatesPOST(
      req('/api/succession-candidates', {
        method: 'POST',
        token,
        body: { criticalRoleId: created.id, employeeId, readiness: 'ready_now' },
      }),
      undefined as never,
    );
    expect(candidate.status).toBe(201);

    const candidates = await candidatesGET(
      req(`/api/succession-candidates?criticalRoleId=${created.id}`, { token }),
      undefined as never,
    );
    expect((await candidates.json()).value.total).toBe(1);

    // Stale concurrency token → 409
    const stale = await rolePATCH(
      req(`/api/critical-roles/${created.id}`, {
        method: 'PATCH',
        token,
        body: { status: 'in_progress', expectedUpdatedAt: new Date(0).toISOString() },
      }),
      params(created.id),
    );
    expect(stale.status).toBe(409);

    // Correct token → 200
    const upd = await rolePATCH(
      req(`/api/critical-roles/${created.id}`, {
        method: 'PATCH',
        token,
        body: { status: 'in_progress', expectedUpdatedAt: created.updatedAt },
      }),
      params(created.id),
    );
    expect(upd.status).toBe(200);
    expect((await upd.json()).value.status).toBe('in_progress');

    const del = await roleDELETE(
      req(`/api/critical-roles/${created.id}`, { method: 'DELETE', token }),
      params(created.id),
    );
    expect(del.status).toBe(200);

    const list2 = await rolesGET(req('/api/critical-roles', { token }), undefined as never);
    expect((await list2.json()).value.total).toBe(0); // soft-deleted rows are filtered out
  });

  it('returns 422 with field errors on invalid input', async () => {
    const r = await rolesPOST(
      req('/api/critical-roles', { method: 'POST', token, body: { riskLevel: 'high' } }),
      undefined as never,
    );
    expect(r.status).toBe(422);
    const body = await r.json();
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields.title).toBeTruthy();
  });

  it('forbids a viewer (no write permission) with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await rolesPOST(
      req('/api/critical-roles', {
        method: 'POST',
        token: vl.token,
        body: { title: 'Chief Engineer', riskLevel: 'high' },
      }),
      undefined as never,
    );
    expect(r.status).toBe(403);
  });
});

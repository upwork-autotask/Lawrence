import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, employees } from '@/lib/db/schema';
import { GET as listGET, POST as listPOST } from '@/app/api/job-descriptions/route';
import { PATCH as onePATCH, DELETE as oneDELETE } from '@/app/api/job-descriptions/[id]/route';
import { GET as entriesGET, POST as entriesPOST } from '@/app/api/jd-entries/route';
import { GET as rolesGET, POST as rolesPOST } from '@/app/api/jd-roles/route';
import { GET as empJdGET, POST as empJdPOST } from '@/app/api/employee-jds/route';
import { DELETE as empJdDELETE } from '@/app/api/employee-jds/[id]/route';
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

describe('job descriptions API (full handler stack)', () => {
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
    const r = await listGET(req('/api/job-descriptions'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('creates, lists, adds children, optimistic-lock, assigns employee, and deletes', async () => {
    // Create JD
    const create = await listPOST(
      req('/api/job-descriptions', {
        method: 'POST',
        token,
        body: { title: 'Site Manager', summary: 'Runs the site', reportsToTitle: 'CEO' },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const created = (await create.json()).value;
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('draft');
    expect(created.version).toBe(1);

    const list = await listGET(req('/api/job-descriptions', { token }), undefined as never);
    expect((await list.json()).value.total).toBe(1);

    // Add a jdEntry
    const entry = await entriesPOST(
      req('/api/jd-entries', {
        method: 'POST',
        token,
        body: { jdId: created.id, section: 'Purpose', body: 'To manage the site.', sortOrder: 1 },
      }),
      undefined as never,
    );
    expect(entry.status).toBe(201);
    const entriesList = await entriesGET(req(`/api/jd-entries?jdId=${created.id}`, { token }), undefined as never);
    expect((await entriesList.json()).value.total).toBe(1);

    // Add a jdRole
    const role = await rolesPOST(
      req('/api/jd-roles', {
        method: 'POST',
        token,
        body: { jdId: created.id, description: 'Ensure safety compliance', weight: 2, sortOrder: 1 },
      }),
      undefined as never,
    );
    expect(role.status).toBe(201);
    const rolesList = await rolesGET(req(`/api/jd-roles?jdId=${created.id}`, { token }), undefined as never);
    expect((await rolesList.json()).value.total).toBe(1);

    // Stale concurrency token → 409
    const stale = await onePATCH(
      req(`/api/job-descriptions/${created.id}`, {
        method: 'PATCH',
        token,
        body: { status: 'active', expectedUpdatedAt: new Date(0).toISOString() },
      }),
      params(created.id),
    );
    expect(stale.status).toBe(409);

    // Correct token → 200
    const upd = await onePATCH(
      req(`/api/job-descriptions/${created.id}`, {
        method: 'PATCH',
        token,
        body: { status: 'active', expectedUpdatedAt: created.updatedAt },
      }),
      params(created.id),
    );
    expect(upd.status).toBe(200);
    expect((await upd.json()).value.status).toBe('active');

    // Assign employeeJd
    const assign = await empJdPOST(
      req('/api/employee-jds', {
        method: 'POST',
        token,
        body: { employeeId, jdId: created.id, assignedAt: '2026-07-01', status: 'assigned' },
      }),
      undefined as never,
    );
    expect(assign.status).toBe(201);
    const assigned = (await assign.json()).value;
    expect(assigned.employeeId).toBe(employeeId);

    const empJdList = await empJdGET(req(`/api/employee-jds?jdId=${created.id}`, { token }), undefined as never);
    expect((await empJdList.json()).value.total).toBe(1);

    const delAssign = await empJdDELETE(
      req(`/api/employee-jds/${assigned.id}`, { method: 'DELETE', token }),
      params(assigned.id),
    );
    expect(delAssign.status).toBe(200);

    // Delete JD
    const del = await oneDELETE(req(`/api/job-descriptions/${created.id}`, { method: 'DELETE', token }), params(created.id));
    expect(del.status).toBe(200);

    const list2 = await listGET(req('/api/job-descriptions', { token }), undefined as never);
    expect((await list2.json()).value.total).toBe(0); // soft-deleted rows are filtered out
  });

  it('returns 422 with field errors on invalid input', async () => {
    const r = await listPOST(
      req('/api/job-descriptions', { method: 'POST', token, body: { summary: 'No title' } }),
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
    const r = await listPOST(
      req('/api/job-descriptions', {
        method: 'POST',
        token: vl.token,
        body: { title: 'Blocked' },
      }),
      undefined as never,
    );
    expect(r.status).toBe(403);
  });
});

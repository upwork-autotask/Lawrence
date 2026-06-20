import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles } from '@/lib/db/schema';
import { POST as empPOST } from '@/app/api/employees/route';
import { GET as auditGET } from '@/app/api/audit/route';
import { GET as reportsGET } from '@/app/api/reports/summary/route';
import { GET as usersGET } from '@/app/api/users/route';
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

describe('admin: audit viewer + reports', () => {
  let db: Db;
  let token: string;
  beforeEach(async () => {
    db = await makeTestDb();
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {});
    token = res.token;
  });

  it('records an audit entry on mutation and the audit viewer returns it (AuditRead)', async () => {
    const create = await empPOST(
      req('/api/employees', { method: 'POST', token, body: { employeeNumber: 'E1', firstName: 'Thandi', surname: 'Mbeki' } }),
      undefined as never,
    );
    expect(create.status).toBe(201);

    const r = await auditGET(req('/api/audit', { token }), undefined as never);
    expect(r.status).toBe(200);
    const body = (await r.json()).value;
    expect(body.total).toBeGreaterThan(0);
    expect(body.items.some((e: { entityType: string }) => e.entityType === 'employee')).toBe(true);

    // entityType filter works
    const filtered = await auditGET(req('/api/audit?entityType=employee', { token }), undefined as never);
    const fbody = (await filtered.json()).value;
    expect(fbody.items.every((e: { entityType: string }) => e.entityType === 'employee')).toBe(true);
  });

  it('returns report summary counts (ReportsRun)', async () => {
    await empPOST(
      req('/api/employees', { method: 'POST', token, body: { employeeNumber: 'E2', firstName: 'Sipho', surname: 'Nkosi' } }),
      undefined as never,
    );
    const r = await reportsGET(req('/api/reports/summary', { token }), undefined as never);
    expect(r.status).toBe(200);
    const summary = (await r.json()).value;
    expect(summary.activeEmployees).toBe(1);
    expect(typeof summary.pendingLeave).toBe('number');
    expect(typeof summary.openDisciplinaryCases).toBe('number');
    expect(typeof summary.trainingCourses).toBe('number');
    expect(typeof summary.performanceReviews).toBe('number');
  });

  it('forbids a viewer on the users route with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await usersGET(req('/api/users', { token: vl.token }), undefined as never);
    expect(r.status).toBe(403);
  });

  it('allows a viewer to read the audit log (viewer has audit.read)', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view2', fullName: 'Viewer Two', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view2', 'password123', {});
    const r = await auditGET(req('/api/audit', { token: vl.token }), undefined as never);
    expect(r.status).toBe(200);
  });
});

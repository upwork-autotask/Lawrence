import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { makeTestDb } from './helpers/db';
import { bootstrap, login } from '@/lib/auth/service';
import { hashPassword } from '@/lib/auth/password';
import { users, roles, employees } from '@/lib/db/schema';
import { GET as requestsGET, POST as requestsPOST } from '@/app/api/recruitment-requests/route';
import { PATCH as requestPATCH, DELETE as requestDELETE } from '@/app/api/recruitment-requests/[id]/route';
import { POST as candidatesPOST } from '@/app/api/candidates/route';
import { POST as interviewsPOST } from '@/app/api/interviews/route';
import { GET as leadsGET, POST as leadsPOST } from '@/app/api/interview-leads/route';
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

describe('recruitment API (full handler stack)', () => {
  let db: Db;
  let token: string;
  let empA: string;
  let empB: string;

  beforeEach(async () => {
    db = await makeTestDb();
    const res = await bootstrap({ fullName: 'Admin', username: 'admin', password: 'password123' }, {});
    token = res.token;

    // Two employees to serve as interview panel members.
    const [a] = await db
      .insert(employees)
      .values({ employeeNumber: 'E1', firstName: 'Thandi', surname: 'Mbeki' })
      .returning();
    empA = a.id;
    const [b] = await db
      .insert(employees)
      .values({ employeeNumber: 'E2', firstName: 'Sipho', surname: 'Dlamini' })
      .returning();
    empB = b.id;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const r = await requestsGET(req('/api/recruitment-requests'), undefined as never);
    expect(r.status).toBe(401);
  });

  it('creates a requisition, candidate, interview, multi-lead panel, optimistic-lock update, delete', async () => {
    // Create a requisition
    const create = await requestsPOST(
      req('/api/recruitment-requests', {
        method: 'POST',
        token,
        body: { positionTitle: 'Senior Engineer', headcount: 2, motivation: 'Growth' },
      }),
      undefined as never,
    );
    expect(create.status).toBe(201);
    const request = (await create.json()).value;
    expect(request.id).toBeTruthy();
    expect(request.status).toBe('draft');
    expect(request.headcount).toBe(2);

    // List requisitions
    const list = await requestsGET(req('/api/recruitment-requests', { token }), undefined as never);
    expect((await list.json()).value.total).toBe(1);

    // Add a candidate
    const cand = await candidatesPOST(
      req('/api/candidates', {
        method: 'POST',
        token,
        body: { requestId: request.id, firstName: 'Nomsa', surname: 'Khumalo', email: 'nomsa@example.com' },
      }),
      undefined as never,
    );
    expect(cand.status).toBe(201);
    const candidate = (await cand.json()).value;
    expect(candidate.status).toBe('applied');

    // Create an interview
    const iv = await interviewsPOST(
      req('/api/interviews', {
        method: 'POST',
        token,
        body: { requestId: request.id, candidateId: candidate.id, stage: 'first' },
      }),
      undefined as never,
    );
    expect(iv.status).toBe(201);
    const interview = (await iv.json()).value;
    expect(interview.status).toBe('scheduled');

    // ── KEY FEATURE: multi-lead interview panel ──────────────────────────
    // Add TWO panel members; one marked primary.
    const lead1 = await leadsPOST(
      req('/api/interview-leads', {
        method: 'POST',
        token,
        body: { interviewId: interview.id, employeeId: empA, roleOnPanel: 'Chair', isPrimary: true },
      }),
      undefined as never,
    );
    expect(lead1.status).toBe(201);
    const primaryLead = (await lead1.json()).value;
    expect(primaryLead.isPrimary).toBe(true);

    const lead2 = await leadsPOST(
      req('/api/interview-leads', {
        method: 'POST',
        token,
        body: { interviewId: interview.id, employeeId: empB, roleOnPanel: 'Technical', isPrimary: false },
      }),
      undefined as never,
    );
    expect(lead2.status).toBe(201);
    const secondLead = (await lead2.json()).value;
    expect(secondLead.isPrimary).toBe(false);

    // Both panel members persist for this interview.
    const leadsList = await leadsGET(
      req(`/api/interview-leads?interviewId=${interview.id}`, { token }),
      undefined as never,
    );
    const leadsBody = (await leadsList.json()).value;
    expect(leadsBody.total).toBe(2);
    const ids = leadsBody.items.map((l: { employeeId: string }) => l.employeeId).sort();
    expect(ids).toEqual([empA, empB].sort());
    expect(leadsBody.items.filter((l: { isPrimary: boolean }) => l.isPrimary)).toHaveLength(1);

    // unique(interviewId, employeeId) rejects a duplicate panel member.
    // The DB unique violation surfaces as a 500 from the handler (not a 2xx),
    // and no third lead row is persisted.
    const dup = await leadsPOST(
      req('/api/interview-leads', {
        method: 'POST',
        token,
        body: { interviewId: interview.id, employeeId: empA, roleOnPanel: 'Duplicate' },
      }),
      undefined as never,
    );
    expect(dup.status).toBeGreaterThanOrEqual(400);

    const leadsAfterDup = await leadsGET(
      req(`/api/interview-leads?interviewId=${interview.id}`, { token }),
      undefined as never,
    );
    expect((await leadsAfterDup.json()).value.total).toBe(2);

    // Stale concurrency token → 409
    const stale = await requestPATCH(
      req(`/api/recruitment-requests/${request.id}`, {
        method: 'PATCH',
        token,
        body: { headcount: 5, expectedUpdatedAt: new Date(0).toISOString() },
      }),
      params(request.id),
    );
    expect(stale.status).toBe(409);

    // Correct token → 200
    const upd = await requestPATCH(
      req(`/api/recruitment-requests/${request.id}`, {
        method: 'PATCH',
        token,
        body: { headcount: 5, expectedUpdatedAt: request.updatedAt },
      }),
      params(request.id),
    );
    expect(upd.status).toBe(200);
    expect((await upd.json()).value.headcount).toBe(5);

    // Soft delete
    const del = await requestDELETE(
      req(`/api/recruitment-requests/${request.id}`, { method: 'DELETE', token }),
      params(request.id),
    );
    expect(del.status).toBe(200);

    const list2 = await requestsGET(req('/api/recruitment-requests', { token }), undefined as never);
    expect((await list2.json()).value.total).toBe(0); // soft-deleted rows filtered out
  });

  it('returns 422 with field errors on invalid input', async () => {
    const r = await requestsPOST(
      req('/api/recruitment-requests', { method: 'POST', token, body: { headcount: 1 } }),
      undefined as never,
    );
    expect(r.status).toBe(422);
    const body = await r.json();
    expect(body.error.code).toBe('VALIDATION');
    expect(body.error.fields.positionTitle).toBeTruthy();
  });

  it('forbids a viewer (no write permission) with 403', async () => {
    const [viewer] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    await db.insert(users).values({
      username: 'view', fullName: 'Viewer', passwordHash: await hashPassword('password123'), roleId: viewer.id,
    });
    const vl = await login('view', 'password123', {});
    const r = await requestsPOST(
      req('/api/recruitment-requests', {
        method: 'POST',
        token: vl.token,
        body: { positionTitle: 'Senior Engineer' },
      }),
      undefined as never,
    );
    expect(r.status).toBe(403);
  });
});

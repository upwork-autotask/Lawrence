import { asc, desc, eq, ilike, type SQL } from 'drizzle-orm';
import { recruitmentRequests, candidates, interviews, interviewLeads, evaluations } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listRequests(
  ctx: Ctx,
  input: {
    q?: string;
    status?: string;
    departmentId?: string;
    regionId?: string;
    jobTitleId?: string;
    employmentType?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(recruitmentRequests.status, input.status));
  if (input.departmentId) where.push(eq(recruitmentRequests.departmentId, input.departmentId));
  if (input.regionId) where.push(eq(recruitmentRequests.regionId, input.regionId));
  if (input.jobTitleId) where.push(eq(recruitmentRequests.jobTitleId, input.jobTitleId));
  if (input.employmentType) where.push(eq(recruitmentRequests.employmentType, input.employmentType));
  if (input.q) where.push(ilike(recruitmentRequests.positionTitle, `%${input.q}%`));
  const { items, total } = await crudList(ctx.tx, recruitmentRequests, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(recruitmentRequests.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listCandidates(
  ctx: Ctx,
  input: { requestId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.requestId) where.push(eq(candidates.requestId, input.requestId));
  const { items, total } = await crudList(ctx.tx, candidates, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(candidates.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listInterviews(
  ctx: Ctx,
  input: { requestId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.requestId) where.push(eq(interviews.requestId, input.requestId));
  const { items, total } = await crudList(ctx.tx, interviews, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(interviews.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listInterviewLeads(
  ctx: Ctx,
  input: { interviewId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.interviewId) where.push(eq(interviewLeads.interviewId, input.interviewId));
  const { items, total } = await crudList(ctx.tx, interviewLeads, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(interviewLeads.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listEvaluations(
  ctx: Ctx,
  input: { interviewId?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 100;
  const where: SQL[] = [];
  if (input.interviewId) where.push(eq(evaluations.interviewId, input.interviewId));
  const { items, total } = await crudList(ctx.tx, evaluations, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(evaluations.createdAt),
  });
  return { items, total, page, pageSize };
}

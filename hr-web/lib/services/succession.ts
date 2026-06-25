import { asc, desc, eq, ilike, type SQL } from 'drizzle-orm';
import {
  criticalRoles, criticalSkills, successionCandidates, successionCommitments,
} from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listCriticalRoles(
  ctx: Ctx,
  input: {
    q?: string;
    status?: string;
    riskLevel?: string;
    regionId?: string;
    departmentId?: string;
    jobTitleId?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(criticalRoles.status, input.status));
  if (input.riskLevel) where.push(eq(criticalRoles.riskLevel, input.riskLevel));
  if (input.regionId) where.push(eq(criticalRoles.regionId, input.regionId));
  if (input.departmentId) where.push(eq(criticalRoles.departmentId, input.departmentId));
  if (input.jobTitleId) where.push(eq(criticalRoles.jobTitleId, input.jobTitleId));
  if (input.q) where.push(ilike(criticalRoles.title, `%${input.q}%`));
  const { items, total } = await crudList(ctx.tx, criticalRoles, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(criticalRoles.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listSkills(ctx: Ctx, roleId: string) {
  const { items, total } = await crudList(ctx.tx, criticalSkills, {
    where: [eq(criticalSkills.criticalRoleId, roleId)],
    limit: 200,
    orderBy: asc(criticalSkills.createdAt),
  });
  return { items, total, page: 1, pageSize: 200 };
}

export async function listCandidates(ctx: Ctx, roleId: string) {
  const { items, total } = await crudList(ctx.tx, successionCandidates, {
    where: [eq(successionCandidates.criticalRoleId, roleId)],
    limit: 200,
    orderBy: desc(successionCandidates.createdAt),
  });
  return { items, total, page: 1, pageSize: 200 };
}

export async function listCommitments(ctx: Ctx, candidateId: string) {
  const { items, total } = await crudList(ctx.tx, successionCommitments, {
    where: [eq(successionCommitments.candidateId, candidateId)],
    limit: 200,
    orderBy: asc(successionCommitments.createdAt),
  });
  return { items, total, page: 1, pageSize: 200 };
}

import { desc, eq, type SQL } from 'drizzle-orm';
import { employeeTrainingInternal, employeeTrainingExternal } from '../db/schema/employee-training';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listEmployeeTrainingInternal(
  ctx: Ctx,
  input: { employeeId?: string; trainingId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(employeeTrainingInternal.employeeId, input.employeeId));
  if (input.trainingId) where.push(eq(employeeTrainingInternal.trainingId, input.trainingId));
  if (input.status) where.push(eq(employeeTrainingInternal.status, input.status));
  const { items, total } = await crudList(ctx.tx, employeeTrainingInternal, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(employeeTrainingInternal.createdAt),
  });
  return { items, total, page, pageSize };
}

export async function listEmployeeTrainingExternal(
  ctx: Ctx,
  input: { employeeId?: string; trainingId?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.employeeId) where.push(eq(employeeTrainingExternal.employeeId, input.employeeId));
  if (input.trainingId) where.push(eq(employeeTrainingExternal.trainingId, input.trainingId));
  if (input.status) where.push(eq(employeeTrainingExternal.status, input.status));
  const { items, total } = await crudList(ctx.tx, employeeTrainingExternal, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: desc(employeeTrainingExternal.createdAt),
  });
  return { items, total, page, pageSize };
}

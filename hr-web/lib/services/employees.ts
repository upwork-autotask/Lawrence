import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { employees } from '../db/schema';
import { crudList } from '../api/crud';
import type { Ctx } from '../api/handler';

export async function listEmployees(
  ctx: Ctx,
  input: { q?: string; status?: string; page?: number; pageSize?: number },
) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const where: SQL[] = [];
  if (input.status) where.push(eq(employees.employmentStatus, input.status));
  if (input.q) {
    const like = `%${input.q}%`;
    where.push(
      or(
        ilike(employees.firstName, like),
        ilike(employees.surname, like),
        ilike(employees.employeeNumber, like),
      ) as SQL,
    );
  }
  const { items, total } = await crudList(ctx.tx, employees, {
    where,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: asc(employees.surname),
  });
  return { items, total, page, pageSize };
}

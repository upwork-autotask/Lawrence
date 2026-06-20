import { desc, eq, type SQL } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { EmployeeTestCreate, EmployeeTestListQuery } from '@/lib/api/contracts/training';
import { employeeTests } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: EmployeeTestListQuery,
  permission: Permissions.TrainingRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: SQL[] = [];
    if (input.employeeId) where.push(eq(employeeTests.employeeId, input.employeeId));
    if (input.trainingInternalId) where.push(eq(employeeTests.trainingInternalId, input.trainingInternalId));
    const { items, total } = await crudList(ctx.tx, employeeTests, {
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(employeeTests.createdAt),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: EmployeeTestCreate,
  permission: Permissions.TrainingWrite,
  handler: (input, ctx) => crudCreate(ctx, employeeTests, 'employee_test', input),
});

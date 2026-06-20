import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import {
  employees,
  leaveForms,
  disciplinaryCases,
  trainingsCatalogue,
  employeePerformance,
  recruitmentRequests,
  developmentPlans,
} from '../db/schema';
import type { Ctx } from '../api/handler';
import type { Db } from '../db/client';

async function countWhere(tx: Db, table: unknown, conds: SQL[]): Promise<number> {
  // Loosely typed: the table objects don't share a common Drizzle type here, but
  // every table in the summary carries `deletedAt` so the where clause is valid.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [{ count }] = await (tx as any)
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(conds.length ? and(...conds) : undefined);
  return count;
}

export type ReportSummary = {
  activeEmployees: number;
  pendingLeave: number;
  openDisciplinaryCases: number;
  trainingCourses: number;
  performanceReviews: number;
  openRecruitment: number;
  developmentPlans: number;
};

export async function summary(ctx: Ctx): Promise<ReportSummary> {
  const tx = ctx.tx;
  const [
    activeEmployees,
    pendingLeave,
    openDisciplinaryCases,
    trainingCourses,
    performanceReviews,
    openRecruitment,
    developmentPlansCount,
  ] = await Promise.all([
    countWhere(tx, employees, [isNull(employees.deletedAt), eq(employees.employmentStatus, 'active')]),
    countWhere(tx, leaveForms, [isNull(leaveForms.deletedAt), eq(leaveForms.status, 'submitted')]),
    countWhere(tx, disciplinaryCases, [isNull(disciplinaryCases.deletedAt), eq(disciplinaryCases.status, 'open')]),
    countWhere(tx, trainingsCatalogue, [isNull(trainingsCatalogue.deletedAt)]),
    countWhere(tx, employeePerformance, [isNull(employeePerformance.deletedAt)]),
    countWhere(tx, recruitmentRequests, [isNull(recruitmentRequests.deletedAt)]),
    countWhere(tx, developmentPlans, [isNull(developmentPlans.deletedAt)]),
  ]);

  return {
    activeEmployees,
    pendingLeave,
    openDisciplinaryCases,
    trainingCourses,
    performanceReviews,
    openRecruitment,
    developmentPlans: developmentPlansCount,
  };
}

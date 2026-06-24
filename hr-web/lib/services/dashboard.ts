import { and, eq, gte, isNull, sql, desc, type SQL } from 'drizzle-orm';
import {
  employees, depots, regions, leaveForms, disciplinaryCases,
  expenses, recruitmentRequests, employeeTakeOns,
  candidates, recruitmentTargets, trainingInternal, trainingExternal, employeePerformance,
} from '../db/schema';
import type { Ctx } from '../api/handler';
import type { Db } from '../db/client';

type Bucket = { label: string; count: number };

async function count(tx: Db, table: unknown, conds: SQL[]): Promise<number> {
  const [{ c }] = await (tx as any)
    .select({ c: sql<number>`count(*)::int` })
    .from(table)
    .where(conds.length ? and(...conds) : undefined);
  return c;
}

/** group active employees by a column, resolving a joined lookup name. */
async function groupActive(
  tx: Db,
  col: unknown,
  lookup?: { table: any; name: any },
): Promise<Bucket[]> {
  const labelExpr = lookup ? lookup.name : (col as never);
  let qb = (tx as any)
    .select({ label: labelExpr, count: sql<number>`count(*)::int` })
    .from(employees);
  if (lookup) qb = qb.leftJoin(lookup.table, eq(col as never, lookup.table.id));
  const rows = await qb
    .where(and(isNull(employees.deletedAt), eq(employees.employmentStatus, 'active')))
    .groupBy(labelExpr)
    .orderBy(desc(sql`count(*)`));
  return rows.map((r: { label: string | null; count: number }) => ({ label: r.label ?? 'Unassigned', count: r.count }));
}

/** Group any soft-deletable table by a column into labelled counts. */
async function groupBy(tx: Db, table: any, col: any, extra: SQL[] = []): Promise<Bucket[]> {
  const rows = await (tx as any)
    .select({ label: col, count: sql<number>`count(*)::int` })
    .from(table)
    .where(and(isNull(table.deletedAt), ...extra))
    .groupBy(col)
    .orderBy(desc(sql`count(*)`));
  return rows.map((r: { label: string | null; count: number }) => ({ label: r.label ?? 'Unknown', count: r.count }));
}

export type DashboardAlert = { key: string; severity: 'high' | 'medium' | 'low'; label: string; count: number; href: string };

export type HrDashboard = {
  headcount: { active: number; total: number; newHires90d: number };
  byStatus: Bucket[];
  byDepot: Bucket[];
  byRegion: Bucket[];
  byGender: Bucket[];
  pending: { leave: number; claims: number; disciplinary: number; recruitment: number; takeOns: number };
  alerts: DashboardAlert[];
  recruitment: { requestsByStatus: Bucket[]; candidatesByStatus: Bucket[]; targets: { year: number; target: number; achieved: number }[] };
  training: { byStatus: Bucket[]; completed: number; total: number };
  performance: { byStatus: Bucket[]; avgScore: number; total: number };
};

export async function hrDashboard(ctx: Ctx): Promise<HrDashboard> {
  const tx = ctx.tx;
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const activeOnly = [isNull(employees.deletedAt), eq(employees.employmentStatus, 'active')];

  const [
    active, total, newHires90d,
    byStatus, byDepot, byRegion, byGender,
    pendingLeave, pendingClaims, openDisc, openRec, submittedTakeOns,
    noBank, noEmergency, noId,
  ] = await Promise.all([
    count(tx, employees, activeOnly),
    count(tx, employees, [isNull(employees.deletedAt)]),
    count(tx, employees, [...activeOnly, gte(employees.hireDate, since)]),
    groupActive(tx, employees.employmentStatus),
    groupActive(tx, employees.depotId, { table: depots, name: depots.name }),
    groupActive(tx, employees.regionId, { table: regions, name: regions.name }),
    groupActive(tx, employees.gender),
    count(tx, leaveForms, [isNull(leaveForms.deletedAt), eq(leaveForms.status, 'submitted')]),
    count(tx, expenses, [isNull(expenses.deletedAt), eq(expenses.managerStatus, 'pending')]),
    count(tx, disciplinaryCases, [isNull(disciplinaryCases.deletedAt), eq(disciplinaryCases.status, 'open')]),
    count(tx, recruitmentRequests, [
      isNull(recruitmentRequests.deletedAt),
      sql`${recruitmentRequests.status} not in ('filled', 'cancelled')`,
    ]),
    count(tx, employeeTakeOns, [isNull(employeeTakeOns.deletedAt), eq(employeeTakeOns.status, 'submitted')]),
    count(tx, employees, [...activeOnly, isNull(employees.accountNumber)]),
    count(tx, employees, [...activeOnly, isNull(employees.emergencyName)]),
    count(tx, employees, [...activeOnly, isNull(employees.idNumber)]),
  ]);

  // Submitted take-ons whose onboarding checklist is incomplete.
  const incompleteTakeOns = await count(tx, employeeTakeOns, [
    isNull(employeeTakeOns.deletedAt),
    eq(employeeTakeOns.status, 'submitted'),
    sql`NOT (${employeeTakeOns.docIdCard} AND ${employeeTakeOns.docContractOfEmp} AND ${employeeTakeOns.docBankConfirmation})`,
  ]);

  const allAlerts: DashboardAlert[] = [
    { key: 'no-bank', severity: 'high', label: 'Active employees with no bank account', count: noBank, href: '/employees' },
    { key: 'no-id', severity: 'high', label: 'Active employees with no ID number', count: noId, href: '/employees' },
    { key: 'no-emergency', severity: 'medium', label: 'Active employees with no emergency contact', count: noEmergency, href: '/employees' },
    { key: 'claims-approval', severity: 'medium', label: 'Expense claims awaiting approval', count: pendingClaims, href: '/expenses' },
    { key: 'leave-approval', severity: 'medium', label: 'Leave requests awaiting approval', count: pendingLeave, href: '/leave' },
    { key: 'takeon-incomplete', severity: 'medium', label: 'Submitted take-ons with missing key documents', count: incompleteTakeOns, href: '/employees/take-ons' },
    { key: 'open-disciplinary', severity: 'low', label: 'Open disciplinary cases', count: openDisc, href: '/disciplinary' },
  ];
  const alerts = allAlerts.filter((a) => a.count > 0);

  // ── Module dashboards (Access frmRecruitmentDash / FrmTrainDash / frmKPIdash) ──
  const [requestsByStatus, candidatesByStatus, trainInt, trainExt, perfByStatus] = await Promise.all([
    groupBy(tx, recruitmentRequests, recruitmentRequests.status),
    groupBy(tx, candidates, candidates.status),
    groupBy(tx, trainingInternal, trainingInternal.status),
    groupBy(tx, trainingExternal, trainingExternal.status),
    groupBy(tx, employeePerformance, employeePerformance.status),
  ]);

  const targetRows = await (tx as any)
    .select({
      year: recruitmentTargets.periodYear,
      target: sql<number>`coalesce(sum(${recruitmentTargets.targetCount}), 0)::int`,
      achieved: sql<number>`coalesce(sum(${recruitmentTargets.achievedCount}), 0)::int`,
    })
    .from(recruitmentTargets)
    .where(isNull(recruitmentTargets.deletedAt))
    .groupBy(recruitmentTargets.periodYear)
    .orderBy(recruitmentTargets.periodYear);

  // Merge internal + external training by status.
  const trainMap = new Map<string, number>();
  for (const b of [...trainInt, ...trainExt]) trainMap.set(b.label, (trainMap.get(b.label) ?? 0) + b.count);
  const trainingByStatus = [...trainMap].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const trainingTotal = [...trainMap.values()].reduce((a, b) => a + b, 0);
  const trainingCompleted = trainMap.get('completed') ?? 0;

  const [{ avgScore, perfTotal }] = await (tx as any)
    .select({
      avgScore: sql<number>`coalesce(round(avg(${employeePerformance.score})::numeric, 1), 0)::float`,
      perfTotal: sql<number>`count(*)::int`,
    })
    .from(employeePerformance)
    .where(isNull(employeePerformance.deletedAt));

  return {
    headcount: { active, total, newHires90d },
    byStatus, byDepot, byRegion, byGender,
    pending: { leave: pendingLeave, claims: pendingClaims, disciplinary: openDisc, recruitment: openRec, takeOns: submittedTakeOns },
    alerts,
    recruitment: {
      requestsByStatus,
      candidatesByStatus,
      targets: targetRows.map((r: { year: number; target: number; achieved: number }) => r),
    },
    training: { byStatus: trainingByStatus, completed: trainingCompleted, total: trainingTotal },
    performance: { byStatus: perfByStatus, avgScore, total: perfTotal },
  };
}

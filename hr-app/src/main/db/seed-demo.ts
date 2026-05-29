import { getDb } from './connection';
import {
  users, roles, userRoles,
  regions, departments, jobTitles, depots, tiers, patersonGrades, eeGroups, nbcCouncils, taxStatuses,
  employees,
  leaveTypes, leaveForms,
  natureOfOffence, disciplinaryActions, disciplinaryCases,
  kpiCategories, kpis, employeePerformance,
  jobDescriptions, jdEntries, jdRoles, jdKpis, employeeJds, jdTrainingInternal,
  trainingsCatalogue, trainingInternal,
  developmentPlans, qualDev, skillsDev, devExperience,
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import log from 'electron-log/main';

/**
 * Demo seed. Idempotent — only runs when the users table is empty, which
 * means a freshly-installed instance. Existing installs are untouched.
 *
 * Writes go directly with Drizzle (not through mutate()) because seed
 * inserts represent the initial state — there's no user to attribute them to
 * and no sync history yet.
 */
export function seedDemoData(): void {
  const db = getDb();

  if (db.select({ id: users.id }).from(users).limit(1).all().length > 0) {
    return;
  }

  log.info('Seeding demo data (first-run, fresh database)…');

  // ---------- Lookups ----------
  const regionRows = db.insert(regions).values([
    { name: 'Gauteng', code: 'GP', sortOrder: 1 },
    { name: 'Western Cape', code: 'WC', sortOrder: 2 },
    { name: 'KwaZulu-Natal', code: 'KZN', sortOrder: 3 },
    { name: 'Eastern Cape', code: 'EC', sortOrder: 4 },
    { name: 'Free State', code: 'FS', sortOrder: 5 },
  ]).returning().all();

  const deptRows = db.insert(departments).values([
    { name: 'Operations', code: 'OPS', sortOrder: 1 },
    { name: 'Finance', code: 'FIN', sortOrder: 2 },
    { name: 'Human Resources', code: 'HR', sortOrder: 3 },
    { name: 'Information Technology', code: 'IT', sortOrder: 4 },
    { name: 'Sales & Marketing', code: 'SM', sortOrder: 5 },
    { name: 'Logistics', code: 'LOG', sortOrder: 6 },
  ]).returning().all();

  const titleRows = db.insert(jobTitles).values([
    { name: 'General Manager' },
    { name: 'HR Manager' },
    { name: 'Operations Supervisor' },
    { name: 'Driver' },
    { name: 'Warehouse Clerk' },
    { name: 'Accountant' },
    { name: 'IT Administrator' },
    { name: 'Sales Representative' },
  ]).returning().all();

  const depotRows = db.insert(depots).values([
    { name: 'Johannesburg North' },
    { name: 'Cape Town' },
    { name: 'Durban Central' },
    { name: 'Port Elizabeth' },
  ]).returning().all();

  const tierRows = db.insert(tiers).values([
    { name: 'Executive', sortOrder: 1 },
    { name: 'Senior Management', sortOrder: 2 },
    { name: 'Middle Management', sortOrder: 3 },
    { name: 'Operations', sortOrder: 4 },
    { name: 'Junior', sortOrder: 5 },
  ]).returning().all();

  db.insert(patersonGrades).values([
    { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }, { name: 'F' },
  ]).run();

  db.insert(eeGroups).values([
    { name: 'African Male' }, { name: 'African Female' },
    { name: 'Coloured Male' }, { name: 'Coloured Female' },
    { name: 'Indian Male' }, { name: 'Indian Female' },
    { name: 'White Male' }, { name: 'White Female' },
    { name: 'Foreign National' },
  ]).run();

  db.insert(nbcCouncils).values([
    { name: 'NBCRFLI', description: 'Road Freight & Logistics Industry' },
    { name: 'NBCWPS', description: 'Wholesale & Retail Sector' },
  ]).run();

  db.insert(taxStatuses).values([
    { name: 'PAYE' },
    { name: 'Provisional' },
    { name: 'IRP5 Exempt' },
  ]).run();

  // ---------- Leave types ----------
  const leaveTypeRows = db.insert(leaveTypes).values([
    { name: 'Annual leave', defaultDays: 21, accrualPerMonth: 1.75, requiresAttachment: false },
    { name: 'Sick leave', defaultDays: 30, accrualPerMonth: 0, requiresAttachment: true },
    { name: 'Family responsibility', defaultDays: 3, accrualPerMonth: 0, requiresAttachment: false },
    { name: 'Maternity', defaultDays: 120, accrualPerMonth: 0, requiresAttachment: true },
    { name: 'Study', defaultDays: 10, accrualPerMonth: 0, requiresAttachment: true },
  ]).returning().all();

  // ---------- Disciplinary lookups ----------
  const offenceRows = db.insert(natureOfOffence).values([
    { name: 'Late arrival' },
    { name: 'Unauthorised absenteeism' },
    { name: 'Insubordination' },
    { name: 'Theft' },
    { name: 'Negligence' },
    { name: 'Harassment' },
  ]).returning().all();

  const actionRows = db.insert(disciplinaryActions).values([
    { name: 'Verbal warning', sortOrder: 1 },
    { name: 'Written warning', sortOrder: 2 },
    { name: 'Final written warning', sortOrder: 3 },
    { name: 'Suspension', sortOrder: 4 },
    { name: 'Dismissal', sortOrder: 5 },
  ]).returning().all();

  // ---------- KPIs ----------
  const kpiCatRows = db.insert(kpiCategories).values([
    { name: 'Financial', sortOrder: 1 },
    { name: 'Customer', sortOrder: 2 },
    { name: 'Operations', sortOrder: 3 },
    { name: 'People', sortOrder: 4 },
  ]).returning().all();

  const kpiRows = db.insert(kpis).values([
    { categoryId: kpiCatRows[0]!.id, name: 'Revenue target', unit: 'ZAR', targetDirection: 'higher_better' },
    { categoryId: kpiCatRows[0]!.id, name: 'Cost variance', unit: '%', targetDirection: 'lower_better' },
    { categoryId: kpiCatRows[1]!.id, name: 'Customer satisfaction', unit: '%', targetDirection: 'higher_better' },
    { categoryId: kpiCatRows[2]!.id, name: 'On-time delivery', unit: '%', targetDirection: 'higher_better' },
    { categoryId: kpiCatRows[3]!.id, name: 'Training compliance', unit: '%', targetDirection: 'higher_better' },
  ]).returning().all();

  // ---------- Demo user (super_admin) ----------
  const superAdminRole = db.select().from(roles).where(eq(roles.name, 'super_admin')).get();
  if (!superAdminRole) throw new Error('super_admin role missing — roles must be seeded first');

  const demoPasswordHash = bcrypt.hashSync('demo1234', 10);
  const demoUser = db.insert(users).values({
    username: 'demo',
    fullName: 'Demo Administrator',
    email: 'demo@example.com',
    passwordHash: demoPasswordHash,
    isActive: true,
  }).returning().get();
  if (!demoUser) throw new Error('Failed to insert demo user');
  db.insert(userRoles).values({ userId: demoUser.id, roleId: superAdminRole.id }).run();

  // ---------- Employees ----------
  const region = (code: string) => regionRows.find((r) => r.code === code)!.id;
  const dept = (code: string) => deptRows.find((r) => r.code === code)!.id;
  const title = (name: string) => titleRows.find((r) => r.name === name)!.id;
  const tier = (name: string) => tierRows.find((r) => r.name === name)!.id;
  const depot = (name: string) => depotRows.find((r) => r.name === name)!.id;

  const empRows = db.insert(employees).values([
    {
      employeeNumber: 'EMP001', firstName: 'Pieter', surname: 'van der Merwe',
      email: 'pieter.vdmerwe@example.com', phoneMobile: '+27 82 555 0101',
      regionId: region('WC'), departmentId: dept('OPS'), jobTitleId: title('General Manager'),
      depotId: depot('Cape Town'), tierId: tier('Executive'),
      hireDate: new Date('2018-03-15'), employmentStatus: 'active',
    },
    {
      employeeNumber: 'EMP002', firstName: 'Thandiwe', surname: 'Mbeki',
      email: 'thandiwe.mbeki@example.com', phoneMobile: '+27 83 555 0102',
      regionId: region('GP'), departmentId: dept('HR'), jobTitleId: title('HR Manager'),
      depotId: depot('Johannesburg North'), tierId: tier('Senior Management'),
      hireDate: new Date('2019-06-01'), employmentStatus: 'active',
    },
    {
      employeeNumber: 'EMP003', firstName: 'Sipho', surname: 'Dlamini',
      email: 'sipho.dlamini@example.com', phoneMobile: '+27 84 555 0103',
      regionId: region('KZN'), departmentId: dept('OPS'), jobTitleId: title('Operations Supervisor'),
      depotId: depot('Durban Central'), tierId: tier('Middle Management'),
      hireDate: new Date('2020-01-20'), employmentStatus: 'active',
    },
    {
      employeeNumber: 'EMP004', firstName: 'Lerato', surname: 'Molefe',
      email: 'lerato.molefe@example.com', phoneMobile: '+27 82 555 0104',
      regionId: region('GP'), departmentId: dept('FIN'), jobTitleId: title('Accountant'),
      depotId: depot('Johannesburg North'), tierId: tier('Middle Management'),
      hireDate: new Date('2021-08-12'), employmentStatus: 'active',
    },
    {
      employeeNumber: 'EMP005', firstName: 'Ayanda', surname: 'Ngcobo',
      email: 'ayanda.ngcobo@example.com', phoneMobile: '+27 83 555 0105',
      regionId: region('KZN'), departmentId: dept('LOG'), jobTitleId: title('Driver'),
      depotId: depot('Durban Central'), tierId: tier('Operations'),
      hireDate: new Date('2022-04-04'), employmentStatus: 'active',
    },
    {
      employeeNumber: 'EMP006', firstName: 'Nadia', surname: 'Patel',
      email: 'nadia.patel@example.com', phoneMobile: '+27 84 555 0106',
      regionId: region('WC'), departmentId: dept('IT'), jobTitleId: title('IT Administrator'),
      depotId: depot('Cape Town'), tierId: tier('Middle Management'),
      hireDate: new Date('2020-11-09'), employmentStatus: 'active',
    },
    {
      employeeNumber: 'EMP007', firstName: 'Sibusiso', surname: 'Khumalo',
      email: 'sibusiso.khumalo@example.com', phoneMobile: '+27 82 555 0107',
      regionId: region('EC'), departmentId: dept('SM'), jobTitleId: title('Sales Representative'),
      depotId: depot('Port Elizabeth'), tierId: tier('Operations'),
      hireDate: new Date('2023-02-15'), employmentStatus: 'active',
    },
    {
      employeeNumber: 'EMP008', firstName: 'Anika', surname: 'Naidoo',
      email: 'anika.naidoo@example.com', phoneMobile: '+27 83 555 0108',
      regionId: region('GP'), departmentId: dept('LOG'), jobTitleId: title('Warehouse Clerk'),
      depotId: depot('Johannesburg North'), tierId: tier('Junior'),
      hireDate: new Date('2023-09-01'), employmentStatus: 'active',
    },
  ]).returning().all();

  const pieter = empRows[0]!, thandiwe = empRows[1]!, sipho = empRows[2]!,
        lerato = empRows[3]!, ayanda = empRows[4]!, nadia = empRows[5]!,
        sibusiso = empRows[6]!, anika = empRows[7]!;

  // Wire line-manager references
  db.update(employees).set({ lineManagerId: pieter.id }).where(eq(employees.id, thandiwe.id)).run();
  db.update(employees).set({ lineManagerId: pieter.id }).where(eq(employees.id, sipho.id)).run();
  db.update(employees).set({ lineManagerId: thandiwe.id }).where(eq(employees.id, lerato.id)).run();
  db.update(employees).set({ lineManagerId: sipho.id }).where(eq(employees.id, ayanda.id)).run();
  db.update(employees).set({ lineManagerId: thandiwe.id }).where(eq(employees.id, nadia.id)).run();
  db.update(employees).set({ lineManagerId: pieter.id }).where(eq(employees.id, sibusiso.id)).run();
  db.update(employees).set({ lineManagerId: sipho.id }).where(eq(employees.id, anika.id)).run();

  // suppress unused-var warning for nadia + sibusiso (left in for the demo employee roster)
  void nadia; void sibusiso;

  // ---------- Leave applications ----------
  const annualType = leaveTypeRows.find((t) => t.name === 'Annual leave')!.id;
  const sickType = leaveTypeRows.find((t) => t.name === 'Sick leave')!.id;
  const now = Date.now();
  const days = (n: number) => n * 86_400_000;

  db.insert(leaveForms).values([
    {
      employeeId: lerato.id, leaveTypeId: annualType,
      startDate: new Date(now + days(7)), endDate: new Date(now + days(11)),
      daysRequested: 5, reason: 'Family holiday',
      status: 'approved',
      lineManagerId: thandiwe.id, lineManagerStatus: 'approved',
      lineManagerDecidedAt: new Date(now - days(1)),
      hrId: thandiwe.id, hrStatus: 'approved', hrDecidedAt: new Date(now - days(1)),
    },
    {
      employeeId: sipho.id, leaveTypeId: sickType,
      startDate: new Date(now - days(2)), endDate: new Date(now - days(1)),
      daysRequested: 2, reason: 'Flu — doctor\'s note attached',
      status: 'submitted',
      lineManagerId: pieter.id, lineManagerStatus: 'approved', lineManagerDecidedAt: new Date(now - days(1)),
      hrStatus: 'pending',
    },
    {
      employeeId: ayanda.id, leaveTypeId: annualType,
      startDate: new Date(now + days(14)), endDate: new Date(now + days(28)),
      daysRequested: 11, reason: 'Long break',
      status: 'rejected',
      lineManagerId: sipho.id, lineManagerStatus: 'rejected',
      lineManagerDecidedAt: new Date(now - days(2)),
      lineManagerComments: 'Peak season — please rebook for October.',
    },
  ]).run();

  // ---------- Disciplinary cases ----------
  const insubordination = offenceRows.find((o) => o.name === 'Insubordination')!.id;
  const lateArrival = offenceRows.find((o) => o.name === 'Late arrival')!.id;
  const verbalWarning = actionRows.find((a) => a.name === 'Verbal warning')!.id;

  db.insert(disciplinaryCases).values([
    {
      caseNumber: 'DC-2026-001',
      employeeId: sipho.id, offenceId: insubordination,
      incidentDate: new Date(now - days(5)), reportedDate: new Date(now - days(4)),
      reportedBy: pieter.id,
      description: 'Refused to attend safety briefing on 2026-05-22.',
      status: 'under_investigation',
    },
    {
      caseNumber: 'DC-2026-002',
      employeeId: anika.id, offenceId: lateArrival, actionId: verbalWarning,
      incidentDate: new Date(now - days(20)), reportedDate: new Date(now - days(19)),
      reportedBy: sipho.id,
      description: 'Repeated late arrival across two weeks.',
      status: 'closed',
      outcome: 'Verbal warning issued, employee acknowledged.',
      closedDate: new Date(now - days(10)), closedBy: thandiwe.id,
    },
  ]).run();

  // ---------- Job description (Operations Supervisor) ----------
  const jd = db.insert(jobDescriptions).values({
    title: 'Operations Supervisor', version: 1, status: 'active',
    summary: 'Supervises day-to-day depot operations, coordinates drivers, and ensures on-time delivery.',
    reportsToTitle: 'General Manager', preparedBy: thandiwe.id,
    approvedByCeoAt: new Date(now - days(40)),
    effectiveDate: new Date(now - days(35)),
  }).returning().get()!;

  db.insert(jdEntries).values([
    { jdId: jd.id, section: 'Purpose', body: 'Ensure efficient, safe, and compliant depot operations.', sortOrder: 1 },
    { jdId: jd.id, section: 'Scope', body: 'Reports to GM. Manages drivers and warehouse clerks for the region.', sortOrder: 2 },
    { jdId: jd.id, section: 'Context', body: 'Operates within NBCRFLI council requirements.', sortOrder: 3 },
  ]).run();

  db.insert(jdRoles).values([
    { jdId: jd.id, description: 'Coordinate daily driver schedules and depot workflow.', weight: 0.4, sortOrder: 1 },
    { jdId: jd.id, description: 'Conduct safety briefings and ensure PPE compliance.', weight: 0.3, sortOrder: 2 },
    { jdId: jd.id, description: 'Investigate incidents and report to HR + GM.', weight: 0.3, sortOrder: 3 },
  ]).run();

  const onTimeKpi = kpiRows.find((k) => k.name === 'On-time delivery')!.id;
  const trainingKpi = kpiRows.find((k) => k.name === 'Training compliance')!.id;
  db.insert(jdKpis).values([
    { jdId: jd.id, kpiId: onTimeKpi, target: '≥ 95%', weight: 0.6, sortOrder: 1 },
    { jdId: jd.id, kpiId: trainingKpi, target: '100% within 30 days', weight: 0.4, sortOrder: 2 },
  ]).run();

  db.insert(employeeJds).values({
    employeeId: sipho.id, jdId: jd.id, assignedAt: new Date(now - days(30)),
    lineManagerId: pieter.id, hrId: thandiwe.id,
    ceoApprovedAt: new Date(now - days(28)), status: 'signed_off',
  }).run();

  // ---------- Training ----------
  const forklift = db.insert(trainingsCatalogue).values({
    code: 'FLT-001', name: 'Forklift Safety Training', kind: 'internal',
    durationHours: 8, cost: 0, description: 'Mandatory annual refresher for warehouse staff.',
    isActive: true, requiresQuiz: true,
  }).returning().get()!;

  db.insert(trainingsCatalogue).values([
    { code: 'FA-101', name: 'First Aid Level 1', kind: 'external', provider: 'St John', durationHours: 16, cost: 1850 },
    { code: 'FIN-AML', name: 'Anti-Money-Laundering Awareness', kind: 'blended', durationHours: 4, cost: 0 },
  ]).run();

  db.insert(jdTrainingInternal).values({
    jdId: jd.id, trainingId: forklift.id, required: true, frequency: 'Annual', sortOrder: 1,
  }).run();

  db.insert(trainingInternal).values([
    {
      trainingId: forklift.id, employeeId: ayanda.id,
      scheduledDate: new Date(now + days(5)),
      status: 'scheduled', approvalStatus: 'approved',
      approvedBy: sipho.id, approvedAt: new Date(now - days(1)),
    },
    {
      trainingId: forklift.id, employeeId: anika.id,
      scheduledDate: new Date(now + days(5)),
      status: 'scheduled', approvalStatus: 'pending',
    },
  ]).run();

  // ---------- Performance reviews ----------
  db.insert(employeePerformance).values([
    {
      employeeId: sipho.id, periodYear: 2026, periodQuarter: 3, periodLabel: 'Q3 2026',
      kpiId: onTimeKpi, targetValue: 95, actualValue: 92, score: 92, weight: 0.6,
      managerComments: 'Slightly below target — peak-season pressure.',
      status: 'reviewed',
      lineManagerId: pieter.id, lineManagerDecidedAt: new Date(now - days(3)),
      hrId: thandiwe.id, hrDecidedAt: new Date(now - days(2)),
    },
    {
      employeeId: lerato.id, periodYear: 2026, periodQuarter: 3, periodLabel: 'Q3 2026',
      kpiId: kpiRows.find((k) => k.name === 'Cost variance')!.id,
      targetValue: 5, actualValue: 3.2, score: 100, weight: 1,
      managerComments: 'Excellent cost discipline.',
      status: 'approved',
      lineManagerId: thandiwe.id, lineManagerDecidedAt: new Date(now - days(5)),
      hrId: thandiwe.id, hrDecidedAt: new Date(now - days(4)),
      excoDecidedAt: new Date(now - days(2)),
    },
  ]).run();

  // ---------- Development plan ----------
  const plan = db.insert(developmentPlans).values({
    employeeId: lerato.id, planYear: 2026,
    summary: 'Develop Lerato toward Senior Finance Analyst within 18 months.',
    status: 'in_progress',
    lineManagerId: thandiwe.id, lineManagerStatus: 'approved', lineManagerDecidedAt: new Date(now - days(20)),
    hrId: thandiwe.id, hrStatus: 'approved', hrDecidedAt: new Date(now - days(18)),
    complianceStatus: 'approved', complianceDecidedAt: new Date(now - days(15)),
    excoStatus: 'approved', excoDecidedAt: new Date(now - days(10)),
    targetCompletionDate: new Date('2027-12-31'),
  }).returning().get()!;

  db.insert(qualDev).values({
    planId: plan.id, qualificationName: 'B.Com Honours (Accounting)',
    institution: 'UNISA', startDate: new Date('2026-02-01'),
    targetCompletionDate: new Date('2027-11-30'), status: 'in_progress',
    cost: 38000, sortOrder: 1,
  }).run();

  db.insert(skillsDev).values([
    { planId: plan.id, skillName: 'IFRS 17 reporting', category: 'Technical', currentLevel: 2, targetLevel: 4, status: 'in_progress', sortOrder: 1 },
    { planId: plan.id, skillName: 'Power BI dashboards', category: 'Technical', currentLevel: 3, targetLevel: 5, status: 'in_progress', sortOrder: 2 },
  ]).run();

  db.insert(devExperience).values({
    planId: plan.id, experienceType: 'Rotation',
    description: 'Three-month rotation through the Cape Town operations finance team.',
    startDate: new Date('2026-07-01'), endDate: new Date('2026-09-30'),
    mentorId: pieter.id, status: 'planned', sortOrder: 1,
  }).run();

  log.info('Demo data seeded successfully. Login with username "demo" / password "demo1234".');
}

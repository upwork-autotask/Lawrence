import { sql } from 'drizzle-orm';
import type { Db } from './client';
import {
  users, roles, employees, regions, departments, jobTitles,
  leaveTypes, natureOfOffence, disciplinaryActions,
} from './schema';
import { ensureRbacSeeded } from '../auth/seed-rbac';
import { hashPassword } from '../auth/password';

async function count(db: Db, table: any): Promise<number> {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(table);
  return c;
}

const names = (xs: string[]) => xs.map((name, i) => ({ name, sortOrder: i }));

/**
 * Idempotent demo seed: RBAC, a demo admin (demo / demo1234), core lookups, and
 * a handful of realistic South African employee records. Safe to re-run.
 */
export async function seedDemo(db: Db): Promise<void> {
  await ensureRbacSeeded(db);

  if ((await count(db, users)) === 0) {
    const [admin] = await db.select().from(roles).where(sql`${roles.name} = 'super_admin'`).limit(1);
    await db.insert(users).values({
      username: 'demo',
      fullName: 'Demo Administrator',
      passwordHash: await hashPassword('demo1234'),
      roleId: admin.id,
    });
  }

  if ((await count(db, departments)) === 0) {
    await db.insert(departments).values(names(['Finance', 'Operations', 'Human Resources', 'Sales', 'Information Technology']));
  }
  if ((await count(db, regions)) === 0) {
    await db.insert(regions).values(names(['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape']));
  }
  if ((await count(db, jobTitles)) === 0) {
    await db.insert(jobTitles).values(names(['General Manager', 'Accountant', 'HR Officer', 'Sales Representative', 'Software Developer', 'Operations Supervisor']));
  }
  if ((await count(db, leaveTypes)) === 0) {
    await db.insert(leaveTypes).values([
      { name: 'Annual Leave', code: 'ANN', defaultDays: 21, accrualPerMonth: 1.75 },
      { name: 'Sick Leave', code: 'SICK', defaultDays: 30 },
      { name: 'Family Responsibility', code: 'FAM', defaultDays: 3 },
      { name: 'Maternity Leave', code: 'MAT', defaultDays: 120 },
    ]);
  }
  if ((await count(db, natureOfOffence)) === 0) {
    await db.insert(natureOfOffence).values(names(['Misconduct', 'Absenteeism', 'Insubordination', 'Poor performance', 'Theft']));
  }
  if ((await count(db, disciplinaryActions)) === 0) {
    await db.insert(disciplinaryActions).values(names(['Verbal warning', 'Written warning', 'Final written warning', 'Suspension', 'Dismissal']));
  }

  if ((await count(db, employees)) === 0) {
    const dept = await db.select().from(departments);
    const reg = await db.select().from(regions);
    const jt = await db.select().from(jobTitles);
    const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
    const people = [
      ['EMP001', 'Pieter', 'van der Merwe', 'male'],
      ['EMP002', 'Thandiwe', 'Mbeki', 'female'],
      ['EMP003', 'Sipho', 'Dlamini', 'male'],
      ['EMP004', 'Lerato', 'Molefe', 'female'],
      ['EMP005', 'Ayanda', 'Ngcobo', 'female'],
      ['EMP006', 'Nadia', 'Patel', 'female'],
      ['EMP007', 'Sibusiso', 'Khumalo', 'male'],
      ['EMP008', 'Anika', 'Naidoo', 'female'],
    ];
    await db.insert(employees).values(
      people.map(([employeeNumber, firstName, surname, gender], i) => ({
        employeeNumber, firstName, surname, gender,
        employmentStatus: 'active',
        departmentId: pick(dept, i).id,
        regionId: pick(reg, i).id,
        jobTitleId: pick(jt, i).id,
        hireDate: new Date(2020 + (i % 4), i % 12, 1 + (i % 27)),
      })),
    );
  }
}

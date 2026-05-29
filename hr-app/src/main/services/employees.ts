import { getDb } from '../db/connection';
import { mutate } from '../db/mutate';
import {
  employees, regions, departments, jobTitles,
} from '@shared/schema';
import { and, eq, like, sql, asc, desc, isNull } from 'drizzle-orm';
import type {
  EmployeeFormValues, EmployeesListRequest, EmployeeRow,
} from '@shared/ipc/employees';

type ListResult = { rows: EmployeeRow[]; total: number };

export function listEmployees(req: EmployeesListRequest): ListResult {
  const db = getDb();

  const conds = [isNull(employees.deletedAt)];
  if (req.status) conds.push(eq(employees.employmentStatus, req.status));
  if (req.departmentId) conds.push(eq(employees.departmentId, req.departmentId));
  if (req.regionId) conds.push(eq(employees.regionId, req.regionId));
  if (req.search) {
    const q = `%${req.search.toLowerCase()}%`;
    conds.push(sql`(
      lower(${employees.firstName}) LIKE ${q} OR
      lower(${employees.surname})   LIKE ${q} OR
      lower(${employees.employeeNumber}) LIKE ${q} OR
      lower(coalesce(${employees.email}, '')) LIKE ${q}
    )`);
  }

  const where = conds.length ? and(...conds) : undefined;

  const rows = db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      surname: employees.surname,
      email: employees.email,
      phoneMobile: employees.phoneMobile,
      employmentStatus: employees.employmentStatus,
      departmentName: departments.name,
      jobTitleName: jobTitles.name,
      regionName: regions.name,
      hireDate: employees.hireDate,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobTitles, eq(employees.jobTitleId, jobTitles.id))
    .leftJoin(regions, eq(employees.regionId, regions.id))
    .where(where)
    .orderBy(asc(employees.surname), asc(employees.firstName))
    .limit(req.limit)
    .offset(req.offset)
    .all();

  const total = db.select({ c: sql<number>`count(*)` }).from(employees).where(where).get()?.c ?? 0;

  return {
    rows: rows.map((r) => ({
      id: r.id,
      employeeNumber: r.employeeNumber,
      firstName: r.firstName,
      surname: r.surname,
      fullName: `${r.firstName} ${r.surname}`.trim(),
      email: r.email,
      phoneMobile: r.phoneMobile,
      employmentStatus: r.employmentStatus,
      departmentName: r.departmentName,
      jobTitleName: r.jobTitleName,
      regionName: r.regionName,
      hireDate: r.hireDate ? r.hireDate.getTime() : null,
    })),
    total,
  };
}

export function getEmployee(id: number): EmployeeRow | null {
  const db = getDb();
  const row = db
    .select({
      id: employees.id,
      employeeNumber: employees.employeeNumber,
      firstName: employees.firstName,
      surname: employees.surname,
      email: employees.email,
      phoneMobile: employees.phoneMobile,
      employmentStatus: employees.employmentStatus,
      departmentName: departments.name,
      jobTitleName: jobTitles.name,
      regionName: regions.name,
      hireDate: employees.hireDate,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobTitles, eq(employees.jobTitleId, jobTitles.id))
    .leftJoin(regions, eq(employees.regionId, regions.id))
    .where(and(eq(employees.id, id), isNull(employees.deletedAt)))
    .get();
  if (!row) return null;
  return {
    id: row.id,
    employeeNumber: row.employeeNumber,
    firstName: row.firstName,
    surname: row.surname,
    fullName: `${row.firstName} ${row.surname}`.trim(),
    email: row.email,
    phoneMobile: row.phoneMobile,
    employmentStatus: row.employmentStatus,
    departmentName: row.departmentName,
    jobTitleName: row.jobTitleName,
    regionName: row.regionName,
    hireDate: row.hireDate ? row.hireDate.getTime() : null,
  };
}

function toInsertValues(v: EmployeeFormValues, userId?: number) {
  return {
    employeeNumber: v.employeeNumber,
    firstName: v.firstName,
    surname: v.surname,
    middleNames: v.middleNames ?? null,
    knownAs: v.knownAs ?? null,
    email: v.email && v.email !== '' ? v.email : null,
    phoneMobile: v.phoneMobile ?? null,
    phoneHome: v.phoneHome ?? null,
    idNumber: v.idNumber ?? null,
    dateOfBirth: v.dateOfBirth ?? null,
    gender: v.gender ?? null,
    maritalStatus: v.maritalStatus ?? null,
    nationality: v.nationality ?? null,
    ethnicity: v.ethnicity ?? null,
    physicalAddress: v.physicalAddress ?? null,
    postalAddress: v.postalAddress ?? null,
    hireDate: v.hireDate ?? null,
    terminationDate: v.terminationDate ?? null,
    employmentStatus: v.employmentStatus,
    contractType: v.contractType ?? null,
    regionId: v.regionId ?? null,
    departmentId: v.departmentId ?? null,
    jobTitleId: v.jobTitleId ?? null,
    depotId: v.depotId ?? null,
    tierId: v.tierId ?? null,
    patersonGradeId: v.patersonGradeId ?? null,
    eeGroupId: v.eeGroupId ?? null,
    nbcCouncilId: v.nbcCouncilId ?? null,
    taxStatusId: v.taxStatusId ?? null,
    lineManagerId: v.lineManagerId ?? null,
    notes: v.notes ?? null,
    createdBy: userId,
    updatedBy: userId,
  };
}

export async function createEmployee(values: EmployeeFormValues, userId: number): Promise<{ id: number }> {
  return mutate<{ id: number }>((tx) => {
    const inserted = tx.insert(employees).values(toInsertValues(values, userId)).returning().get();
    return {
      result: { id: inserted.id },
      envelope: {
        entity: 'employees', entityId: inserted.id, op: 'insert',
        payload: inserted, baseVersion: 0, userId, after: inserted,
      },
    };
  });
}

export async function updateEmployee(id: number, values: EmployeeFormValues, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employees).where(eq(employees.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const next = { ...toInsertValues(values, userId), updatedAt: new Date(), syncVersion: (before.syncVersion ?? 0) + 1 };
    tx.update(employees).set(next).where(eq(employees.id, id)).run();
    const after = tx.select().from(employees).where(eq(employees.id, id)).get();
    return {
      result: null,
      envelope: {
        entity: 'employees', entityId: id, op: 'update',
        payload: next, baseVersion: before.syncVersion ?? 0, userId,
        before, after,
      },
    };
  });
}

export async function deleteEmployee(id: number, userId: number): Promise<void> {
  await mutate<null>((tx) => {
    const before = tx.select().from(employees).where(eq(employees.id, id)).get();
    if (!before || before.deletedAt) {
      throw Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
    }
    const now = new Date();
    tx.update(employees)
      .set({ deletedAt: now, updatedAt: now, updatedBy: userId, syncVersion: (before.syncVersion ?? 0) + 1 })
      .where(eq(employees.id, id))
      .run();
    return {
      result: null,
      envelope: {
        entity: 'employees', entityId: id, op: 'delete',
        payload: { id }, baseVersion: before.syncVersion ?? 0, userId, before,
      },
    };
  });
}

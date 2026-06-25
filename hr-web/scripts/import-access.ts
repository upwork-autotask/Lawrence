/**
 * import-access.ts
 * ────────────────
 * Reads CSV files exported from HR0405_v1.0.accdb (via mdb-export) and inserts
 * them into the HR web app's PostgreSQL database using Drizzle ORM.
 *
 * Run:  npx tsx scripts/import-access.ts
 *
 * Strategy:
 *   1. Migrate DB (create tables if needed)
 *   2. Seed RBAC (roles & permissions)
 *   3. Insert lookup tables (build legacy_id → uuid maps)
 *   4. Insert employees (hub table)
 *   5. Insert transactional / detail tables
 *   6. Backfill self-referential FK (lineManagerId on employees)
 *   7. Create user accounts from LoginDetails
 *   8. Report results
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sql, eq } from 'drizzle-orm';
import { getDb } from '../lib/db/client.js';
import { migrateDb } from '../lib/db/migrate.js';
import {
  // lookups
  regions, departments, jobTitles, depots, tiers, patersonGrades,
  eeGroups, taxStatuses, successionSchemes,
  costOfSale, activities, overheads, sites, grading,
  // core
  employees,
  // leave
  leaveTypes, leaveForms,
  // disciplinary
  natureOfOffence, disciplinaryActions,
  // performance
  kpiCategories, kpis,
  // training
  trainingsCatalogue, analysisSkills, quizQuestions, quizAnswers,
  // job descriptions
  jobDescriptions, jdEntries, jdRoles, jdKpis,
  jdTrainingInternal, jdTrainingExternal, employeeJds,
  // development
  developmentPlans,
  // succession
  criticalRoles, criticalSkills, successionCandidates, successionCommitments,
  // recruitment
  nonRecruitmentReasons, recruitmentRequests, recruitmentTargets, interviewQuestions, actualRecruitment,
  // expenses
  expenseCategories, expenses,
  // exit
  exitRecords,
  // auth
  users, roles,
} from '../lib/db/schema/index.js';
import { ensureRbacSeeded } from '../lib/auth/seed-rbac.js';
import { hashPassword } from '../lib/auth/password.js';

// ─── Paths ───────────────────────────────────────────────────────────────────
const DATA_DIR = join(import.meta.dirname, '..', 'import-data');

// ─── CSV parser ──────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function readCSV(filename: string): Record<string, string>[] {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) { console.warn(`  ⚠ CSV not found: ${filename}`); return []; }
  const raw = readFileSync(path, 'utf-8').replace(/\r/g, '');
  const lines = raw.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? '').trim(); });
    return obj;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Coerce to integer or null. */
function toInt(v: string | undefined): number | null {
  if (!v || v === '') return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

/** Coerce to float or null. */
function toFloat(v: string | undefined): number | null {
  if (!v || v === '' || v === '[]') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/** Parse Access date string → Date or null. */
function toDate(v: string | undefined): Date | null {
  if (!v || v === '' || v === '1905-07-17 00:00:00') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Clean string: empty/whitespace → null, otherwise trimmed. */
function str(v: string | undefined): string | null {
  if (!v) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

/** Format phone: ensure it has leading zero and strip non-digits. */
function phone(v: string | undefined): string | null {
  if (!v || v === '' || v === '0') return null;
  let n = v.replace(/\.0$/, '').replace(/[^0-9]/g, '');
  if (n.length === 9) n = '0' + n; // SA numbers missing leading 0
  return n.length >= 9 ? n : null;
}

// ─── Tracking ────────────────────────────────────────────────────────────────
const stats: { table: string; inserted: number; skipped: number; errors: string[] }[] = [];
function log(table: string, inserted: number, skipped = 0, errors: string[] = []) {
  stats.push({ table, inserted, skipped, errors });
  const emoji = errors.length ? '⚠' : '✓';
  console.log(`  ${emoji} ${table}: ${inserted} inserted, ${skipped} skipped${errors.length ? ` (${errors.length} errors)` : ''}`);
}

// ─── Maps from legacy integer IDs to UUIDs ───────────────────────────────────
type IdMap = Map<number, string>;

const regionMap: IdMap = new Map();
const departmentMap: IdMap = new Map();
const jobTitleMap: IdMap = new Map();
const depotMap: IdMap = new Map();
const tierMap: IdMap = new Map();
const taxStatusMap: IdMap = new Map();
const leaveTypeMap: IdMap = new Map();
const offenceMap: IdMap = new Map();
const discActionMap: IdMap = new Map();
const kpiCategoryMap: IdMap = new Map();
const kpiMap: IdMap = new Map();
const schemeMap: IdMap = new Map();
const expenseCategoryMap: IdMap = new Map();
const costOfSaleMap: IdMap = new Map();
const activitiesMap: IdMap = new Map();
const overheadsMap: IdMap = new Map();
const nonRecruitReasonMap: IdMap = new Map();
const trainingMap: IdMap = new Map();
const employeeMap: IdMap = new Map();    // EmployeeID → uuid
const jobDescMap: IdMap = new Map();     // JobDescriptionID → uuid
const jdDetailMap: IdMap = new Map();    // JoBID → uuid (jd_entries)
const critRoleMap: IdMap = new Map();    // tblCritical.ID → uuid
const succCandidateMap: IdMap = new Map();
const eeGroupMap: Map<string, string> = new Map(); // name → uuid
const patersonMap: Map<string, string> = new Map(); // grade name → uuid
const quizQuestionMap: IdMap = new Map();

// ─── Depot code → uuid (for employee.Depo which uses Code not DepotID) ──────
const depotCodeMap: Map<string, string> = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('┌─ Access → PostgreSQL Import');
  console.log('│');

  const db = await getDb();
  console.log('│ ✓ Database connected');

  await migrateDb(db);
  console.log('│ ✓ Migrations applied');

  await ensureRbacSeeded(db);
  console.log('│ ✓ RBAC seeded');

  // ─── 1. LOOKUP TABLES ───────────────────────────────────────────────────
  console.log('│');
  console.log('├─ Phase 1: Lookup tables');

  // 1a. Regions
  {
    const rows = readCSV('TbRegion.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['RegionID']);
      const name = str(r['Region']);
      if (!lid || !name) continue;
      const [row] = await db.insert(regions).values({
        name, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { regionMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(regions).where(eq(regions.name, name)).limit(1);
        if (existing) regionMap.set(lid, existing.id);
      }
    }
    log('regions', inserted);
  }

  // 1b. Departments
  {
    const rows = readCSV('TblDeparment.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['DepID']);
      const name = str(r['DepName']);
      if (!lid || !name) continue;
      const [row] = await db.insert(departments).values({
        name: name.trim(), legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { departmentMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(departments).where(eq(departments.name, name.trim())).limit(1);
        if (existing) departmentMap.set(lid, existing.id);
      }
    }
    log('departments', inserted);
  }

  // 1c. Job Titles
  {
    const rows = readCSV('TblJobTitle.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['JobTitleID']);
      const name = str(r['JobTitle']);
      const code = str(r['Job_code']);
      if (!lid || !name) continue;
      const [row] = await db.insert(jobTitles).values({
        name, code, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { jobTitleMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(jobTitles).where(eq(jobTitles.name, name)).limit(1);
        if (existing) jobTitleMap.set(lid, existing.id);
      }
    }
    log('job_titles', inserted);
  }

  // 1d. Depots
  {
    const rows = readCSV('TblDepot.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['DepotID']);
      const name = str(r['DepotName']);
      const code = str(r['Code']);
      if (!lid || !name) continue;
      const [row] = await db.insert(depots).values({
        name, code, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) {
        depotMap.set(lid, row.id);
        if (code) depotCodeMap.set(code, row.id);
        inserted++;
      } else {
        const [existing] = await db.select().from(depots).where(eq(depots.name, name)).limit(1);
        if (existing) {
          depotMap.set(lid, existing.id);
          if (code) depotCodeMap.set(code, existing.id);
        }
      }
    }
    log('depots', inserted);
  }

  // 1e. Tiers
  {
    const rows = readCSV('tblTiers.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['TierID']);
      const name = str(r['Tier']);
      if (!lid || !name) continue;
      const [row] = await db.insert(tiers).values({
        name, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { tierMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(tiers).where(eq(tiers.name, name)).limit(1);
        if (existing) tierMap.set(lid, existing.id);
      }
    }
    log('tiers', inserted);
  }

  // 1f. Tax Statuses
  {
    const rows = readCSV('tblTaxStatus.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['ID']);
      const name = str(r['Status']);
      if (!lid || !name) continue;
      const [row] = await db.insert(taxStatuses).values({
        name, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { taxStatusMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(taxStatuses).where(eq(taxStatuses.name, name)).limit(1);
        if (existing) taxStatusMap.set(lid, existing.id);
      }
    }
    log('tax_statuses', inserted);
  }

  // 1g. Leave Types
  {
    const rows = readCSV('TblTypeofLeave.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['TypeOfLeaveID']);
      const name = str(r['TypeOfLeave']);
      if (!lid || !name) continue;
      const [row] = await db.insert(leaveTypes).values({
        name: name.trim(), legacyId: lid,
      }).onConflictDoNothing().returning();
      if (row) { leaveTypeMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(leaveTypes).where(eq(leaveTypes.name, name.trim())).limit(1);
        if (existing) leaveTypeMap.set(lid, existing.id);
      }
    }
    log('leave_types', inserted);
  }

  // 1h. Nature of Offence
  {
    const rows = readCSV('tblNatureOfOffence.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['OffenceID']);
      const name = str(r['OffenceName']);
      if (!lid || !name) continue;
      const [row] = await db.insert(natureOfOffence).values({
        name: name.trim(), legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { offenceMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(natureOfOffence).where(eq(natureOfOffence.name, name.trim())).limit(1);
        if (existing) offenceMap.set(lid, existing.id);
      }
    }
    log('nature_of_offence', inserted);
  }

  // 1i. Disciplinary Actions
  {
    const rows = readCSV('tblDisciplinaryAction.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['DAID']);
      const name = str(r['DA']);
      if (!lid || !name) continue;
      const [row] = await db.insert(disciplinaryActions).values({
        name: name.trim(), legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { discActionMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(disciplinaryActions).where(eq(disciplinaryActions.name, name.trim())).limit(1);
        if (existing) discActionMap.set(lid, existing.id);
      }
    }
    log('disciplinary_actions', inserted);
  }

  // 1j. KPI Categories
  {
    const rows = readCSV('TblKPICategory.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['KPICateID']);
      const name = str(r['KPICatrgory']);
      if (!lid || !name) continue;
      const [row] = await db.insert(kpiCategories).values({
        name: name.trim(), legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { kpiCategoryMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(kpiCategories).where(eq(kpiCategories.name, name.trim())).limit(1);
        if (existing) kpiCategoryMap.set(lid, existing.id);
      }
    }
    log('kpi_categories', inserted);
  }

  // 1k. KPIs
  {
    const rows = readCSV('TblKPI.csv');
    let inserted = 0;
    // We need a default category for KPIs that don't map.
    // All Access KPIs lack category column, so assign to first category.
    const firstCat = kpiCategoryMap.values().next().value;
    for (const r of rows) {
      const lid = toInt(r['KPIID']);
      const name = str(r['KPI']);
      if (!lid || !name) continue;
      const [row] = await db.insert(kpis).values({
        name: name.trim(),
        categoryId: firstCat!,
        legacyId: lid,
        sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { kpiMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(kpis).where(eq(kpis.name, name.trim())).limit(1);
        if (existing) kpiMap.set(lid, existing.id);
      }
    }
    log('kpis', inserted);
  }

  // 1l. Succession Schemes
  {
    const rows = readCSV('TblScheme.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['SchemeID']);
      const name = str(r['SName']);
      if (!lid || !name) continue;
      const [row] = await db.insert(successionSchemes).values({
        name, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { schemeMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(successionSchemes).where(eq(successionSchemes.name, name)).limit(1);
        if (existing) schemeMap.set(lid, existing.id);
      }
    }
    log('succession_schemes', inserted);
  }

  // 1m. Expense Categories
  {
    const rows = readCSV('TblExpenseCategory.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['ExpenseCategoryID']);
      const name = str(r['ExpenseCategory']);
      if (!lid || !name) continue;
      const [row] = await db.insert(expenseCategories).values({
        name: name.trim(), legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { expenseCategoryMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(expenseCategories).where(eq(expenseCategories.name, name.trim())).limit(1);
        if (existing) expenseCategoryMap.set(lid, existing.id);
      }
    }
    log('expense_categories', inserted);
  }

  // 1m-ii. Cost of sale (TblCostOfSale → cost_of_sale)
  {
    const rows = readCSV('TblCostOfSale.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['CostofSaleID']);
      const name = str(r['CostOfSale']);
      const code = str(r['Code']);
      if (!lid || !name) continue;
      const [row] = await db.insert(costOfSale).values({
        name: name.trim(), code, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { costOfSaleMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(costOfSale).where(eq(costOfSale.name, name.trim())).limit(1);
        if (existing) costOfSaleMap.set(lid, existing.id);
      }
    }
    log('cost_of_sale', inserted);
  }

  // 1m-iii. Activities (tblActivities → activities)
  {
    const rows = readCSV('tblActivities.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['ActivitiesID']);
      const name = str(r['Activities']);
      const code = str(r['Code']);
      if (!lid || !name) continue;
      const [row] = await db.insert(activities).values({
        name: name.trim(), code, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { activitiesMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(activities).where(eq(activities.name, name.trim())).limit(1);
        if (existing) activitiesMap.set(lid, existing.id);
      }
    }
    log('activities', inserted);
  }

  // 1m-iv. Overheads (tblOverheads → overheads)
  {
    const rows = readCSV('tblOverheads.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['OverheadsID']);
      const name = str(r['Overheads']);
      const code = str(r['Code']);
      if (!lid || !name) continue;
      const [row] = await db.insert(overheads).values({
        name: name.trim(), code, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { overheadsMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(overheads).where(eq(overheads.name, name.trim())).limit(1);
        if (existing) overheadsMap.set(lid, existing.id);
      }
    }
    log('overheads', inserted);
  }

  // 1m-v. Sites (tblSites → sites)
  {
    const rows = readCSV('tblSites.csv');
    let inserted = 0;
    const seen = new Set<string>();
    for (const r of rows) {
      const name = str(r['Site']);
      if (!name || seen.has(name)) continue; // tblSites has duplicate site names
      seen.add(name);
      const [row] = await db.insert(sites).values({
        name: name.trim(), legacyId: toInt(r['ID']),
      }).onConflictDoNothing().returning();
      if (row) inserted++;
    }
    log('sites', inserted);
  }

  // 1m-vi. Salary grading scale (tblGrading → grading)
  {
    const rows = readCSV('tblGrading.csv');
    let inserted = 0;
    for (const r of rows) {
      const patersonGrade = str(r['PatersonGrade']);
      const jobTitle = str(r['JobTitle']);
      if (!patersonGrade && !jobTitle) continue;
      await db.insert(grading).values({
        scale: str(r['Scale']),
        occLevel: str(r['OccLevel']),
        jobTitle,
        code: str(r['Code']),
        patersonGrade,
        patersonBand: str(r['PatersonBand']),
        minRate: toFloat(r['MinRate']),
        maxRate: toFloat(r['MaxRate']),
      });
      inserted++;
    }
    log('grading', inserted);
  }

  // 1m-vii. Interview question bank (tblInterview → interview_questions)
  {
    const rows = readCSV('tblInterview.csv');
    let inserted = 0;
    for (const r of rows) {
      const question = str(r['Que']);
      if (!question) continue;
      await db.insert(interviewQuestions).values({
        heading: str(r['Head']),
        question,
        modelAnswer: str(r['Ans']),
        maxScore: toFloat(r['Score']) ?? 5,
        sortOrder: toInt(r['QueID']) ?? 0,
        legacyId: toInt(r['QueID']),
      });
      inserted++;
    }
    log('interview_questions', inserted);
  }

  // 1n. Non-recruitment Reasons
  {
    const rows = readCSV('tblNonRecruitmentReason.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['ReasonID']);
      const name = str(r['Reason']);
      if (!lid || !name) continue;
      const [row] = await db.insert(nonRecruitmentReasons).values({
        name, legacyId: lid, sortOrder: lid,
      }).onConflictDoNothing().returning();
      if (row) { nonRecruitReasonMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(nonRecruitmentReasons).where(eq(nonRecruitmentReasons.name, name)).limit(1);
        if (existing) nonRecruitReasonMap.set(lid, existing.id);
      }
    }
    log('non_recruitment_reasons', inserted);
  }

  // 1o. Trainings Catalogue
  {
    const rows = readCSV('TblAllTrainings.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['TrainingID']);
      const name = str(r['Training']);
      const rawKind = str(r['TrainingType']) ?? 'internal';
      if (!lid || !name) continue;
      const kind = rawKind.toLowerCase().includes('external') ? 'external'
        : rawKind.toLowerCase().includes('blended') ? 'blended' : 'internal';
      const [row] = await db.insert(trainingsCatalogue).values({
        name, kind, legacyId: lid,
      }).onConflictDoNothing().returning();
      if (row) { trainingMap.set(lid, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(trainingsCatalogue).where(eq(trainingsCatalogue.name, name)).limit(1);
        if (existing) trainingMap.set(lid, existing.id);
      }
    }
    log('trainings_catalogue', inserted);
  }

  // 1p. EE Groups (from tblOccLevel — no integer IDs, just names)
  {
    const rows = readCSV('tblOccLevel.csv');
    let inserted = 0;
    for (let i = 0; i < rows.length; i++) {
      const name = str(rows[i]['Occupational Level']);
      if (!name) continue;
      const [row] = await db.insert(eeGroups).values({
        name, sortOrder: i + 1,
      }).onConflictDoNothing().returning();
      if (row) { eeGroupMap.set(name, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(eeGroups).where(eq(eeGroups.name, name)).limit(1);
        if (existing) eeGroupMap.set(name, existing.id);
      }
    }
    log('ee_groups', inserted);
  }

  // 1q. Paterson Grades (extract unique from tblGrading)
  {
    const rows = readCSV('tblGrading.csv');
    const seen = new Set<string>();
    let inserted = 0;
    for (const r of rows) {
      const grade = str(r['PatersonGrade']);
      const band = str(r['PatersonBand']);
      if (!grade || seen.has(grade)) continue;
      seen.add(grade);
      const [row] = await db.insert(patersonGrades).values({
        name: grade, code: band, sortOrder: inserted,
      }).onConflictDoNothing().returning();
      if (row) { patersonMap.set(grade, row.id); inserted++; }
      else {
        const [existing] = await db.select().from(patersonGrades).where(eq(patersonGrades.name, grade)).limit(1);
        if (existing) patersonMap.set(grade, existing.id);
      }
    }
    log('paterson_grades', inserted);
  }

  // ─── 2. EMPLOYEES (hub table) ──────────────────────────────────────────────
  console.log('│');
  console.log('├─ Phase 2: Employees');
  {
    const rows = readCSV('Employees_Employment_details.csv');
    let inserted = 0;
    const errors: string[] = [];

    for (const r of rows) {
      const lid = toInt(r['EmployeeID']);
      const empCode = str(r['EmployeeCode']);
      const surname = str(r['Surname']);
      const firstName = str(r['First Name']);
      if (!lid || !empCode || !surname || !firstName) {
        errors.push(`Skip employee: missing key fields (ID=${r['EmployeeID']})`);
        continue;
      }

      // Build address strings
      const resParts = [r['ResUnitNumber'], r['ResStreetNumber'], r['ResStreetName'], r['ResSuburb'], r['ResCity'], r['ResPostalCode']].map(s => str(s)).filter(Boolean);
      const postParts = [r['PostUnitNumber'], r['PostStreetNumber'], r['PostStreetName'], r['PostSuburb'], r['PostCity'], r['PostPostalCode']].map(s => str(s)).filter(Boolean);

      // Resolve FK lookups
      const depotId = depotCodeMap.get(r['Depo']?.trim()) ?? null;
      const regionId = regionMap.get(toInt(r['Province'])!) ?? null;
      const departmentId = departmentMap.get(toInt(r['Department'])!) ?? null;
      const jobTitleId = jobTitleMap.get(toInt(r['Job Title'])!) ?? null;
      const taxStatusId = taxStatusMap.get(toInt(r['TaxStatus'])!) ?? null;

      try {
        const [row] = await db.insert(employees).values({
          employeeNumber: empCode,
          // Personal
          title: str(r['Title']),
          initials: str(r['Intials']),
          firstName,
          surname,
          middleNames: str(r['Last Name']),
          maidenName: str(r['MadienName']),
          knownAs: str(r['AlsoKnownAS']),
          spouseName: str(r['SpouseName']),
          email: str(r['E-mail Address']),
          phoneMobile: phone(r['CellNumber']),
          phoneHome: phone(r['HomeNumber']),
          phoneWork: phone(r['WorkNumber']),
          idNumber: str(r['ID Number']),
          passportNumber: str(r['PassportNumber']),
          passportCountry: str(r['PassportCountry']),
          dateOfBirth: toDate(r['DOB']),
          gender: str(r['Gender']),
          maritalStatus: str(r['MaritalStatus']),
          nationality: str(r['PassportCountry']),
          ethnicity: str(r['Ethnicity']),
          language: str(r['Language']),
          taxNumber: str(r['IncomeTaxNumber']),
          taxDirective: str(r['Directive']),
          skillLevel: str(r['SkillLevel']),
          criticalSkills: str(r['CriticalSkills']),
          // Emergency
          emergencyName: str(r['EmergencyNameAndSurname']),
          emergencyCell: phone(r['EmergencyCellNumber']),
          emergencyWork: phone(r['EmergencyWorkNumber']),
          // Address — residential
          physicalAddress: resParts.length ? resParts.join(', ') : null,
          postalAddress: postParts.length ? postParts.join(', ') : null,
          resUnitNumber: str(r['ResUnitNumber']),
          resStreetNumber: str(r['ResStreetNumber']),
          resStreetName: str(r['ResStreetName']),
          resComplex: str(r['ResComplex']),
          resSuburb: str(r['ResSuburb']),
          resCity: str(r['ResCity']),
          resPostalCode: str(r['ResPostalCode']),
          // Address — postal
          postUnitNumber: str(r['PostUnitNumber']),
          postStreetNumber: str(r['PostStreetNumber']),
          postStreetName: str(r['PostStreetName']),
          postComplex: str(r['PostComplex']),
          postSuburb: str(r['PostSuburb']),
          postCity: str(r['PostCity']),
          postPostalCode: str(r['PostPostalCode']),
          // Banking
          paymentMethod: str(r['PaymentMethod']),
          bankName: str(r['BankName']),
          branchCode: str(r['BranchCode']),
          accountHolderName: str(r['AccountHolderName']),
          accountNumber: str(r['AccountNumber']),
          accountType: str(r['TypeOfAccount']),
          accountRelationship: str(r['AccountRelationship']),
          // Appointment & payroll
          hireDate: toDate(r['DateEmployed']),
          employmentStatus: 'active',
          jobGradeNbc: str(r['JobGradeasPerNBC']),
          categoryNbc: str(r['CategoryAsPerNBC']),
          account: str(r['Account']),
          costDepartment: str(r['CostDepartment']),
          costCenter: str(r['CostCenter']),
          ratePerHour: toFloat(r['RatePerHour']),
          monthlySalary: toFloat(r['MonthlySalary']),
          remunerationPerAnnum: toFloat(r['RemunerationPerAnunm']),
          uifStatus: str(r['UIFStatus']),
          medicalAidPlan: str(r['MedicalAidPlan']),
          medicalAidAmount: toFloat(r['MedicalAidAmount']),
          vitalityAmount: toFloat(r['VitalityAmount']),
          site: str(r['Site']),
          jobFunctionalityEquity: str(r['JobFunctionalityEquity']),
          occupationalLevelEquity: str(r['OccupationalyLevelEquity']),
          hoursPerMonth: toFloat(r['HoursPerMonth']),
          hoursPerDay: toFloat(r['HoursPerDay']),
          annualLeaveEntitlement: toFloat(r['AnnualLeaveEntitlement']),
          momentum: str(r['Momentum']),
          momentumDate: toDate(r['Momentum_Date']),
          momentumAmount: toFloat(r['Momentum_a']),
          // Org FKs
          regionId,
          departmentId,
          jobTitleId,
          depotId,
          taxStatusId,
          // Compliance & admin (document-flag columns hold junk legacy ids; skipped)
          compliance: str(r['Compliance']),
          excoApproval: str(r['EXCOapproval']),
          eeCommitteeRep: str(r['EEcommitteeRep']),
          approval: str(r['Approval']),
          currentPosition: str(r['CurrentPosition']),
          notes: str(r['Notes']),
          legacyId: lid,
        }).onConflictDoNothing().returning();

        if (row) {
          employeeMap.set(lid, row.id);
          inserted++;
        } else {
          // Already exists (same employee_number), look it up
          const [existing] = await db.select().from(employees)
            .where(eq(employees.employeeNumber, empCode)).limit(1);
          if (existing) employeeMap.set(lid, existing.id);
        }
      } catch (e: any) {
        errors.push(`Employee ${empCode}: ${e.message?.slice(0, 80)}`);
      }
    }
    log('employees', inserted, 0, errors);
  }

  // ─── 2b. Backfill lineManagerId (self-referential FK) ──────────────────────
  {
    const rows = readCSV('Employees_Employment_details.csv');
    let updated = 0;
    for (const r of rows) {
      const lid = toInt(r['EmployeeID']);
      const mgrLid = toInt(r['LineManager']);
      if (!lid || !mgrLid) continue;
      const empUuid = employeeMap.get(lid);
      const mgrUuid = employeeMap.get(mgrLid);
      if (empUuid && mgrUuid) {
        await db.update(employees)
          .set({ lineManagerId: mgrUuid })
          .where(eq(employees.id, empUuid));
        updated++;
      }
    }
    console.log(`  ✓ employees.lineManagerId: ${updated} backfilled`);
  }

  // ─── 3. TRANSACTIONAL TABLES ───────────────────────────────────────────────
  console.log('│');
  console.log('├─ Phase 3: Transactional tables');

  // 3a. Leave Forms
  {
    const rows = readCSV('TblLeaveForm.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const empUuid = employeeMap.get(toInt(r['EmployeeID'])!);
      const ltUuid = leaveTypeMap.get(toInt(r['TypeOfLeave'])!);
      const startDate = toDate(r['StartDate']);
      const endDate = toDate(r['ToDate']);
      if (!empUuid || !ltUuid || !startDate || !endDate) {
        errors.push(`Leave form: missing FK (EmpID=${r['EmployeeID']})`);
        continue;
      }
      const days = toFloat(r['TotalHoildays']) ?? 0;
      // Map approval statuses
      const lmStatus = r['ManagerApprovalStatus']?.toLowerCase()?.includes('approv') ? 'approved'
        : r['ManagerApprovalStatus']?.toLowerCase()?.includes('reject') ? 'rejected' : 'pending';
      const hrStatus = r['HRApprovalStatus']?.toLowerCase()?.includes('approv') ? 'approved'
        : r['HRApprovalStatus']?.toLowerCase()?.includes('reject') ? 'rejected' : 'pending';

      try {
        await db.insert(leaveForms).values({
          employeeId: empUuid,
          leaveTypeId: ltUuid,
          startDate,
          endDate,
          daysRequested: days,
          status: lmStatus === 'approved' && hrStatus === 'approved' ? 'approved' : 'submitted',
          lineManagerStatus: lmStatus,
          hrStatus,
          legacyId: toInt(r['LeaveID']),
        });
        inserted++;
      } catch (e: any) { errors.push(`Leave: ${e.message?.slice(0, 80)}`); }
    }
    log('leave_forms', inserted, 0, errors);
  }

  // 3b. Job Descriptions
  {
    const rows = readCSV('TblJobDescription.csv');
    let inserted = 0;
    // Group by JobTitleID to create one JD per job title
    const byJT = new Map<number, typeof rows>();
    for (const r of rows) {
      const jtId = toInt(r['JobTitleID']);
      if (!jtId) continue;
      if (!byJT.has(jtId)) byJT.set(jtId, []);
      byJT.get(jtId)!.push(r);
    }

    for (const [jtId, jdRows] of byJT) {
      const jtName = [...jobTitleMap.entries()].find(([k]) => k === jtId);
      // Look up the job title name from DB
      let title = `Job Description for Title ${jtId}`;
      if (jobTitleMap.has(jtId)) {
        const [jt] = await db.select().from(jobTitles).where(eq(jobTitles.legacyId, jtId)).limit(1);
        if (jt) title = jt.name;
      }
      // Use first row's ID as legacy
      const firstLid = toInt(jdRows[0]['JobDescriptionID']);

      try {
        const [row] = await db.insert(jobDescriptions).values({
          title,
          status: 'active',
          summary: jdRows.map(r => str(r['JobDescription'])).filter(Boolean).join('\n'),
          legacyId: firstLid,
        }).onConflictDoNothing().returning();

        if (row) {
          // Map ALL Access JD IDs that belong to this job title to this one PG JD
          for (const r of jdRows) {
            const lid = toInt(r['JobDescriptionID']);
            if (lid) jobDescMap.set(lid, row.id);
          }
          inserted++;
        }
      } catch { /* skip duplicates */ }
    }
    log('job_descriptions', inserted);
  }

  // 3c. JD Detail Records → jd_entries
  {
    const rows = readCSV('TblJobdescriptionDetailRecord.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['JoBID']);
      const jtLid = toInt(r['Job Title']);
      // Find a JD for this job title
      let jdUuid: string | undefined;
      if (jtLid) {
        // Find any JD with this job title ID
        for (const [accJdId, uuid] of jobDescMap) {
          jdUuid = uuid;
          break; // We'll match by job title
        }
        // Better: look up from the JD we created for this job title
        const [jd] = await db.select().from(jobDescriptions)
          .where(sql`${jobDescriptions.legacyId} IN (SELECT "JobDescriptionID" FROM (VALUES ${sql.raw(
            // Get Access JD IDs for this job title
            `(0)` // fallback
          )}) AS t("JobDescriptionID"))`)
          .limit(1);
      }

      // Simplified: map by finding JD for the job title
      if (jtLid && jobTitleMap.has(jtLid)) {
        const jtUuid = jobTitleMap.get(jtLid)!;
        const [jt] = await db.select().from(jobTitles).where(eq(jobTitles.id, jtUuid)).limit(1);
        if (jt) {
          const [jd] = await db.select().from(jobDescriptions)
            .where(eq(jobDescriptions.title, jt.name)).limit(1);
          if (jd) jdUuid = jd.id;
        }
      }
      if (!jdUuid) continue;

      const skill = str(r['Skill level']);
      const qual = str(r['Qualification']);
      try {
        const [row] = await db.insert(jdEntries).values({
          jdId: jdUuid,
          section: 'Qualification & Skill Level',
          body: [skill ? `Skill Level: ${skill}` : null, qual ? `Qualification: ${qual}` : null].filter(Boolean).join('\n'),
          sortOrder: lid ?? 0,
          legacyId: lid,
        }).returning();
        if (row && lid) jdDetailMap.set(lid, row.id);
        inserted++;
      } catch { /* skip */ }
    }
    log('jd_entries', inserted);
  }

  // 3d. JD Roles and Responsibilities
  {
    const rows = readCSV('TblJobDesRolesAndResponsibility.csv');
    let inserted = 0;
    for (const r of rows) {
      const jdLid = toInt(r['JobDescriptionId']);
      const desc = str(r['RolesAndRes']);
      if (!desc) continue;
      // Find JD by legacy ID — the JobDescriptionId here refers to the JD detail record (JoBID)
      // Actually in Access, JobDescriptionId maps to jd_entries which we need to trace back to JD
      // Let's find the JD the detail belongs to
      let jdUuid: string | undefined;
      if (jdLid) {
        // Try direct map first (many Access JD IDs were mapped)
        jdUuid = jobDescMap.get(jdLid);
        if (!jdUuid) {
          // Try via jd_entries legacy
          const [entry] = await db.select().from(jdEntries).where(eq(jdEntries.legacyId, jdLid)).limit(1);
          if (entry) jdUuid = entry.jdId;
        }
      }
      if (!jdUuid) continue;
      try {
        await db.insert(jdRoles).values({
          jdId: jdUuid, description: desc, sortOrder: toInt(r['RolesAndResponsibilitiesID']) ?? 0,
          legacyId: toInt(r['RolesAndResponsibilitiesID']),
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('jd_roles', inserted);
  }

  // 3e. JD KPI entries
  {
    const rows = readCSV('TbJobDescriptionlKPIEntry.csv');
    let inserted = 0;
    for (const r of rows) {
      const jdDetailLid = toInt(r['JobdescriptionRecordID']);
      const kpiName = str(r['KPI']);
      if (!kpiName) continue;
      // Find JD via detail record
      let jdUuid: string | undefined;
      if (jdDetailLid) {
        const [entry] = await db.select().from(jdEntries).where(eq(jdEntries.legacyId, jdDetailLid)).limit(1);
        if (entry) jdUuid = entry.jdId;
      }
      if (!jdUuid) continue;
      try {
        await db.insert(jdKpis).values({
          jdId: jdUuid, target: kpiName, sortOrder: toInt(r['JobDescriptionKPIID']) ?? 0,
          legacyId: toInt(r['JobDescriptionKPIID']),
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('jd_kpis', inserted);
  }

  // 3f. JD Internal Training Links
  {
    const rows = readCSV('TblJobDesInternalTrainingEntry.csv');
    let inserted = 0;
    for (const r of rows) {
      const jdDetailLid = toInt(r['JobDescription']); // This is the JD detail record ID
      const trainLid = toInt(r['InternalTraining']);
      let jdUuid: string | undefined;
      if (jdDetailLid) {
        // Find JD the entry belongs to
        const [entry] = await db.select().from(jdEntries).where(eq(jdEntries.legacyId, jdDetailLid)).limit(1);
        if (entry) jdUuid = entry.jdId;
        // Fallback: try jobDescMap
        if (!jdUuid) jdUuid = jobDescMap.get(jdDetailLid);
      }
      if (!jdUuid) continue;
      const trainUuid = trainLid ? trainingMap.get(trainLid) : undefined;
      try {
        await db.insert(jdTrainingInternal).values({
          jdId: jdUuid,
          trainingId: trainUuid ?? null,
          required: true,
          legacyId: toInt(r['JobDescriptionID']),
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('jd_training_internal', inserted);
  }

  // 3g. JD External Training Links
  {
    const rows = readCSV('TblJobDesExternalTrainingEntry.csv');
    let inserted = 0;
    for (const r of rows) {
      const jdDetailLid = toInt(r['JobDescription']);
      const trainLid = toInt(r['ExternalTraining']);
      let jdUuid: string | undefined;
      if (jdDetailLid) {
        const [entry] = await db.select().from(jdEntries).where(eq(jdEntries.legacyId, jdDetailLid)).limit(1);
        if (entry) jdUuid = entry.jdId;
        if (!jdUuid) jdUuid = jobDescMap.get(jdDetailLid);
      }
      if (!jdUuid) continue;
      const trainUuid = trainLid ? trainingMap.get(trainLid) : undefined;
      try {
        await db.insert(jdTrainingExternal).values({
          jdId: jdUuid,
          trainingId: trainUuid ?? null,
          required: true,
          legacyId: toInt(r['JobDescriptionID']),
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('jd_training_external', inserted);
  }

  // 3h. Employee ↔ JD assignments
  {
    const rows = readCSV('TblEmployeJobDescriptionDetails.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const empLid = toInt(r['EmployeeID']);
      const jdLid = toInt(r['JobDescription']);
      const empUuid = empLid ? employeeMap.get(empLid) : undefined;
      // Resolve JD: the "JobDescription" column actually references a JD ID in Access
      let jdUuid: string | undefined;
      if (jdLid) {
        jdUuid = jobDescMap.get(jdLid);
        if (!jdUuid) {
          // Try legacy_id on job_descriptions
          const [jd] = await db.select().from(jobDescriptions).where(eq(jobDescriptions.legacyId, jdLid)).limit(1);
          if (jd) jdUuid = jd.id;
        }
      }
      if (!empUuid || !jdUuid) {
        errors.push(`employee_jds: missing FK (emp=${empLid}, jd=${jdLid})`);
        continue;
      }
      try {
        await db.insert(employeeJds).values({
          employeeId: empUuid,
          jdId: jdUuid,
          assignedAt: new Date(),
          status: 'assigned',
          legacyId: toInt(r['JobDescriptionID']),
        }).onConflictDoNothing();
        inserted++;
      } catch (e: any) { errors.push(`employee_jds: ${e.message?.slice(0, 80)}`); }
    }
    log('employee_jds', inserted, 0, errors);
  }

  // 3i. Skills Analysis
  {
    const rows = readCSV('TblAnalysisSkils.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const empLid = toInt(r['EmployeeID']);
      const empUuid = empLid ? employeeMap.get(empLid) : undefined;
      if (!empUuid) { errors.push(`analysis_skills: no employee ${empLid}`); continue; }

      const trainLid = toInt(r['Skills']);
      const kind = str(r['TypeOfTraining']);
      const isInternal = kind?.toLowerCase().includes('internal');

      try {
        await db.insert(analysisSkills).values({
          employeeId: empUuid,
          trainingInternalId: isInternal && trainLid ? trainingMap.get(trainLid) ?? null : null,
          trainingExternalId: !isInternal && trainLid ? trainingMap.get(trainLid) ?? null : null,
          bookingComplete: !!toDate(r['BookingDate']),
          startComplete: !!toDate(r['TrainingStartDate']),
          endComplete: !!toDate(r['TrainingEndDate']),
          certificateComplete: toInt(r['Certificate']) === 1,
          approvalComplete: false,
          poComplete: false,
          legacyId: toInt(r['ID']),
        });
        inserted++;
      } catch (e: any) { errors.push(`analysis_skills: ${e.message?.slice(0, 80)}`); }
    }
    log('analysis_skills', inserted, 0, errors);
  }

  // 3j. Quiz Questions (tblQue → quiz_questions)
  {
    const rows = readCSV('tblQue.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['QueID']);
      const question = str(r['Question']);
      const trainLid = toInt(r['TrainNo']);
      if (!lid || !question) continue;
      const trainUuid = trainLid ? trainingMap.get(trainLid) : undefined;
      if (!trainUuid) continue; // Can't insert without training FK
      try {
        const [row] = await db.insert(quizQuestions).values({
          trainingId: trainUuid,
          question,
          sortOrder: lid,
          legacyId: lid,
        }).onConflictDoNothing().returning();
        if (row) { quizQuestionMap.set(lid, row.id); inserted++; }
      } catch { /* skip */ }
    }
    log('quiz_questions', inserted);
  }

  // 3k. Quiz Answers (tblAnswers → quiz_answers)
  {
    const rows = readCSV('tblAnswers.csv');
    let inserted = 0;
    for (const r of rows) {
      const queLid = toInt(r['QueNo']);
      const text = str(r['Answer']);
      if (!queLid || !text) continue;
      const queUuid = quizQuestionMap.get(queLid);
      if (!queUuid) continue;
      const points = toFloat(r['Points']) ?? 0;
      try {
        await db.insert(quizAnswers).values({
          questionId: queUuid,
          answerText: text,
          isCorrect: points > 0,
          sortOrder: toInt(r['AnswerID']) ?? 0,
          legacyId: toInt(r['AnswerID']),
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('quiz_answers', inserted);
  }

  // 3l. Expenses
  {
    const rows = readCSV('TblExpense.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const empLid = toInt(r['EmployeeID']);
      const empUuid = empLid ? employeeMap.get(empLid) : undefined;
      if (!empUuid) { errors.push(`expense: no employee ${empLid}`); continue; }
      const catLid = toInt(r['ExpenseCategory']);
      const catUuid = catLid ? expenseCategoryMap.get(catLid) : undefined;
      const expDate = toDate(r['DateOfClaim']);
      if (!expDate) { errors.push(`expense: no date ${r['ExpenseID']}`); continue; }

      // Cost allocation (legacy ids → uuids)
      const depotLid = toInt(r['DepotID']);
      const cosLid = toInt(r['CostOfSaleID']);
      const actLid = toInt(r['ActivitiesID']);
      const ovhLid = toInt(r['OverheadsID']);

      // VAT breakdown — Access stores VAT as a fraction (0.15 = 15%).
      const costExVat = toFloat(r['CostExVAT']);
      const vatFraction = toFloat(r['VAT']);
      const vatRate = vatFraction != null ? vatFraction * 100 : null;
      const vatAmount = toFloat(r['VATAmount']);
      // TotalAmount is the source of truth where present; otherwise derive.
      const total = toFloat(r['TotalAmount']) ?? ((costExVat ?? 0) + (vatAmount ?? 0));

      const managerStatus = r['MangerApproval']?.toLowerCase().includes('approv') ? 'approved' : 'pending';
      try {
        await db.insert(expenses).values({
          employeeId: empUuid,
          categoryId: catUuid ?? null,
          depotId: (depotLid ? depotMap.get(depotLid) : undefined) ?? null,
          costOfSaleId: (cosLid ? costOfSaleMap.get(cosLid) : undefined) ?? null,
          activitiesId: (actLid ? activitiesMap.get(actLid) : undefined) ?? null,
          overheadsId: (ovhLid ? overheadsMap.get(ovhLid) : undefined) ?? null,
          expenseDate: expDate,
          periodStart: toDate(r['PeriodClaimStartDate']),
          periodEnd: toDate(r['PeriodClaimEndDate']),
          costExVat,
          vatRate,
          vatAmount,
          amount: total,
          description: str(r['ListTextItems']),
          claimNumber: str(r['RefNo']),
          status: managerStatus === 'approved' ? 'approved' : 'draft',
          managerStatus,
          approvedBy: str(r['ApprovedBy']),
          signedOn: managerStatus === 'approved' ? toDate(r['SignedOn']) : null,
          legacyId: toInt(r['ExpenseID']),
        });
        inserted++;
      } catch (e: any) { errors.push(`expense: ${e.message?.slice(0, 80)}`); }
    }
    log('expenses', inserted, 0, errors);
  }

  // 3m. Exit Records
  {
    const rows = readCSV('tblExit.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const empLid = toInt(r['EmpNo']);
      const empUuid = empLid ? employeeMap.get(empLid) : undefined;
      if (!empUuid) { errors.push(`exit: no employee ${empLid}`); continue; }
      const reason = str(r['Reason']);
      const exitType = reason?.toLowerCase().includes('terminat') ? 'dismissal'
        : reason?.toLowerCase().includes('resign') ? 'resignation'
        : reason?.toLowerCase().includes('retire') ? 'retirement' : 'resignation';
      try {
        await db.insert(exitRecords).values({
          employeeId: empUuid,
          exitType,
          interviewNotes: str(r['Reason Code(drop down)']),
          status: 'completed',
        });
        inserted++;
      } catch (e: any) { errors.push(`exit: ${e.message?.slice(0, 80)}`); }
    }
    log('exit_records', inserted);
  }

  // 3n. Critical Roles (tblCritical → critical_roles)
  {
    const rows = readCSV('tblCritical.csv');
    let inserted = 0;
    for (const r of rows) {
      const lid = toInt(r['ID']);
      const title = str(r['CriticalSkills']);
      const code = str(r['REF']);
      if (!lid || !title) continue;
      try {
        const [row] = await db.insert(criticalRoles).values({
          title,
          riskLevel: 'medium',
          status: 'open',
          reason: code,
          legacyId: lid,
        }).returning();
        if (row) { critRoleMap.set(lid, row.id); inserted++; }
      } catch { /* skip */ }
    }
    log('critical_roles', inserted);
  }

  // 3o. Critical Skills
  {
    const rows = readCSV('tblCriticalSkills.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const lid = toInt(r['ID']);
      const critLid = toInt(r['CriticalityReason']);
      const critUuid = critLid ? critRoleMap.get(critLid) : undefined;
      if (!critUuid) { errors.push(`critical_skills: no role ${critLid}`); continue; }
      const riskLevel = str(r['RiskLevel'])?.toLowerCase() ?? 'medium';
      const tierSel = str(r['TierSelection']);
      // Update the critical role's risk level
      await db.update(criticalRoles)
        .set({ riskLevel: riskLevel || 'medium' })
        .where(eq(criticalRoles.id, critUuid));
      try {
        await db.insert(criticalSkills).values({
          criticalRoleId: critUuid,
          skillName: `Critical skill for role ${critLid}`,
          importance: riskLevel === 'high' ? 'essential' : 'important',
          notes: tierSel,
          legacyId: lid,
        });
        inserted++;
      } catch (e: any) { errors.push(`critical_skills: ${e.message?.slice(0, 80)}`); }
    }
    log('critical_skills', inserted, 0, errors);
  }

  // 3p. Succession (tblSuccession → succession_candidates)
  {
    const rows = readCSV('tblSuccession.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const empLid = toInt(r['EmpNo']);
      const empUuid = empLid ? employeeMap.get(empLid) : undefined;
      const succId = toInt(r['SuccID']);
      if (!empUuid) { errors.push(`succession: no employee ${empLid}`); continue; }

      // Need a critical role to link to. Find or create one based on the identified position.
      const identifiedPos = str(r['IdentifiedSuccessionPosition']) ?? 'Unspecified Position';
      let critRoleUuid: string | undefined;
      // Look for an existing critical role matching the position
      const [existingCR] = await db.select().from(criticalRoles)
        .where(eq(criticalRoles.title, identifiedPos)).limit(1);
      if (existingCR) {
        critRoleUuid = existingCR.id;
      } else {
        const [newCR] = await db.insert(criticalRoles).values({
          title: identifiedPos,
          incumbentEmployeeId: empUuid,
          riskLevel: 'medium',
          status: 'open',
          reason: str(r['FocusArea']),
        }).returning();
        critRoleUuid = newCR.id;
      }

      const tierText = str(r['AssessmentTier']);
      const readiness = tierText?.includes('1') ? 'ready_now'
        : tierText?.includes('2') ? '1_2_years' : '3_5_years';

      try {
        const [row] = await db.insert(successionCandidates).values({
          criticalRoleId: critRoleUuid,
          employeeId: empUuid,
          readiness,
          developmentNeeds: str(r['FocusArea']),
          status: 'identified',
          legacyId: succId,
        }).returning();
        if (row) { succCandidateMap.set(succId!, row.id); inserted++; }
      } catch (e: any) { errors.push(`succession: ${e.message?.slice(0, 80)}`); }
    }
    log('succession_candidates', inserted, 0, errors);
  }

  // 3q. Succession Commitments (TblScommitment)
  {
    const rows = readCSV('TblScommitment.csv');
    let inserted = 0;
    // TblScommitment doesn't have clear FK columns in the CSV; skip if structure is unclear
    // If data has candidate references, we'd insert them
    if (rows.length > 0 && succCandidateMap.size > 0) {
      // Use the first candidate for all commitments as a fallback
      const firstCandidate = succCandidateMap.values().next().value;
      for (const r of rows) {
        const text = Object.values(r).filter(v => v && v.length > 2).join(' — ');
        if (!text || !firstCandidate) continue;
        try {
          await db.insert(successionCommitments).values({
            candidateId: firstCandidate,
            commitment: text,
            status: 'pending',
          });
          inserted++;
        } catch { /* skip */ }
      }
    }
    log('succession_commitments', inserted);
  }

  // 3r. Recruitment Targets
  {
    const rows = readCSV('tblRecruitmentTarget.csv');
    let inserted = 0;
    for (const r of rows) {
      const due = toDate(r['Due Date']);
      const yearNum = toFloat(r['Due Date']);
      const periodYear = due ? due.getFullYear() : (yearNum ? Math.round(yearNum) : null);
      if (!periodYear) continue;
      const value = toFloat(r['Value']) ?? 0;
      try {
        await db.insert(recruitmentTargets).values({
          periodYear,
          dueDate: due,
          occupationalLevel: str(r['Occupational Level']),
          employmentType: str(r['Employment Type']),
          gender: str(r['Gender']),
          race: str(r['Race']),
          targetCount: Math.round(value),
          achievedCount: 0,
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('recruitment_targets', inserted);
  }

  // 3r-ii. Actual recruitment register (tblActualRecruitment → actual_recruitment)
  {
    const rows = readCSV('tblActualRecruitment.csv');
    let inserted = 0;
    for (const r of rows) {
      const name = str(r['Name']);
      const surname = str(r['Surname']);
      if (!name && !surname) continue;
      const nonEe = (str(r['NonEE']) ?? '').toLowerCase().startsWith('y') || str(r['NonEE']) === '1';
      try {
        await db.insert(actualRecruitment).values({
          dueDate: toDate(r['Due Date']),
          name,
          surname,
          companyNo: str(r['Company No']),
          jobTitle: str(r['Job Title']),
          occupationalLevel: str(r['Occupational Level']),
          employmentType: str(r['Employment Type']),
          gender: str(r['Gender']),
          race: str(r['Race']),
          value: Math.round(toFloat(r['Value']) ?? 1),
          reasonForAppointment: str(r['Reason for appoinment']),
          responsibleExecutive: str(r['Responsible Executive']),
          responsibleManager: str(r['Resposnsible Manager']),
          progressStatus: str(r['Progress Track Status']) ?? 'appointed',
          reason: str(r['Reason']),
          nonEe,
          approval: str(r['Approval']),
          supportingDocument: str(r['Suporting Document']),
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('actual_recruitment', inserted);
  }

  // 3s. Recruitment Requests (tblRequest)
  {
    const rows = readCSV('tblRequest.csv');
    let inserted = 0;
    for (const r of rows) {
      const title = str(r['Job Title']) ?? 'Unspecified';
      const dept = str(r['Department']);
      const region = str(r['Region']);
      const reason = str(r['Reason for Appoinment']);
      const status = str(r['Progress Track Status']);

      // Try to resolve department/region by name
      let deptUuid: string | undefined;
      if (dept) {
        const [d] = await db.select().from(departments).where(eq(departments.name, dept)).limit(1);
        if (d) deptUuid = d.id;
      }
      let regUuid: string | undefined;
      if (region) {
        const [rr] = await db.select().from(regions).where(eq(regions.name, region)).limit(1);
        if (rr) regUuid = rr.id;
      }

      // Find job title by name
      let jtUuid: string | undefined;
      if (title !== 'Unspecified') {
        const [jt] = await db.select().from(jobTitles).where(eq(jobTitles.name, title)).limit(1);
        if (jt) jtUuid = jt.id;
      }

      try {
        await db.insert(recruitmentRequests).values({
          positionTitle: title,
          jobTitleId: jtUuid ?? null,
          departmentId: deptUuid ?? null,
          regionId: regUuid ?? null,
          motivation: reason,
          status: status?.toLowerCase().includes('not') ? 'cancelled' : 'filled',
        });
        inserted++;
      } catch { /* skip */ }
    }
    log('recruitment_requests', inserted);
  }

  // 3t. Development Plans
  {
    const rows = readCSV('tblDevelopement.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const empLid = toInt(r['EmpNo']);
      const empUuid = empLid ? employeeMap.get(empLid) : undefined;
      if (!empUuid) { errors.push(`dev plan: no employee ${empLid}`); continue; }
      const dateInit = toDate(r['DateInitiated']);
      try {
        await db.insert(developmentPlans).values({
          employeeId: empUuid,
          planYear: dateInit ? dateInit.getFullYear() : 2026,
          dateInitiated: dateInit,
          requiredStandard: str(r['Required Standard']),
          currentLevel: str(r['Current Level']),
          gapIdentified: str(r['Gap Identified']),
          actionRequired: str(r['Action Required']),
          milestone: str(r['Milestone']),
          measurementCriteria: str(r['Measurement Criteria']),
          status: 'draft',
          legacyId: toInt(r['DevID']),
        });
        inserted++;
      } catch (e: any) { errors.push(`dev plan: ${e.message?.slice(0, 80)}`); }
    }
    log('development_plans', inserted, 0, errors);
  }

  // ─── 4. USER ACCOUNTS ──────────────────────────────────────────────────────
  console.log('│');
  console.log('├─ Phase 4: User accounts');
  {
    const rows = readCSV('LoginDetails.csv');
    let inserted = 0;
    const errors: string[] = [];
    for (const r of rows) {
      const username = str(r['UserName']);
      const password = str(r['Password']) ?? 'changeme';
      const empLid = toInt(r['EmployeeName']);
      const isAdmin = r['Admin'] === 'True';
      const level = str(r['Level']);
      if (!username) continue;

      // Map level to role
      const roleName = isAdmin ? 'super_admin'
        : level?.includes('1') ? 'line_manager'
        : level?.includes('2') ? 'hr_officer'
        : 'employee';

      const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
      if (!role) { errors.push(`user ${username}: role ${roleName} not found`); continue; }

      const empUuid = empLid ? employeeMap.get(empLid) : undefined;

      // Get employee name for full_name
      let fullName = username;
      if (empUuid) {
        const [emp] = await db.select().from(employees).where(eq(employees.id, empUuid)).limit(1);
        if (emp) fullName = `${emp.firstName} ${emp.surname}`;
      }

      try {
        await db.insert(users).values({
          username: username.toLowerCase(),
          passwordHash: await hashPassword(password),
          fullName,
          roleId: role.id,
          employeeId: empUuid ?? null,
          legacyId: toInt(r['ID']),
        }).onConflictDoNothing();
        inserted++;
      } catch (e: any) { errors.push(`user ${username}: ${e.message?.slice(0, 80)}`); }
    }
    log('users', inserted, 0, errors);
  }

  // ─── 5. REPORT ──────────────────────────────────────────────────────────────
  console.log('│');
  console.log('└─ Import complete');
  console.log('');

  let totalInserted = 0;
  let totalErrors = 0;
  for (const s of stats) {
    totalInserted += s.inserted;
    totalErrors += s.errors.length;
    if (s.errors.length > 0) {
      console.log(`  Errors in ${s.table}:`);
      s.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
      if (s.errors.length > 5) console.log(`    ... and ${s.errors.length - 5} more`);
    }
  }
  console.log('');
  console.log(`  Total: ${totalInserted} rows inserted across ${stats.length} tables`);
  if (totalErrors > 0) console.log(`  Total errors: ${totalErrors}`);
  console.log('');
  console.log('  Summary by table:');
  for (const s of stats) {
    console.log(`    ${s.table.padEnd(28)} ${String(s.inserted).padStart(5)} rows`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * verify-import.ts — Quick row-count check against the imported PGlite database.
 * Run:  PGLITE_DIR=./.pglite-imported npx tsx scripts/verify-import.ts
 */
import { sql } from 'drizzle-orm';
import { getDb } from '../lib/db/client.js';
import * as s from '../lib/db/schema/index.js';

const db = await getDb();

const tables = [
  ['regions', s.regions],
  ['departments', s.departments],
  ['job_titles', s.jobTitles],
  ['depots', s.depots],
  ['tiers', s.tiers],
  ['tax_statuses', s.taxStatuses],
  ['paterson_grades', s.patersonGrades],
  ['ee_groups', s.eeGroups],
  ['leave_types', s.leaveTypes],
  ['nature_of_offence', s.natureOfOffence],
  ['disciplinary_actions', s.disciplinaryActions],
  ['kpi_categories', s.kpiCategories],
  ['kpis', s.kpis],
  ['succession_schemes', s.successionSchemes],
  ['expense_categories', s.expenseCategories],
  ['non_recruitment_reasons', s.nonRecruitmentReasons],
  ['trainings_catalogue', s.trainingsCatalogue],
  ['employees', s.employees],
  ['leave_forms', s.leaveForms],
  ['job_descriptions', s.jobDescriptions],
  ['jd_entries', s.jdEntries],
  ['jd_roles', s.jdRoles],
  ['jd_kpis', s.jdKpis],
  ['jd_training_internal', s.jdTrainingInternal],
  ['jd_training_external', s.jdTrainingExternal],
  ['employee_jds', s.employeeJds],
  ['analysis_skills', s.analysisSkills],
  ['quiz_questions', s.quizQuestions],
  ['quiz_answers', s.quizAnswers],
  ['expenses', s.expenses],
  ['exit_records', s.exitRecords],
  ['critical_roles', s.criticalRoles],
  ['critical_skills', s.criticalSkills],
  ['succession_candidates', s.successionCandidates],
  ['succession_commitments', s.successionCommitments],
  ['recruitment_targets', s.recruitmentTargets],
  ['recruitment_requests', s.recruitmentRequests],
  ['development_plans', s.developmentPlans],
  ['users', s.users],
  ['roles', s.roles],
  ['permissions', s.permissions],
] as const;

console.log('┌─ Import Verification');
console.log('│');
let total = 0;
for (const [name, table] of tables) {
  const [{ c }] = await db.select({ c: sql<number>`count(*)::int` }).from(table as any);
  total += c;
  console.log(`│  ${name.padEnd(28)} ${String(c).padStart(5)} rows`);
}
console.log('│');
console.log(`│  ${'TOTAL'.padEnd(28)} ${String(total).padStart(5)} rows`);
console.log('│');

// Sample employee data
console.log('├─ Sample employees:');
const emps = await db.select({
  num: s.employees.employeeNumber,
  first: s.employees.firstName,
  last: s.employees.surname,
  hired: s.employees.hireDate,
  lid: s.employees.legacyId,
}).from(s.employees).limit(5);
for (const e of emps) {
  console.log(`│  ${e.num} - ${e.first} ${e.last} (hired: ${e.hired?.toISOString().slice(0, 10) ?? 'N/A'}, legacy_id: ${e.lid})`);
}

// Check FK integrity: employees with valid region/dept/jobTitle
console.log('│');
console.log('├─ FK integrity check:');
const [fkCheck] = await db.select({
  total: sql<number>`count(*)::int`,
  withRegion: sql<number>`count(region_id)::int`,
  withDept: sql<number>`count(department_id)::int`,
  withJobTitle: sql<number>`count(job_title_id)::int`,
  withDepot: sql<number>`count(depot_id)::int`,
  withManager: sql<number>`count(line_manager_id)::int`,
}).from(s.employees);
console.log(`│  Employees total:        ${fkCheck.total}`);
console.log(`│  With region_id:         ${fkCheck.withRegion}`);
console.log(`│  With department_id:     ${fkCheck.withDept}`);
console.log(`│  With job_title_id:      ${fkCheck.withJobTitle}`);
console.log(`│  With depot_id:          ${fkCheck.withDepot}`);
console.log(`│  With line_manager_id:   ${fkCheck.withManager}`);

console.log('│');
console.log('└─ Verification complete');
process.exit(0);

/**
 * Maps legacy Access table names to the new SQLite table names.
 * Used by the migration importer to resolve old → new during CSV import.
 * Keep this in sync as module subagents add their tables.
 */
export const LegacyTableMap: Record<string, string> = {
  // Auth
  'LoginDetails': 'users',
  'tblPermissions': '(replaced by role_permissions)',

  // Employees + lookups
  'Employees Employment details': 'employees',
  'TbRegion': 'regions',
  'TblDeparment': 'departments',
  'TblJobTitle': 'job_titles',
  'TblDepot': 'depots',
  'tblTiers': 'tiers',
  'tblTaxStatus': 'tax_statuses',

  // Recruitment
  'tblRequest': 'recruitment_requests',
  'Recruitment': 'recruitment',
  'tblInterview': 'interview_questions',
  'tblQue': 'interview_questions',
  'tblEmpInterview': 'candidate_answers',
  'tblMainSHeetInterview': 'recruitment_interviews',
  'tblEvaluation': 'recruitment_evaluations',
  'tblActualRecruitment': 'actual_recruitment',
  'tblEmpTake': 'employee_takes',
  'tblRecruitmentTarget': 'recruitment_targets',
  'tblRecruitmentAppData': 'recruitment_app_data',
  'tblNonRecruitmentReason': 'non_recruitment_reasons',

  // Job Descriptions
  'TblJobDescription': 'job_descriptions',
  'TblJobDescriptionEntryRecord': 'jd_entries',
  'TblJobdescriptionDetailRecord': 'jd_details',
  'TblJobDesRolesAndResponsibility': 'jd_roles',
  'TbJobDescriptionlKPIEntry': 'jd_kpis',
  'TblJobDesInternalTrainingEntry': 'jd_training_internal',
  'TblJobDesExternalTrainingEntry': 'jd_training_external',
  'TblEmployeJobDescriptionDetails': 'employee_jds',

  // Training
  'TblAllTrainings': 'trainings_catalogue',
  'TblEmployeeInternalTrainingDetails': 'training_internal',
  'TblEmployeeExternalTrainingDetails': 'training_external',
  'TblAnalysisSkils': 'analysis_skills',
  'tblAnswers': 'quiz_answers',
  'tblEmpTest': 'employee_tests',

  // Performance / Development / Succession
  'TblEmployeePerformence': 'employee_performance',
  'TblKPI': 'kpis',
  'TblKPICategory': 'kpi_categories',
  'tblDevelopement': 'development_plans',
  'tblQualDev': 'qual_dev',
  'tblSkillsDev': 'skills_dev',
  'tblDevExp': 'dev_experience',
  'tblCritical': 'critical_roles',
  'tblCriticalSkills': 'critical_skills',
  'tblSuccession': 'succession',
  'tblSuccAppData': 'succession_app_data',
  'TblScheme': 'schemes',

  // Leave / Expenses / Disciplinary
  'TblLeaveForm': 'leave_forms',
  'TblTypeofLeave': 'leave_types',
  'TblExpense': 'expenses',
  'tblCarScheme': 'car_scheme',
  'TblExpenseCategory': 'expense_categories',
  'TblCostOfSale': 'cost_of_sale',
  'tblActivities': 'activities',
  'tblOverheads': 'overheads',
  'tblApproval': 'expense_approvals',
  'TblDisciplinary': 'disciplinary_cases',
  'tblNatureOfOffence': 'nature_of_offence',
  'tblDisciplinaryAction': 'disciplinary_actions',
};

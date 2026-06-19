/**
 * Permission strings, ported verbatim from the desktop build so the RBAC model
 * stays identical. Format: <resource>.<action>[.<scope>].
 */
export const Permissions = {
  EmployeeRead: 'employee.read',
  EmployeeWrite: 'employee.write',
  EmployeeDelete: 'employee.delete',

  LeaveReadAll: 'leave.read.all',
  LeaveReadOwn: 'leave.read.own',
  LeaveReadOwnReports: 'leave.read.own_reports',
  LeaveWrite: 'leave.write',
  LeaveApproveOwnReports: 'leave.approve.own_reports',
  LeaveApproveAll: 'leave.approve.all',

  DisciplinaryRead: 'disciplinary.read',
  DisciplinaryWrite: 'disciplinary.write',

  RecruitmentRead: 'recruitment.read',
  RecruitmentWrite: 'recruitment.write',
  RecruitmentApprove: 'recruitment.approve',

  JobDescriptionRead: 'jd.read',
  JobDescriptionWrite: 'jd.write',

  TrainingRead: 'training.read',
  TrainingWrite: 'training.write',
  TrainingApprove: 'training.approve',

  PerformanceRead: 'performance.read',
  PerformanceWrite: 'performance.write',

  DevelopmentRead: 'development.read',
  DevelopmentWrite: 'development.write',
  DevelopmentApprove: 'development.approve',

  SuccessionRead: 'succession.read',
  SuccessionWrite: 'succession.write',

  ExpenseRead: 'expense.read',
  ExpenseWrite: 'expense.write',
  ExpenseApprove: 'expense.approve',

  ExitRead: 'exit.read',
  ExitWrite: 'exit.write',

  ReportsRun: 'reports.run',

  LookupsRead: 'lookups.read',
  LookupsWrite: 'lookups.write',

  SettingsRead: 'settings.read',
  SettingsWrite: 'settings.write',

  UsersManage: 'users.manage',
  AuditRead: 'audit.read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const P = Permissions;

/** Seed mapping of role → permissions. */
export const RolePermissions: Record<string, Permission[]> = {
  super_admin: Object.values(P),
  hr_admin: [
    P.EmployeeRead, P.EmployeeWrite, P.EmployeeDelete,
    P.LeaveReadAll, P.LeaveWrite, P.LeaveApproveAll,
    P.DisciplinaryRead, P.DisciplinaryWrite,
    P.RecruitmentRead, P.RecruitmentWrite, P.RecruitmentApprove,
    P.JobDescriptionRead, P.JobDescriptionWrite,
    P.TrainingRead, P.TrainingWrite, P.TrainingApprove,
    P.PerformanceRead, P.PerformanceWrite,
    P.DevelopmentRead, P.DevelopmentWrite, P.DevelopmentApprove,
    P.SuccessionRead, P.SuccessionWrite,
    P.ExpenseRead, P.ExpenseWrite, P.ExpenseApprove,
    P.ExitRead, P.ExitWrite,
    P.ReportsRun, P.LookupsRead, P.LookupsWrite,
    P.SettingsRead, P.SettingsWrite, P.UsersManage, P.AuditRead,
  ],
  hr_officer: [
    P.EmployeeRead, P.EmployeeWrite,
    P.LeaveReadAll, P.LeaveWrite,
    P.DisciplinaryRead, P.DisciplinaryWrite,
    P.RecruitmentRead, P.RecruitmentWrite,
    P.JobDescriptionRead, P.JobDescriptionWrite,
    P.TrainingRead, P.TrainingWrite,
    P.PerformanceRead, P.DevelopmentRead, P.SuccessionRead,
    P.ExpenseRead, P.ExitRead, P.ExitWrite,
    P.ReportsRun, P.LookupsRead, P.SettingsRead,
  ],
  line_manager: [
    P.EmployeeRead,
    P.LeaveReadOwnReports, P.LeaveApproveOwnReports,
    P.JobDescriptionRead, P.TrainingRead,
    P.PerformanceRead, P.PerformanceWrite,
    P.DevelopmentRead, P.ExpenseRead, P.ExpenseApprove,
    P.ReportsRun, P.LookupsRead,
  ],
  employee: [
    P.LeaveReadOwn, P.LeaveWrite,
    P.TrainingRead, P.ExpenseRead, P.ExpenseWrite,
  ],
  viewer: [
    P.EmployeeRead, P.LeaveReadAll, P.DisciplinaryRead, P.RecruitmentRead,
    P.JobDescriptionRead, P.TrainingRead, P.PerformanceRead, P.DevelopmentRead,
    P.SuccessionRead, P.ExpenseRead, P.ExitRead, P.ReportsRun, P.LookupsRead, P.AuditRead,
  ],
};

export const RoleDescriptions: Record<string, string> = {
  super_admin: 'Full system access',
  hr_admin: 'HR administrator — manage all HR records and users',
  hr_officer: 'HR officer — day-to-day HR record keeping',
  line_manager: 'Line manager — own team, approvals',
  employee: 'Employee self-service',
  viewer: 'Read-only / auditor',
};

export type RoleName = keyof typeof RolePermissions;

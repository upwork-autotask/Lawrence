/**
 * Permission strings used across IPC handlers and renderer guards.
 * Format: <resource>.<action>[.<scope>]
 */
export const Permissions = {
  // Employees
  EmployeeRead: 'employee.read',
  EmployeeWrite: 'employee.write',
  EmployeeDelete: 'employee.delete',

  // Leave
  LeaveReadAll: 'leave.read.all',
  LeaveReadOwn: 'leave.read.own',
  LeaveReadOwnReports: 'leave.read.own_reports',
  LeaveWrite: 'leave.write',
  LeaveApproveOwnReports: 'leave.approve.own_reports',
  LeaveApproveAll: 'leave.approve.all',

  // Disciplinary
  DisciplinaryRead: 'disciplinary.read',
  DisciplinaryWrite: 'disciplinary.write',

  // Recruitment
  RecruitmentRead: 'recruitment.read',
  RecruitmentWrite: 'recruitment.write',
  RecruitmentApprove: 'recruitment.approve',

  // Job Descriptions
  JobDescriptionRead: 'jd.read',
  JobDescriptionWrite: 'jd.write',

  // Training
  TrainingRead: 'training.read',
  TrainingWrite: 'training.write',
  TrainingApprove: 'training.approve',

  // Performance
  PerformanceRead: 'performance.read',
  PerformanceWrite: 'performance.write',

  // Development
  DevelopmentRead: 'development.read',
  DevelopmentWrite: 'development.write',
  DevelopmentApprove: 'development.approve',

  // Succession
  SuccessionRead: 'succession.read',
  SuccessionWrite: 'succession.write',

  // Expenses
  ExpenseRead: 'expense.read',
  ExpenseWrite: 'expense.write',
  ExpenseApprove: 'expense.approve',

  // Exit
  ExitRead: 'exit.read',
  ExitWrite: 'exit.write',

  // Reports
  ReportsRun: 'reports.run',

  // Settings
  SettingsRead: 'settings.read',
  SettingsWrite: 'settings.write',

  // Users / RBAC
  UsersManage: 'users.manage',

  // Audit
  AuditRead: 'audit.read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

/** Seed mapping of role → permissions. */
export const RolePermissions: Record<string, Permission[]> = {
  super_admin: Object.values(Permissions),
  hr_admin: [
    Permissions.EmployeeRead,
    Permissions.EmployeeWrite,
    Permissions.EmployeeDelete,
    Permissions.LeaveReadAll,
    Permissions.LeaveWrite,
    Permissions.LeaveApproveAll,
    Permissions.DisciplinaryRead,
    Permissions.DisciplinaryWrite,
    Permissions.RecruitmentRead,
    Permissions.RecruitmentWrite,
    Permissions.RecruitmentApprove,
    Permissions.JobDescriptionRead,
    Permissions.JobDescriptionWrite,
    Permissions.TrainingRead,
    Permissions.TrainingWrite,
    Permissions.TrainingApprove,
    Permissions.PerformanceRead,
    Permissions.PerformanceWrite,
    Permissions.DevelopmentRead,
    Permissions.DevelopmentWrite,
    Permissions.DevelopmentApprove,
    Permissions.SuccessionRead,
    Permissions.SuccessionWrite,
    Permissions.ExpenseRead,
    Permissions.ExpenseWrite,
    Permissions.ExpenseApprove,
    Permissions.ExitRead,
    Permissions.ExitWrite,
    Permissions.ReportsRun,
    Permissions.SettingsRead,
    Permissions.SettingsWrite,
    Permissions.UsersManage,
  ],
  hr_officer: [
    Permissions.EmployeeRead,
    Permissions.EmployeeWrite,
    Permissions.LeaveReadAll,
    Permissions.LeaveWrite,
    Permissions.DisciplinaryRead,
    Permissions.DisciplinaryWrite,
    Permissions.RecruitmentRead,
    Permissions.RecruitmentWrite,
    Permissions.JobDescriptionRead,
    Permissions.JobDescriptionWrite,
    Permissions.TrainingRead,
    Permissions.TrainingWrite,
    Permissions.PerformanceRead,
    Permissions.DevelopmentRead,
    Permissions.SuccessionRead,
    Permissions.ExpenseRead,
    Permissions.ExitRead,
    Permissions.ExitWrite,
    Permissions.ReportsRun,
    Permissions.SettingsRead,
  ],
  line_manager: [
    Permissions.EmployeeRead,
    Permissions.LeaveReadOwnReports,
    Permissions.LeaveApproveOwnReports,
    Permissions.JobDescriptionRead,
    Permissions.TrainingRead,
    Permissions.PerformanceRead,
    Permissions.PerformanceWrite,
    Permissions.DevelopmentRead,
    Permissions.ExpenseRead,
    Permissions.ExpenseApprove,
    Permissions.ReportsRun,
  ],
  employee: [
    Permissions.LeaveReadOwn,
    Permissions.LeaveWrite,
    Permissions.TrainingRead,
    Permissions.ExpenseRead,
    Permissions.ExpenseWrite,
  ],
  viewer: [
    Permissions.EmployeeRead,
    Permissions.LeaveReadAll,
    Permissions.DisciplinaryRead,
    Permissions.RecruitmentRead,
    Permissions.JobDescriptionRead,
    Permissions.TrainingRead,
    Permissions.PerformanceRead,
    Permissions.DevelopmentRead,
    Permissions.SuccessionRead,
    Permissions.ExpenseRead,
    Permissions.ExitRead,
    Permissions.ReportsRun,
    Permissions.AuditRead,
  ],
};

export type RoleName = keyof typeof RolePermissions;

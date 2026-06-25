import {
  Users, CalendarDays, ShieldAlert, FileText, GraduationCap, Gauge, TrendingUp,
  Network, UserPlus, Receipt, DoorOpen, BarChart3, ListTree, UserCog, ScrollText, Settings, Scale,
  LayoutDashboard, ListChecks, ClipboardList, ClipboardCheck, Award, KeyRound,
  type LucideIcon,
} from 'lucide-react';
import { Permissions } from './auth/permissions';

export type NavItem = { label: string; href: string; icon: LucideIcon; permission: string };
export type NavGroup = { group: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: Permissions.ReportsRun },
    ],
  },
  {
    group: 'Core HR',
    items: [
      { label: 'Employees', href: '/employees', icon: Users, permission: Permissions.EmployeeRead },
      { label: 'Leave', href: '/leave', icon: CalendarDays, permission: Permissions.LeaveReadAll },
      { label: 'Disciplinary', href: '/disciplinary', icon: ShieldAlert, permission: Permissions.DisciplinaryRead },
    ],
  },
  {
    group: 'Talent',
    items: [
      { label: 'Job Descriptions', href: '/job-descriptions', icon: FileText, permission: Permissions.JobDescriptionRead },
      { label: 'JD Assignments', href: '/job-descriptions/assignments', icon: ClipboardList, permission: Permissions.JobDescriptionRead },
      { label: 'JD Grading', href: '/jd-grading-eval', icon: Scale, permission: Permissions.JobDescriptionRead },
      { label: 'Training', href: '/training', icon: GraduationCap, permission: Permissions.TrainingRead },
      { label: 'Take a test', href: '/training/test', icon: ClipboardCheck, permission: Permissions.TrainingRead },
      { label: 'Test results', href: '/training/results', icon: Award, permission: Permissions.TrainingRead },
      { label: 'Training assignments', href: '/training/assignments', icon: GraduationCap, permission: Permissions.TrainingRead },
      { label: 'Performance', href: '/performance', icon: Gauge, permission: Permissions.PerformanceRead },
    ],
  },
  {
    group: 'Growth',
    items: [
      { label: 'Development', href: '/development', icon: TrendingUp, permission: Permissions.DevelopmentRead },
      { label: 'Succession', href: '/succession', icon: Network, permission: Permissions.SuccessionRead },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Recruitment', href: '/recruitment', icon: UserPlus, permission: Permissions.RecruitmentRead },
      { label: 'Candidate assessments', href: '/recruitment/assessments', icon: ClipboardCheck, permission: Permissions.RecruitmentRead },
      { label: 'Expenses', href: '/expenses', icon: Receipt, permission: Permissions.ExpenseRead },
      { label: 'Exit', href: '/exit', icon: DoorOpen, permission: Permissions.ExitRead },
    ],
  },
  {
    group: 'Administration',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3, permission: Permissions.ReportsRun },
      { label: 'Lookups', href: '/lookups', icon: ListTree, permission: Permissions.LookupsRead },
      { label: 'Grading', href: '/grading', icon: Scale, permission: Permissions.LookupsRead },
      { label: 'Leave types', href: '/leave-types', icon: CalendarDays, permission: Permissions.LeaveReadAll },
      { label: 'KPI categories', href: '/kpi-categories', icon: Gauge, permission: Permissions.PerformanceRead },
      { label: 'Interview questions', href: '/interview-questions', icon: ListChecks, permission: Permissions.RecruitmentRead },
      { label: 'Users', href: '/users', icon: UserCog, permission: Permissions.UsersManage },
      { label: 'Permissions', href: '/permissions', icon: KeyRound, permission: Permissions.UsersManage },
      { label: 'Audit Log', href: '/audit', icon: ScrollText, permission: Permissions.AuditRead },
      { label: 'Settings', href: '/settings', icon: Settings, permission: Permissions.SettingsRead },
    ],
  },
];

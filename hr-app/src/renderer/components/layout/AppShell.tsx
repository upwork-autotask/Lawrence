import * as React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Users, Calendar, AlertTriangle, Briefcase, GraduationCap, BarChart3,
  Target, TrendingUp, ClipboardList, Receipt, LogOut, Settings, Search,
} from 'lucide-react';
import { useAuth } from '@renderer/lib/auth';
import { Button } from '@renderer/components/ui/button';
import { cn } from '@renderer/lib/cn';
import { Permissions } from '@shared/permissions';

const nav: Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }>; permission?: string }> = [
  { to: '/employees', label: 'Employees', icon: Users, permission: Permissions.EmployeeRead },
  { to: '/leave', label: 'Leave', icon: Calendar },
  { to: '/disciplinary', label: 'Disciplinary', icon: AlertTriangle, permission: Permissions.DisciplinaryRead },
  { to: '/recruitment', label: 'Recruitment', icon: Search, permission: Permissions.RecruitmentRead },
  { to: '/job-descriptions', label: 'Job Descriptions', icon: ClipboardList, permission: Permissions.JobDescriptionRead },
  { to: '/training', label: 'Training', icon: GraduationCap, permission: Permissions.TrainingRead },
  { to: '/performance', label: 'Performance', icon: BarChart3, permission: Permissions.PerformanceRead },
  { to: '/development', label: 'Development', icon: TrendingUp, permission: Permissions.DevelopmentRead },
  { to: '/succession', label: 'Succession', icon: Target, permission: Permissions.SuccessionRead },
  { to: '/expenses', label: 'Expenses', icon: Receipt, permission: Permissions.ExpenseRead },
  { to: '/exit', label: 'Exit', icon: Briefcase, permission: Permissions.ExitRead },
];

export function AppShell() {
  const { user, logout, can } = useAuth();
  const filtered = nav.filter((n) => !n.permission || can(n.permission));

  return (
    <div className="grid h-full grid-cols-[260px_1fr] bg-background">
      <aside className="flex flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-semibold tracking-tight">HR Desktop</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-auto p-2">
          {filtered.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    isActive && 'bg-accent text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t p-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground',
                isActive && 'bg-accent text-foreground',
              )
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        </div>
        <div className="flex items-center justify-between gap-2 border-t p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user?.fullName}</div>
            <div className="truncate text-xs text-muted-foreground">{user?.roles.join(', ')}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={logout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>
      <main className="overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { authApi } from '@/lib/api/auth-client';
import { Button } from '@/components/ui/button';
import type { MeResponse } from '@/lib/api/contracts/auth';

const roleLabels: Record<string, string> = {
  super_admin: 'Administrator',
  hr_admin: 'HR Admin',
  hr_officer: 'HR Officer',
  line_manager: 'Line Manager',
  employee: 'Employee',
  viewer: 'Viewer',
};

export function Topbar({ me, onMenuClick }: { me: MeResponse; onMenuClick?: () => void }) {
  const router = useRouter();
  async function logout() {
    await authApi.logout();
    router.replace('/login');
  }
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open navigation" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
        <div className="truncate text-sm text-muted-foreground">HR Management</div>
      </div>
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        <div className="min-w-0 text-right">
          <div className="text-sm font-medium">{me.fullName}</div>
          <div className="text-xs text-muted-foreground">{roleLabels[me.roleName] ?? me.roleName}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
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

export function Topbar({ me }: { me: MeResponse }) {
  const router = useRouter();
  async function logout() {
    await authApi.logout();
    router.replace('/login');
  }
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="text-sm text-muted-foreground">HR Management</div>
      <div className="flex items-center gap-4">
        <div className="text-right">
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/cn';
import type { MeResponse } from '@/lib/api/contracts/auth';

export function Sidebar({
  me,
  className,
  onNavigate,
}: {
  me: MeResponse;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const perms = new Set(me.permissions);

  return (
    <aside className={cn('flex w-60 flex-col border-r bg-card', className)}>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" className="h-8 w-8 shrink-0" />
        <span className="truncate font-semibold tracking-tight">ORICOL</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {NAV.map((group) => {
          const items = group.items.filter((i) => perms.has(i.permission));
          if (!items.length) return null;
          return (
            <div key={group.group}>
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.group}
              </div>
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                          active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

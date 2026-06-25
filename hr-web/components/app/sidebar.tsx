'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/cn';
import type { MeResponse } from '@/lib/api/contracts/auth';

/**
 * Spinner shown on a nav item the moment it is clicked, until the target route
 * commits. Must be rendered as a descendant of the <Link> it reflects.
 */
function NavPending() {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin" /> : null;
}

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

  // Highlight only the single most-specific match, so a child route like
  // /training/test doesn't also light up its /training parent.
  const activeHref = NAV.flatMap((g) => g.items.map((i) => i.href))
    .filter((h) => pathname === h || pathname.startsWith(h + '/'))
    .reduce((best, h) => (h.length > best.length ? h : best), '');

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
                  const active = item.href === activeHref;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                          active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        <NavPending />
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

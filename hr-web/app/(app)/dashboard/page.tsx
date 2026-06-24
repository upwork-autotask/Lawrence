'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserPlus, CalendarDays, Receipt, Network, ClipboardList, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard-client';
import { titleCase } from '@/lib/format';
import { Card } from '@/components/ui/card';

type Bucket = { label: string; count: number };

const sevTone: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

function Stat({ icon: Icon, label, value, href }: { icon: typeof Users; label: string; value: number; href?: string }) {
  const inner = (
    <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
      <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{value.toLocaleString('en-ZA')}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function BarList({ title, buckets }: { title: string; buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {buckets.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-sm">
            <span className="w-28 shrink-0 truncate text-muted-foreground" title={b.label}>{titleCase(b.label)}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
              <div className="h-full rounded bg-primary/70" style={{ width: `${(b.count / max) * 100}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right tabular-nums">{b.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const r = await dashboardApi.get();
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const d = q.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground">Workforce overview and alerts</p>
      </div>

      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.isError && <p className="text-destructive">Could not load dashboard: {(q.error as Error).message}</p>}

      {d && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Stat icon={Users} label="Active employees" value={d.headcount.active} href="/employees" />
            <Stat icon={UserPlus} label="New hires (90 days)" value={d.headcount.newHires90d} href="/employees" />
            <Stat icon={CalendarDays} label="Leave to approve" value={d.pending.leave} href="/leave" />
            <Stat icon={Receipt} label="Claims to approve" value={d.pending.claims} href="/expenses" />
            <Stat icon={Network} label="Open recruitment" value={d.pending.recruitment} href="/recruitment" />
            <Stat icon={ClipboardList} label="Submitted take-ons" value={d.pending.takeOns} href="/employees/take-ons" />
          </div>

          {/* Alerts */}
          <Card className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> HR Alerts
            </h3>
            {d.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All clear — no outstanding alerts.</p>
            ) : (
              <ul className="space-y-2">
                {d.alerts.map((a) => (
                  <li key={a.key}>
                    <Link href={a.href} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${sevTone[a.severity]}`}>
                      <span>{a.label}</span>
                      <span className="flex items-center gap-1 font-semibold tabular-nums">{a.count}<ChevronRight className="h-4 w-4" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Breakdowns */}
          <div className="grid gap-3 md:grid-cols-2">
            <BarList title="Headcount by depot" buckets={d.byDepot} />
            <BarList title="Headcount by region" buckets={d.byRegion} />
            <BarList title="By employment status" buckets={d.byStatus} />
            <BarList title="By gender" buckets={d.byGender} />
          </div>
        </>
      )}
    </div>
  );
}

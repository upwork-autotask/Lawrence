'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users, UserPlus, CalendarDays, Receipt, Network, ClipboardList, AlertTriangle, ChevronRight,
  GraduationCap, Gauge,
} from 'lucide-react';
import { dashboardApi } from '@/lib/api/dashboard-client';
import { titleCase } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

type Bucket = { label: string; count: number };

const sevTone: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'recruitment', label: 'Recruitment' },
  { key: 'training', label: 'Training' },
  { key: 'performance', label: 'Performance' },
] as const;
type Tab = (typeof TABS)[number]['key'];

function Stat({ icon: Icon, label, value, href }: { icon: typeof Users; label: string; value: number | string; href?: string }) {
  const inner = (
    <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
      <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{typeof value === 'number' ? value.toLocaleString('en-ZA') : value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function BarList({ title, buckets, empty }: { title: string; buckets: Bucket[]; empty?: string }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {buckets.length === 0 && <p className="text-sm text-muted-foreground">{empty ?? 'No data.'}</p>}
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-sm">
            <span className="w-32 shrink-0 truncate text-muted-foreground" title={b.label}>{titleCase(b.label)}</span>
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
  const [tab, setTab] = React.useState<Tab>('overview');
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
        <p className="text-sm text-muted-foreground">Workforce overview, alerts and module metrics</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.isError && <p className="text-destructive">Could not load dashboard: {(q.error as Error).message}</p>}

      {d && tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Stat icon={Users} label="Active employees" value={d.headcount.active} href="/employees" />
            <Stat icon={UserPlus} label="New hires (90 days)" value={d.headcount.newHires90d} href="/employees" />
            <Stat icon={CalendarDays} label="Leave to approve" value={d.pending.leave} href="/leave" />
            <Stat icon={Receipt} label="Claims to approve" value={d.pending.claims} href="/expenses" />
            <Stat icon={Network} label="Open recruitment" value={d.pending.recruitment} href="/recruitment" />
            <Stat icon={ClipboardList} label="Submitted take-ons" value={d.pending.takeOns} href="/employees/take-ons" />
          </div>

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

          <div className="grid gap-3 md:grid-cols-2">
            <BarList title="Headcount by depot" buckets={d.byDepot} />
            <BarList title="Headcount by region" buckets={d.byRegion} />
            <BarList title="By employment status" buckets={d.byStatus} />
            <BarList title="By gender" buckets={d.byGender} />
          </div>
        </>
      )}

      {d && tab === 'recruitment' && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={Network} label="Open requisitions" value={d.pending.recruitment} href="/recruitment" />
            <Stat icon={Users} label="Candidates (hired)" value={d.recruitment.candidatesByStatus.find((b) => b.label === 'hired')?.count ?? 0} />
            <Stat icon={UserPlus} label="In interview" value={d.recruitment.requestsByStatus.find((b) => b.label === 'interviewing')?.count ?? 0} />
            <Stat icon={ClipboardList} label="Candidate records" value={d.recruitment.candidatesByStatus.reduce((n, b) => n + b.count, 0)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <BarList title="Requisitions by status" buckets={d.recruitment.requestsByStatus} empty="No recruitment requests." />
            <BarList title="Candidate pipeline" buckets={d.recruitment.candidatesByStatus} empty="No candidates yet." />
          </div>
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Recruitment targets — target vs. actual</h3>
            {d.recruitment.targets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recruitment targets set.</p>
            ) : (
              <div className="space-y-3">
                {d.recruitment.targets.map((t) => {
                  const pct = t.target > 0 ? Math.min(100, Math.round((t.achieved / t.target) * 100)) : 0;
                  return (
                    <div key={t.year} className="text-sm">
                      <div className="mb-1 flex justify-between"><span className="font-medium">{t.year}</span><span className="tabular-nums text-muted-foreground">{t.achieved} / {t.target} ({pct}%)</span></div>
                      <div className="h-3 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary/70" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {d && tab === 'training' && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={GraduationCap} label="Training records" value={d.training.total} href="/training" />
            <Stat icon={GraduationCap} label="Completed" value={d.training.completed} />
            <Stat icon={Gauge} label="Completion rate" value={d.training.total > 0 ? `${Math.round((d.training.completed / d.training.total) * 100)}%` : '—'} />
            <Stat icon={ClipboardList} label="In progress" value={d.training.byStatus.find((b) => b.label === 'in_progress')?.count ?? 0} />
          </div>
          <BarList title="Training by status (internal + external)" buckets={d.training.byStatus} empty="No training records yet." />
        </>
      )}

      {d && tab === 'performance' && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={Gauge} label="Performance records" value={d.performance.total} href="/performance" />
            <Stat icon={Gauge} label="Average score" value={d.performance.total > 0 ? d.performance.avgScore : '—'} />
            <Stat icon={ClipboardList} label="Approved" value={d.performance.byStatus.find((b) => b.label === 'approved')?.count ?? 0} />
            <Stat icon={AlertTriangle} label="Disputed" value={d.performance.byStatus.find((b) => b.label === 'disputed')?.count ?? 0} />
          </div>
          <BarList title="Performance reviews by status" buckets={d.performance.byStatus} empty="No performance records yet." />
        </>
      )}
    </div>
  );
}

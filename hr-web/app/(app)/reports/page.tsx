'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, CalendarClock, Gavel, GraduationCap, LineChart, Briefcase, TrendingUp } from 'lucide-react';
import { reportsApi } from '@/lib/api/reports-client';
import type { ReportSummary } from '@/lib/api/reports-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const STATS: { key: keyof ReportSummary; label: string; icon: typeof Users }[] = [
  { key: 'activeEmployees', label: 'Active employees', icon: Users },
  { key: 'pendingLeave', label: 'Pending leave applications', icon: CalendarClock },
  { key: 'openDisciplinaryCases', label: 'Open disciplinary cases', icon: Gavel },
  { key: 'trainingCourses', label: 'Training courses', icon: GraduationCap },
  { key: 'performanceReviews', label: 'Performance reviews', icon: LineChart },
  { key: 'openRecruitment', label: 'Recruitment requests', icon: Briefcase },
  { key: 'developmentPlans', label: 'Development plans', icon: TrendingUp },
];

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const r = await reportsApi.summary();
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">At-a-glance HR metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {isLoading ? '—' : (data?.[key] ?? 0)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

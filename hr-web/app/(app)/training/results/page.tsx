'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { trainingsApi } from '@/lib/api/training-client';
import { quizAttemptsApi } from '@/lib/api/quiz-attempts-client';
import { employeesApi } from '@/lib/api/resources';
import type { TrainingRow, QuizAttemptRow } from '@/lib/api/contracts/training';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { titleCase, pluralize } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'gray'> = {
  submitted: 'green', in_progress: 'amber',
};

const dt = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');

export default function TrainingResultsPage() {
  const [courseId, setCourseId] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');

  const options = useQuery({
    queryKey: ['results-options'],
    queryFn: async () => {
      const [e, t] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        trainingsApi.list({ pageSize: 1000 }),
      ]);
      return {
        employees: e.ok ? (e.value.items as EmployeeRow[]) : [],
        trainings: t.ok ? (t.value.items as TrainingRow[]) : [],
      };
    },
  });

  const attempts = useQuery({
    queryKey: ['quiz-attempts', courseId, employeeId],
    queryFn: async () => {
      const r = await quizAttemptsApi.list({
        courseId: courseId || undefined,
        employeeId: employeeId || undefined,
        pageSize: 500,
      });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const courseName = (id: string | null) =>
    (id && options.data?.trainings.find((x) => x.id === id)?.name) || '—';

  const items = (attempts.data?.items ?? []) as QuizAttemptRow[];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/training" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to training
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Test results</h1>
            <p className="text-sm text-muted-foreground">{pluralize(attempts.data?.total ?? 0, 'attempt')}</p>
          </div>
          <Link href="/training/test" className="text-sm text-primary underline-offset-4 hover:underline">
            Take a test →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-xl">
        <div className="space-y-1">
          <Label>Course</Label>
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All courses</option>
            {options.data?.trainings.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Candidate</Label>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">All candidates</option>
            {options.data?.employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.surname}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Candidate</TH><TH>Course</TH><TH>Score</TH><TH>Questions</TH><TH>Status</TH><TH>Submitted</TH>
            </TR>
          </THead>
          <TBody>
            {attempts.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {attempts.isError && <TR><TD colSpan={6} className="text-destructive">Could not load results: {(attempts.error as Error).message}</TD></TR>}
            {items.length === 0 && !attempts.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">No attempts yet.</TD></TR>}
            {items.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">{employeeName(a.employeeId)}</TD>
                <TD>{courseName(a.courseId)}</TD>
                <TD className="font-semibold">{a.totalScore}</TD>
                <TD>{a.totalQuestions}</TD>
                <TD><Badge tone={statusTone[a.status] ?? 'gray'}>{titleCase(a.status)}</Badge></TD>
                <TD>{dt(a.submittedAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

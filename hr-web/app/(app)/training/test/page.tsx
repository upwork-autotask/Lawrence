'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { trainingsApi } from '@/lib/api/training-client';
import { employeesApi } from '@/lib/api/resources';
import type { TrainingRow } from '@/lib/api/contracts/training';
import type { QuizAttemptRow } from '@/lib/api/contracts/training';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { TestRunner } from '@/components/training/test-runner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TrainingTestPage() {
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.TrainingWrite);

  const [courseId, setCourseId] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');
  const [started, setStarted] = React.useState(false);
  const [result, setResult] = React.useState<QuizAttemptRow | null>(null);

  const options = useQuery({
    queryKey: ['test-options'],
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

  const ready = Boolean(courseId && employeeId);

  function reset() {
    setStarted(false);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/training" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to training
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Take a test</h1>
          <p className="text-sm text-muted-foreground">Sit a course quiz and record the score.</p>
        </div>
      </div>

      {!canWrite && (
        <p className="text-sm text-destructive">You do not have permission to record test results.</p>
      )}

      {canWrite && (
        <>
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Course</Label>
                <Select
                  value={courseId}
                  onChange={(e) => { setCourseId(e.target.value); reset(); }}
                  disabled={started}
                >
                  <option value="">—</option>
                  {options.data?.trainings.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Candidate</Label>
                <Select
                  value={employeeId}
                  onChange={(e) => { setEmployeeId(e.target.value); reset(); }}
                  disabled={started}
                >
                  <option value="">—</option>
                  {options.data?.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.surname}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                {!started ? (
                  <Button className="w-full" disabled={!ready} onClick={() => setStarted(true)}>
                    Start test
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={reset}>
                    <RotateCcw className="h-4 w-4" /> Restart
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">Result recorded</h2>
                  <Badge tone="green">Submitted</Badge>
                </div>
                <p className="text-sm">
                  Score <span className="font-semibold">{result.totalScore}</span> across{' '}
                  {result.totalQuestions} question{result.totalQuestions === 1 ? '' : 's'}.
                </p>
                <Link href="/training/results" className="text-sm text-primary underline-offset-4 hover:underline">
                  View all results →
                </Link>
              </CardContent>
            </Card>
          )}

          {started && !result && (
            <TestRunner
              courseId={courseId}
              employeeId={employeeId}
              onSubmitted={(attempt) => { setResult(attempt); setStarted(false); }}
            />
          )}
        </>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { EmployeeDetailForm } from '@/components/employees/employee-detail-form';
import type { EmployeeLookups } from '@/components/employees/employee-detail-form';
import { titleCase } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  active: 'green', on_leave: 'amber', suspended: 'amber', terminated: 'red',
};

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.EmployeeWrite);

  const employee = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const r = await employeesApi.get(id);
      if (!r.ok) throw new Error(r.error.message);
      return r.value as EmployeeRow;
    },
  });

  const lookups = useQuery({
    queryKey: ['employee-detail-lookups'],
    queryFn: async (): Promise<EmployeeLookups> => {
      const [dep, job, reg, dp, tier, pat, ee, nbc, tax, site, emps] = await Promise.all([
        lookupsApi.list('departments'), lookupsApi.list('jobTitles'), lookupsApi.list('regions'),
        lookupsApi.list('depots'), lookupsApi.list('tiers'), lookupsApi.list('patersonGrades'),
        lookupsApi.list('eeGroups'), lookupsApi.list('nbcCouncils'), lookupsApi.list('taxStatuses'),
        lookupsApi.list('sites'),
        employeesApi.list({ pageSize: 1000 }),
      ]);
      return {
        departments: dep.ok ? dep.value.items : [],
        jobTitles: job.ok ? job.value.items : [],
        regions: reg.ok ? reg.value.items : [],
        depots: dp.ok ? dp.value.items : [],
        tiers: tier.ok ? tier.value.items : [],
        patersonGrades: pat.ok ? pat.value.items : [],
        eeGroups: ee.ok ? ee.value.items : [],
        nbcCouncils: nbc.ok ? nbc.value.items : [],
        taxStatuses: tax.ok ? tax.value.items : [],
        sites: site.ok ? site.value.items : [],
        managers: emps.ok
          ? emps.value.items.filter((e) => e.id !== id).map((e) => ({ id: e.id, name: `${e.firstName} ${e.surname}` }))
          : [],
      };
    },
  });

  function onSaved(updated: EmployeeRow) {
    qc.setQueryData(['employee', id], updated);
    qc.invalidateQueries({ queryKey: ['employees'] });
  }

  const e = employee.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employees" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Back to employees">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          {employee.isLoading && <p className="text-muted-foreground">Loading…</p>}
          {employee.isError && <p className="text-destructive">Could not load employee: {(employee.error as Error).message}</p>}
          {e && (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {e.title ? `${e.title} ` : ''}{e.firstName} {e.surname}
              </h1>
              <span className="font-mono text-sm text-muted-foreground">#{e.employeeNumber}</span>
              <Badge tone={statusTone[e.employmentStatus] ?? 'gray'}>{titleCase(e.employmentStatus)}</Badge>
            </div>
          )}
        </div>
      </div>

      {e && lookups.data && (
        <div className="rounded-lg border bg-card p-6">
          {canWrite ? (
            <EmployeeDetailForm employee={e} lookups={lookups.data} onSaved={onSaved} />
          ) : (
            <p className="text-sm text-muted-foreground">You do not have permission to edit employees.</p>
          )}
        </div>
      )}
    </div>
  );
}

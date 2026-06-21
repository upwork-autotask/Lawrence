'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { EmployeeForm } from '@/components/employees/employee-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  active: 'green', on_leave: 'amber', suspended: 'amber', terminated: 'red',
};

export default function EmployeesPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<EmployeeRow | null | undefined>(undefined); // undefined = closed

  const pageSize = 50;

  const list = useQuery({
    queryKey: ['employees', q, page],
    queryFn: async () => {
      const r = await employeesApi.list({ q, page, pageSize });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Keep the page in range when the result set shrinks (e.g. a new search).
  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function onSearch(value: string) {
    setQ(value);
    setPage(1);
  }

  const lookups = useQuery({
    queryKey: ['employee-lookups'],
    queryFn: async () => {
      const [d, j, r, dp] = await Promise.all([
        lookupsApi.list('departments'), lookupsApi.list('jobTitles'), lookupsApi.list('regions'), lookupsApi.list('depots'),
      ]);
      return {
        departments: d.ok ? d.value.items : [],
        jobTitles: j.ok ? j.value.items : [],
        regions: r.ok ? r.value.items : [],
        depots: dp.ok ? dp.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.EmployeeWrite);
  const canDelete = can(me, Permissions.EmployeeDelete);
  const depotName = (id: string | null) => lookups.data?.depots.find((d) => d.id === id)?.name ?? '—';

  async function onDelete(emp: EmployeeRow) {
    if (!confirm(`Delete ${emp.firstName} ${emp.surname}?`)) return;
    const r = await employeesApi.remove(emp.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['employees'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['employees'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'record')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New employee
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name or number…" value={q} onChange={(e) => onSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>No.</TH><TH>Name</TH><TH>Depot</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load employees: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No employees yet.</TD></TR>}
            {list.data?.items.map((emp) => (
              <TR key={emp.id}>
                <TD className="font-mono text-xs">{emp.employeeNumber}</TD>
                <TD className="font-medium">{emp.firstName} {emp.surname}</TD>
                <TD>{depotName(emp.depotId)}</TD>
                <TD><Badge tone={statusTone[emp.employmentStatus] ?? 'gray'}>{titleCase(emp.employmentStatus)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(emp)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(emp)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount} · {pluralize(total, 'record')}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit employee' : 'New employee'}</DialogTitle>
        {lookups.data && (
          <EmployeeForm
            employee={editing}
            lookups={lookups.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}

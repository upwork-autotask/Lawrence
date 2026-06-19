'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { EmployeeForm } from '@/components/employees/employee-form';
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
  const [editing, setEditing] = React.useState<EmployeeRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['employees', q],
    queryFn: async () => {
      const r = await employeesApi.list({ q, pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const lookups = useQuery({
    queryKey: ['employee-lookups'],
    queryFn: async () => {
      const [d, j, r] = await Promise.all([
        lookupsApi.list('departments'), lookupsApi.list('jobTitles'), lookupsApi.list('regions'),
      ]);
      return {
        departments: d.ok ? d.value.items : [],
        jobTitles: j.ok ? j.value.items : [],
        regions: r.ok ? r.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.EmployeeWrite);
  const canDelete = can(me, Permissions.EmployeeDelete);
  const deptName = (id: string | null) => lookups.data?.departments.find((d) => d.id === id)?.name ?? '—';

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
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} records</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New employee
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name or number…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>No.</TH><TH>Name</TH><TH>Department</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No employees yet.</TD></TR>}
            {list.data?.items.map((emp) => (
              <TR key={emp.id}>
                <TD className="font-mono text-xs">{emp.employeeNumber}</TD>
                <TD className="font-medium">{emp.firstName} {emp.surname}</TD>
                <TD>{deptName(emp.departmentId)}</TD>
                <TD><Badge tone={statusTone[emp.employmentStatus] ?? 'gray'}>{emp.employmentStatus}</Badge></TD>
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

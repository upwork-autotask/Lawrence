import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@renderer/components/ui/table';
import { Plus, Search } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import type { DevelopmentPlanStatus } from '@shared/ipc/development';

const STATUS_OPTIONS: DevelopmentPlanStatus[] = [
  'draft', 'submitted', 'approved', 'in_progress', 'completed', 'cancelled',
];

export function DevelopmentList() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [year, setYear] = React.useState<string>('');
  const [status, setStatus] = React.useState<DevelopmentPlanStatus | ''>('');
  const [employeeId, setEmployeeId] = React.useState<string>('');
  const canCreate = useCan(Permissions.DevelopmentWrite);

  const employeesQ = useQuery({
    queryKey: ['employees', { limit: 500 }],
    queryFn: async () => {
      const r = await api.employees.list({ limit: 500, offset: 0 });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const query = useQuery({
    queryKey: ['development', { search, year, status, employeeId }],
    queryFn: async () => {
      const r = await api.development.list({
        search: search || undefined,
        status: status || undefined,
        planYear: year ? Number(year) : undefined,
        employeeId: employeeId ? Number(employeeId) : undefined,
        limit: 100,
        offset: 0,
      });
      if (!r.ok) throw new Error(r.error.code === 'INTERNAL' ? r.error.message : r.error.code);
      return r.value;
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Development plans</h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${query.data.total} total` : 'Loading…'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/development/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New plan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 items-end gap-2">
        <div className="relative">
          <Label className="text-xs">Search</Label>
          <Search className="absolute left-2 top-[1.85rem] h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Employee or summary…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Year</Label>
          <Input
            type="number"
            placeholder="e.g. 2025"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus((e.target.value as DevelopmentPlanStatus) || '')}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Employee</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">All</option>
            {employeesQ.data?.rows.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Line mgr</TableHead>
              <TableHead>HR</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>EXCO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No development plans yet. {canCreate && 'Click "New plan" to add one.'}
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/development/${r.id}`)}
              >
                <TableCell className="font-medium">{r.employeeName}</TableCell>
                <TableCell className="font-mono text-xs">{r.planYear}</TableCell>
                <TableCell className="max-w-[20rem] truncate text-muted-foreground">{r.summary}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.status.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.lineManagerStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.hrStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.complianceStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.excoStatus}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

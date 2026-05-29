import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@renderer/components/ui/table';
import { Plus, Search } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';

export function EmployeesList() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const canCreate = useCan(Permissions.EmployeeWrite);

  const query = useQuery({
    queryKey: ['employees', { search }],
    queryFn: async () => {
      const r = await api.employees.list({ search, limit: 100, offset: 0 });
      if (!r.ok) throw new Error(r.error.code === 'INTERNAL' ? r.error.message : r.error.code);
      return r.value;
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${query.data.total} total` : 'Loading…'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/employees/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New employee
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, number or email…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No employees yet. {canCreate && 'Click "New employee" to add one.'}
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/employees/${r.id}`)}
              >
                <TableCell className="font-mono text-xs">{r.employeeNumber}</TableCell>
                <TableCell className="font-medium">{r.fullName}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.departmentName}</TableCell>
                <TableCell>{r.jobTitleName}</TableCell>
                <TableCell>{r.regionName}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.employmentStatus}
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

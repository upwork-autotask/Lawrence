import * as React from 'react';
import { useNavigate } from 'react-router-dom';
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

function formatDate(ms: number | null | undefined): string {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleDateString();
}

export function LeaveList() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const canCreate = useCan(Permissions.LeaveWrite);

  const query = useQuery({
    queryKey: ['leave', { search }],
    queryFn: async () => {
      const r = await api.leave.list({ search, limit: 100, offset: 0 });
      if (!r.ok) throw new Error(r.error.code === 'INTERNAL' ? r.error.message : r.error.code);
      return r.value;
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave applications</h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${query.data.total} total` : 'Loading…'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/leave/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New application
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee or reason…"
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
              <TableHead>Employee</TableHead>
              <TableHead>Leave type</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Line mgr</TableHead>
              <TableHead>HR</TableHead>
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
                  No leave applications yet. {canCreate && 'Click "New application" to add one.'}
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/leave/${r.id}`)}
              >
                <TableCell className="font-medium">{r.employeeName}</TableCell>
                <TableCell>{r.leaveTypeName}</TableCell>
                <TableCell>{formatDate(r.startDate)}</TableCell>
                <TableCell>{formatDate(r.endDate)}</TableCell>
                <TableCell className="font-mono text-xs">{r.daysRequested}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.status}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

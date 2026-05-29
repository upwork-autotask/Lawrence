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
import type { JobDescriptionStatus } from '@shared/ipc/job-descriptions';

const STATUS_OPTIONS: { value: '' | JobDescriptionStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
];

function formatDate(ms: number | null): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

export function JobDescriptionsList() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'' | JobDescriptionStatus>('');
  const canCreate = useCan(Permissions.JobDescriptionWrite);

  const query = useQuery({
    queryKey: ['job-descriptions', { search, status }],
    queryFn: async () => {
      const r = await api.jobDescriptions.list({
        search,
        status: status === '' ? undefined : status,
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
          <h1 className="text-2xl font-semibold tracking-tight">Job descriptions</h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${query.data.total} total` : 'Loading…'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/job-descriptions/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New JD
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, summary, or reports-to…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | JobDescriptionStatus)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Reports to</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Effective</TableHead>
              <TableHead>CEO approved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No job descriptions yet. {canCreate && 'Click "New JD" to add one.'}
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/job-descriptions/${r.id}`)}
              >
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="font-mono text-xs">v{r.version}</TableCell>
                <TableCell>{r.reportsToTitle ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.status}
                  </span>
                </TableCell>
                <TableCell>{formatDate(r.effectiveDate)}</TableCell>
                <TableCell>{formatDate(r.approvedByCeoAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

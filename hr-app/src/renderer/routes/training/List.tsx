import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@renderer/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import type { TrainingKind, TrainingSessionStatus } from '@shared/ipc/training';

function formatDate(ms: number | null): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

const SESSION_STATUS_OPTIONS: { value: '' | TrainingSessionStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'no_show', label: 'No show' },
];

const KIND_OPTIONS: { value: '' | TrainingKind; label: string }[] = [
  { value: '', label: 'All kinds' },
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'blended', label: 'Blended' },
];

export function TrainingList() {
  const navigate = useNavigate();
  const canCreate = useCan(Permissions.TrainingWrite);
  const [tab, setTab] = React.useState<'catalogue' | 'internal' | 'external'>('catalogue');

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training</h1>
          <p className="text-sm text-muted-foreground">
            Manage the training catalogue and assigned sessions.
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/training/new?kind=internal')}>
              <Plus className="mr-2 h-4 w-4" /> New internal session
            </Button>
            <Button onClick={() => navigate('/training/new?kind=external')}>
              <Plus className="mr-2 h-4 w-4" /> New external session
            </Button>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'catalogue' | 'internal' | 'external')}>
        <TabsList>
          <TabsTrigger value="catalogue">Catalogue</TabsTrigger>
          <TabsTrigger value="internal">Internal</TabsTrigger>
          <TabsTrigger value="external">External</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogue">
          <CatalogueTab />
        </TabsContent>
        <TabsContent value="internal">
          <InternalTab />
        </TabsContent>
        <TabsContent value="external">
          <ExternalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Catalogue tab ---------- */

function CatalogueTab() {
  const [search, setSearch] = React.useState('');
  const [kind, setKind] = React.useState<'' | TrainingKind>('');

  const query = useQuery({
    queryKey: ['trainingCatalogue', { search, kind }],
    queryFn: async () => {
      const r = await api.training.catalogueList({
        search,
        kind: kind === '' ? undefined : kind,
        includeInactive: false,
        limit: 100,
        offset: 0,
      });
      if (!r.ok) throw new Error(r.error.code === 'INTERNAL' ? r.error.message : r.error.code);
      return r.value;
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or provider…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as '' | TrainingKind)}
        >
          {KIND_OPTIONS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Duration (h)</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Quiz</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            )}
            {query.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No trainings in the catalogue.
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs">{r.code ?? '—'}</TableCell>
                <TableCell>{r.kind}</TableCell>
                <TableCell>{r.provider ?? '—'}</TableCell>
                <TableCell>{r.durationHours ?? '—'}</TableCell>
                <TableCell>{r.cost != null ? r.cost.toFixed(2) : '—'}</TableCell>
                <TableCell>{r.requiresQuiz ? 'Yes' : 'No'}</TableCell>
                <TableCell>{r.isActive ? 'Active' : 'Inactive'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------- Internal tab ---------- */

function InternalTab() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'' | TrainingSessionStatus>('');

  const query = useQuery({
    queryKey: ['trainingInternal', { search, status }],
    queryFn: async () => {
      const r = await api.training.internalList({
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee or training name…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | TrainingSessionStatus)}
        >
          {SESSION_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Training</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            )}
            {query.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No internal training sessions yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/training/internal/${r.id}`)}
              >
                <TableCell className="font-medium">{r.employeeName ?? '—'}</TableCell>
                <TableCell>{r.trainingName ?? '—'}</TableCell>
                <TableCell>{formatDate(r.scheduledDate)}</TableCell>
                <TableCell>{formatDate(r.completedAt)}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.status.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.approvalStatus}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.score ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------- External tab ---------- */

function ExternalTab() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'' | TrainingSessionStatus>('');

  const query = useQuery({
    queryKey: ['trainingExternal', { search, status }],
    queryFn: async () => {
      const r = await api.training.externalList({
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee, training, or provider…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | TrainingSessionStatus)}
        >
          {SESSION_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Training</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>PO #</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            )}
            {query.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No external training sessions yet.
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/training/external/${r.id}`)}
              >
                <TableCell className="font-medium">{r.employeeName ?? '—'}</TableCell>
                <TableCell>{r.trainingName ?? '—'}</TableCell>
                <TableCell>{r.providerName}</TableCell>
                <TableCell>{formatDate(r.scheduledDate)}</TableCell>
                <TableCell className="font-mono text-xs">{r.poNumber ?? '—'}</TableCell>
                <TableCell>{r.cost != null ? r.cost.toFixed(2) : '—'}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.status.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.approvalStatus}
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

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api/audit-client';
import { titleCase, pluralize } from '@/lib/format';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const ENTITY_TYPES = [
  'employee', 'user', 'leave_form', 'disciplinary_case', 'training',
  'performance', 'job_description', 'development', 'succession',
  'recruitment', 'expense', 'exit', 'lookup', 'setting',
];

const actionTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  create: 'green', update: 'amber', delete: 'red', login: 'gray',
};

export default function AuditPage() {
  const [entityType, setEntityType] = React.useState('');

  const list = useQuery({
    queryKey: ['audit', entityType],
    queryFn: async () => {
      const r = await auditApi.list({ entityType, pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'entry', 'entries')}</p>
        </div>
        <div className="w-56">
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Time</TH><TH>Actor</TH><TH>Action</TH><TH>Entity type</TH><TH>Entity id</TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load audit entries: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No audit entries.</TD></TR>}
            {list.data?.items.map((e) => (
              <TR key={e.id}>
                <TD className="whitespace-nowrap text-xs">{new Date(e.at).toLocaleString()}</TD>
                <TD className="font-mono text-xs">{e.actorId ?? '—'}</TD>
                <TD><Badge tone={actionTone[e.action] ?? 'gray'}>{titleCase(e.action)}</Badge></TD>
                <TD>{titleCase(e.entityType)}</TD>
                <TD className="font-mono text-xs">{e.entityId ?? '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

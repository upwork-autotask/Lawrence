'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { lookupsApi } from '@/lib/api/resources';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { LookupForm } from '@/components/lookups/lookup-form';
import { pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

/** Keys from lookupTables, with friendly labels. */
const TABLES: { key: string; label: string }[] = [
  { key: 'departments', label: 'Departments' },
  { key: 'regions', label: 'Regions' },
  { key: 'jobTitles', label: 'Job titles' },
  { key: 'depots', label: 'Depots' },
  { key: 'tiers', label: 'Tiers' },
  { key: 'patersonGrades', label: 'Paterson grades' },
  { key: 'eeGroups', label: 'EE groups' },
  { key: 'nbcCouncils', label: 'NBC councils' },
  { key: 'taxStatuses', label: 'Tax statuses' },
  { key: 'costOfSale', label: 'Cost of sale' },
  { key: 'activities', label: 'Activities' },
  { key: 'overheads', label: 'Overheads' },
  { key: 'sites', label: 'Sites' },
];

export default function LookupsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [table, setTable] = React.useState(TABLES[0].key);
  const [editing, setEditing] = React.useState<LookupRow | null | undefined>(undefined); // undefined = closed

  const canWrite = can(me, Permissions.LookupsWrite);

  const list = useQuery({
    queryKey: ['lookups', table],
    queryFn: async () => {
      const r = await lookupsApi.list(table);
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  async function onDelete(row: LookupRow) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    const r = await lookupsApi.remove(table, row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['lookups', table] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['lookups', table] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lookups</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'value')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add value
          </Button>
        )}
      </div>

      <div className="max-w-xs">
        <Select
          value={table}
          onChange={(e) => {
            setTable(e.target.value);
            setEditing(undefined);
          }}
        >
          {TABLES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH><TH>Code</TH><TH>Sort</TH><TH>Active</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load values: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No values yet.</TD></TR>}
            {list.data?.items.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium">{row.name}</TD>
                <TD className="font-mono text-xs">{row.code ?? '—'}</TD>
                <TD>{row.sortOrder}</TD>
                <TD><Badge tone={row.isActive ? 'green' : 'gray'}>{row.isActive ? 'Active' : 'Inactive'}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit value' : 'Add value'}</DialogTitle>
        <LookupForm
          table={table}
          row={editing}
          onSaved={onSaved}
          onCancel={() => setEditing(undefined)}
        />
      </Dialog>
    </div>
  );
}

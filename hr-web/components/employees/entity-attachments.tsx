'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import type { AttachmentsApi } from '@/lib/api/attachments-client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

// Mirrors the Access onboarding/employee document types, plus a catch-all.
const DEFAULT_DOC_TYPES = [
  'Criminal check', 'Contract', 'Job description', 'SARS document',
  'Sage form', 'Bank confirmation', 'ID / passport', "Driver's licence",
  'Medical', 'Work permit', 'PrDP', 'Other',
];

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');
const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** Reusable upload/list/download/delete panel for any entity's attachments. */
export function EntityAttachments({
  api, parentId, queryScope, docTypes = DEFAULT_DOC_TYPES,
}: {
  api: AttachmentsApi;
  parentId: string;
  queryScope: string;
  docTypes?: string[];
}) {
  const qc = useQueryClient();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [category, setCategory] = React.useState(docTypes[0]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const key = [queryScope, 'attachments', parentId];

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const r = await api.list(parentId);
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  async function onUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Choose a file first.'); return; }
    setError(null);
    setBusy(true);
    const r = await api.upload(parentId, file, category);
    setBusy(false);
    if (!r.ok) { setError(r.error.message); return; }
    if (fileRef.current) fileRef.current.value = '';
    qc.invalidateQueries({ queryKey: key });
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const r = await api.remove(id);
    if (!r.ok) { alert(r.error.message); return; }
    qc.invalidateQueries({ queryKey: key });
  }

  const items = list.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Document type</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
            {docTypes.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">File</label>
          <input
            ref={fileRef}
            type="file"
            className="block text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
          />
        </div>
        <Button type="button" onClick={onUpload} disabled={busy}>
          <Upload className="h-4 w-4" /> {busy ? 'Uploading…' : 'Upload'}
        </Button>
        <span className="text-xs text-muted-foreground">Max 15 MB.</span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Document</TH><TH>Type</TH><TH>Size</TH><TH>Uploaded</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load attachments: {(list.error as Error).message}</TD></TR>}
            {!list.isLoading && items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No documents uploaded yet.</TD></TR>}
            {items.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">
                  <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{a.filename}</span>
                </TD>
                <TD>{a.category ?? '—'}</TD>
                <TD>{fmtSize(a.size)}</TD>
                <TD>{day(a.createdAt)}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    <a
                      href={api.downloadUrl(a.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
                      aria-label="Download"
                      download={a.filename}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(a.id, a.filename)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

// Client-side CSV export — build a CSV from rows and trigger a browser download.
// Used by list/register pages for the Access "Export to Excel" affordance.
// (Pairs with window.print() for the "Print" affordance.)

export type CsvColumn<T> = {
  /** Property key on the row (ignored when `value` is supplied). */
  key?: string;
  /** Column header. */
  label: string;
  /** Derive the cell value (e.g. resolve an FK id to a name). */
  value?: (row: T) => unknown;
};

function cell(v: unknown): string {
  if (v == null) return '';
  const s = typeof v === 'string' ? v : String(v);
  // Quote when the value contains a delimiter, quote or newline; double interior quotes.
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((r) =>
    columns
      .map((c) => cell(c.value ? c.value(r) : (r as Record<string, unknown>)[c.key ?? '']))
      .join(','),
  );
  return [header, ...body].join('\r\n');
}

/** Build a CSV and download it as `<filename>.csv` (UTF-8 with BOM for Excel). */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const csv = '﻿' + toCsv(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

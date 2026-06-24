import { apiFetch } from './client';
import type { Result } from '../types/result';

export type AttachmentRow = {
  id: string;
  entityType: string;
  entityId: string;
  category: string | null;
  filename: string;
  mime: string;
  size: number;
  createdAt: string;
};

/**
 * Attachments client bound to a parent resource base (e.g. '/api/employees'
 * or '/api/employee-take-ons'). list/upload hit `${base}/${id}/attachments`;
 * download/delete are entity-agnostic (keyed by attachment id).
 */
export function makeAttachmentsApi(base: string) {
  return {
    list: (parentId: string) =>
      apiFetch<{ items: AttachmentRow[]; total: number }>(`${base}/${parentId}/attachments`),

    remove: (id: string) => apiFetch<{ id: string }>(`/api/attachments/${id}`, { method: 'DELETE' }),

    downloadUrl: (id: string) => `/api/attachments/${id}/download`,

    /** Multipart upload — must NOT set Content-Type so the browser adds the boundary. */
    async upload(parentId: string, file: File, category: string): Promise<Result<AttachmentRow>> {
      const fd = new FormData();
      fd.append('file', file);
      if (category) fd.append('category', category);
      try {
        const res = await fetch(`${base}/${parentId}/attachments`, {
          method: 'POST',
          body: fd,
          credentials: 'same-origin',
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) return { ok: true, value: body.value as AttachmentRow };
        return { ok: false, error: body.error ?? { code: 'INTERNAL', message: 'Upload failed' } };
      } catch {
        return { ok: false, error: { code: 'NETWORK', message: 'Could not reach the server' } };
      }
    },
  };
}

export type AttachmentsApi = ReturnType<typeof makeAttachmentsApi>;

export const employeeAttachmentsApi = makeAttachmentsApi('/api/employees');
export const takeOnAttachmentsApi = makeAttachmentsApi('/api/employee-take-ons');

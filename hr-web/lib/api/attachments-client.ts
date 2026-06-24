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

export const employeeAttachmentsApi = {
  list: (employeeId: string) =>
    apiFetch<{ items: AttachmentRow[]; total: number }>(`/api/employees/${employeeId}/attachments`),

  remove: (id: string) => apiFetch<{ id: string }>(`/api/attachments/${id}`, { method: 'DELETE' }),

  downloadUrl: (id: string) => `/api/attachments/${id}/download`,

  /** Multipart upload — must NOT set Content-Type so the browser adds the boundary. */
  async upload(employeeId: string, file: File, category: string): Promise<Result<AttachmentRow>> {
    const fd = new FormData();
    fd.append('file', file);
    if (category) fd.append('category', category);
    try {
      const res = await fetch(`/api/employees/${employeeId}/attachments`, {
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

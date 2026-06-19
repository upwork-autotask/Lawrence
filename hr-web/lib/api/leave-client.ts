import { resource, apiFetch } from './client';
import type { LeaveFormRow, LeaveTypeRow } from './contracts/leave';

const base = resource<LeaveFormRow>('/api/leave');

export const leaveApi = {
  ...base,
  approve: (
    id: string,
    body: { step: 'lineManager' | 'hr'; decision: 'approved' | 'rejected'; comments?: string },
  ) => apiFetch<LeaveFormRow>(`/api/leave/${id}/approve`, { method: 'POST', body: JSON.stringify(body) }),
};

export const leaveTypesApi = resource<LeaveTypeRow>('/api/leave-types');

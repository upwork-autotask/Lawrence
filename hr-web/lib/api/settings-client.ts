import { apiFetch } from './client';
import type { SettingsResponse } from './contracts/settings';

export const settingsApi = {
  get: () => apiFetch<SettingsResponse>('/api/settings'),
  save: (entries: { key: string; value: string }[]) =>
    apiFetch<SettingsResponse>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ entries }),
    }),
};

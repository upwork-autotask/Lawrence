import { resource } from './client';
import type { CaseRow, OffenceRow, ActionRow } from './contracts/disciplinary';

export const disciplinaryApi = resource<CaseRow>('/api/disciplinary');
export const offencesApi = resource<OffenceRow>('/api/offences');
export const actionsApi = resource<ActionRow>('/api/disciplinary-actions');

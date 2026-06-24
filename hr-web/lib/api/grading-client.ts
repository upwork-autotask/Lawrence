import { resource } from './client';
import type { GradingRow } from './contracts/grading';

export const gradingApi = resource<GradingRow>('/api/grading');

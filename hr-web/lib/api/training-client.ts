import { resource } from './client';
import type { TrainingRow, TrainingInternalRow, TrainingExternalRow } from './contracts/training';

export const trainingsApi = resource<TrainingRow>('/api/trainings');
export const trainingInternalApi = resource<TrainingInternalRow>('/api/training-internal');
export const trainingExternalApi = resource<TrainingExternalRow>('/api/training-external');

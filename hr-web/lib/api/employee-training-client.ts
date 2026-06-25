import { resource } from './client';
import type {
  EmployeeTrainingInternalRow,
  EmployeeTrainingExternalRow,
} from './contracts/employee-training';

export const employeeTrainingInternalApi = resource<EmployeeTrainingInternalRow>('/api/employee-training-internal');
export const employeeTrainingExternalApi = resource<EmployeeTrainingExternalRow>('/api/employee-training-external');

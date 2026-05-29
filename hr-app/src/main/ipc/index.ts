import { registerAuthHandlers } from './auth';
import { registerEmployeesHandlers } from './employees';
import { registerLookupsHandlers } from './lookups';
import { registerLeaveHandlers } from './leave';
import { registerDisciplinaryHandlers } from './disciplinary';
import { registerSettingsHandlers } from './settings';
import { registerJobDescriptionsHandlers } from './job-descriptions';
import { registerTrainingHandlers } from './training';
import { registerPerformanceHandlers } from './performance';
import { registerDevelopmentHandlers } from './development';

/** Single entry point — called once from main/index.ts before windows open. */
export function registerAllHandlers(): void {
  registerAuthHandlers();
  registerEmployeesHandlers();
  registerLookupsHandlers();
  registerLeaveHandlers();
  registerDisciplinaryHandlers();
  registerSettingsHandlers();
  registerJobDescriptionsHandlers();
  registerTrainingHandlers();
  registerPerformanceHandlers();
  registerDevelopmentHandlers();
}

import { resource } from './client';
import type {
  DevelopmentPlanRow, QualDevRow, SkillsDevRow, DevExperienceRow,
} from './contracts/development';

export const developmentApi = resource<DevelopmentPlanRow>('/api/development');
export const devQualsApi = resource<QualDevRow>('/api/dev-quals');
export const devSkillsApi = resource<SkillsDevRow>('/api/dev-skills');
export const devExperienceApi = resource<DevExperienceRow>('/api/dev-experience');

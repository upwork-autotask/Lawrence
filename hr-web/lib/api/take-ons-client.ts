import { resource } from './client';
import type { TakeOnRow } from './contracts/take-ons';

export const takeOnsApi = resource<TakeOnRow>('/api/employee-take-ons');

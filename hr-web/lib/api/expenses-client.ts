import { resource } from './client';
import type { ExpenseRow, CategoryRow, CarSchemeRow } from './contracts/expenses';

export const expensesApi = resource<ExpenseRow>('/api/expenses');
export const expenseCategoriesApi = resource<CategoryRow>('/api/expense-categories');
export const carSchemeApi = resource<CarSchemeRow>('/api/car-scheme');

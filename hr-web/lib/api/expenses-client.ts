import { resource, apiFetch } from './client';
import type {
  ExpenseRow,
  CategoryRow,
  CarSchemeRow,
  ExpenseListResult,
  ExpenseApprove,
} from './contracts/expenses';

const base = resource<ExpenseRow>('/api/expenses');

export const expensesApi = {
  ...base,
  /** Typed list (includes `totalAmount` for the register footer). */
  list: (params?: Record<string, unknown>) =>
    apiFetch<ExpenseListResult>(`/api/expenses${query(params)}`),
  /** Manager approve/reject a claim. */
  approve: (id: string, data: ExpenseApprove) =>
    apiFetch<ExpenseRow>(`/api/expenses/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
};

function query(params?: Record<string, unknown>) {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const expenseCategoriesApi = resource<CategoryRow>('/api/expense-categories');
export const carSchemeApi = resource<CarSchemeRow>('/api/car-scheme');

import type { Result, Paginated } from '../types/result';

/** Low-level fetch returning the app's Result<T> envelope. Browser-side. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, value: (body.value ?? body) as T };
    return { ok: false, error: body.error ?? { code: 'INTERNAL', message: 'Request failed' } };
  } catch {
    return { ok: false, error: { code: 'NETWORK', message: 'Could not reach the server' } };
  }
}

const qs = (params?: Record<string, unknown>) => {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

/** Typed REST resource. Gives every module list/get/create/update/remove. */
export function resource<T, C = Partial<T>, U = Partial<T>>(base: string) {
  return {
    list: (params?: Record<string, unknown>) => apiFetch<Paginated<T>>(`${base}${qs(params)}`),
    get: (id: string) => apiFetch<T>(`${base}/${id}`),
    create: (data: C) => apiFetch<T>(base, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: U) => apiFetch<T>(`${base}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch<{ id: string }>(`${base}/${id}`, { method: 'DELETE' }),
  };
}

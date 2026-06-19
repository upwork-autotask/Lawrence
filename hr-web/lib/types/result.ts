export type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

/** Shape the client wrapper hands the UI. Mirrors the desktop build's Result<T>. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: ApiErrorBody };

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

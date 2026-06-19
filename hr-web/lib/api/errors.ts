/** Application error carrying an HTTP status, a stable code, and optional field errors. */
export class AppError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const Errors = {
  unauthorized: (msg = 'Authentication required') => new AppError(401, 'UNAUTHENTICATED', msg),
  forbidden: (msg = 'You do not have permission to do that') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (msg = 'Not found') => new AppError(404, 'NOT_FOUND', msg),
  conflict: (msg = 'This record was changed by someone else. Reload and try again.') =>
    new AppError(409, 'CONFLICT', msg),
  validation: (fields: Record<string, string>, msg = 'Validation failed') =>
    new AppError(422, 'VALIDATION', msg, fields),
  badRequest: (msg = 'Bad request') => new AppError(400, 'BAD_REQUEST', msg),
  internal: (msg = 'Something went wrong') => new AppError(500, 'INTERNAL', msg),
};

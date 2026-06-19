import { NextRequest, NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { getDb, type Db } from '../db/client';
import { auditLog } from '../db/schema';
import { AppError, Errors } from './errors';
import { resolveActor, type Actor } from '../auth/session';

export type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

export type Ctx = {
  actor: Actor | null;
  /** The DB handle to use — a transaction for writes, the base client for reads. */
  tx: Db;
  params: Record<string, string>;
  query: URLSearchParams;
  req: NextRequest;
  /** Append an audit row inside the current transaction. */
  audit: (entry: AuditInput) => Promise<void>;
};

type Opts<I, O> = {
  schema?: ZodType<I>;
  source?: 'body' | 'query' | 'none';
  permission?: string | string[];
  public?: boolean;
  handler: (input: I, ctx: Ctx) => Promise<O> | O;
};

type Segment = { params: Promise<Record<string, string>> };

function errorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) } },
      { status: err.status },
    );
  }
  console.error('[api] unhandled error:', err);
  return NextResponse.json({ error: { code: 'INTERNAL', message: 'Something went wrong' } }, { status: 500 });
}

/**
 * Wraps every API route. Guarantees, in one place: auth resolution, permission
 * gating, Zod validation, a DB transaction for writes, audit logging, optimistic
 * concurrency surfacing, and consistent error → HTTP status mapping.
 */
export function withHandler<I, O>(opts: Opts<I, O>) {
  return async (req: NextRequest, segment: Segment): Promise<NextResponse> => {
    try {
      const params = (await segment?.params) ?? {};
      const url = new URL(req.url);
      const method = req.method.toUpperCase();
      const isWrite = method !== 'GET' && method !== 'HEAD';

      // 1–2. Auth + permission
      let actor: Actor | null = null;
      if (opts.public) {
        actor = await resolveActor(req).catch(() => null);
      } else {
        actor = await resolveActor(req);
        if (!actor) throw Errors.unauthorized();
        if (opts.permission) {
          const need = Array.isArray(opts.permission) ? opts.permission : [opts.permission];
          if (!need.some((p) => actor!.permissions.has(p))) throw Errors.forbidden();
        }
      }

      // 3. Validate input
      const source = opts.source ?? (method === 'GET' ? 'query' : isWrite ? 'body' : 'none');
      let input = {} as I;
      if (opts.schema) {
        let raw: unknown = {};
        if (source === 'body') raw = await req.json().catch(() => ({}));
        else if (source === 'query') raw = Object.fromEntries(url.searchParams.entries());
        const parsed = opts.schema.safeParse(raw);
        if (!parsed.success) {
          const fields: Record<string, string> = {};
          for (const issue of parsed.error.issues) fields[issue.path.join('.') || '_'] = issue.message;
          throw Errors.validation(fields);
        }
        input = parsed.data;
      }

      // 4. Run (inside a transaction for writes)
      const db = await getDb();
      const run = async (tx: Db): Promise<O> => {
        const ctx: Ctx = {
          actor,
          tx,
          params,
          query: url.searchParams,
          req,
          audit: async (e) => {
            await tx.insert(auditLog).values({
              actorId: actor?.id ?? null,
              action: e.action,
              entityType: e.entityType,
              entityId: e.entityId ?? null,
              before: (e.before as object) ?? null,
              after: (e.after as object) ?? null,
            });
          },
        };
        return opts.handler(input, ctx);
      };

      const value = isWrite ? await db.transaction((tx) => run(tx as unknown as Db)) : await run(db);

      // 5. Respond
      return NextResponse.json({ value }, { status: method === 'POST' ? 201 : 200 });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

import { ipcMain } from 'electron';
import type { ZodTypeAny, z } from 'zod';
import type { Permission } from '@shared/permissions';
import type { Result, AppError } from '@shared/types/result';
import { ok, err } from '@shared/types/result';
import { lookupSession, type RequestContext } from './context';
import { translateError } from '../db/error-translate';
import log from 'electron-log/main';

type Handler<Req, Res> = (req: Req, ctx: RequestContext) => Promise<Result<Res>> | Result<Res>;

export interface HandlerOptions<ReqSchema extends ZodTypeAny> {
  channel: string;
  request: ReqSchema;
  permission?: Permission | null;     // null = no permission needed (still needs session unless `public`)
  public?: boolean;                   // skip session check (auth.login, auth.bootstrap, auth.session)
}

const registered = new Set<string>();

/**
 * Registers a typed IPC handler. The handler factory:
 *   1. validates the request payload (Zod)
 *   2. resolves the session from the renderer-provided token (unless `public: true`)
 *   3. checks the declared permission
 *   4. wraps the handler body so thrown errors return Result<...> instead of crashing IPC
 */
export function registerHandler<ReqSchema extends ZodTypeAny, Res>(
  opts: HandlerOptions<ReqSchema>,
  handler: Handler<z.infer<ReqSchema>, Res>,
): void {
  if (registered.has(opts.channel)) {
    throw new Error(`IPC channel already registered: ${opts.channel}`);
  }
  registered.add(opts.channel);

  ipcMain.handle(opts.channel, async (_event, raw: { token?: string; payload: unknown }): Promise<Result<Res>> => {
    try {
      const parsed = opts.request.safeParse(raw?.payload);
      if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          fields[issue.path.join('.')] = issue.message;
        }
        return err({ code: 'VALIDATION', fields });
      }

      const session = lookupSession(raw?.token);
      if (!opts.public && !session) {
        return err({ code: 'UNAUTHENTICATED' });
      }
      if (opts.permission && session) {
        if (!session.permissions.includes(opts.permission)) {
          return err({ code: 'FORBIDDEN', permission: opts.permission });
        }
      }

      const ctx: RequestContext = { session };
      const result = await handler(parsed.data, ctx);
      return result;
    } catch (e) {
      log.error(`Handler error on ${opts.channel}:`, e);
      return err(translateError(e) as AppError);
    }
  });
}

/** Convenience wrapper that just calls ok()/err() — re-exported here for handler files. */
export { ok, err };

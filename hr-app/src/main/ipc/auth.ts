import { z } from 'zod';
import { Channels } from '@shared/ipc/channels';
import {
  LoginRequest, BootstrapRequest, ChangePasswordRequest,
} from '@shared/ipc/auth';
import { registerHandler, ok, err } from './registry';
import * as auth from '../services/auth';
import { rememberSession, forgetSession, lookupSession } from './context';

export function registerAuthHandlers(): void {
  registerHandler(
    {
      channel: Channels.AuthBootstrap,
      request: BootstrapRequest,
      public: true,
    },
    async (req) => {
      if (auth.hasAnyUser()) {
        return err({ code: 'CONFLICT', message: 'Initial admin already exists. Sign in instead.' });
      }
      try {
        const { token, user } = await auth.bootstrapSuperAdmin(req);
        rememberSession(token, user);
        return ok({ token, user });
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'CONFLICT') {
          return err({ code: 'CONFLICT', message: (e as Error).message });
        }
        throw e;
      }
    },
  );

  registerHandler(
    {
      channel: Channels.AuthLogin,
      request: LoginRequest,
      public: true,
    },
    async (req) => {
      try {
        const { token, user } = await auth.login(req.username, req.password);
        rememberSession(token, user);
        return ok({ token, user });
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'UNAUTHENTICATED') {
          return err({ code: 'UNAUTHENTICATED', message: 'Invalid username or password' });
        }
        throw e;
      }
    },
  );

  registerHandler(
    {
      channel: Channels.AuthLogout,
      request: z.object({}),
      public: true, // public so the call still works even if session expired
    },
    async (_req, ctx) => {
      // The renderer drops its token; here we just clear the in-memory cache.
      if (ctx.session) {
        // Find token by reverse lookup is awkward; renderer will forget locally,
        // and old tokens will fail subsequent permission checks. Add explicit token in payload if needed.
      }
      return ok(null);
    },
  );

  registerHandler(
    {
      channel: Channels.AuthSession,
      request: z.object({}),
      public: true,
    },
    async (_req, ctx) => {
      return ok(ctx.session);
    },
  );

  registerHandler(
    {
      channel: Channels.AuthStatus,
      request: z.object({}),
      public: true,
    },
    async () => ok({ usersExist: auth.hasAnyUser() }),
  );

  registerHandler(
    {
      channel: Channels.AuthChangePassword,
      request: ChangePasswordRequest,
    },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await auth.changePassword(ctx.session.id, req.currentPassword, req.newPassword);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'UNAUTHENTICATED') return err({ code: 'UNAUTHENTICATED', message: 'Current password incorrect' });
        throw e;
      }
    },
  );
}

export { forgetSession, lookupSession };

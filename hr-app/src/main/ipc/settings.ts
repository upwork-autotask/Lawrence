import { Channels } from '@shared/ipc/channels';
import {
  SettingsGetRequest, SettingsSetRequest, SmtpTestRequest,
} from '@shared/ipc/settings';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/settings';
import { Permissions } from '@shared/permissions';

export function registerSettingsHandlers(): void {
  registerHandler(
    { channel: Channels.SettingsGet, request: SettingsGetRequest, permission: Permissions.SettingsRead },
    async () => ok(svc.listSettings()),
  );

  registerHandler(
    { channel: Channels.SettingsSet, request: SettingsSetRequest, permission: Permissions.SettingsWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      await svc.setSetting(req.key, req.value, ctx.session.id);
      return ok(null);
    },
  );

  registerHandler(
    { channel: Channels.SettingsTestSmtp, request: SmtpTestRequest, permission: Permissions.SettingsWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.testSmtp(req.to);
      return ok(r);
    },
  );
}

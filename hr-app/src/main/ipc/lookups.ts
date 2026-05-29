import { Channels } from '@shared/ipc/channels';
import {
  LookupsListRequest, LookupsCreateRequest, LookupsUpdateRequest, LookupsDeleteRequest,
} from '@shared/ipc/lookups';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/lookups';
import { Permissions } from '@shared/permissions';

export function registerLookupsHandlers(): void {
  registerHandler(
    { channel: Channels.LookupsList, request: LookupsListRequest, permission: null },
    async (req) => ok({ rows: svc.listLookup(req.kind, req.includeInactive) }),
  );

  registerHandler(
    { channel: Channels.LookupsCreate, request: LookupsCreateRequest, permission: Permissions.SettingsWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createLookup(req.kind, req.values, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.LookupsUpdate, request: LookupsUpdateRequest, permission: Permissions.SettingsWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.updateLookup(req.kind, req.id, req.values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.LookupsDelete, request: LookupsDeleteRequest, permission: Permissions.SettingsWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteLookup(req.kind, req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );
}

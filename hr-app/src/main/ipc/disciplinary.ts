import { Channels } from '@shared/ipc/channels';
import {
  DisciplinaryListRequest, DisciplinaryGetRequest,
  DisciplinaryCreateRequest, DisciplinaryUpdateRequest, DisciplinaryDeleteRequest,
  NatureOfOffenceListRequest, NatureOfOffenceCreateRequest,
  NatureOfOffenceUpdateRequest, NatureOfOffenceDeleteRequest,
  DisciplinaryActionListRequest, DisciplinaryActionCreateRequest,
  DisciplinaryActionUpdateRequest, DisciplinaryActionDeleteRequest,
  CriminalReportListRequest, CriminalReportCreateRequest,
  CriminalReportUpdateRequest, CriminalReportDeleteRequest,
} from '@shared/ipc/disciplinary';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/disciplinary';
import { Permissions } from '@shared/permissions';

export function registerDisciplinaryHandlers(): void {
  // ---------- Disciplinary cases ----------
  registerHandler(
    { channel: Channels.DisciplinaryList, request: DisciplinaryListRequest, permission: Permissions.DisciplinaryRead },
    async (req) => ok(svc.listDisciplinary(req)),
  );

  registerHandler(
    { channel: Channels.DisciplinaryGet, request: DisciplinaryGetRequest, permission: Permissions.DisciplinaryRead },
    async (req) => ok(svc.getDisciplinaryCase(req.id)),
  );

  registerHandler(
    { channel: Channels.DisciplinaryCreate, request: DisciplinaryCreateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createDisciplinaryCase(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.DisciplinaryUpdate, request: DisciplinaryUpdateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateDisciplinaryCase(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.DisciplinaryDelete, request: DisciplinaryDeleteRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteDisciplinaryCase(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  // ---------- Nature of offence ----------
  registerHandler(
    { channel: Channels.NatureOfOffenceList, request: NatureOfOffenceListRequest, permission: Permissions.DisciplinaryRead },
    async (req) => ok({ rows: svc.listNatureOfOffence(req.includeInactive) }),
  );

  registerHandler(
    { channel: Channels.NatureOfOffenceCreate, request: NatureOfOffenceCreateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createNatureOfOffence(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.NatureOfOffenceUpdate, request: NatureOfOffenceUpdateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateNatureOfOffence(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.NatureOfOffenceDelete, request: NatureOfOffenceDeleteRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteNatureOfOffence(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  // ---------- Disciplinary actions ----------
  registerHandler(
    { channel: Channels.DisciplinaryActionList, request: DisciplinaryActionListRequest, permission: Permissions.DisciplinaryRead },
    async (req) => ok({ rows: svc.listDisciplinaryActions(req.includeInactive) }),
  );

  registerHandler(
    { channel: Channels.DisciplinaryActionCreate, request: DisciplinaryActionCreateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createDisciplinaryAction(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.DisciplinaryActionUpdate, request: DisciplinaryActionUpdateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateDisciplinaryAction(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.DisciplinaryActionDelete, request: DisciplinaryActionDeleteRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteDisciplinaryAction(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  // ---------- Criminal reports ----------
  registerHandler(
    { channel: Channels.CriminalReportList, request: CriminalReportListRequest, permission: Permissions.DisciplinaryRead },
    async (req) => ok({ rows: svc.listCriminalReports(req.caseId) }),
  );

  registerHandler(
    { channel: Channels.CriminalReportCreate, request: CriminalReportCreateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createCriminalReport(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.CriminalReportUpdate, request: CriminalReportUpdateRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateCriminalReport(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.CriminalReportDelete, request: CriminalReportDeleteRequest, permission: Permissions.DisciplinaryWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteCriminalReport(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );
}

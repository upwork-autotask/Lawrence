import { Channels } from '@shared/ipc/channels';
import {
  LeaveListRequest, LeaveGetRequest,
  LeaveCreateRequest, LeaveUpdateRequest, LeaveDeleteRequest,
  LeaveApproveRequest,
  LeaveTypeListRequest, LeaveTypeCreateRequest, LeaveTypeUpdateRequest, LeaveTypeDeleteRequest,
  LeaveBalanceListRequest,
} from '@shared/ipc/leave';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/leave';
import { Permissions } from '@shared/permissions';

export function registerLeaveHandlers(): void {
  /* ---------- Leave forms ---------- */
  // NOTE: scope handling (read.own, read.own_reports / approve.own_reports) is OUT OF SCOPE
  // for this pass — every read/approve requires the *.all permission. Later passes refine.
  registerHandler(
    { channel: Channels.LeaveList, request: LeaveListRequest, permission: Permissions.LeaveReadAll },
    async (req) => ok(svc.listLeave(req)),
  );

  registerHandler(
    { channel: Channels.LeaveGet, request: LeaveGetRequest, permission: Permissions.LeaveReadAll },
    async (req) => ok(svc.getLeave(req.id)),
  );

  registerHandler(
    { channel: Channels.LeaveCreate, request: LeaveCreateRequest, permission: Permissions.LeaveWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createLeave(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.LeaveUpdate, request: LeaveUpdateRequest, permission: Permissions.LeaveWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateLeave(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.LeaveDelete, request: LeaveDeleteRequest, permission: Permissions.LeaveWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteLeave(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.LeaveApprove, request: LeaveApproveRequest, permission: Permissions.LeaveApproveAll },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.approveLeave(req, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Leave types ---------- */
  registerHandler(
    { channel: Channels.LeaveTypesList, request: LeaveTypeListRequest, permission: Permissions.LeaveReadAll },
    async (req) => ok({ rows: svc.listLeaveTypes(req.includeInactive) }),
  );

  registerHandler(
    { channel: Channels.LeaveTypesCreate, request: LeaveTypeCreateRequest, permission: Permissions.LeaveWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createLeaveType(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.LeaveTypesUpdate, request: LeaveTypeUpdateRequest, permission: Permissions.LeaveWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateLeaveType(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.LeaveTypesDelete, request: LeaveTypeDeleteRequest, permission: Permissions.LeaveWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteLeaveType(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Leave balances ---------- */
  registerHandler(
    { channel: Channels.LeaveBalancesList, request: LeaveBalanceListRequest, permission: Permissions.LeaveReadAll },
    async (req) => ok({ rows: svc.listLeaveBalances(req) }),
  );
}

import { Channels } from '@shared/ipc/channels';
import {
  EmployeesListRequest, EmployeesGetRequest,
  EmployeesCreateRequest, EmployeesUpdateRequest, EmployeesDeleteRequest,
} from '@shared/ipc/employees';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/employees';
import { Permissions } from '@shared/permissions';

export function registerEmployeesHandlers(): void {
  registerHandler(
    { channel: Channels.EmployeesList, request: EmployeesListRequest, permission: Permissions.EmployeeRead },
    async (req) => ok(svc.listEmployees(req)),
  );

  registerHandler(
    { channel: Channels.EmployeesGet, request: EmployeesGetRequest, permission: Permissions.EmployeeRead },
    async (req) => ok(svc.getEmployee(req.id)),
  );

  registerHandler(
    { channel: Channels.EmployeesCreate, request: EmployeesCreateRequest, permission: Permissions.EmployeeWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createEmployee(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.EmployeesUpdate, request: EmployeesUpdateRequest, permission: Permissions.EmployeeWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateEmployee(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.EmployeesDelete, request: EmployeesDeleteRequest, permission: Permissions.EmployeeDelete },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteEmployee(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );
}

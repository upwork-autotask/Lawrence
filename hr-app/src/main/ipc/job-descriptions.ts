import { Channels } from '@shared/ipc/channels';
import {
  JobDescriptionListRequest, JobDescriptionGetRequest,
  JobDescriptionCreateRequest, JobDescriptionUpdateRequest, JobDescriptionDeleteRequest,
  JdEntryListRequest, JdEntryCreateRequest, JdEntryUpdateRequest, JdEntryDeleteRequest,
  JdRoleListRequest, JdRoleCreateRequest, JdRoleUpdateRequest, JdRoleDeleteRequest,
  JdKpiListRequest, JdKpiCreateRequest, JdKpiUpdateRequest, JdKpiDeleteRequest,
  JdTrainingListRequest, JdTrainingCreateRequest, JdTrainingUpdateRequest, JdTrainingDeleteRequest,
  EmployeeJdListRequest, EmployeeJdCreateRequest, EmployeeJdUpdateRequest, EmployeeJdDeleteRequest,
} from '@shared/ipc/job-descriptions';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/job-descriptions';
import { Permissions } from '@shared/permissions';

export function registerJobDescriptionsHandlers(): void {
  /* ---------- Job descriptions (master) ---------- */
  registerHandler(
    { channel: Channels.JobDescriptionsList, request: JobDescriptionListRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok(svc.listJobDescriptions(req)),
  );

  registerHandler(
    { channel: Channels.JobDescriptionsGet, request: JobDescriptionGetRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok(svc.getJobDescription(req.id)),
  );

  registerHandler(
    { channel: Channels.JobDescriptionsCreate, request: JobDescriptionCreateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createJobDescription(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.JobDescriptionsUpdate, request: JobDescriptionUpdateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateJobDescription(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.JobDescriptionsDelete, request: JobDescriptionDeleteRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteJobDescription(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- JD entries ---------- */
  registerHandler(
    { channel: Channels.JdEntriesList, request: JdEntryListRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok({ rows: svc.listJdEntries(req.jdId) }),
  );

  registerHandler(
    { channel: Channels.JdEntriesCreate, request: JdEntryCreateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createJdEntry(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.JdEntriesUpdate, request: JdEntryUpdateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateJdEntry(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.JdEntriesDelete, request: JdEntryDeleteRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteJdEntry(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- JD roles ---------- */
  registerHandler(
    { channel: Channels.JdRolesList, request: JdRoleListRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok({ rows: svc.listJdRoles(req.jdId) }),
  );

  registerHandler(
    { channel: Channels.JdRolesCreate, request: JdRoleCreateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createJdRole(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.JdRolesUpdate, request: JdRoleUpdateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateJdRole(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.JdRolesDelete, request: JdRoleDeleteRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteJdRole(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- JD KPIs ---------- */
  registerHandler(
    { channel: Channels.JdKpisList, request: JdKpiListRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok({ rows: svc.listJdKpis(req.jdId) }),
  );

  registerHandler(
    { channel: Channels.JdKpisCreate, request: JdKpiCreateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createJdKpi(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.JdKpisUpdate, request: JdKpiUpdateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateJdKpi(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.JdKpisDelete, request: JdKpiDeleteRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteJdKpi(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- JD internal training ---------- */
  registerHandler(
    { channel: Channels.JdTrainingInternalList, request: JdTrainingListRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok({ rows: svc.listJdTraining('internal', req.jdId) }),
  );

  registerHandler(
    { channel: Channels.JdTrainingInternalCreate, request: JdTrainingCreateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createJdTraining('internal', req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.JdTrainingInternalUpdate, request: JdTrainingUpdateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateJdTraining('internal', id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.JdTrainingInternalDelete, request: JdTrainingDeleteRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteJdTraining('internal', req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- JD external training ---------- */
  registerHandler(
    { channel: Channels.JdTrainingExternalList, request: JdTrainingListRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok({ rows: svc.listJdTraining('external', req.jdId) }),
  );

  registerHandler(
    { channel: Channels.JdTrainingExternalCreate, request: JdTrainingCreateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createJdTraining('external', req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.JdTrainingExternalUpdate, request: JdTrainingUpdateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateJdTraining('external', id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.JdTrainingExternalDelete, request: JdTrainingDeleteRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteJdTraining('external', req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Employee JD assignments ---------- */
  registerHandler(
    { channel: Channels.EmployeeJdsList, request: EmployeeJdListRequest, permission: Permissions.JobDescriptionRead },
    async (req) => ok({ rows: svc.listEmployeeJds(req) }),
  );

  registerHandler(
    { channel: Channels.EmployeeJdsCreate, request: EmployeeJdCreateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createEmployeeJd(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.EmployeeJdsUpdate, request: EmployeeJdUpdateRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateEmployeeJd(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.EmployeeJdsDelete, request: EmployeeJdDeleteRequest, permission: Permissions.JobDescriptionWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteEmployeeJd(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );
}

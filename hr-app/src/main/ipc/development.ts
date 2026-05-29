import { Channels } from '@shared/ipc/channels';
import {
  DevelopmentListRequest, DevelopmentGetRequest,
  DevelopmentCreateRequest, DevelopmentUpdateRequest, DevelopmentDeleteRequest,
  DevelopmentApproveRequest,
  QualDevListRequest, QualDevCreateRequest, QualDevUpdateRequest, QualDevDeleteRequest,
  SkillsDevListRequest, SkillsDevCreateRequest, SkillsDevUpdateRequest, SkillsDevDeleteRequest,
  DevExperienceListRequest, DevExperienceCreateRequest, DevExperienceUpdateRequest, DevExperienceDeleteRequest,
} from '@shared/ipc/development';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/development';
import { Permissions } from '@shared/permissions';

export function registerDevelopmentHandlers(): void {
  /* ---------- Development plans ---------- */
  registerHandler(
    { channel: Channels.DevelopmentList, request: DevelopmentListRequest, permission: Permissions.DevelopmentRead },
    async (req) => ok(svc.listDevelopmentPlans(req)),
  );

  registerHandler(
    { channel: Channels.DevelopmentGet, request: DevelopmentGetRequest, permission: Permissions.DevelopmentRead },
    async (req) => ok(svc.getDevelopmentPlan(req.id)),
  );

  registerHandler(
    { channel: Channels.DevelopmentCreate, request: DevelopmentCreateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createDevelopmentPlan(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.DevelopmentUpdate, request: DevelopmentUpdateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateDevelopmentPlan(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.DevelopmentDelete, request: DevelopmentDeleteRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteDevelopmentPlan(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.DevelopmentApprove, request: DevelopmentApproveRequest, permission: Permissions.DevelopmentApprove },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.approveDevelopmentPlan(req, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Qualifications ---------- */
  registerHandler(
    { channel: Channels.QualDevList, request: QualDevListRequest, permission: Permissions.DevelopmentRead },
    async (req) => ok({ rows: svc.listQualDev(req.planId) }),
  );

  registerHandler(
    { channel: Channels.QualDevCreate, request: QualDevCreateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createQualDev(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.QualDevUpdate, request: QualDevUpdateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateQualDev(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.QualDevDelete, request: QualDevDeleteRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteQualDev(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Skills ---------- */
  registerHandler(
    { channel: Channels.SkillsDevList, request: SkillsDevListRequest, permission: Permissions.DevelopmentRead },
    async (req) => ok({ rows: svc.listSkillsDev(req.planId) }),
  );

  registerHandler(
    { channel: Channels.SkillsDevCreate, request: SkillsDevCreateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createSkillsDev(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.SkillsDevUpdate, request: SkillsDevUpdateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateSkillsDev(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.SkillsDevDelete, request: SkillsDevDeleteRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteSkillsDev(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Experience ---------- */
  registerHandler(
    { channel: Channels.DevExperienceList, request: DevExperienceListRequest, permission: Permissions.DevelopmentRead },
    async (req) => ok({ rows: svc.listDevExperience(req.planId) }),
  );

  registerHandler(
    { channel: Channels.DevExperienceCreate, request: DevExperienceCreateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createDevExperience(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.DevExperienceUpdate, request: DevExperienceUpdateRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateDevExperience(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.DevExperienceDelete, request: DevExperienceDeleteRequest, permission: Permissions.DevelopmentWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteDevExperience(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );
}

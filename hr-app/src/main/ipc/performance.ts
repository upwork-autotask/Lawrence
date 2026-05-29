import { Channels } from '@shared/ipc/channels';
import {
  PerformanceListRequest, PerformanceGetRequest,
  PerformanceCreateRequest, PerformanceUpdateRequest, PerformanceDeleteRequest,
  PerformanceApproveRequest,
  KpiCategoryListRequest, KpiCategoryCreateRequest, KpiCategoryUpdateRequest, KpiCategoryDeleteRequest,
  KpiListRequest, KpiCreateRequest, KpiUpdateRequest, KpiDeleteRequest,
} from '@shared/ipc/performance';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/performance';
import { Permissions } from '@shared/permissions';

export function registerPerformanceHandlers(): void {
  /* ---------- Employee performance ---------- */
  registerHandler(
    { channel: Channels.PerformanceList, request: PerformanceListRequest, permission: Permissions.PerformanceRead },
    async (req) => ok(svc.listPerformance(req)),
  );

  registerHandler(
    { channel: Channels.PerformanceGet, request: PerformanceGetRequest, permission: Permissions.PerformanceRead },
    async (req) => ok(svc.getPerformance(req.id)),
  );

  registerHandler(
    { channel: Channels.PerformanceCreate, request: PerformanceCreateRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createPerformance(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.PerformanceUpdate, request: PerformanceUpdateRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updatePerformance(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.PerformanceDelete, request: PerformanceDeleteRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deletePerformance(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.PerformanceApprove, request: PerformanceApproveRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.approvePerformance(req, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- KPI categories ---------- */
  registerHandler(
    { channel: Channels.KpiCategoriesList, request: KpiCategoryListRequest, permission: Permissions.PerformanceRead },
    async (req) => ok({ rows: svc.listKpiCategories(req.includeInactive) }),
  );

  registerHandler(
    { channel: Channels.KpiCategoriesCreate, request: KpiCategoryCreateRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createKpiCategory(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.KpiCategoriesUpdate, request: KpiCategoryUpdateRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateKpiCategory(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.KpiCategoriesDelete, request: KpiCategoryDeleteRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteKpiCategory(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- KPIs ---------- */
  registerHandler(
    { channel: Channels.KpisList, request: KpiListRequest, permission: Permissions.PerformanceRead },
    async (req) => ok({ rows: svc.listKpis(req) }),
  );

  registerHandler(
    { channel: Channels.KpisCreate, request: KpiCreateRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const r = await svc.createKpi(req, ctx.session.id);
      return ok(r);
    },
  );

  registerHandler(
    { channel: Channels.KpisUpdate, request: KpiUpdateRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateKpi(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.KpisDelete, request: KpiDeleteRequest, permission: Permissions.PerformanceWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteKpi(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );
}

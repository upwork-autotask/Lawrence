import { Channels } from '@shared/ipc/channels';
import {
  TrainingCatalogueListRequest, TrainingCatalogueGetRequest,
  TrainingCatalogueCreateRequest, TrainingCatalogueUpdateRequest, TrainingCatalogueDeleteRequest,
  TrainingInternalListRequest, TrainingInternalGetRequest,
  TrainingInternalCreateRequest, TrainingInternalUpdateRequest, TrainingInternalDeleteRequest,
  TrainingExternalListRequest, TrainingExternalGetRequest,
  TrainingExternalCreateRequest, TrainingExternalUpdateRequest, TrainingExternalDeleteRequest,
  TrainingApproveRequest,
  AnalysisSkillsListRequest, AnalysisSkillsCreateRequest,
  AnalysisSkillsUpdateRequest, AnalysisSkillsDeleteRequest,
  QuizQuestionListRequest, QuizQuestionCreateRequest,
  QuizQuestionUpdateRequest, QuizQuestionDeleteRequest,
  QuizAnswerListRequest, QuizAnswerCreateRequest,
  QuizAnswerUpdateRequest, QuizAnswerDeleteRequest,
  EmployeeTestListRequest, EmployeeTestCreateRequest,
  EmployeeTestUpdateRequest, EmployeeTestDeleteRequest,
} from '@shared/ipc/training';
import { registerHandler, ok, err } from './registry';
import * as svc from '../services/training';
import { Permissions } from '@shared/permissions';

export function registerTrainingHandlers(): void {
  /* ---------- Trainings catalogue ---------- */
  registerHandler(
    { channel: Channels.TrainingCatalogueList, request: TrainingCatalogueListRequest, permission: Permissions.TrainingRead },
    async (req) => ok(svc.listTrainingsCatalogue(req)),
  );

  registerHandler(
    { channel: Channels.TrainingCatalogueGet, request: TrainingCatalogueGetRequest, permission: Permissions.TrainingRead },
    async (req) => ok(svc.getTrainingCatalogue(req.id)),
  );

  registerHandler(
    { channel: Channels.TrainingCatalogueCreate, request: TrainingCatalogueCreateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createTrainingCatalogue(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.TrainingCatalogueUpdate, request: TrainingCatalogueUpdateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateTrainingCatalogue(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.TrainingCatalogueDelete, request: TrainingCatalogueDeleteRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteTrainingCatalogue(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Internal training sessions ---------- */
  registerHandler(
    { channel: Channels.TrainingInternalList, request: TrainingInternalListRequest, permission: Permissions.TrainingRead },
    async (req) => ok(svc.listTrainingInternal(req)),
  );

  registerHandler(
    { channel: Channels.TrainingInternalGet, request: TrainingInternalGetRequest, permission: Permissions.TrainingRead },
    async (req) => ok(svc.getTrainingInternal(req.id)),
  );

  registerHandler(
    { channel: Channels.TrainingInternalCreate, request: TrainingInternalCreateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createTrainingInternal(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.TrainingInternalUpdate, request: TrainingInternalUpdateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateTrainingInternal(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.TrainingInternalDelete, request: TrainingInternalDeleteRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteTrainingInternal(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- External training sessions ---------- */
  registerHandler(
    { channel: Channels.TrainingExternalList, request: TrainingExternalListRequest, permission: Permissions.TrainingRead },
    async (req) => ok(svc.listTrainingExternal(req)),
  );

  registerHandler(
    { channel: Channels.TrainingExternalGet, request: TrainingExternalGetRequest, permission: Permissions.TrainingRead },
    async (req) => ok(svc.getTrainingExternal(req.id)),
  );

  registerHandler(
    { channel: Channels.TrainingExternalCreate, request: TrainingExternalCreateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createTrainingExternal(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.TrainingExternalUpdate, request: TrainingExternalUpdateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateTrainingExternal(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.TrainingExternalDelete, request: TrainingExternalDeleteRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteTrainingExternal(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Approvals (internal + external) ---------- */
  registerHandler(
    { channel: Channels.TrainingApprove, request: TrainingApproveRequest, permission: Permissions.TrainingApprove },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.approveTraining(req, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Analysis skills (pipeline) ---------- */
  registerHandler(
    { channel: Channels.AnalysisSkillsList, request: AnalysisSkillsListRequest, permission: Permissions.TrainingRead },
    async (req) => ok({ rows: svc.listAnalysisSkills(req) }),
  );

  registerHandler(
    { channel: Channels.AnalysisSkillsCreate, request: AnalysisSkillsCreateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createAnalysisSkills(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.AnalysisSkillsUpdate, request: AnalysisSkillsUpdateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateAnalysisSkills(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.AnalysisSkillsDelete, request: AnalysisSkillsDeleteRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteAnalysisSkills(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Quiz questions ---------- */
  registerHandler(
    { channel: Channels.QuizQuestionList, request: QuizQuestionListRequest, permission: Permissions.TrainingRead },
    async (req) => ok({ rows: svc.listQuizQuestions(req) }),
  );

  registerHandler(
    { channel: Channels.QuizQuestionCreate, request: QuizQuestionCreateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createQuizQuestion(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.QuizQuestionUpdate, request: QuizQuestionUpdateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateQuizQuestion(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.QuizQuestionDelete, request: QuizQuestionDeleteRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteQuizQuestion(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Quiz answers ---------- */
  registerHandler(
    { channel: Channels.QuizAnswerList, request: QuizAnswerListRequest, permission: Permissions.TrainingRead },
    async (req) => ok({ rows: svc.listQuizAnswers(req) }),
  );

  registerHandler(
    { channel: Channels.QuizAnswerCreate, request: QuizAnswerCreateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createQuizAnswer(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.QuizAnswerUpdate, request: QuizAnswerUpdateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateQuizAnswer(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.QuizAnswerDelete, request: QuizAnswerDeleteRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteQuizAnswer(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  /* ---------- Employee tests ---------- */
  registerHandler(
    { channel: Channels.EmployeeTestList, request: EmployeeTestListRequest, permission: Permissions.TrainingRead },
    async (req) => ok({ rows: svc.listEmployeeTests(req) }),
  );

  registerHandler(
    { channel: Channels.EmployeeTestCreate, request: EmployeeTestCreateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      return ok(await svc.createEmployeeTest(req, ctx.session.id));
    },
  );

  registerHandler(
    { channel: Channels.EmployeeTestUpdate, request: EmployeeTestUpdateRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      const { id, ...values } = req;
      try {
        await svc.updateEmployeeTest(id, values, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );

  registerHandler(
    { channel: Channels.EmployeeTestDelete, request: EmployeeTestDeleteRequest, permission: Permissions.TrainingWrite },
    async (req, ctx) => {
      if (!ctx.session) return err({ code: 'UNAUTHENTICATED' });
      try {
        await svc.deleteEmployeeTest(req.id, ctx.session.id);
        return ok(null);
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === 'NOT_FOUND') return err({ code: 'NOT_FOUND' });
        throw e;
      }
    },
  );
}

import type { Result } from '../types/result';
import type {
  LoginRequest, LoginResponse, SessionUser, BootstrapRequest, ChangePasswordRequest,
} from './auth';
import type {
  EmployeesListRequest, EmployeesListResponse,
  EmployeeFormValues, EmployeeRow,
} from './employees';
import type {
  LookupKind, LookupRow, LookupFormValues,
} from './lookups';
import type {
  LeaveListRequest, LeaveListResponse,
  LeaveFormValues, LeaveRow,
  LeaveApproveRequest,
  LeaveTypeFormValues, LeaveTypeListRequest, LeaveTypeListResponse,
  LeaveBalanceListRequest, LeaveBalanceListResponse,
} from './leave';
import type {
  DisciplinaryListRequest, DisciplinaryListResponse,
  DisciplinaryCaseFormValues, DisciplinaryRow,
  NatureOfOffenceFormValues, NatureOfOffenceListResponse,
  DisciplinaryActionFormValues, DisciplinaryActionListResponse,
  CriminalReportFormValues, CriminalReportListResponse,
} from './disciplinary';
import type {
  SettingsGetResponse, SettingsSetRequest, SmtpTestRequest,
} from './settings';
import type {
  JobDescriptionListRequest, JobDescriptionListResponse,
  JobDescriptionFormValues, JobDescriptionRow,
  JdEntryFormValues, JdEntryListRequest, JdEntryListResponse,
  JdRoleFormValues, JdRoleListRequest, JdRoleListResponse,
  JdKpiFormValues, JdKpiListRequest, JdKpiListResponse,
  JdTrainingFormValues, JdTrainingListRequest, JdTrainingListResponse,
  EmployeeJdFormValues, EmployeeJdListRequest, EmployeeJdListResponse,
} from './job-descriptions';
import type {
  TrainingCatalogueListRequest, TrainingCatalogueListResponse,
  TrainingCatalogueFormValues, TrainingCatalogueRow,
  TrainingInternalListRequest, TrainingInternalListResponse,
  TrainingInternalFormValues, TrainingInternalRow,
  TrainingExternalListRequest, TrainingExternalListResponse,
  TrainingExternalFormValues, TrainingExternalRow,
  TrainingApproveRequest,
  AnalysisSkillsListRequest, AnalysisSkillsListResponse,
  AnalysisSkillsFormValues,
  QuizQuestionListRequest, QuizQuestionListResponse,
  QuizQuestionFormValues,
  QuizAnswerListRequest, QuizAnswerListResponse,
  QuizAnswerFormValues,
  EmployeeTestListRequest, EmployeeTestListResponse,
  EmployeeTestFormValues,
} from './training';
import type {
  PerformanceListRequest, PerformanceListResponse,
  PerformanceFormValues, PerformanceRow,
  PerformanceApproveRequest,
  KpiFormValues, KpiListRequest, KpiListResponse,
  KpiCategoryFormValues, KpiCategoryListRequest, KpiCategoryListResponse,
} from './performance';
import type {
  DevelopmentListRequest, DevelopmentListResponse,
  DevelopmentPlanFormValues, DevelopmentPlanRow,
  DevelopmentApproveRequest,
  QualDevFormValues, QualDevListRequest, QualDevListResponse,
  SkillsDevFormValues, SkillsDevListRequest, SkillsDevListResponse,
  DevExperienceFormValues, DevExperienceListRequest, DevExperienceListResponse,
} from './development';

/**
 * The shape exposed to the renderer as `window.api`.
 * Each method takes a request and returns `Promise<Result<T>>`.
 */
export interface RendererApi {
  auth: {
    bootstrap(req: BootstrapRequest): Promise<Result<LoginResponse>>;
    login(req: LoginRequest): Promise<Result<LoginResponse>>;
    logout(): Promise<Result<null>>;
    session(): Promise<Result<SessionUser | null>>;
    status(): Promise<Result<{ usersExist: boolean }>>;
    changePassword(req: ChangePasswordRequest): Promise<Result<null>>;
  };
  employees: {
    list(req: EmployeesListRequest): Promise<Result<EmployeesListResponse>>;
    get(req: { id: number }): Promise<Result<EmployeeRow | null>>;
    create(req: EmployeeFormValues): Promise<Result<{ id: number }>>;
    update(req: EmployeeFormValues & { id: number }): Promise<Result<null>>;
    delete(req: { id: number }): Promise<Result<null>>;
  };
  lookups: {
    list(req: { kind: LookupKind; includeInactive?: boolean }): Promise<Result<{ rows: LookupRow[] }>>;
    create(req: { kind: LookupKind; values: LookupFormValues }): Promise<Result<{ id: number }>>;
    update(req: { kind: LookupKind; id: number; values: LookupFormValues }): Promise<Result<null>>;
    delete(req: { kind: LookupKind; id: number }): Promise<Result<null>>;
  };
  leave: {
    list(req: LeaveListRequest): Promise<Result<LeaveListResponse>>;
    get(req: { id: number }): Promise<Result<LeaveRow | null>>;
    create(req: LeaveFormValues): Promise<Result<{ id: number }>>;
    update(req: LeaveFormValues & { id: number }): Promise<Result<null>>;
    delete(req: { id: number }): Promise<Result<null>>;
    approve(req: LeaveApproveRequest): Promise<Result<null>>;
    listTypes(req: LeaveTypeListRequest): Promise<Result<LeaveTypeListResponse>>;
    createType(req: LeaveTypeFormValues): Promise<Result<{ id: number }>>;
    updateType(req: LeaveTypeFormValues & { id: number }): Promise<Result<null>>;
    deleteType(req: { id: number }): Promise<Result<null>>;
    listBalances(req: LeaveBalanceListRequest): Promise<Result<LeaveBalanceListResponse>>;
  };
  disciplinary: {
    list(req: DisciplinaryListRequest): Promise<Result<DisciplinaryListResponse>>;
    get(req: { id: number }): Promise<Result<DisciplinaryRow | null>>;
    create(req: DisciplinaryCaseFormValues): Promise<Result<{ id: number }>>;
    update(req: DisciplinaryCaseFormValues & { id: number }): Promise<Result<null>>;
    delete(req: { id: number }): Promise<Result<null>>;

    offenceList(req: { includeInactive?: boolean }): Promise<Result<NatureOfOffenceListResponse>>;
    offenceCreate(req: NatureOfOffenceFormValues): Promise<Result<{ id: number }>>;
    offenceUpdate(req: NatureOfOffenceFormValues & { id: number }): Promise<Result<null>>;
    offenceDelete(req: { id: number }): Promise<Result<null>>;

    actionList(req: { includeInactive?: boolean }): Promise<Result<DisciplinaryActionListResponse>>;
    actionCreate(req: DisciplinaryActionFormValues): Promise<Result<{ id: number }>>;
    actionUpdate(req: DisciplinaryActionFormValues & { id: number }): Promise<Result<null>>;
    actionDelete(req: { id: number }): Promise<Result<null>>;

    criminalReportList(req: { caseId: number }): Promise<Result<CriminalReportListResponse>>;
    criminalReportCreate(req: CriminalReportFormValues): Promise<Result<{ id: number }>>;
    criminalReportUpdate(req: CriminalReportFormValues & { id: number }): Promise<Result<null>>;
    criminalReportDelete(req: { id: number }): Promise<Result<null>>;
  };
  settings: {
    get(req: Record<string, never>): Promise<Result<SettingsGetResponse>>;
    set(req: SettingsSetRequest): Promise<Result<null>>;
    testSmtp(req: SmtpTestRequest): Promise<Result<{ ok: true }>>;
  };
  jobDescriptions: {
    list(req: JobDescriptionListRequest): Promise<Result<JobDescriptionListResponse>>;
    get(req: { id: number }): Promise<Result<JobDescriptionRow | null>>;
    create(req: JobDescriptionFormValues): Promise<Result<{ id: number }>>;
    update(req: JobDescriptionFormValues & { id: number }): Promise<Result<null>>;
    delete(req: { id: number }): Promise<Result<null>>;

    entryList(req: JdEntryListRequest): Promise<Result<JdEntryListResponse>>;
    entryCreate(req: JdEntryFormValues): Promise<Result<{ id: number }>>;
    entryUpdate(req: JdEntryFormValues & { id: number }): Promise<Result<null>>;
    entryDelete(req: { id: number }): Promise<Result<null>>;

    roleList(req: JdRoleListRequest): Promise<Result<JdRoleListResponse>>;
    roleCreate(req: JdRoleFormValues): Promise<Result<{ id: number }>>;
    roleUpdate(req: JdRoleFormValues & { id: number }): Promise<Result<null>>;
    roleDelete(req: { id: number }): Promise<Result<null>>;

    kpiList(req: JdKpiListRequest): Promise<Result<JdKpiListResponse>>;
    kpiCreate(req: JdKpiFormValues): Promise<Result<{ id: number }>>;
    kpiUpdate(req: JdKpiFormValues & { id: number }): Promise<Result<null>>;
    kpiDelete(req: { id: number }): Promise<Result<null>>;

    trainingInternalList(req: JdTrainingListRequest): Promise<Result<JdTrainingListResponse>>;
    trainingInternalCreate(req: JdTrainingFormValues): Promise<Result<{ id: number }>>;
    trainingInternalUpdate(req: JdTrainingFormValues & { id: number }): Promise<Result<null>>;
    trainingInternalDelete(req: { id: number }): Promise<Result<null>>;

    trainingExternalList(req: JdTrainingListRequest): Promise<Result<JdTrainingListResponse>>;
    trainingExternalCreate(req: JdTrainingFormValues): Promise<Result<{ id: number }>>;
    trainingExternalUpdate(req: JdTrainingFormValues & { id: number }): Promise<Result<null>>;
    trainingExternalDelete(req: { id: number }): Promise<Result<null>>;

    assignmentList(req: EmployeeJdListRequest): Promise<Result<EmployeeJdListResponse>>;
    assignmentCreate(req: EmployeeJdFormValues): Promise<Result<{ id: number }>>;
    assignmentUpdate(req: EmployeeJdFormValues & { id: number }): Promise<Result<null>>;
    assignmentDelete(req: { id: number }): Promise<Result<null>>;
  };
  training: {
    catalogueList(req: TrainingCatalogueListRequest): Promise<Result<TrainingCatalogueListResponse>>;
    catalogueGet(req: { id: number }): Promise<Result<TrainingCatalogueRow | null>>;
    catalogueCreate(req: TrainingCatalogueFormValues): Promise<Result<{ id: number }>>;
    catalogueUpdate(req: TrainingCatalogueFormValues & { id: number }): Promise<Result<null>>;
    catalogueDelete(req: { id: number }): Promise<Result<null>>;

    internalList(req: TrainingInternalListRequest): Promise<Result<TrainingInternalListResponse>>;
    internalGet(req: { id: number }): Promise<Result<TrainingInternalRow | null>>;
    internalCreate(req: TrainingInternalFormValues): Promise<Result<{ id: number }>>;
    internalUpdate(req: TrainingInternalFormValues & { id: number }): Promise<Result<null>>;
    internalDelete(req: { id: number }): Promise<Result<null>>;

    externalList(req: TrainingExternalListRequest): Promise<Result<TrainingExternalListResponse>>;
    externalGet(req: { id: number }): Promise<Result<TrainingExternalRow | null>>;
    externalCreate(req: TrainingExternalFormValues): Promise<Result<{ id: number }>>;
    externalUpdate(req: TrainingExternalFormValues & { id: number }): Promise<Result<null>>;
    externalDelete(req: { id: number }): Promise<Result<null>>;

    approve(req: TrainingApproveRequest): Promise<Result<null>>;

    analysisSkillsList(req: AnalysisSkillsListRequest): Promise<Result<AnalysisSkillsListResponse>>;
    analysisSkillsCreate(req: AnalysisSkillsFormValues): Promise<Result<{ id: number }>>;
    analysisSkillsUpdate(req: AnalysisSkillsFormValues & { id: number }): Promise<Result<null>>;
    analysisSkillsDelete(req: { id: number }): Promise<Result<null>>;

    quizQuestionList(req: QuizQuestionListRequest): Promise<Result<QuizQuestionListResponse>>;
    quizQuestionCreate(req: QuizQuestionFormValues): Promise<Result<{ id: number }>>;
    quizQuestionUpdate(req: QuizQuestionFormValues & { id: number }): Promise<Result<null>>;
    quizQuestionDelete(req: { id: number }): Promise<Result<null>>;

    quizAnswerList(req: QuizAnswerListRequest): Promise<Result<QuizAnswerListResponse>>;
    quizAnswerCreate(req: QuizAnswerFormValues): Promise<Result<{ id: number }>>;
    quizAnswerUpdate(req: QuizAnswerFormValues & { id: number }): Promise<Result<null>>;
    quizAnswerDelete(req: { id: number }): Promise<Result<null>>;

    employeeTestList(req: EmployeeTestListRequest): Promise<Result<EmployeeTestListResponse>>;
    employeeTestCreate(req: EmployeeTestFormValues): Promise<Result<{ id: number }>>;
    employeeTestUpdate(req: EmployeeTestFormValues & { id: number }): Promise<Result<null>>;
    employeeTestDelete(req: { id: number }): Promise<Result<null>>;
  };
  performance: {
    list(req: PerformanceListRequest): Promise<Result<PerformanceListResponse>>;
    get(req: { id: number }): Promise<Result<PerformanceRow | null>>;
    create(req: PerformanceFormValues): Promise<Result<{ id: number }>>;
    update(req: PerformanceFormValues & { id: number }): Promise<Result<null>>;
    delete(req: { id: number }): Promise<Result<null>>;
    approve(req: PerformanceApproveRequest): Promise<Result<null>>;
    listKpis(req: KpiListRequest): Promise<Result<KpiListResponse>>;
    createKpi(req: KpiFormValues): Promise<Result<{ id: number }>>;
    updateKpi(req: KpiFormValues & { id: number }): Promise<Result<null>>;
    deleteKpi(req: { id: number }): Promise<Result<null>>;
    listKpiCategories(req: KpiCategoryListRequest): Promise<Result<KpiCategoryListResponse>>;
    createKpiCategory(req: KpiCategoryFormValues): Promise<Result<{ id: number }>>;
    updateKpiCategory(req: KpiCategoryFormValues & { id: number }): Promise<Result<null>>;
    deleteKpiCategory(req: { id: number }): Promise<Result<null>>;
  };
  development: {
    list(req: DevelopmentListRequest): Promise<Result<DevelopmentListResponse>>;
    get(req: { id: number }): Promise<Result<DevelopmentPlanRow | null>>;
    create(req: DevelopmentPlanFormValues): Promise<Result<{ id: number }>>;
    update(req: DevelopmentPlanFormValues & { id: number }): Promise<Result<null>>;
    delete(req: { id: number }): Promise<Result<null>>;
    approve(req: DevelopmentApproveRequest): Promise<Result<null>>;

    qualList(req: QualDevListRequest): Promise<Result<QualDevListResponse>>;
    qualCreate(req: QualDevFormValues): Promise<Result<{ id: number }>>;
    qualUpdate(req: QualDevFormValues & { id: number }): Promise<Result<null>>;
    qualDelete(req: { id: number }): Promise<Result<null>>;

    skillsList(req: SkillsDevListRequest): Promise<Result<SkillsDevListResponse>>;
    skillsCreate(req: SkillsDevFormValues): Promise<Result<{ id: number }>>;
    skillsUpdate(req: SkillsDevFormValues & { id: number }): Promise<Result<null>>;
    skillsDelete(req: { id: number }): Promise<Result<null>>;

    experienceList(req: DevExperienceListRequest): Promise<Result<DevExperienceListResponse>>;
    experienceCreate(req: DevExperienceFormValues): Promise<Result<{ id: number }>>;
    experienceUpdate(req: DevExperienceFormValues & { id: number }): Promise<Result<null>>;
    experienceDelete(req: { id: number }): Promise<Result<null>>;
  };
}

declare global {
  interface Window {
    api: RendererApi;
  }
}

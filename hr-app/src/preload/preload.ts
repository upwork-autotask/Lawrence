import { contextBridge, ipcRenderer } from 'electron';
import { Channels } from '@shared/ipc/channels';

let cachedToken: string | null = null;

function setToken(t: string | null) {
  cachedToken = t;
}

async function invoke<T>(channel: string, payload: unknown): Promise<T> {
  return ipcRenderer.invoke(channel, { token: cachedToken, payload });
}

const api = {
  __setToken: setToken,
  __getToken: () => cachedToken,

  auth: {
    bootstrap: (req: unknown) => invoke(Channels.AuthBootstrap, req),
    login: (req: unknown) => invoke(Channels.AuthLogin, req),
    logout: () => invoke(Channels.AuthLogout, {}),
    session: () => invoke(Channels.AuthSession, {}),
    status: () => invoke(Channels.AuthStatus, {}),
    changePassword: (req: unknown) => invoke(Channels.AuthChangePassword, req),
  },
  employees: {
    list: (req: unknown) => invoke(Channels.EmployeesList, req),
    get: (req: unknown) => invoke(Channels.EmployeesGet, req),
    create: (req: unknown) => invoke(Channels.EmployeesCreate, req),
    update: (req: unknown) => invoke(Channels.EmployeesUpdate, req),
    delete: (req: unknown) => invoke(Channels.EmployeesDelete, req),
  },
  lookups: {
    list: (req: unknown) => invoke(Channels.LookupsList, req),
    create: (req: unknown) => invoke(Channels.LookupsCreate, req),
    update: (req: unknown) => invoke(Channels.LookupsUpdate, req),
    delete: (req: unknown) => invoke(Channels.LookupsDelete, req),
  },
  leave: {
    list: (req: unknown) => invoke(Channels.LeaveList, req),
    get: (req: unknown) => invoke(Channels.LeaveGet, req),
    create: (req: unknown) => invoke(Channels.LeaveCreate, req),
    update: (req: unknown) => invoke(Channels.LeaveUpdate, req),
    delete: (req: unknown) => invoke(Channels.LeaveDelete, req),
    approve: (req: unknown) => invoke(Channels.LeaveApprove, req),
    listTypes: (req: unknown) => invoke(Channels.LeaveTypesList, req),
    createType: (req: unknown) => invoke(Channels.LeaveTypesCreate, req),
    updateType: (req: unknown) => invoke(Channels.LeaveTypesUpdate, req),
    deleteType: (req: unknown) => invoke(Channels.LeaveTypesDelete, req),
    listBalances: (req: unknown) => invoke(Channels.LeaveBalancesList, req),
  },
  disciplinary: {
    list: (req: unknown) => invoke(Channels.DisciplinaryList, req),
    get: (req: unknown) => invoke(Channels.DisciplinaryGet, req),
    create: (req: unknown) => invoke(Channels.DisciplinaryCreate, req),
    update: (req: unknown) => invoke(Channels.DisciplinaryUpdate, req),
    delete: (req: unknown) => invoke(Channels.DisciplinaryDelete, req),

    offenceList: (req: unknown) => invoke(Channels.NatureOfOffenceList, req),
    offenceCreate: (req: unknown) => invoke(Channels.NatureOfOffenceCreate, req),
    offenceUpdate: (req: unknown) => invoke(Channels.NatureOfOffenceUpdate, req),
    offenceDelete: (req: unknown) => invoke(Channels.NatureOfOffenceDelete, req),

    actionList: (req: unknown) => invoke(Channels.DisciplinaryActionList, req),
    actionCreate: (req: unknown) => invoke(Channels.DisciplinaryActionCreate, req),
    actionUpdate: (req: unknown) => invoke(Channels.DisciplinaryActionUpdate, req),
    actionDelete: (req: unknown) => invoke(Channels.DisciplinaryActionDelete, req),

    criminalReportList: (req: unknown) => invoke(Channels.CriminalReportList, req),
    criminalReportCreate: (req: unknown) => invoke(Channels.CriminalReportCreate, req),
    criminalReportUpdate: (req: unknown) => invoke(Channels.CriminalReportUpdate, req),
    criminalReportDelete: (req: unknown) => invoke(Channels.CriminalReportDelete, req),
  },
  settings: {
    get: (req: unknown) => invoke(Channels.SettingsGet, req),
    set: (req: unknown) => invoke(Channels.SettingsSet, req),
    testSmtp: (req: unknown) => invoke(Channels.SettingsTestSmtp, req),
  },
  jobDescriptions: {
    list: (req: unknown) => invoke(Channels.JobDescriptionsList, req),
    get: (req: unknown) => invoke(Channels.JobDescriptionsGet, req),
    create: (req: unknown) => invoke(Channels.JobDescriptionsCreate, req),
    update: (req: unknown) => invoke(Channels.JobDescriptionsUpdate, req),
    delete: (req: unknown) => invoke(Channels.JobDescriptionsDelete, req),

    entryList: (req: unknown) => invoke(Channels.JdEntriesList, req),
    entryCreate: (req: unknown) => invoke(Channels.JdEntriesCreate, req),
    entryUpdate: (req: unknown) => invoke(Channels.JdEntriesUpdate, req),
    entryDelete: (req: unknown) => invoke(Channels.JdEntriesDelete, req),

    roleList: (req: unknown) => invoke(Channels.JdRolesList, req),
    roleCreate: (req: unknown) => invoke(Channels.JdRolesCreate, req),
    roleUpdate: (req: unknown) => invoke(Channels.JdRolesUpdate, req),
    roleDelete: (req: unknown) => invoke(Channels.JdRolesDelete, req),

    kpiList: (req: unknown) => invoke(Channels.JdKpisList, req),
    kpiCreate: (req: unknown) => invoke(Channels.JdKpisCreate, req),
    kpiUpdate: (req: unknown) => invoke(Channels.JdKpisUpdate, req),
    kpiDelete: (req: unknown) => invoke(Channels.JdKpisDelete, req),

    trainingInternalList: (req: unknown) => invoke(Channels.JdTrainingInternalList, req),
    trainingInternalCreate: (req: unknown) => invoke(Channels.JdTrainingInternalCreate, req),
    trainingInternalUpdate: (req: unknown) => invoke(Channels.JdTrainingInternalUpdate, req),
    trainingInternalDelete: (req: unknown) => invoke(Channels.JdTrainingInternalDelete, req),

    trainingExternalList: (req: unknown) => invoke(Channels.JdTrainingExternalList, req),
    trainingExternalCreate: (req: unknown) => invoke(Channels.JdTrainingExternalCreate, req),
    trainingExternalUpdate: (req: unknown) => invoke(Channels.JdTrainingExternalUpdate, req),
    trainingExternalDelete: (req: unknown) => invoke(Channels.JdTrainingExternalDelete, req),

    assignmentList: (req: unknown) => invoke(Channels.EmployeeJdsList, req),
    assignmentCreate: (req: unknown) => invoke(Channels.EmployeeJdsCreate, req),
    assignmentUpdate: (req: unknown) => invoke(Channels.EmployeeJdsUpdate, req),
    assignmentDelete: (req: unknown) => invoke(Channels.EmployeeJdsDelete, req),
  },
  training: {
    catalogueList: (req: unknown) => invoke(Channels.TrainingCatalogueList, req),
    catalogueGet: (req: unknown) => invoke(Channels.TrainingCatalogueGet, req),
    catalogueCreate: (req: unknown) => invoke(Channels.TrainingCatalogueCreate, req),
    catalogueUpdate: (req: unknown) => invoke(Channels.TrainingCatalogueUpdate, req),
    catalogueDelete: (req: unknown) => invoke(Channels.TrainingCatalogueDelete, req),

    internalList: (req: unknown) => invoke(Channels.TrainingInternalList, req),
    internalGet: (req: unknown) => invoke(Channels.TrainingInternalGet, req),
    internalCreate: (req: unknown) => invoke(Channels.TrainingInternalCreate, req),
    internalUpdate: (req: unknown) => invoke(Channels.TrainingInternalUpdate, req),
    internalDelete: (req: unknown) => invoke(Channels.TrainingInternalDelete, req),

    externalList: (req: unknown) => invoke(Channels.TrainingExternalList, req),
    externalGet: (req: unknown) => invoke(Channels.TrainingExternalGet, req),
    externalCreate: (req: unknown) => invoke(Channels.TrainingExternalCreate, req),
    externalUpdate: (req: unknown) => invoke(Channels.TrainingExternalUpdate, req),
    externalDelete: (req: unknown) => invoke(Channels.TrainingExternalDelete, req),

    approve: (req: unknown) => invoke(Channels.TrainingApprove, req),

    analysisSkillsList: (req: unknown) => invoke(Channels.AnalysisSkillsList, req),
    analysisSkillsCreate: (req: unknown) => invoke(Channels.AnalysisSkillsCreate, req),
    analysisSkillsUpdate: (req: unknown) => invoke(Channels.AnalysisSkillsUpdate, req),
    analysisSkillsDelete: (req: unknown) => invoke(Channels.AnalysisSkillsDelete, req),

    quizQuestionList: (req: unknown) => invoke(Channels.QuizQuestionList, req),
    quizQuestionCreate: (req: unknown) => invoke(Channels.QuizQuestionCreate, req),
    quizQuestionUpdate: (req: unknown) => invoke(Channels.QuizQuestionUpdate, req),
    quizQuestionDelete: (req: unknown) => invoke(Channels.QuizQuestionDelete, req),

    quizAnswerList: (req: unknown) => invoke(Channels.QuizAnswerList, req),
    quizAnswerCreate: (req: unknown) => invoke(Channels.QuizAnswerCreate, req),
    quizAnswerUpdate: (req: unknown) => invoke(Channels.QuizAnswerUpdate, req),
    quizAnswerDelete: (req: unknown) => invoke(Channels.QuizAnswerDelete, req),

    employeeTestList: (req: unknown) => invoke(Channels.EmployeeTestList, req),
    employeeTestCreate: (req: unknown) => invoke(Channels.EmployeeTestCreate, req),
    employeeTestUpdate: (req: unknown) => invoke(Channels.EmployeeTestUpdate, req),
    employeeTestDelete: (req: unknown) => invoke(Channels.EmployeeTestDelete, req),
  },
  performance: {
    list: (req: unknown) => invoke(Channels.PerformanceList, req),
    get: (req: unknown) => invoke(Channels.PerformanceGet, req),
    create: (req: unknown) => invoke(Channels.PerformanceCreate, req),
    update: (req: unknown) => invoke(Channels.PerformanceUpdate, req),
    delete: (req: unknown) => invoke(Channels.PerformanceDelete, req),
    approve: (req: unknown) => invoke(Channels.PerformanceApprove, req),
    listKpis: (req: unknown) => invoke(Channels.KpisList, req),
    createKpi: (req: unknown) => invoke(Channels.KpisCreate, req),
    updateKpi: (req: unknown) => invoke(Channels.KpisUpdate, req),
    deleteKpi: (req: unknown) => invoke(Channels.KpisDelete, req),
    listKpiCategories: (req: unknown) => invoke(Channels.KpiCategoriesList, req),
    createKpiCategory: (req: unknown) => invoke(Channels.KpiCategoriesCreate, req),
    updateKpiCategory: (req: unknown) => invoke(Channels.KpiCategoriesUpdate, req),
    deleteKpiCategory: (req: unknown) => invoke(Channels.KpiCategoriesDelete, req),
  },
  development: {
    list: (req: unknown) => invoke(Channels.DevelopmentList, req),
    get: (req: unknown) => invoke(Channels.DevelopmentGet, req),
    create: (req: unknown) => invoke(Channels.DevelopmentCreate, req),
    update: (req: unknown) => invoke(Channels.DevelopmentUpdate, req),
    delete: (req: unknown) => invoke(Channels.DevelopmentDelete, req),
    approve: (req: unknown) => invoke(Channels.DevelopmentApprove, req),

    qualList: (req: unknown) => invoke(Channels.QualDevList, req),
    qualCreate: (req: unknown) => invoke(Channels.QualDevCreate, req),
    qualUpdate: (req: unknown) => invoke(Channels.QualDevUpdate, req),
    qualDelete: (req: unknown) => invoke(Channels.QualDevDelete, req),

    skillsList: (req: unknown) => invoke(Channels.SkillsDevList, req),
    skillsCreate: (req: unknown) => invoke(Channels.SkillsDevCreate, req),
    skillsUpdate: (req: unknown) => invoke(Channels.SkillsDevUpdate, req),
    skillsDelete: (req: unknown) => invoke(Channels.SkillsDevDelete, req),

    experienceList: (req: unknown) => invoke(Channels.DevExperienceList, req),
    experienceCreate: (req: unknown) => invoke(Channels.DevExperienceCreate, req),
    experienceUpdate: (req: unknown) => invoke(Channels.DevExperienceUpdate, req),
    experienceDelete: (req: unknown) => invoke(Channels.DevExperienceDelete, req),
  },
} as const;

contextBridge.exposeInMainWorld('api', api);

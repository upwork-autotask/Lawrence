# Training module integration note

This module follows the standard module shape. The Training subagent did NOT edit any
shared files; the changes below must be applied by the integrator before the module
becomes reachable.

`registerTrainingHandlers` IS exported as a named export from `src/main/ipc/training.ts`.

---

## 1. `src/shared/ipc/channels.ts`

Add the following entries inside the `Channels` object (place them after the
existing module blocks):

```ts
  // Training catalogue
  TrainingCatalogueList: 'training.catalogue.list',
  TrainingCatalogueGet: 'training.catalogue.get',
  TrainingCatalogueCreate: 'training.catalogue.create',
  TrainingCatalogueUpdate: 'training.catalogue.update',
  TrainingCatalogueDelete: 'training.catalogue.delete',

  // Training — internal sessions
  TrainingInternalList: 'training.internal.list',
  TrainingInternalGet: 'training.internal.get',
  TrainingInternalCreate: 'training.internal.create',
  TrainingInternalUpdate: 'training.internal.update',
  TrainingInternalDelete: 'training.internal.delete',

  // Training — external sessions
  TrainingExternalList: 'training.external.list',
  TrainingExternalGet: 'training.external.get',
  TrainingExternalCreate: 'training.external.create',
  TrainingExternalUpdate: 'training.external.update',
  TrainingExternalDelete: 'training.external.delete',

  // Training — approve (works for both internal + external; payload carries kind)
  TrainingApprove: 'training.approve',

  // Training — analysis skills (pipeline checkpoints)
  AnalysisSkillsList: 'training.analysisSkills.list',
  AnalysisSkillsCreate: 'training.analysisSkills.create',
  AnalysisSkillsUpdate: 'training.analysisSkills.update',
  AnalysisSkillsDelete: 'training.analysisSkills.delete',

  // Training — quiz questions
  QuizQuestionList: 'training.quizQuestion.list',
  QuizQuestionCreate: 'training.quizQuestion.create',
  QuizQuestionUpdate: 'training.quizQuestion.update',
  QuizQuestionDelete: 'training.quizQuestion.delete',

  // Training — quiz answers
  QuizAnswerList: 'training.quizAnswer.list',
  QuizAnswerCreate: 'training.quizAnswer.create',
  QuizAnswerUpdate: 'training.quizAnswer.update',
  QuizAnswerDelete: 'training.quizAnswer.delete',

  // Training — employee tests (quiz attempts)
  EmployeeTestList: 'training.employeeTest.list',
  EmployeeTestCreate: 'training.employeeTest.create',
  EmployeeTestUpdate: 'training.employeeTest.update',
  EmployeeTestDelete: 'training.employeeTest.delete',
```

---

## 2. `src/shared/ipc/api.ts`

Add the import block alongside the existing module imports:

```ts
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
```

Add this property to the `RendererApi` interface (alongside `employees`,
`leave`, `disciplinary`, etc.):

```ts
  training: {
    // Catalogue
    catalogueList(req: TrainingCatalogueListRequest): Promise<Result<TrainingCatalogueListResponse>>;
    catalogueGet(req: { id: number }): Promise<Result<TrainingCatalogueRow | null>>;
    catalogueCreate(req: TrainingCatalogueFormValues): Promise<Result<{ id: number }>>;
    catalogueUpdate(req: TrainingCatalogueFormValues & { id: number }): Promise<Result<null>>;
    catalogueDelete(req: { id: number }): Promise<Result<null>>;

    // Internal sessions
    internalList(req: TrainingInternalListRequest): Promise<Result<TrainingInternalListResponse>>;
    internalGet(req: { id: number }): Promise<Result<TrainingInternalRow | null>>;
    internalCreate(req: TrainingInternalFormValues): Promise<Result<{ id: number }>>;
    internalUpdate(req: TrainingInternalFormValues & { id: number }): Promise<Result<null>>;
    internalDelete(req: { id: number }): Promise<Result<null>>;

    // External sessions
    externalList(req: TrainingExternalListRequest): Promise<Result<TrainingExternalListResponse>>;
    externalGet(req: { id: number }): Promise<Result<TrainingExternalRow | null>>;
    externalCreate(req: TrainingExternalFormValues): Promise<Result<{ id: number }>>;
    externalUpdate(req: TrainingExternalFormValues & { id: number }): Promise<Result<null>>;
    externalDelete(req: { id: number }): Promise<Result<null>>;

    // Approval (internal + external dispatched via kind)
    approve(req: TrainingApproveRequest): Promise<Result<null>>;

    // Analysis skills (pipeline)
    analysisSkillsList(req: AnalysisSkillsListRequest): Promise<Result<AnalysisSkillsListResponse>>;
    analysisSkillsCreate(req: AnalysisSkillsFormValues): Promise<Result<{ id: number }>>;
    analysisSkillsUpdate(req: AnalysisSkillsFormValues & { id: number }): Promise<Result<null>>;
    analysisSkillsDelete(req: { id: number }): Promise<Result<null>>;

    // Quiz questions
    quizQuestionList(req: QuizQuestionListRequest): Promise<Result<QuizQuestionListResponse>>;
    quizQuestionCreate(req: QuizQuestionFormValues): Promise<Result<{ id: number }>>;
    quizQuestionUpdate(req: QuizQuestionFormValues & { id: number }): Promise<Result<null>>;
    quizQuestionDelete(req: { id: number }): Promise<Result<null>>;

    // Quiz answers
    quizAnswerList(req: QuizAnswerListRequest): Promise<Result<QuizAnswerListResponse>>;
    quizAnswerCreate(req: QuizAnswerFormValues): Promise<Result<{ id: number }>>;
    quizAnswerUpdate(req: QuizAnswerFormValues & { id: number }): Promise<Result<null>>;
    quizAnswerDelete(req: { id: number }): Promise<Result<null>>;

    // Employee tests (quiz attempts)
    employeeTestList(req: EmployeeTestListRequest): Promise<Result<EmployeeTestListResponse>>;
    employeeTestCreate(req: EmployeeTestFormValues): Promise<Result<{ id: number }>>;
    employeeTestUpdate(req: EmployeeTestFormValues & { id: number }): Promise<Result<null>>;
    employeeTestDelete(req: { id: number }): Promise<Result<null>>;
  };
```

---

## 3. `src/preload/index.ts`

Add this object to the `api` const (alongside `employees`, `leave`, `disciplinary`, etc.):

```ts
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
```

---

## 4. `src/main/ipc/index.ts`

Add the import:

```ts
import { registerTrainingHandlers } from './training';
```

And invoke it inside `registerAllHandlers()`:

```ts
  registerTrainingHandlers();
```

---

## 5. `src/renderer/App.tsx`

Add the imports:

```tsx
import { TrainingList } from '@renderer/routes/training/List';
import { TrainingDetail } from '@renderer/routes/training/Detail';
import { TrainingForm } from '@renderer/routes/training/Form';
```

`TrainingDetail` takes a `kind` prop (`'internal' | 'external'`) — the router
selects which by URL segment. Replace the existing placeholder route:

```tsx
<Route path="training" element={<Placeholder title="Training" />} />
```

with this block of routes:

```tsx
<Route path="training" element={<TrainingList />} />
<Route path="training/new" element={<TrainingForm />} />
<Route path="training/internal/:id" element={<TrainingDetail kind="internal" />} />
<Route path="training/internal/:id/edit" element={<TrainingForm />} />
<Route path="training/external/:id" element={<TrainingDetail kind="external" />} />
<Route path="training/external/:id/edit" element={<TrainingForm />} />
```

The Form reads the session kind from either the `:kind` URL segment (when editing —
React Router places `internal` / `external` into `useParams().kind` via the path
above) or the `?kind=internal|external` query param (when creating a new session,
linked from the List page's "New internal/external session" buttons).

---

## 6. Confirmation

- `registerTrainingHandlers` is exported as a named export from
  `src/main/ipc/training.ts` and ready to be called from `registerAllHandlers()`.
- The schema in `src/shared/schema/training.ts` is re-exported by the existing
  `src/shared/schema/index.ts` (no edit required there — it already does
  `export * from './training'`).
- No drizzle migration was generated; regenerate after merging all module schemas.
- Quiz authoring UI is OUT OF SCOPE for this pass — services and IPC handlers
  exist for `quiz_questions`, `quiz_answers`, and `employee_tests`, but the
  renderer surfaces only a "Quiz authoring coming soon" placeholder. Drive these
  endpoints from a follow-up pass or directly via integration tests for now.
- Scope-aware permissions are not refined for Training — handlers use
  `training.read`, `training.write`, and `training.approve` flat strings as
  declared in `src/shared/permissions.ts`.
- `analysis_skills` has no FK from `training_internal_id` / `training_external_id`
  because those columns reference different parent tables; the caller is
  responsible for setting exactly one. Seed/migration scripts should preserve
  this invariant.

# Job Descriptions module — integration patches

This module follows the standard module shape. The JD subagent did NOT edit any
shared files; the changes below must be applied by the integrator before the
module becomes reachable.

`registerJobDescriptionsHandlers` IS exported as a named export from
`src/main/ipc/job-descriptions.ts`.

---

## 1. `src/shared/ipc/channels.ts`

Append to the `Channels` object (e.g. just before the `// Users / Roles` block):

```ts
  // Job Descriptions
  JobDescriptionsList: 'jobDescriptions.list',
  JobDescriptionsGet: 'jobDescriptions.get',
  JobDescriptionsCreate: 'jobDescriptions.create',
  JobDescriptionsUpdate: 'jobDescriptions.update',
  JobDescriptionsDelete: 'jobDescriptions.delete',

  // JD entries (narrative sections)
  JdEntriesList: 'jdEntries.list',
  JdEntriesCreate: 'jdEntries.create',
  JdEntriesUpdate: 'jdEntries.update',
  JdEntriesDelete: 'jdEntries.delete',

  // JD roles & responsibilities
  JdRolesList: 'jdRoles.list',
  JdRolesCreate: 'jdRoles.create',
  JdRolesUpdate: 'jdRoles.update',
  JdRolesDelete: 'jdRoles.delete',

  // JD KPIs
  JdKpisList: 'jdKpis.list',
  JdKpisCreate: 'jdKpis.create',
  JdKpisUpdate: 'jdKpis.update',
  JdKpisDelete: 'jdKpis.delete',

  // JD internal training
  JdTrainingInternalList: 'jdTrainingInternal.list',
  JdTrainingInternalCreate: 'jdTrainingInternal.create',
  JdTrainingInternalUpdate: 'jdTrainingInternal.update',
  JdTrainingInternalDelete: 'jdTrainingInternal.delete',

  // JD external training
  JdTrainingExternalList: 'jdTrainingExternal.list',
  JdTrainingExternalCreate: 'jdTrainingExternal.create',
  JdTrainingExternalUpdate: 'jdTrainingExternal.update',
  JdTrainingExternalDelete: 'jdTrainingExternal.delete',

  // Employee JD assignments
  EmployeeJdsList: 'employeeJds.list',
  EmployeeJdsCreate: 'employeeJds.create',
  EmployeeJdsUpdate: 'employeeJds.update',
  EmployeeJdsDelete: 'employeeJds.delete',
```

---

## 2. `src/shared/ipc/api.ts`

Add the import block alongside the existing module imports:

```ts
import type {
  JobDescriptionListRequest, JobDescriptionListResponse,
  JobDescriptionFormValues, JobDescriptionRow,
  JdEntryFormValues, JdEntryListRequest, JdEntryListResponse,
  JdRoleFormValues, JdRoleListRequest, JdRoleListResponse,
  JdKpiFormValues, JdKpiListRequest, JdKpiListResponse,
  JdTrainingFormValues, JdTrainingListRequest, JdTrainingListResponse,
  EmployeeJdFormValues, EmployeeJdListRequest, EmployeeJdListResponse,
} from './job-descriptions';
```

Add this property to the `RendererApi` interface (alongside `employees`,
`leave`, etc.):

```ts
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
```

---

## 3. `src/preload/index.ts`

Add this object to the `api` const (alongside `employees`, `leave`, etc.):

```ts
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
```

---

## 4. `src/main/ipc/index.ts`

Add the import at the top:

```ts
import { registerJobDescriptionsHandlers } from './job-descriptions';
```

And the call inside `registerAllHandlers()`:

```ts
  registerJobDescriptionsHandlers();
```

---

## 5. `src/renderer/App.tsx`

Add these imports:

```tsx
import { JobDescriptionsList } from '@renderer/routes/job-descriptions/List';
import { JobDescriptionDetail } from '@renderer/routes/job-descriptions/Detail';
import { JobDescriptionForm } from '@renderer/routes/job-descriptions/Form';
```

Replace the existing placeholder route:

```tsx
<Route path="job-descriptions" element={<Placeholder title="Job Descriptions" />} />
```

with this block of four routes:

```tsx
<Route path="job-descriptions" element={<JobDescriptionsList />} />
<Route path="job-descriptions/new" element={<JobDescriptionForm />} />
<Route path="job-descriptions/:id" element={<JobDescriptionDetail />} />
<Route path="job-descriptions/:id/edit" element={<JobDescriptionForm />} />
```

---

## 6. Confirmation

- `registerJobDescriptionsHandlers` is exported as a named export from
  `src/main/ipc/job-descriptions.ts` and ready to be called from
  `registerAllHandlers()`.
- The schema in `src/shared/schema/job-descriptions.ts` is re-exported by the
  existing `src/shared/schema/index.ts` (no edit required there — it already
  does `export * from './job-descriptions'`).
- `jd_kpis.kpi_id`, `jd_training_internal.training_id`, and
  `jd_training_external.training_id` are intentionally left as plain integers
  WITHOUT foreign keys — the target tables (`kpis`, `trainings_catalogue`)
  belong to the Performance and Training modules respectively. Add the FK
  constraints in a later migration once those modules land. The schema file
  carries `TODO: cross-module FK …` comments at the relevant columns.
- No drizzle migration was generated; regenerate after merging all module
  schemas.
- Scope-aware reads (own / own_reports) are OUT OF SCOPE for this pass —
  handlers currently require `jd.read` / `jd.write` only.
- Permissions reused: `Permissions.JobDescriptionRead` (`jd.read`) and
  `Permissions.JobDescriptionWrite` (`jd.write`). Both already exist in
  `src/shared/permissions.ts`.

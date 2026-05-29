# Development module integration note

This module follows the standard module shape. The Development subagent did NOT edit any
shared files; the changes below must be applied by the integrator before the module
becomes reachable.

`registerDevelopmentHandlers` IS exported as a named export from
`src/main/ipc/development.ts`.

---

## 1. `src/shared/ipc/channels.ts`

Add the following entries inside the `Channels` object (place them after the
Disciplinary block, before the Users/Roles block):

```ts
  // Development
  DevelopmentList: 'development.list',
  DevelopmentGet: 'development.get',
  DevelopmentCreate: 'development.create',
  DevelopmentUpdate: 'development.update',
  DevelopmentDelete: 'development.delete',
  DevelopmentApprove: 'development.approve',

  // Development — qualifications
  QualDevList: 'development.qual.list',
  QualDevCreate: 'development.qual.create',
  QualDevUpdate: 'development.qual.update',
  QualDevDelete: 'development.qual.delete',

  // Development — skills
  SkillsDevList: 'development.skills.list',
  SkillsDevCreate: 'development.skills.create',
  SkillsDevUpdate: 'development.skills.update',
  SkillsDevDelete: 'development.skills.delete',

  // Development — experience
  DevExperienceList: 'development.experience.list',
  DevExperienceCreate: 'development.experience.create',
  DevExperienceUpdate: 'development.experience.update',
  DevExperienceDelete: 'development.experience.delete',
```

---

## 2. `src/shared/ipc/api.ts`

Add the following imports alongside the existing module imports near the top:

```ts
import type {
  DevelopmentListRequest, DevelopmentListResponse,
  DevelopmentPlanFormValues, DevelopmentPlanRow,
  DevelopmentApproveRequest,
  QualDevFormValues, QualDevListRequest, QualDevListResponse,
  SkillsDevFormValues, SkillsDevListRequest, SkillsDevListResponse,
  DevExperienceFormValues, DevExperienceListRequest, DevExperienceListResponse,
} from './development';
```

Add the following member to the `RendererApi` interface (alongside `employees`,
`lookups`, etc.):

```ts
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
```

---

## 3. `src/preload/index.ts`

Add the following object to the `api` const (alongside `employees`, `lookups`, etc.):

```ts
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
```

---

## 4. `src/main/ipc/index.ts`

Add the import at the top:

```ts
import { registerDevelopmentHandlers } from './development';
```

And the call inside `registerAllHandlers()`:

```ts
  registerDevelopmentHandlers();
```

---

## 5. `src/renderer/App.tsx`

Add these imports:

```tsx
import { DevelopmentList } from '@renderer/routes/development/List';
import { DevelopmentDetail } from '@renderer/routes/development/Detail';
import { DevelopmentForm } from '@renderer/routes/development/Form';
```

Replace the existing `<Route path="development" element={<Placeholder title="Development" />} />`
line with these four routes:

```tsx
            <Route path="development" element={<DevelopmentList />} />
            <Route path="development/new" element={<DevelopmentForm />} />
            <Route path="development/:id" element={<DevelopmentDetail />} />
            <Route path="development/:id/edit" element={<DevelopmentForm />} />
```

---

## 6. Confirmation

- `registerDevelopmentHandlers` is exported as a named export from
  `src/main/ipc/development.ts` and ready to be called from `registerAllHandlers()`.
- The schema in `src/shared/schema/development.ts` is re-exported by the existing
  `src/shared/schema/index.ts` (no edit required there — it already does
  `export * from './development'`).
- No drizzle migration was generated; regenerate after merging all module schemas.
- The four approval steps (line_manager, hr, compliance, exco) all share the
  `development.approve` permission. Step-specific gating is OUT OF SCOPE for this
  pass — later passes can split it (e.g. `development.approve.compliance`).
- Overall plan `status` is recomputed inside `approveDevelopmentPlan`:
  any step rejection drives the record to `cancelled`; all four steps `approved`
  drives the record to `approved`; otherwise a previously `draft` plan is moved
  to `submitted` when any step is decided.

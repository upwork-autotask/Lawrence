# Disciplinary module — integration patches

The Disciplinary module is self-contained except for the five shared "wiring"
files listed below. Apply each patch verbatim — do not edit any other module
files.

---

## 1. `src/shared/ipc/channels.ts`

Append to the `Channels` object (e.g. just before the `// Settings` section, or
in its own block — the exact placement doesn't matter):

```ts
  // Disciplinary
  DisciplinaryList: 'disciplinary.list',
  DisciplinaryGet: 'disciplinary.get',
  DisciplinaryCreate: 'disciplinary.create',
  DisciplinaryUpdate: 'disciplinary.update',
  DisciplinaryDelete: 'disciplinary.delete',
  NatureOfOffenceList: 'disciplinary.offence.list',
  NatureOfOffenceCreate: 'disciplinary.offence.create',
  NatureOfOffenceUpdate: 'disciplinary.offence.update',
  NatureOfOffenceDelete: 'disciplinary.offence.delete',
  DisciplinaryActionList: 'disciplinary.action.list',
  DisciplinaryActionCreate: 'disciplinary.action.create',
  DisciplinaryActionUpdate: 'disciplinary.action.update',
  DisciplinaryActionDelete: 'disciplinary.action.delete',
  CriminalReportList: 'disciplinary.criminal.list',
  CriminalReportCreate: 'disciplinary.criminal.create',
  CriminalReportUpdate: 'disciplinary.criminal.update',
  CriminalReportDelete: 'disciplinary.criminal.delete',
```

---

## 2. `src/shared/ipc/api.ts`

Add the import block alongside the existing module imports:

```ts
import type {
  DisciplinaryListRequest, DisciplinaryListResponse,
  DisciplinaryCaseFormValues, DisciplinaryRow,
  NatureOfOffenceFormValues, NatureOfOffenceListResponse,
  DisciplinaryActionFormValues, DisciplinaryActionListResponse,
  CriminalReportFormValues, CriminalReportListResponse,
} from './disciplinary';
```

Add this property to the `RendererApi` interface (alongside `employees`,
`lookups`, etc.):

```ts
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
```

---

## 3. `src/preload/index.ts`

Add this object to the `api` const (alongside `employees`, `lookups`, etc.):

```ts
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
```

---

## 4. `src/main/ipc/index.ts`

Add the import:

```ts
import { registerDisciplinaryHandlers } from './disciplinary';
```

And invoke it inside `registerAllHandlers()`:

```ts
  registerDisciplinaryHandlers();
```

So the function reads (after patch):

```ts
export function registerAllHandlers(): void {
  registerAuthHandlers();
  registerEmployeesHandlers();
  registerLookupsHandlers();
  registerDisciplinaryHandlers();
  // TODO: subagents register their module handlers here.
}
```

---

## 5. `src/renderer/App.tsx`

Add the imports:

```tsx
import { DisciplinaryList } from '@renderer/routes/disciplinary/List';
import { DisciplinaryDetail } from '@renderer/routes/disciplinary/Detail';
import { DisciplinaryForm } from '@renderer/routes/disciplinary/Form';
```

Replace the existing placeholder route:

```tsx
<Route path="disciplinary" element={<Placeholder title="Disciplinary" />} />
```

with this block of four routes:

```tsx
<Route path="disciplinary" element={<DisciplinaryList />} />
<Route path="disciplinary/new" element={<DisciplinaryForm />} />
<Route path="disciplinary/:id" element={<DisciplinaryDetail />} />
<Route path="disciplinary/:id/edit" element={<DisciplinaryForm />} />
```

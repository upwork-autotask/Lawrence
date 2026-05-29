# Performance module integration note

This module follows the standard module shape. The Performance subagent did NOT edit
any shared files; the changes below must be applied by the integrator before the
module becomes reachable.

`registerPerformanceHandlers` IS exported as a named export from
`src/main/ipc/performance.ts`.

---

## 1. `src/shared/ipc/channels.ts`

Add the following entries inside the `Channels` object (place them after the
Disciplinary block, before the Users/Roles block):

```ts
  // Performance
  PerformanceList: 'performance.list',
  PerformanceGet: 'performance.get',
  PerformanceCreate: 'performance.create',
  PerformanceUpdate: 'performance.update',
  PerformanceDelete: 'performance.delete',
  PerformanceApprove: 'performance.approve',

  // KPIs
  KpisList: 'kpis.list',
  KpisCreate: 'kpis.create',
  KpisUpdate: 'kpis.update',
  KpisDelete: 'kpis.delete',

  // KPI categories
  KpiCategoriesList: 'kpiCategories.list',
  KpiCategoriesCreate: 'kpiCategories.create',
  KpiCategoriesUpdate: 'kpiCategories.update',
  KpiCategoriesDelete: 'kpiCategories.delete',
```

---

## 2. `src/shared/ipc/api.ts`

Add the following imports near the top:

```ts
import type {
  PerformanceListRequest, PerformanceListResponse,
  PerformanceFormValues, PerformanceRow,
  PerformanceApproveRequest,
  KpiFormValues, KpiListRequest, KpiListResponse,
  KpiCategoryFormValues, KpiCategoryListRequest, KpiCategoryListResponse,
} from './performance';
```

Add the following member to the `RendererApi` interface (alongside `employees`,
`lookups`, `leave`, etc.):

```ts
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
```

---

## 3. `src/preload/index.ts`

Add the following object to the `api` const (alongside `employees`, `leave`, etc.):

```ts
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
```

---

## 4. `src/main/ipc/index.ts`

Add the import at the top:

```ts
import { registerPerformanceHandlers } from './performance';
```

And the call inside `registerAllHandlers()`:

```ts
  registerPerformanceHandlers();
```

---

## 5. `src/renderer/App.tsx`

Add these imports:

```tsx
import { PerformanceList } from '@renderer/routes/performance/List';
import { PerformanceDetail } from '@renderer/routes/performance/Detail';
import { PerformanceForm } from '@renderer/routes/performance/Form';
```

Replace the existing
`<Route path="performance" element={<Placeholder title="Performance" />} />` line
with these four routes:

```tsx
            <Route path="performance" element={<PerformanceList />} />
            <Route path="performance/new" element={<PerformanceForm />} />
            <Route path="performance/:id" element={<PerformanceDetail />} />
            <Route path="performance/:id/edit" element={<PerformanceForm />} />
```

---

## 6. Confirmation

- `registerPerformanceHandlers` is exported as a named export from
  `src/main/ipc/performance.ts` and ready to be called from `registerAllHandlers()`.
- The schema in `src/shared/schema/performance.ts` is re-exported by the existing
  `src/shared/schema/index.ts` (no edit required — it already does
  `export * from './performance'`).
- No drizzle migration was generated; regenerate after merging all module schemas.
- Scope-aware read/approve permissions are NOT implemented for this pass — every
  handler currently requires `performance.read` / `performance.write` only. The
  approve handler reuses `performance.write` for v1 (per the spec's parity rule:
  approval state stays as columns on each transactional record).
- Seed rows for `kpi_categories` and `kpis` should be added to `resources/seed/*.sql`
  per the spec's "lookup data is seeded, never hard-coded in TS" rule.

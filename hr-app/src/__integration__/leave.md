# Leave module integration note

This module follows the standard module shape. The Leave subagent did NOT edit any
shared files; the changes below must be applied by the integrator before the module
becomes reachable.

`registerLeaveHandlers` IS exported as a named export from `src/main/ipc/leave.ts`.

---

## 1. `src/shared/ipc/channels.ts`

Add the following entries inside the `Channels` object (place them after the
Employees/Lookups blocks, before the Users/Roles block):

```ts
  // Leave
  LeaveList: 'leave.list',
  LeaveGet: 'leave.get',
  LeaveCreate: 'leave.create',
  LeaveUpdate: 'leave.update',
  LeaveDelete: 'leave.delete',
  LeaveApprove: 'leave.approve',

  // Leave types (catalogue)
  LeaveTypesList: 'leaveTypes.list',
  LeaveTypesCreate: 'leaveTypes.create',
  LeaveTypesUpdate: 'leaveTypes.update',
  LeaveTypesDelete: 'leaveTypes.delete',

  // Leave balances
  LeaveBalancesList: 'leaveBalances.list',
```

---

## 2. `src/shared/ipc/api.ts`

Add the following imports near the top:

```ts
import type {
  LeaveListRequest, LeaveListResponse,
  LeaveFormValues, LeaveRow,
  LeaveApproveRequest,
  LeaveTypeFormValues, LeaveTypeListRequest, LeaveTypeListResponse,
  LeaveBalanceListRequest, LeaveBalanceListResponse,
} from './leave';
```

Add the following members to the `RendererApi` interface (alongside `employees`,
`lookups`, etc.):

```ts
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
```

---

## 3. `src/preload/index.ts`

Add the following object to the `api` const (alongside `employees`, `lookups`, etc.):

```ts
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
```

---

## 4. `src/main/ipc/index.ts`

Add the import at the top:

```ts
import { registerLeaveHandlers } from './leave';
```

And the call inside `registerAllHandlers()`:

```ts
  registerLeaveHandlers();
```

---

## 5. `src/renderer/App.tsx`

Add these imports:

```tsx
import { LeaveList } from '@renderer/routes/leave/List';
import { LeaveDetail } from '@renderer/routes/leave/Detail';
import { LeaveForm } from '@renderer/routes/leave/Form';
```

Replace the existing `<Route path="leave" element={<Placeholder title="Leave" />} />`
line with these four routes:

```tsx
            <Route path="leave" element={<LeaveList />} />
            <Route path="leave/new" element={<LeaveForm />} />
            <Route path="leave/:id" element={<LeaveDetail />} />
            <Route path="leave/:id/edit" element={<LeaveForm />} />
```

---

## 6. Confirmation

- `registerLeaveHandlers` is exported as a named export from
  `src/main/ipc/leave.ts` and ready to be called from `registerAllHandlers()`.
- The schema in `src/shared/schema/leave.ts` is re-exported by the existing
  `src/shared/schema/index.ts` (no edit required there — it already does
  `export * from './leave'`).
- No drizzle migration was generated; regenerate after merging all module schemas.
- Scope-aware read/approve (own / own_reports) is OUT OF SCOPE for this pass —
  handlers currently require `leave.read.all` / `leave.approve.all` only.
- Seed rows for `leave_types` should be added to `resources/seed/*.sql` per the
  spec's "lookup data is seeded, never hard-coded in TS" rule.

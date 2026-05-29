# Settings module — integration patches

This document lists every change to **shared / wiring files** that the Settings
module depends on. The Settings agent did **not** apply these — you (the human
integrator) must apply them by hand because these files are owned by multiple
modules and merging conflicts is your job.

All paths are relative to the repo root.

---

## 1. `src/shared/ipc/channels.ts` — no change required

The three Settings channels are already declared in the foundation. Confirm
they still exist:

```ts
// Settings
SettingsGet: 'settings.get',
SettingsSet: 'settings.set',
SettingsTestSmtp: 'settings.testSmtp',
```

If any are missing, add them inside the existing `Channels` object.

---

## 2. `src/shared/ipc/api.ts` — add `settings` to `RendererApi`

**Add to the imports block at the top:**

```ts
import type {
  SettingsGetResponse, SettingsSetRequest, SmtpTestRequest,
} from './settings';
```

**Add a new member inside the `RendererApi` interface** (after `lookups`):

```ts
  settings: {
    get(req: Record<string, never>): Promise<Result<SettingsGetResponse>>;
    set(req: SettingsSetRequest): Promise<Result<null>>;
    testSmtp(req: SmtpTestRequest): Promise<Result<{ ok: true }>>;
  };
```

---

## 3. `src/preload/index.ts` — expose `settings` on `window.api`

**Add a new object inside the `api` const** (after `lookups`):

```ts
  settings: {
    get: (req: unknown) => invoke(Channels.SettingsGet, req),
    set: (req: unknown) => invoke(Channels.SettingsSet, req),
    testSmtp: (req: unknown) => invoke(Channels.SettingsTestSmtp, req),
  },
```

---

## 4. `src/main/ipc/index.ts` — register the handlers

**Add the import** alongside the existing handler imports:

```ts
import { registerSettingsHandlers } from './settings';
```

**Call it from `registerAllHandlers()`** (after `registerLookupsHandlers()`):

```ts
  registerSettingsHandlers();
```

The full body should read:

```ts
export function registerAllHandlers(): void {
  registerAuthHandlers();
  registerEmployeesHandlers();
  registerLookupsHandlers();
  registerSettingsHandlers();
}
```

---

## 5. `src/renderer/App.tsx` — mount the real settings page

**Add the import** near the other route imports:

```ts
import { SettingsPage } from '@renderer/routes/settings/Page';
```

**Replace the placeholder route** — change this line:

```tsx
<Route path="settings" element={<Placeholder title="Settings" />} />
```

to:

```tsx
<Route path="settings" element={<SettingsPage />} />
```

---

## Done

After applying the five patches above, run:

```
npm run typecheck
npm run lint
```

There should be no new TypeScript or ESLint errors attributable to the
Settings module. The renderer is now reachable at `/#/settings`.

# HR Web Application — Design Spec

**Date:** 2026-06-19
**Status:** Approved (sections 1–3 with user; 4–5 locked by builder under "build it, don't interrupt")
**Goal:** Replicate **all** Microsoft Access HR functions (`Database_2ndCopy.accdb` — 73 tables, 11 modules) as a multi-user web application. Full parity, delivered in phases.

---

## 1. Architecture (Approach B — decoupled REST API)

A single Next.js 15 App Router project, deployed as one unit, split into a standalone REST API and a client UI so any future client (mobile/desktop/integration) can reuse the API.

- `app/(auth)/...` — public login + first-run admin bootstrap.
- `app/(app)/...` — authenticated shell (sidebar, top bar) + module routes. Client Components using TanStack Query.
- `app/api/<resource>/route.ts` — REST endpoints, one folder per resource. `GET`/`POST` on the collection, `GET`/`PATCH`/`DELETE` on `[id]`.
- `lib/api/contracts/*.ts` — Zod request/response schemas, the single source of truth for types (shared by route handlers and client).
- `lib/db/` — Drizzle schema, client, migrations.
- `lib/auth/` — session (cookie + bearer), RBAC.
- `lib/api/handler.ts` — the one wrapper every route uses (validation, authz, audit, concurrency, error mapping).
- `components/ui/` — shadcn primitives; `components/<module>/` — module forms/tables.
- `lib/api/client.ts` — typed fetch wrapper returning `Result<T>` to the UI.

One Next.js deployment, one Postgres, one codebase.

## 2. Auth & RBAC

- `/api/auth/login` — Zod-validates, verifies bcrypt, issues an httpOnly session cookie (`SameSite=Lax`, secure, CSRF-paired) **and** a bearer JWT in the body. Browser rides the cookie; other clients use the bearer.
- `/api/auth/logout`, `/api/auth/me`, `/api/auth/bootstrap` (first-run admin when zero users exist), `/api/auth/status` (`{ usersExist }`).
- Tables: `users`, `roles`, `permissions`, `role_permissions`, `sessions` (server-side rows so logout revokes bearers).
- Permission strings (`<resource>.<action>[.<scope>]`) ported verbatim from the desktop build's `permissions.ts`. Seeded roles: `super_admin`, `hr_admin`, `hr_officer`, `line_manager`, `employee`, `viewer`.
- `middleware.ts` does a cheap cookie-presence redirect (UX only). **Real authorization is always in the handler wrapper**, server-side. Passwords bcrypt cost 12; bearer = signed JWT (`jose`) + server session row.

## 3. Data model & handler wrapper

**Every table:** `id` uuid PK, `created_at`/`updated_at` timestamptz (`updated_at` = optimistic-lock token → 409 on stale PATCH), `created_by`/`updated_by`, `deleted_at` soft delete, `legacy_id` (maps back to the Access row).

**`lib/api/handler.ts` — `withHandler({ schema, permission, handler })`:**
1. resolve session (cookie or bearer) → 401 if none
2. load actor + permissions → 403 if `permission` not held
3. Zod-validate body/params → 422 with `fields`
4. DB transaction: run `handler(input, ctx)`; on every write append `audit_log` (before/after jsonb) in the same tx
5. commit → 200/201; optimistic-lock mismatch → 409; `AppError` → its status; unknown → 500 (logged, generic body)

**Error body everywhere:** `{ error: { code, message, fields? } }` + correct HTTP status. Client wrapper maps it to `Result<T>`.

**Attachments:** generic `attachments` table (`entity_type`, `entity_id`, `storage_key`, `filename`, `mime`, `size`, `uploaded_by`). Files in object storage (local-disk adapter for dev, S3/Blob for prod) via signed URLs; DB stores key + metadata only. **Full upload in MVP.**

**Audit:** `audit_log` (`actor_id`, `action`, `entity_type`, `entity_id`, `before`, `after`, `at`).

## 4. Front-end structure & data flow

- `app/(app)/layout.tsx` — server-validates session, renders sidebar (module nav, permission-filtered) + top bar (user, logout).
- Per module: `…/page.tsx` (list, TanStack Query) + detail/drawer with a React Hook Form + Zod form bound to the shared contract.
- `lib/api/client.ts` — `api.<module>.list/get/create/update/remove`, returns `Result<T>`.
- **Optimistic concurrency in the UI:** forms carry `updated_at`; a 409 surfaces "this record changed, reload" rather than silently clobbering.
- Tables: server-side pagination/sort/filter via query params. Exports (Excel/PDF) per list, parity with the Access reports.
- shadcn/ui + Tailwind; lucide icons. Generic branding ("HR" — no AI/agent references anywhere client-facing).

## 5. Testing

- **Vitest** unit + integration, running against **PGlite** (embedded Postgres, no server needed) with migrations applied per suite.
- Handler-wrapper tests: 401/403/422/409/500 paths, audit row written, soft delete.
- Per-module service tests: CRUD + approval transitions + balance math (leave) + permission scoping.
- API route smoke tests: login → create → list → update happy path per module.
- Seed script for demo data (SA fake data, reused from desktop seed).
- Playwright E2E (login + one happy path per module) as breadth allows.

## 6. Module parity plan (phased)

Foundation first, then modules on the same proven pattern (schema → contracts → service → routes → UI → tests).

| Phase | Modules | Access source |
|---|---|---|
| **0 — Foundation** | Scaffold, DB, auth, RBAC, handler wrapper, audit, attachments, UI shell, lookups | `LoginDetails`, `tblPermissions`, lookups |
| **1 — Core HR** | Employees (master), Leave, Disciplinary | `Employees Employment details`, `TblLeaveForm`, `TblDisciplinary` |
| **2 — Talent** | Job Descriptions, Training, Performance | JD hierarchy, `TblAllTrainings`, `TblEmployeePerformence` |
| **3 — Growth** | Development, Succession | `tblDevelopement`, `tblSuccession` |
| **4 — Ops & lifecycle** | Recruitment, Expenses & Car, Exit | `tblRequest`→recruitment chain, `TblExpense`/`tblCarScheme`, exit tables |
| **5 — Cross-cutting** | Reports/exports, Notifications (SMTP), Settings, Users/RBAC admin | `qry*`, email status columns |

Employees is the reference template; every other module follows its structure.

## 7. Flagged risks (decide before go-live — not silently resolved)

- **POPIA:** cloud-hosting South African HR personal data (ID numbers, disciplinary records) triggers POPIA duties — data residency, breach notification, consent. Pick an SA-resident host or document mitigations before go-live.
- **"No online version" reversal:** Lawrence was told the system is offline/desktop. A cloud-hosted web app is a material change to what he agreed — reconcile explicitly with him.
- **"HTML/CSS/JS" expectation:** their local programmer asked for plain HTML/CSS/JS; the build uses React (compiles to HTML/CSS/JS, full documented source handed over). If they need literally hand-editable HTML, revisit.
- **Single-tenant now:** built for one company; NEXACORE's "sell to others" goal will need tenant scoping later (planned, not built).

## 8. Non-goals (v1)

- Multi-tenant isolation. Offline/PWA mode. Real-time collaboration. Mobile-native client (API is ready for one; UI is responsive web only).

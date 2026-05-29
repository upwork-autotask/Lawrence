# HR Desktop App — Requirements & Build Spec

**Project:** Full-parity Electron rewrite of the existing Microsoft Access HR system (`Database_2ndCopy.accdb`, 73 tables, 17 queries, 32 enforced FKs).

**Audience:** AI agents and human reviewers building this app. Read this end-to-end before writing code in any module. The companion document `../Database_Workflow.md` is the canonical reference for the legacy schema.

---

## 1. Goals & non-goals

### Goals
- Replace the Access database with a maintainable, cross-platform desktop application.
- Preserve every existing module's business behavior (recruitment, employees, JD, training, performance, development, succession, leave, expenses, disciplinary, exit, auth).
- Run offline by default. Optional cloud sync.
- Support 1–5 concurrent users per organization (single company).
- Per-screen Excel and PDF exports.
- SMTP email notifications for approval workflows.

### Non-goals (v1)
- Multi-tenant SaaS.
- Mobile or web clients.
- Real-time collaboration / CRDT.
- Ad-hoc report builder.
- Localization beyond English.

---

## 2. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Shell | Electron (latest stable) | Electron Forge + Vite + TypeScript |
| Renderer | React 18 + TypeScript | Vite bundler |
| Styling | Tailwind CSS 3 + shadcn/ui | New York style, slate base, neutral accents |
| State (server) | TanStack Query v5 | Cache layer over IPC |
| State (UI) | Zustand | Only for cross-page UI state (sidebar, theme) |
| Forms | React Hook Form + Zod | Zod schemas shared with IPC handlers |
| Router | React Router v6 (data router) | |
| DB | better-sqlite3 + Drizzle ORM | Sync API in main process only |
| Migrations | drizzle-kit | SQL files committed |
| Auth (local) | bcrypt + JWT in safeStorage | 12-hour idle timeout |
| PDF | pdfmake | Pure JS, no native deps |
| Excel | ExcelJS | Pure JS |
| Email | nodemailer | SMTP config in settings |
| Settings | electron-store | userData/config.json |
| Logs | electron-log | userData/logs/{date}.log |
| Tests | Vitest + Playwright (Electron) | |
| Packaging | Electron Forge makers | NSIS (Windows), DMG (macOS) |
| Auto-update | electron-updater | GitHub Releases manifest |

---

## 3. Process architecture

```
src/
├── main/               # Node runtime. Owns DB, fs, SMTP, native.
│   ├── index.ts        # App entry, window creation
│   ├── db/             # Drizzle connection, migrations, mutate wrapper
│   ├── ipc/            # Channel handlers (one file per module)
│   ├── services/       # Business logic (auth, mailer, exporter)
│   └── sync/           # SyncAdapter interface + Null + File adapters
├── preload/            # contextBridge — exposes window.api
│   └── index.ts
├── renderer/           # React app
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/         # One folder per module
│   ├── components/     # Reusable UI (DataTable, FormFields, Layout)
│   ├── lib/            # api wrapper, auth context, hooks
│   └── styles/
└── shared/             # Imported by all three above
    ├── schema/         # Drizzle table definitions
    ├── ipc/            # Channel name constants + Zod request/response schemas
    ├── types/          # Result<T>, common DTOs
    └── permissions.ts  # Permission string constants
```

**Three-tier rule (HARD):**
1. Renderer never accesses `fs`, `path`, `os`, `process`, `require`, or any DB. Only `window.api.<module>.<op>(args)`.
2. Preload exposes `window.api` via `contextBridge`. `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`.
3. Main process owns all native side effects.

---

## 4. Data model

### 4.1 Schema strategy
- Drizzle schema lives in `src/shared/schema/*.ts`, one file per module group.
- All tables get standard columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `created_at`, `updated_at`, `deleted_at` (soft delete), `sync_version INTEGER NOT NULL DEFAULT 0`, `created_by`, `updated_by`.
- Legacy IDs preserved as `legacy_id` nullable column on every migrated table.
- Every FK identified in `../Database_Workflow.md` is enforced (even ones the Access DB left implicit).
- Lookups (regions, departments, job titles, etc.) have `code` + `name` + `is_active`.

### 4.2 Module → schema map
The legacy → new mapping is enumerated in `src/shared/schema/legacy-map.ts`. Module schemas listed in section 8.

### 4.3 Migration from Access
- One-time import via CSV bundle.
- User runs `scripts/export-accdb.ps1` on the Access machine (Windows + Access installed) — dumps every table to `migration/csv/`.
- App reads `migration/csv/*.csv` via `scripts/import-from-access.ts`.
- Each row validated against Zod schema; rejects → `migration/rejects/{table}.csv` with reason.
- FK violations resolved by NULL-ing the FK and logging.
- Report at `migration/report.md`.

---

## 5. IPC contract

### 5.1 Channel naming
`<module>.<operation>` (e.g. `employees.list`, `leave.approve`, `auth.login`).

### 5.2 Request/response shape
Every handler returns `Result<T>`:
```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };
type AppError =
  | { code: 'VALIDATION'; fields: Record<string, string> }
  | { code: 'NOT_FOUND' }
  | { code: 'FORBIDDEN'; permission?: string }
  | { code: 'CONFLICT'; message: string }
  | { code: 'UNAUTHENTICATED' }
  | { code: 'INTERNAL'; message: string };
```

### 5.3 Handler factory
Every handler is registered via `registerHandler(channel, requestSchema, responseSchema, async (req, ctx) => …)` which:
1. Validates the request payload against `requestSchema` (Zod) → returns `VALIDATION` on failure.
2. Checks `ctx.session` — returns `UNAUTHENTICATED` if missing (except `auth.*` channels).
3. Checks required permission (declared on the handler) → returns `FORBIDDEN` on miss.
4. Wraps in try/catch — known errors → typed `AppError`, unknown → logged + `INTERNAL`.

### 5.4 Preload bridge
`window.api` is fully typed via a `RendererApi` type derived from the handler registry. Renderer code only sees that type.

---

## 6. Authentication & authorization

### 6.1 Roles (seeded)
- `super_admin`, `hr_admin`, `hr_officer`, `line_manager`, `employee`, `viewer`.

### 6.2 Permissions
Strings of form `<resource>.<action>[.<scope>]`. Examples:
- `employee.read`, `employee.write`, `employee.delete`
- `leave.read.all`, `leave.read.own`, `leave.read.own_reports`, `leave.approve.own_reports`, `leave.approve.all`
- `disciplinary.*`
- `recruitment.*`
- `settings.write`, `users.manage`, `audit.read`

Full enumeration in `src/shared/permissions.ts`.

### 6.3 Storage
- Passwords: bcrypt cost 12.
- Session: signed JWT (HS256), secret in OS keychain via `safeStorage`.
- Idle timeout: 12 hours.

### 6.4 First-run
On first launch, app prompts to create the initial `super_admin` user. No default password.

---

## 7. Sync engine

### 7.1 Op-log model
Every mutation goes through `src/main/db/mutate.ts`:
```ts
mutate(tx, fn)
  → inside: writes entity changes, then INSERT into sync_outbox
  (entity, entity_id, op, payload_json, base_version, lamport, user_id, created_at)
  → bumps entity.sync_version
  → commits atomically
```

### 7.2 Adapter interface
`src/main/sync/adapter.ts`:
```ts
interface SyncAdapter {
  name: string;
  push(ops: OutboxRow[]): Promise<{ accepted: string[]; rejected: ConflictRow[] }>;
  pull(since: Lamport): Promise<RemoteOp[]>;
  status(): Promise<SyncStatus>;
}
```

### 7.3 Shipped adapters
- `NullSyncAdapter` (default) — no-op, marks outbox rows as `acknowledged_local`.
- `FileSyncAdapter` — writes outbox to a user-chosen shared folder as JSONL; reads back acknowledgements.

Cloud adapter is **Phase 2**. The spec deliberately leaves the choice open.

### 7.4 Conflict policy
Last-write-wins by `updated_at`. Losing rows moved to `sync_conflicts` for human review.

---

## 8. Modules

Each module owns: schema, IPC handlers, services, renderer routes, tests. The **Employees** module is the reference template — every other module follows the same structure.

### Build order (sequential)
1. **Auth** — users, roles, permissions, sessions
2. **Employees** — employees + lookups (regions, departments, job_titles, depots, tiers, paterson_grades)
3. **Settings** — SMTP config, theme, org branding

### Parallel build (after foundation)
4. **Leave** — leave_forms, leave_types, leave_balances
5. **Disciplinary** — disciplinary, nature_of_offence, disciplinary_action, criminal_reports
6. **Job Descriptions** — job_descriptions, jd_entries, jd_roles, jd_kpis, jd_training_int, jd_training_ext, employee_jds
7. **Training** — trainings_catalogue, training_internal, training_external, analysis_skills, quiz_questions, quiz_answers, employee_tests
8. **Performance** — employee_performance, kpis, kpi_categories
9. **Development** — development_plans, qual_dev, skills_dev, dev_experience
10. **Succession** — critical_roles, critical_skills, succession, succession_app_data, schemes, s_commitment, s_position
11. **Recruitment** — requests, recruitment, interviews, interview_questions, candidate_answers, main_sheet_interview, **interview_leads (junction)**, evaluations, actual_recruitment, employee_takes, recruitment_targets, recruitment_app_data, non_recruitment_reasons
12. **Expenses & Car** — expenses, car_scheme, expense_categories, cost_of_sale, activities, overheads, depots, approvals
13. **Exit** — exit_records
14. **Notifications** — notifications, email_outbox
15. **Reports** — read-only views; export buttons hook into ExcelJS/pdfmake

### Standard module shape
Each module exposes the same surface:
- `src/shared/schema/<module>.ts` — Drizzle tables
- `src/shared/ipc/<module>.ts` — Zod request/response schemas + channel constants
- `src/main/services/<module>.ts` — pure business logic, no IPC concerns
- `src/main/ipc/<module>.ts` — handler registrations
- `src/renderer/routes/<module>/list.tsx` — DataTable view
- `src/renderer/routes/<module>/detail.tsx` — tabbed view (Main | Approvals | Attachments | History)
- `src/renderer/routes/<module>/form.tsx` — RHF + Zod, used for new + edit
- `src/main/services/<module>.test.ts` — integration tests
- `src/renderer/routes/<module>/__e2e__/<module>.spec.ts` — Playwright E2E

### Approvals (parity)
Approval state stays as columns on each transactional record (`line_manager_approved_at`, `hr_approved_at`, `compliance_approved_at`, `exco_approved_at`, plus matching `_by` user-id columns and `_status` enum). This is a direct port of the Access DB pattern. No generic approval engine in v1.

---

## 9. Attachments

- Stored under `userData/attachments/<module>/<entity_id>/<original_filename>`.
- DB column: `attachment_path TEXT` (relative path from `userData/attachments/`).
- Multi-file attachments via separate `<entity>_attachments` table with `id, entity_id, path, original_name, mime, size_bytes, uploaded_by, uploaded_at`.
- Sync: file metadata syncs through outbox; binary contents sync separately via Phase 2 blob adapter.

---

## 10. Reporting & export

- Every list view has **Export → Excel** and **Export → PDF** buttons.
- Excel: ExcelJS workbook with current filter/sort, frozen header, autofilter, typed columns (dates, currency).
- PDF: pdfmake template with branded header (org name + logo from settings), paginated table, footer with timestamp + user.
- Detail-page PDF (single record) uses a per-module template.
- 10 built-in report templates **deferred** — Phase 1.5.

---

## 11. Notifications

### In-app
- Bell drawer in topbar. `notifications` table: `user_id, kind, payload_json, read_at, created_at`.

### Email (SMTP)
- Settings page: host, port, user, pass, TLS, from-name, from-address.
- "Send test email" button.
- Events that send mail:
  - Leave applied → approver
  - Leave decision → employee
  - Expense submitted → approver
  - Training booked → employee + line manager
  - JD evaluation pending → CEO
  - Disciplinary hearing scheduled → all parties
- `email_outbox` table queues sends; `EmailWorker` runs every 30s in main; retries 3× then surfaces in bell drawer.

---

## 12. Error handling & observability

- IPC handlers return `Result<T>`; renderer branches on `result.ok`.
- Validation errors include field map → RHF binds via `setError`.
- DB constraint errors translated via `src/main/db/error-translate.ts`.
- `electron-log` to `userData/logs/{date}.log`, 30-day rotation.
- `audit_log` table: every mutation logs `user_id, entity, entity_id, action, before_json, after_json, at`.

---

## 13. Testing strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pure functions, Zod schemas, mappers, importers |
| Integration | Vitest + in-memory sqlite | Full IPC handlers, including permission checks |
| E2E | Playwright (Electron driver) | Smoke flows per module: login → list → create → edit → approve → export |
| Migration | Vitest | Golden CSV bundle → row counts + FK integrity |
| CI | GitHub Actions | Windows + macOS matrix, `tsc`, `eslint`, `vitest run`, `playwright test` |

Pre-commit hook: `tsc --noEmit && eslint --max-warnings 0 && vitest run --changed`.

---

## 14. Packaging & distribution

- Electron Forge makers: `nsis` (Windows), `dmg` (macOS). Linux out of scope.
- Code signing documented but optional in v1.
- Auto-update via `electron-updater` against GitHub Releases.
- DB at `userData/hrapp.db` (SQLite). WAL journal mode. `PRAGMA foreign_keys = ON`.
- Settings at `userData/config.json` (electron-store).
- Attachments at `userData/attachments/`.
- Backup: "Backup now" zips db + attachments to user-chosen path. Daily auto-backup keeps last 7.

---

## 15. Hard rules for contributors / agents

1. **Never touch the renderer's process boundary.** No `require`, no Node API in renderer code. Add a new IPC channel instead.
2. **All writes go through `mutate()`.** Never call Drizzle's `.insert()`/`.update()`/`.delete()` directly outside `mutate()`.
3. **Every IPC handler declares its permission**, even if it's `null` (public).
4. **Every form has a Zod schema** that is the source of truth — RHF resolver wraps it, IPC request validates against it, Drizzle types derive from it where reasonable.
5. **Lookup data is seeded, never hard-coded in TS.** New seed rows go through `resources/seed/*.sql`.
6. **No business logic in renderer.** Renderer formats and dispatches; main decides.
7. **Schema changes ship with a drizzle-kit migration.** Never edit generated migrations.
8. **Tests are required.** A module is not "done" without integration tests covering its handlers and at least one E2E covering create + read + update.

---

## 16. Out-of-scope but planned (Phase 2+)

- Cloud sync adapter (Supabase/Postgres/etc.) — interface stays stable, only `src/main/sync/adapters/cloud.ts` is added.
- SSO (Microsoft 365 / Google).
- Mobile companion app for leave applications.
- Custom report builder.
- Multi-tenant.
- Localization.

---

## 17. Glossary

- **EE** — Employment Equity (South African labour law reporting category).
- **NBC** — National Bargaining Council.
- **Paterson grade** — South African job grading system (A–F bands).
- **EXCO** — Executive Committee (final approval tier).
- **Hub-and-spoke** — schema pattern where `employees` is the central node every transactional table joins back to.

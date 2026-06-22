# HR Web

Web rebuild of the legacy MS Access HR system — full parity as a Next.js 15
(App Router) + TypeScript app. Dev/test run on embedded **PGlite** (no DB server
needed); production uses real Postgres via `DATABASE_URL`.

## Setup on a new machine

```bash
cd hr-web
npm install                 # or: npm ci
cp .env.example .env        # then set AUTH_SECRET (any value works for dev)
npm run db:import           # migrates + imports the Access data (./import-data)
npm run dev                 # http://localhost:3000
```

`npm run db:import` runs `scripts/import-access.ts`, which applies all migrations
and loads the CSV exports in `import-data/` (≈453 employees and every lookup).
It is idempotent — safe to re-run.

### Login

The import creates the users from the legacy `LoginDetails` table. Sign in with:

- **Username:** `admin`  **Password:** `Admin`  (super_admin)

(Usernames are lowercased on import.)

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (PGlite, file-backed at `./.pglite`) |
| `npm run db:migrate` | Apply migrations only |
| `npm run db:import` | Migrate + import the Access data |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest suite (in-memory PGlite) |
| `npm run build` | Production build |

> The Vitest config runs test files sequentially in a single isolated fork
> (`fileParallelism: false`, capped heap) so the embedded PGlite/WASM Postgres
> is released between files and the suite stays within ~1.5 GB. Just run
> `npm test`.

## Notes

- `.env` is git-ignored — create it from `.env.example` on each machine.
- The `./.pglite` data directory is git-ignored and local-only; rebuild it with
  `npm run db:import`.
- `import-data/` and `Database_2ndCopy.accdb` contain real HR personal data —
  keep the repository private (see the POPIA note in the design spec).

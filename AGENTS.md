# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Jam Vibes is a Next.js 15 collaborative music-loop app backed by a local Supabase stack (Postgres, Auth, Storage, Realtime, Mailpit). See `README.md` for architecture and testing philosophy.

### Required services

| Service | Port | Start command |
|---------|------|---------------|
| Docker daemon | — | See below (required before Supabase) |
| Supabase local stack | API `55321`, Postgres `55322`, Mailpit `55324` | `npm run supabase:start` |
| Next.js dev server | `3000` | `npm run dev` |

### First-time / fresh VM setup (not in update script)

1. **Docker** — Supabase runs in Docker. If `docker info` fails, start the daemon:
   ```bash
   sudo dockerd > /tmp/dockerd.log 2>&1 &
   sudo chmod 666 /var/run/docker.sock   # until user is in docker group
   ```
   Cloud VMs use `fuse-overlayfs` storage driver (`/etc/docker/daemon.json`).

2. **`lib/.env`** — Required for `supabase start` because `lib/supabase/config.toml` references Google OAuth env vars. Create with Google disabled:
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=false
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=
   ```
   (This file is gitignored.)

3. **Supabase + DB** — `npm run supabase:start` then `npm run supabase:db:reset`.

4. **`.env.local`** — Populate from `npx supabase status --workdir ./lib -o env`:
   - `NEXT_PUBLIC_SUPABASE_URL` ← `API_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← `ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ← `SERVICE_ROLE_KEY`

   Note: the repo README references `.env.example`, but that file is not committed; use `supabase status -o env` as the source of truth.

### Standard commands

| Task | Command |
|------|---------|
| Lint | `npm run lint` |
| Unit tests (no stack) | `npm run test:unit` |
| Acceptance tests | `npm run test:acceptance` (needs dev server + Supabase) |
| Smoke / E2E | `npm run test:smoke` (Playwright; run `npx playwright install chromium` once if browsers missing) |
| Full precommit | `npm run precommit` |

### Gotchas

- **Supabase must be running** before `npm run dev` or acceptance/smoke tests; API routes talk to local Supabase.
- **Acceptance tests** hit `http://localhost:3000`; start `npm run dev` first (or let Playwright's `webServer` handle it for smoke only).
- **Mailpit** at `http://127.0.0.1:55324` catches local auth emails (password reset, invites).
- **Node 22** — `.nvmrc` specifies Node 22.

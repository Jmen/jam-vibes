# 🍇 Jam Vibes

Collaborative music loops. Create a jam, upload audio, mix the levels, commit
a loop — and anyone listening sees it land in real time. Public jams are open
to the world; private jams work by invite.

## Tech Stack

| Feature          | Implementation                        |
| ---------------- | ------------------------------------- |
| Website          | Next.js (App Router)                  |
| Styling          | Tailwind / shadcn                     |
| API              | Next.js route handlers                |
| Authentication   | Supabase Auth (email + Google)        |
| Database         | Supabase Postgres + RLS               |
| Storage          | Supabase Storage (signed URLs)        |
| Realtime         | Supabase Realtime (behind an adapter) |
| Unit tests       | Vitest + Testing Library              |
| Acceptance tests | Vitest (API)                          |
| Smoke tests      | Playwright                            |
| Hosting          | Vercel (two projects: test → promote) |

## Design Philosophy

**Boring technology.** Stable, well-understood pieces with big communities.

**Free tier / scale to zero.** Supabase and Vercel both run this for free.

**Local offline development.** The entire system runs locally:
Postgres, auth, storage, realtime and email all live in Docker via the
Supabase CLI. No internet needed after the first install.

**API first.** The API is the product; the website is one example client.
Everything the site does goes through `/api/*` with cookie auth — and every
endpoint equally accepts `Authorization: Bearer <accessToken>`, so a native
mobile app can be built against the same surface. Live docs at `/docs`
(OpenAPI generated from the same zod schemas that validate requests).

## Architecture

```
app/api/<resource>/
  route.ts      HTTP wiring only (ApiHandlerBuilder)
  schema.ts     zod schemas: validation + client types + OpenAPI
  commands.ts   use cases, return Result<T>
  db.ts         Supabase queries (RLS-scoped client)
  domain.ts     domain objects where logic deserves a home
```

- **`ApiHandlerBuilder`** composes `.auth()` / `.optionalAuth()` /
  `.validateBody()` wrappers around handlers; errors map to HTTP via
  `Result<T>` and `createResponse`.
- **Row Level Security is the authorization layer.** API routes query with
  the caller's identity (cookie session or bearer token); policies decide
  visibility. Public jams are readable by the `anon` role, which is also what
  makes signed-out realtime work. The service-role client is used in exactly
  two narrow places: signing storage URLs for content RLS already approved,
  and redeeming invite tokens.
- **One typed client** (`lib/api`) is shared by the website, the component
  tests (mocked) and the acceptance test driver (real HTTP). Its methods
  parse responses with the server's own zod schemas, so a contract drift
  breaks loudly everywhere at once — this is what makes mocking it in UI
  tests safe.
- **Realtime is a port** (`lib/realtime/adapter.ts`); Supabase is one
  adapter. Swapping in Pusher is one file.

## Testing

Judge the suite as a whole, not tests in isolation. Priorities:

1. **Speed** — unit tests run in ~1.5s, acceptance in ~12s against the local
   stack. A couple of slow tests are tolerated when they buy real confidence.
2. **Predictive of production** — acceptance tests exercise the real API,
   database, RLS policies, storage and email (Mailpit); the realtime smoke
   test runs two real browsers. If these pass, deploys are boring.
3. **Cost of ownership** — scenarios are written in a DSL
   (`__test__/acceptance/dsl`) with protocol details confined to one driver,
   so refactors rarely touch tests.
4. **Learning/documentation** — scenarios read as the requirements spec:
   "an invited user can accept and view the private jam".

Layers (Growing Object-Oriented Software / Farley style):

- **Acceptance** (`__test__/acceptance`): scenarios → DSL → API driver →
  real local stack. Covers auth, profiles, jams, audio, loops, invites and
  the security boundaries (visitor/member/owner).
- **Unit** (`components/**/__test__`, `lib`): Testing Library with the typed
  API client mocked; pure logic (e.g. the audio mixer) tested directly.
- **Smoke** (`__test__/smoke`): Playwright, kept to two journeys — the core
  register→create→upload→commit flow, and the two-browser realtime test —
  because browser tests are inherently the least reliable layer.

## Getting Started

```bash
npm install
npm run supabase:start     # boots the local stack in Docker (ports 553xx)
npm run supabase:db:reset  # applies migrations
cp .env.example .env.local # fill in keys from `npm run supabase:status`
npm run dev
```

Test commands: `npm run test:unit`, `test:acceptance` (needs dev server +
stack), `test:smoke`, or everything via `npm run precommit`.

Reviewing a PR: `npm run review:pr -- <number>` — checks out the branch,
resets the local database to its migrations, and starts the dev server. The
local stack is the review environment. When finished, `npm run review:done`
returns to a clean main (deletes the PR branch, restores deps/schema if the
PR changed them).

Local services: app on `:3000`, Supabase API `:55321`, Postgres `:55322`,
Mailpit (all local email) `:55324`.

### Google sign-in (optional)

Set `SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=true` plus client id/secret in
`lib/.env`, set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in `.env.local`, then
restart the stack.

# 1. Auto-generated usernames with a cosmetic choice prompt

Date: 2026-06-10

## Status

Accepted

## Context

Usernames are the public identity on jams and loops, but they started life
as a nullable column filled in later from the account page. Every consumer
had to handle the `NULL` case, which leaked email-address fallbacks into the
UI and `if (username)` branches through the app. Sign-up flows (email and
Google OAuth) also differ in how much friction a mandatory "choose a name"
step adds.

## Decision

Every account is born with a username, generated in the database atomically
with account creation:

- A `generate_username()` plpgsql function produces two lowercase words plus
  a 4-char random suffix (e.g. `brave-walrus-x4f2`), inside the existing
  username rules (3–30 chars, `[a-zA-Z0-9_-]`, unique case-insensitively),
  with a bounded retry loop on collision.
- The `handle_new_user` trigger inserts the profile **with** that username
  in the same transaction as the `auth.users` row.
- `profiles.username` is `NOT NULL`, and the username rules are enforced
  with a database `CHECK` constraint, not just zod at the API layer.

Choosing your own username becomes a **cosmetic** act: a prompt at
registration and after first Google sign-in lets people replace the
generated handle, but nothing blocks on it and skipping it is fine.

## Consequences

- App code may assume a username always exists; email fallbacks get deleted
  (JAI-12), and the choice prompts are pure UX slices (JAI-13, JAI-14).
- New accounts appear as `by brave-walrus-x4f2` until their owner picks
  something — benign, readable, URL-friendly.
- No backfill is needed: nothing is deployed. Against a database that did
  have `NULL` usernames, `SET NOT NULL` fails loudly and aborts, which is
  the safe outcome.

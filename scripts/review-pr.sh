#!/usr/bin/env bash
set -euo pipefail

# Stand up a GitHub PR locally for review: checkout, deps, branch schema, dev server.
# Usage: npm run review:pr -- <pr-number>

cd "$(dirname "$0")/.."

pr="${1:-}"
if [[ -z "$pr" ]]; then
  echo "usage: npm run review:pr -- <pr-number>" >&2
  echo >&2
  echo "open PRs:" >&2
  gh pr list >&2 || true
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "error: uncommitted changes in the working tree - commit or stash them first" >&2
  exit 1
fi

echo "==> Checking out PR #${pr}"
gh pr checkout "$pr"

echo "==> Installing dependencies"
npm install --no-fund --no-audit

if [[ ! -f lib/.env ]]; then
  echo "==> Creating lib/.env (Google OAuth disabled)"
  cat > lib/.env <<'EOF'
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=false
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=
EOF
fi

if npm run --silent supabase:status >/dev/null 2>&1; then
  echo "==> Supabase stack already running"
else
  echo "==> Starting Supabase stack"
  npm run supabase:start
fi

echo "==> Resetting database to this branch's migrations (local data is discarded)"
npm run supabase:db:reset

if [[ ! -f .env.local ]]; then
  echo "==> Creating .env.local from the local stack"
  set -a
  eval "$(npx supabase status --workdir ./lib -o env)"
  set +a
  cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
EOF
fi

echo
gh pr view "$pr" --json number,title,url --template '==> Reviewing #{{.number}}: {{.title}}{{"\n"}}    {{.url}}{{"\n"}}'
echo "==> When done: git checkout main"
echo "==> Starting dev server (Ctrl-C to stop)"
exec npm run dev

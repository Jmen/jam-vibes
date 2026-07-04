#!/usr/bin/env bash
set -euo pipefail

# Return to a clean main after reviewing a PR: checkout main, delete the PR
# branch, and restore deps/schema only if the branch changed them.
# Usage: npm run review:done

cd "$(dirname "$0")/.."

branch="$(git branch --show-current)"
if [[ "$branch" == "main" ]]; then
  echo "already on main - nothing to do"
  exit 0
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "error: uncommitted changes in the working tree - commit or stash them first" >&2
  exit 1
fi

changed="$(git diff --name-only main...HEAD)"

echo "==> Switching to main"
git checkout main

if git rev-parse --verify --quiet "${branch}@{upstream}" >/dev/null; then
  unpushed="$(git rev-list --count "${branch}@{upstream}..${branch}")"
else
  unpushed="unknown"
fi

if [[ "$unpushed" == "0" ]]; then
  echo "==> Deleting local branch ${branch}"
  git branch -D "$branch"
else
  echo "==> Keeping ${branch} - it has local commits not on its upstream"
fi

if grep -qE '^package(-lock)?\.json$' <<<"$changed"; then
  echo "==> PR changed dependencies - reinstalling main's"
  npm install --no-fund --no-audit
fi

if grep -q '^lib/supabase/migrations/' <<<"$changed"; then
  echo "==> PR changed migrations - resetting database to main's schema"
  npm run supabase:db:reset
fi

echo "==> Back on a clean main"

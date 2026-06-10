<!--
Title: `type: outcome in plain words`
e.g.   `feat: every account is born with a username (JAI-11)`
-->

Implements [Ticket ID](https://linear.app/jaimen/issue/JAI-__).

<!-- One or two sentences: what this PR does and why, in product/system terms.
     Name any invariant it introduces, or consumes from an earlier PR (link it). -->

## Changes

<!--
One subsection per part of the change, ordered for the READER — the easiest
path to understanding, not commit order or directory order. Usually:

  1. the part that anchors everything else (data model / schema / contract)
  2. each part that builds on it, in dependency order
  3. periphery last (UI copy, tests, config)

A reader who stops after part 1 should still have understood the heart of
the PR.

Under each part, list the files it touches as links to their diff in this PR:

  [`path/to/file.ts`](https://github.com/Jmen/jam-vibes/pull/<PR>/files#diff-<HASH>)

  <HASH> = sha256 of the repo-relative path:
           printf 'path/to/file.ts' | shasum -a 256 | cut -d' ' -f1

These links jump straight to that file in the "Files changed" tab and keep
working after the branch is deleted. The PR number doesn't exist until after
`gh pr create`, so create first, then fill the links in with
`gh pr edit <PR> --body-file <file>`.
-->

### 1. <What changed, stated as a claim>

<!-- What this part does, why it leads, and what it guarantees to the parts below. -->

**Files**

- [`path/to/file.ts`](https://github.com/Jmen/jam-vibes/pull/<PR>/files#diff-<HASH>)

### 2. <Next part, building on part 1>

**Files**

- [`path/to/file.ts`](https://github.com/Jmen/jam-vibes/pull/<PR>/files#diff-<HASH>)

## Safety

<!-- Delete this section if trivial. What could break at deploy time, which DB
     constraints/triggers the change leans on, rollback notes. -->
## Working style

For length, plain language, jargon, and standalone-sentence rules, see
`CONTEXT.md` `## Working style`. Those rules govern both conversation and any
prose written into the repository (ADRs, research notes, commit messages).

## Collaboration

Reserve the top-level checkout, which is the repository directory used by the
human, for human changes. To keep agents from overwriting one another's work,
every agent must make repository edits in a dedicated Git worktree, which is a
separate checkout of the same repository under a temporary directory. Attach
the worktree to a branch named for the issue so the agent's work remains
isolated until it is presented for human review in a pull request. Never place
an agent-authored edit or commit directly in the top-level checkout.

Before editing, make sure a GitHub issue records the requested change. Create a
GitHub issue when none exists.

Every agent-authored change must be committed, pushed to its issue-specific
branch, and submitted as an open pull request before the agent finishes. The
pull request must link the tracking issue, and the tracking issue must link the
pull request. Never leave an agent-authored change as an uncommitted edit, a
commit that exists only locally, or a branch on GitHub without a pull request.
If the permissions needed to create the issue and branch, publish the branch,
or open the pull request are unavailable, do not edit the repository; report
the blocker instead.

Open the pull request as a draft when the work is incomplete or should not be
merged in its current state. The draft pull-request body must state the reason
the change should not be merged and list objective criteria for marking the
pull request ready. Keep the pull request in draft until every readiness
criterion listed in its body is satisfied. A draft pull request lets reviewers
inspect incomplete work but does not represent completed work.

## Pull requests

Agents must never merge pull requests. Leave every pull request open for a human to review and merge.

## Agent skills

### Issue tracker

Issues are tracked on GitHub. External pull requests are not an automatic
triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the canonical state label names. See
`docs/agents/triage-labels.md`.

### Domain docs

`dotfiles-nix` is a standalone user-environment producer; `system-nix` is its
NixOS consumer. See `docs/agents/domain.md`.

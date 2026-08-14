## Working style

For length, plain language, jargon, and standalone-sentence rules, see
`CONTEXT.md` `## Working style`. Those rules govern both conversation and any
prose written into the repository (ADRs, research notes, commit messages).

## Collaboration

Treat the shared workspace as read-only. Every agent must make every repository
edit in a dedicated Git worktree under a temporary directory.
The dedicated-worktree requirement applies to every task regardless of its
size, the number of active agents, or whether the agent believes it is working
alone.

Before editing, make sure a GitHub issue records the requested change. Create a
GitHub issue when none exists. Create an issue-specific branch from the
intended base branch, then attach the temporary worktree to that branch. Never
place an agent-authored edit or commit directly on the branch checked out in
the shared workspace.

Every agent-authored change must be committed, pushed to its issue-specific
branch, and submitted as an open pull request before the agent finishes. The
pull request must link the tracking issue, and the tracking issue must link the
pull request. Never leave an agent-authored change as an uncommitted edit, a
local-only commit, or a remote branch without a pull request. If issue, branch,
push, or pull-request access is unavailable, do not edit the repository; report
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

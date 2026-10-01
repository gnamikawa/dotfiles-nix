# Agent instructions

## Working style

For length, plain language, jargon, and standalone-sentence rules, see
`CONTEXT.md` `## Working style`. Those rules govern both conversation and any
prose written into the repository (ADRs, research notes, commit messages).

## Git

- Never push to `master` (or `main`).
- When working on a feature with the user, changes go to whatever branch is
  active at that moment. Do not create or switch branches unless the user names
  one.
- A job is finished only when its changes are committed. Before reporting work
  as done, commit it on the active branch and check `git status`, so no staged
  or unstaged change is left behind to be forgotten. If something must stay
  uncommitted, say exactly what and why.

## Formatting

Every commit is gated by treefmt via `.githooks/pre-commit`. The hook runs
treefmt against the files staged for the commit — not the whole working tree —
and fails when any of them had to be rewritten. The reformatted content is left
in the working tree; re-stage and retry to commit it.

Before committing, run `nix fmt` yourself so the hook stays a check rather than
a fix. Always do this when the same file has both staged and unstaged changes:
the hook rewrites the working tree in place and would clobber the unstaged
portion.

Enable the hook once per checkout with `git config core.hooksPath .githooks`.
Git worktrees inherit that setting from the main checkout, so an agent branching
off a worktree does not need to re-enable it — but the setting must exist on the
main repository for the inheritance to apply.

The set of formatters and the excluded paths live in `treefmt.nix`; change that
file when a new language or a new generated tree enters the repository.
`nix flake check` runs the same treefmt config across every tracked file as its
`formatting` check, so a CI or pre-push sweep can catch drift the per-commit
hook missed.

## Agent skills

### Issue tracker

Issues are tracked on GitHub. External pull requests are not an automatic triage
surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the canonical state label names. See `docs/agents/triage-labels.md`.

### Domain docs

`dotfiles-nix` is a standalone user-environment producer; `system-nix` is its
NixOS consumer. See `docs/agents/domain.md`.

### Coding style

Repository coding style — pipe-operator preference and multi-line argument
handling. See `STYLE.md`.

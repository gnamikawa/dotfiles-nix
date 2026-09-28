# Agent instructions

## Working style

For length, plain language, jargon, and standalone-sentence rules, see
`CONTEXT.md` `## Working style`. Those rules govern both conversation and any
prose written into the repository (ADRs, research notes, commit messages).

## Never push

Agents must never push. Do not run `git push` or publish a branch, tag, or
commit to any remote by any other means. Agent commits stay local; the human
decides what leaves the machine.

## Formatting

Every commit is gated by treefmt via `.githooks/pre-commit`. The hook runs
treefmt — formatting plus ShellCheck, actionlint, and Markdownlint, all declared
in `treefmt.nix` — against the files staged for the commit, not the whole
working tree, and fails when any of them had to be rewritten or found a lint
issue. Reformatted content is left in the working tree; re-stage and retry to
commit it. `.githooks/pre-push` separately runs `nix flake check --no-build` —
the same evaluation and instantiation checks CI runs first, without building
anything — so a broken flake or missed formatting sweep is caught before the
push, not after.

Before committing, run `nix fmt` yourself so the hook stays a check rather than
a fix. Always do this when the same file has both staged and unstaged changes:
the hook rewrites the working tree in place and would clobber the unstaged
portion.

Enable both hooks once per checkout by entering
`nix develop .#dotfiles-maintenance` (directly or via direnv): its shell hook
runs `git config core.hooksPath .githooks`. Git worktrees inherit that setting
from the main checkout, so an agent branching off a worktree does not need to
re-enter the shell there — but the setting must exist on the main repository for
the inheritance to apply.

The set of formatters and linters and the excluded paths live in `treefmt.nix`;
change that file when a new language or a new generated tree enters the
repository. `nix flake check` runs the same treefmt config across every tracked
file as its `formatting` check, so CI or the pre-push hook can catch drift the
per-commit hook missed.

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

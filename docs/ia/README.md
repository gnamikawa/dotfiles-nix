# Information architecture

This directory holds the desktop UI's information-architecture artifacts.

## The IA process

Information-architecture work follows the Rosenfeld / Morville / Arango
process (their book, _Information Architecture for the Web and Beyond_,
4th ed.). It runs in five phases:

**Research → Strategy → Design → Implementation → Administration**

Each phase produces its own artifacts. The Strategy phase's artifact
constrains everything that comes after it, so downstream phases cite it
rather than re-derive its rules.

## RMA deliverables per phase

The book describes the overall process on pp. 313–315. Its deliverables
for each phase:

| Phase          | Book pages       | Deliverables                                                                                                           |
| -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Research       | 315–353          | Research methods and intermediate work products (not a formal deliverable set).                                        |
| Strategy       | 356–358, 367–388 | Strategy recommendations, work products, strategy report, project plan, presentation.                                  |
| Design         | 389–439          | Sitemaps, wireframes, content maps / inventories, content models, controlled vocabularies, prototypes, IA style guide. |
| Implementation | 314–315          | Built and tested system, organised and tagged documents, documentation, training.                                      |
| Administration | 315              | Ongoing tagging, content removal, monitoring, evaluation, and improvement (not a discrete deliverable).                |

## What currently exists

- **Research** — `docs/research/ia-three-circles.md`. The substrate,
  covering Context, Content, and Users per the RMA three-circles method.
  Its §3.5 enumerates numbered _axes_ — design commitments referenced
  elsewhere as `§3.5 axis N`.
- **Strategy** — `docs/ia/strategy.md` (this directory). The load-bearing
  rule, the three states, the three interruptive channels, the reforming
  stance, and the corollaries subsequent Design work inherits. What every
  downstream design decision consults.

Design has no in-repo artifacts yet. Planned work is tracked on the
wayfinder map (below).

## Which phase does this decision belong in?

The phase names the layer. A visual choice is Design, not Strategy — even
when the Strategy constrains it. A new signal's routing IS a Strategy
question, and belongs in `strategy.md`.

## Wayfinder map

The whole IA effort is coordinated on GitHub as wayfinder map
[#95](https://github.com/gnamikawa/dotfiles-nix/issues/95).

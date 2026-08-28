# Adaptive form over monotony, usability over skeuomorphism

Where a surface displays state that varies in size or count (peer sets,
lists, counters), let the surface's shape vary with the state rather
than holding a fixed skeleton that renders the state as data inside it.
A single-element state and a nine-element state should look like
different surfaces, not the same widget carrying different content.

Skeuomorphism (ADR-0009) is negotiable when it costs usability. A
physical-object metaphor that fails to hold both identity and
information density at the surface's real size stops earning its
space. Trading the metaphor for a denser or clearer form is
legitimate; the trade is noted at the point it is made, so it stays
deliberate rather than accidental.

Why this shape:

- Repetition of identical shape reads as background — the eye stops
  parsing what it has seen before. Adaptive layout keeps the same
  surface from becoming visual wallpaper as its content changes.
- Skeuomorphism buys familiarity of affordance, not correctness of
  shape. Where the affordance is fine without the physical form, or
  where the physical form obscures the state, the shape is what
  should give.
- Usability is the ceiling. A metaphor that is honest, motion-first,
  and encoded but unreadable is still broken.

Consequences: a surface may opt out of ADR-0009 when usability
requires it, with a comment noting the trade. Adaptive layouts that
reshape by content count are a first-class option, not a special case.

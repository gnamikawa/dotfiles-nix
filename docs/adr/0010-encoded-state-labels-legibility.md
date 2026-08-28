# Encoded state as the default, labels when legibility demands

State that a surface reports is expressed as shape, position, fill,
or motion by default, not as writing. A physical object rarely wears
writing that explains itself: a soda bottle's neck tells you where
to drink, a switch's position tells you whether it is on, a keypad's
layout tells you which digit is where. The encoded form is what
makes those objects readable at a glance, and every peek surface is
designed to be read at a glance.

Why this shape:

- Encoding scales with attention. A glance reads a filled dot faster
  than a digit, a lit lamp faster than "ON". Peek surfaces exist to
  be taken in without focal reading, and encoded state can be.
- Encoding matches the physical metaphor (ADR-0009). Dials,
  switches, keypads, plates communicate through shape and state, not
  writing; rendering the shape and then labelling it imports the
  form without importing what makes it physical.
- Text pulls attention the surface does not have the budget for. A
  number reads as prose the eye fixes on; an encoded state reads in
  peripheral vision.

Legibility is the ceiling. If an encoded state cannot be resolved at
the surface's intended viewing distance and glance budget, the
encoding has failed and text returns. The first reach is the
temporary form, gated to the interaction that means the user is now
looking closely (hover, hold, keydown, focus); persistent labels are
also legitimate. The reason to prefer the temporary form is
aesthetic, not principled — a resting surface reads better without
writing on it.

Consequences: shape/position/fill/motion is the default expression
of state. Labels are the finish when the encoding won't scan, and
temporary is the preferred finish.

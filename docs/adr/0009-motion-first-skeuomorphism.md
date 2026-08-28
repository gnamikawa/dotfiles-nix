# Motion-first skeuomorphism as the surface design language

Every summoned surface is modeled on a physical object. The object's
shape shows how to hold it; its visible parts show what state it is in;
its motion — arriving, changing, leaving — is the interaction, not a
decoration applied on top. A user meeting a surface for the first time
should not need to be taught what it does, in the same way that a soda
bottle does not need instructions: the shape narrows toward the
opening, the transparency reveals the contents, and only one part
moves.

Why this shape:

- Affordance beats chrome. The screen has infinite space for controls
  but only one attention budget; borrowing from physical objects lets a
  surface communicate its purpose and interaction with its silhouette
  rather than with labels, tooltips, or discovery-through-clicking.
- Motion is not polish. Enter, change, and leave animations are how the
  surface tells the user which state it is in and what just happened;
  they belong in the design, not the pass at the end. A surface that
  flips through options is a different object than one that slides
  through them, even if the same data is on screen.
- Skeuomorphism here is functional, not visual. The point is not glossy
  leather or drop-shadowed rivets; it is that the surface reads as a
  specific real-world object with a single obvious grip and a single
  obvious action, so the user's hand knows what to do before their
  conscious attention catches up. Geist (ADR-0006) remains the material
  grammar — flat, restrained, monochrome-leaning — applied to shapes
  chosen for their affordances.

Rejected: purely abstract design — floating cards, generic modals,
symmetrical rectangles that convey no intent. They compose easily and
photograph well; they also require the user to learn every surface from
scratch. Rejected also: literal photorealistic imitations — leather
textures, brass rivets, wood grain. The value is in the affordance the
physical object suggests, not in reproducing its material, and
photorealism collides with the visual grammar of ADR-0006.

Consequences: this document does not enumerate which surface maps to
which object. The mapping lives in the code — a surface exists when it
is written, and its metaphor is chosen at the point it is written,
revised through the fast asset-edit loop (ADR-0005). A candidate
surface that cannot be described as "you interact with it the way you
interact with X" is not yet ready to ship; that description is the
design brief and the acceptance test at once. Adherence, like Geist
adherence, is expected by default — a surface without a clear physical
metaphor is a defect.

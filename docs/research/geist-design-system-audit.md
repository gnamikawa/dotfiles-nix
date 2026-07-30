# Geist design system audit of `constants/`

Research for [issue #46](https://github.com/gnamikawa/dotfiles-nix/issues/46)
(part of the AGS v3 migration map, #30). Investigated 2026-07-30 against
primary sources only: <https://vercel.com/geist> and the stylesheets
vercel.com itself serves, the `vercel/geist-font` repository, the npm
registry, GTK's own source and `docs/reference/gtk/css-properties.md` at tags
`4.22.4` and `4.20.3`, and this repo's `constants/`, `flake.lock` and assets.

Establishes what is true. Deliberately changes nothing: `constants/` is
untouched by this note, per the issue.

## TL;DR

- **`theme.nix`'s role vocabulary is Geist's own, verbatim.** All ten steps
  agree — 100 default background through 1000 primary text — and so does the
  `background` 100/200 default/secondary pair. No drift. The one liberty is
  that `colorVariantGenerator` applies the legend to all eight scales where
  Geist states it once, on gray.
- **`palette.nix` is a faithful hex transcription of Geist's *dark* theme,
  with exactly one real error.** 81 of 82 values land on Geist's published
  dark tokens. **purple 200 (`#432155`) holds purple 300's colour** — Geist's
  purple 200 is markedly darker and less saturated.
- **The anomalies that looked like typos are Geist's own data.** Gray's
  non-monotonic 600–900, red 600 == 700, and purple 600 == 700 are all
  published exactly that way in the dark theme.
- **Geist specifies far more than colour, and `constants/` has none of it**:
  a 4px spacing scale, four type families by px size, radii tied to
  elevation (6/12/16), a 20-token shadow family, a focus ring, and two
  motion durations with one easing curve.
- **GTK CSS supports real `var()` custom properties** (since 4.16), so a
  generated token sheet can be a variable sheet rather than textual
  inlining. `@define-color` is deprecated in favour of exactly that.
- **This repo builds GTK 4.20.3, not 4.22.4.** The audit target was wrong.
  Two things the map may want are 4.22-only: `backdrop-filter` and
  `prefers-reduced-motion`.
- **The strongest available compliance check is "no colour literal outside
  `constants/`" — and it fails today**, in one surface that is being deleted
  and one that is not.

---

## 1. Where Geist is actually published

There is no first-party machine-readable Geist token artifact.

- The `geist` npm package is the **typeface only** — the flat file list for
  `geist@1.7.2` is `font.js`, `sans.js`, `mono.js`, `pixel.js`, `package.json`
  and font binaries. Zero `.css` files, zero custom properties.
  <https://data.jsdelivr.com/v1/packages/npm/geist@1.7.2?structure=flat>
- There is no `@vercel/geist` on npm. A registry search returns the font
  package, community font mirrors (`@fontsource*`, `non.geist`) and the
  unrelated community `@geist-ui/*`.
  <https://registry.npmjs.org/-/v1/search?text=geist&size=25>
- <https://vercel.com/geist/colors> renders its swatches from CSS custom
  properties and prints **no hex values at all**.

So the only first-party source of values is vercel.com's own served CSS,
loaded by the Geist docs pages:

- <https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/02y9t7j2e779d.css>
- <https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/328y7_b581oob.css>
- <https://vercel.com/vc-ap-b3331f/_next/static/immutable/chunks/2vbovprnb0zdq.css>

Three namespaces coexist in that bundle: `--ds-*` (current Geist),
`--geist-*` (older primitives that `--ds-*` still builds on), and `--tw-*` /
`--text-*` / `--spacing` / `--ease-*` (Tailwind v4 defaults, **not** Geist —
excluded from everything below).

**That URL shape matters for §5.** The paths are content-hashed and
`immutable`; they change whenever Vercel redeploys. There is nothing to pin
and no version to cite. Any claim of the form "`constants/` matches Geist" is
a claim about a scrape on a date, not against a stable artifact.

### Two colour token generations, one of them dead

`02y9t7j2e779d.css` carries both:

- **Generation L (legacy)** — `.dark,.dark-theme,.invert-theme{--ds-background-100:#000;…}`,
  literal hexes, with a `@supports (color:lab(…))` twin.
- **Generation H (current)** — `:root,:host,.dark,…{--ds-gray-100:hsla(var(--ds-gray-100-value), 1);…}`
  indirecting onto integer-HSL `--ds-*-value` tokens, with a
  `@media (color-gamut:p3)` oklch twin.

Equal specificity, H declared later, so **H wins on an sRGB display**. They
are genuinely different palettes — dark `--ds-red-600` is `#f32e40` in L and
`hsl(358, 75%, 59%)` = `#E5484D` in H. `palette.nix` matches **H**, the one
that renders.

---

## 2. Does `theme.nix`'s role vocabulary match Geist's step meanings?

Yes — completely. Source: the "Color 1..Color 10" legend block in the raw HTML
of <https://vercel.com/geist/colors>, where each row pairs `var(--ds-gray-N00)`
with a purpose string.

| step | Geist's stated purpose (verbatim) | `constants/theme.nix` |
|---|---|---|
| 100 | Default background | `componentBackground.default` |
| 200 | Hover background | `componentBackground.hover` |
| 300 | Active background | `componentBackground.active` |
| 400 | Default border | `border.default` |
| 500 | Hover border | `border.hover` |
| 600 | Active border | `border.active` |
| 700 | High contrast background | `highContrastBackground.default` |
| 800 | Hover high contrast background | `highContrastBackground.hover` |
| 900 | Secondary text and icons | `text.secondary` |
| 1000 | Primary text and icons | `text.primary` |

Ten out of ten. The sub-key names (`default` / `hover` / `active` /
`secondary` / `primary`) are transcriptions of Geist's own words, not
invented shorthand.

The `background` pair likewise: a separate legend block gives
`--ds-background-100` = "Default element background" and
`--ds-background-200` = "Secondary background", which is exactly how
`theme.nix` consumes them as `background.default` / `background.secondary`.
Even the word "secondary" is Geist's.

**One extrapolation, not drift.** `colorVariantGenerator` applies the Color
1..10 legend uniformly to blue, red, amber, green, teal, purple and pink.
Geist attaches the legend once, to the gray ramp. The coloured ramps are
step-aligned by construction so the extrapolation is sound, but the docs page
does not restate it per scale — it is our inference, and worth knowing as
such.

---

## 3. Do `palette.nix`'s hexes match?

81 of 82 do. One is wrong.

**Method.** Generation H publishes **integer HSL triples**, not hex. Comparing
in the hex → HSL direction is lossless (hex carries more precision than an
integer HSL triple); going the other way manufactures ±1/255 noise that is
not real disagreement. So each `palette.nix` hex was converted to integer HSL
and compared against Geist's dark `--ds-*-value`.

- **68 bit-exact.**
- **13 off by exactly one unit in one HSL component** — below the precision
  Geist publishes. These are the same colour. Their near-perfection is itself
  evidence that Geist's HSL triples were *rounded from* the very hexes
  `palette.nix` holds.
- **1 genuine mismatch.**

### The one error: purple 200

`palette.nix` has `"200" = "#432155"`, which converts to `hsl(279, 44%, 23%)`
— bit-exactly Geist's **purple 300**. Geist's dark purple 200 is
`hsl(281, 38%, 16%)`: markedly darker (16% vs 23% lightness) and less
saturated (38% vs 44%). Corroborated by two other representations of the same
token in the same bundle: `oklch(25.91% .0921 314.41)` (generation H, P3) and
`#341142` (generation L).

The neighbouring `"300" = "#422154"` is the same colour with a one-digit
difference in two places, which is what hid the duplication.

**The correct replacement hex is not established** — see UNVERIFIED. The
direction and magnitude of the error are certain; the exact byte is not.

### The three anomalies that are *not* errors

**Gray 600–900 is non-monotonic in Geist itself.** Dark `--ds-gray-*-value`
lightness runs 53 → 56 → **49** → 63 (`#878787`, `#8F8F8F`, `#7D7D7D`,
`#A0A0A0`), and generation L's hex block agrees byte-for-byte on all four.
The dip is explained by §2's semantics: 700/800 are a high-contrast **fill**
pair whose hover goes darker, while 900 is secondary *text* and must jump
back up for legibility. Lightness is monotonic within each role band, not
across the whole ramp.

**red 600 == red 700, and purple 600 == purple 700, in Geist's dark theme.**
`--ds-red-600-value:358, 75%, 59%` and `--ds-red-700-value:358, 75%, 59%` are
identical strings; likewise `--ds-purple-600/700-value:272, 51%, 54%`. The P3
oklch twin collapses them too. This is dark-specific — the light theme
distinguishes both pairs. Only red and purple duplicate; blue, amber, green,
teal and pink all differ at 600 vs 700.

**`background` `#0A0A0A` / `#000000` is right, in the right order.** Dark
`--ds-background-100-value:0, 0%, 4%` → `#0A0A0A` and
`--ds-background-200-value:0, 0%, 0%` → `#000000`. (The dead generation-L
block sets both to `#000`; it is overridden, so `palette.nix` matches what
actually renders.)

### `palette.nix` is dark-theme-only, confirmed

Geist's light block has gray 100 `#f2f2f2` … 1000 `#171717` and background
`#FFFFFF` / `#FAFAFA`. None of those values appear in `palette.nix`. All 82
entries sit on the dark block, with no mixing. There is no light theme in
`constants/` and nothing pretending to be one.

---

## 4. What Geist specifies beyond colour

All values verbatim from the `:root,:host` rule in `02y9t7j2e779d.css` unless
noted. **None of this exists in `constants/` today** — `constants/` is
`palette.nix` (colour) plus `theme.nix` (colour roles plus a terminal
palette), and nothing else.

### Spacing — a 4px base scale

`--geist-space` 4px, and named multiples: `2x` 8, `3x` 12, `4x` 16, `6x` 24,
`8x` 32, `10x` 40, `16x` 64, `24x` 96, `32x` 128, `48x` 192, `64x` 256.
Deliberately **not** every multiple — 5x, 7x, 9x, 12x, 20x do not exist. Most
steps have a `*-negative` twin (3x, 6x and 10x do not).

Gaps: `--geist-gap` 24px, `-half` 12px, `-quarter` 8px, `-double` 40px,
`-section` 32px.

Control heights, which double as the `--ds-size-*` scale:
`small` 32px, `medium` 36px, `large` 40px.

### Type — four families, named by px size

Published as **utility classes**, not custom properties. Root font-size is
16px. Only three weights are tokenised (`--font-weight-normal` 400,
`medium` 500, `semibold` 600) even though the fonts ship a 100–900 axis.

- **Headings**, weight 600, negative tracking:
  14/20px (-0.28), 16/24 (-0.32), 20/26 (-0.40), 24/32 (-0.96), 32/40
  (-1.28), 40/48 (-2.40), 48/56 (-2.88), 56/56 (-3.36), 64/64 (-3.84),
  72/72 (-4.32). Tracking is proportional in three regimes: -2% up to 20px,
  -4% at 24 and 32, -6% from 40 up.
- **Copy** (body), weight 400, no tracking: 13/18, 14/20, 16/24, 18/28,
  20/36, 24/36. Mono variants at 13 and 14.
- **Labels**, weight 400: 12/16, 13/16, 14/20, 16/20, 18/20, 20/32. Mono
  variants at 12, 13, 14.
- **Buttons**, weight 500: 12/16, 14/20, 16/20.

`<strong>` is weight 500 throughout — 900 inside a heading, 1000 inside copy.

Families: `--font-sans` is `"Geist", "Inter", -apple-system, …`;
`--font-mono` is `"Geist Mono", Menlo, Monaco, …`. Globally on `html`:
`font-feature-settings: "rlig" 1, "calt" 0, "ss11" 1` — required ligatures
on, **contextual alternates off**, stylistic set 11 on — plus
`text-rendering: optimizelegibility` and `font-synthesis: none`.

Three families exist: Geist, Geist Mono, Geist Pixel. Sans and Mono are
single-`wght`-axis 100–900 with a separate italic file.
<https://raw.githubusercontent.com/vercel/geist-font/main/sources/config-Geist.yaml>

### Radii — two tokens, three effective values

Only `--geist-radius: 6px` and `--geist-marketing-radius: 8px` exist as
custom properties; there is no `--ds-radius-*` family. But the **materials**
classes (<https://vercel.com/geist/materials>) pin radius per elevation:
6px for `base`/`small`/`tooltip`, 12px for `medium`/`large`/`menu`/`modal`,
16px for `fullscreen`. So the real radius scale is **6 / 12 / 16, tied to
elevation** — a rule, not a free choice.

### Shadows — a 20-token family, and it is theme-scoped

Composed from `--ds-shadow-border-base` (`0 0 0 1px #00000014` light,
`0 0 0 1px #ffffff25` dark) plus a size ramp `2xs`/`xs`/`small`/`medium`/
`large`/`xl`/`2xl`, then semantic composites `-tooltip`, `-menu`, `-modal`,
`-modal-elevated`, `-fullscreen`, and `-border-{small,medium,large}`.

Dark overrides exactly six: `-border-base`, `-border-inset`, `-2xs`, `-xs`,
`-small`, `-medium`, `-modal-elevated`. Everything else keeps its light
value, inheriting the new `-border-base` through the composites.

Note that `--ds-shadow-modal-elevated` (dark) and the focus ring both
reference **`--ds-gray-alpha-600`** — an alpha scale that `palette.nix` does
not have. That is a real gap, though a derivable one.

### Focus ring

`--ds-focus-ring: 0 0 0 2px var(--ds-background-100), 0 0 0 4px var(--ds-focus-color)`,
where `--ds-focus-color` is `--ds-blue-700` light and **`--ds-blue-900` dark**.
Also `--ds-focus-ring-outline: 2px solid var(--ds-focus-color)` and
`--ds-focus-border`.

### Motion — small and specific

```
--ds-motion-timing-swift:     cubic-bezier(.175, .885, .32, 1.1)
--ds-motion-overlay-timing:   var(--ds-motion-timing-swift)
--ds-motion-overlay-duration: .3s
--ds-motion-overlay-scale:    .96
--ds-motion-popover-timing:   var(--ds-motion-timing-swift)
--ds-motion-popover-duration: .2s
--ds-overlay-backdrop-color:   var(--ds-gray-100)
--ds-overlay-backdrop-opacity: .8
```

One curve, and it **overshoots** (final control point y = 1.1) — a slight
back-out spring. Two durations: 0.3s for overlays, 0.2s for popovers.

### What Geist publishes that a shell should ignore

`--ds-page-width` 1400px, `--geist-page-width` 1200px, `--header-height` 64px,
`--footer-height` 79px — web page furniture. And the z-index scale
(`--ds-z-drawer` 200 … `--ds-z-tooltip` 99999) is meaningless in GTK, which
has no `z-index`; surface ordering is a layer-shell property.

---

## 5. What is missing for a shell, and what shape it takes

### The gap is wider than `constants/`

The AGS project is `assets/home/.config/ags/app.ts` plus `tsconfig.json` —
fourteen lines that deliberately open no window
([#33](https://github.com/gnamikawa/dotfiles-nix/issues/33)). **There is no
stylesheet, and no styling entry point.** So "extend `constants/`" is only
half the work; the other half is that nothing yet carries tokens from Nix
into the shell, which is what
[#39](https://github.com/gnamikawa/dotfiles-nix/issues/39) exists to decide.

### What a bar, notifications, launcher, OSD and action hub need

Every family in §4 except page widths and z-index:

| need | Geist has it | `constants/` has it |
|---|---|---|
| colour steps + roles | yes | **yes** (§2, §3) |
| alpha scale (`--ds-gray-alpha-*`) | yes | no — needed by shadow + focus tokens |
| spacing (padding, gaps between bar modules) | 4px scale | no |
| control heights (bar height, button height) | 32/36/40 | no |
| type (bar labels, notification body/title) | label/copy/heading by px | no |
| font family + feature settings | `--font-sans`, `ss11`/`calt` | no |
| radii (notification card, launcher, popovers) | 6/12/16 by elevation | no |
| shadows (every floating surface) | 20 tokens, dark-scoped | no |
| focus ring (launcher is keyboard-driven) | yes, dark-specific colour | no |
| motion (OSD fade, popover open) | 2 durations, 1 curve | no |

The focus ring is the sharpest of these: the launcher is driven entirely by
keyboard, and Geist's focus colour differs between themes, so it cannot be
derived by guessing.

### The shape that matches how `constants/` already works

`constants/` already draws the right line: `palette.nix` is a flat literal
transcription of upstream with no interpretation, and `theme.nix` is the
semantic layer that names roles on top of it. That split is what made §2 and
§3 separable questions and it should be preserved, not flattened.

So: **sibling primitive files per token family, one semantic layer.**
`space.nix`, `type.nix`, `radius.nix`, `shadow.nix`, `motion.nix` alongside
`palette.nix` — each a literal transcription of the values in §4, each dark
where Geist is theme-scoped (matching `palette.nix`'s existing dark-only
convention) — with `theme.nix` continuing to own the role naming, including
the material→radius rule and the elevation→shadow rule, which are the parts
that carry Geist's judgement rather than its numbers.

Two things not to do:

- **Don't port the z-index scale or page widths.** GTK has neither concept
  (§6); transcribing them creates tokens that can only mislead.
- **Don't convert Geist's `rem` values naively.** The `--geist-form-*` family
  is in `rem`, and `rem` does not mean what it means on the web in GTK (§6).
  Transcribe those as px.

This is a proposal for the downstream ticket, not a decision — changing
`constants/` is explicitly out of scope here.

---

## 6. What "following Geist" can be checked against

ADR-0006 asserts that "a surface that diverges from Geist is a defect" and
that "hand-rolling from one palette attrset is the mechanism that makes unity
checkable". Three distinct things are checkable, with very different costs.

### (a) Transcription fidelity — mechanical, but there is nothing to pin

This audit is the check: convert each `constants/` value and diff it against
Geist's served tokens. It works — it found the purple 200 error. But §1
establishes there is no versioned Geist artifact, only content-hashed
`immutable` URLs that change on every Vercel redeploy. So this check cannot
be automated against upstream; it is a re-scrape, and it silently becomes a
diff against a *different* Geist each time.

The way to make it checkable is to **commit the extracted token table as the
pinned reference** — this note is the first such snapshot, dated. Then drift
is a diff against a recorded snapshot with a date on it, and re-scraping is a
deliberate act that updates the snapshot, not an invisible baseline shift.

### (b) Single-source usage — mechanical, cheap, and failing today

"No colour literal outside `constants/`" is a grep. It is the check ADR-0006
actually names, and it is the only one that can run in CI. Current state:

- **`assets/home/.config/waybar/theme.css`** is catppuccin mocha in full —
  26 `@define-color` declarations (`rosewater #f5e0dc` … `crust #11111b`)
  plus semantic aliases, i.e. wholesale adoption of the palette ADR-0006
  explicitly rejected. That surface is slated for deletion, so it resolves
  itself.
- **`assets/home/.config/hypr/hyprlock.conf:22-26`** carries catppuccin
  macchiato values — `rgb(202, 211, 245)`, `rgb(91, 96, 120)`,
  `rgb(24, 25, 38)`, and `<span foreground="##cad3f5">`. hyprlock is **Out of
  scope** on the map, so unlike waybar this divergence does not resolve
  itself. It is a standing counterexample to "divergence is a defect" in a
  surface nobody is deleting.
- **`assets/home/.config/hypr/binds.conf:18-19`** has
  `slurp -b#00000000 -c#ffffffff -s#00556655` — arguably tool arguments
  rather than theme tokens, but a colour-literal grep will flag them, so the
  rule needs a stated position on them either way.

Consumers of `constants/` today, for reference: `flake.nix:49` imports it and
passes it at `:82`/`:103`; `modules/yazi.nix` (~90 references),
`modules/kitty.nix` (the 16-colour terminal palette),
`modules/hyprland.nix:22-23`, `modules/mako.nix:25-49`.

### (c) Role compliance — structural, if `#39` chooses to make it so

Geist assigns meaning per step (§2): a border takes 400/500/600, text takes
900/1000. Whether a surface honours that is normally only visible to review.
But it becomes **structural** if the token surface exposed to the shell is
`theme.nix`'s roles and *not* raw `palette.nix` steps — then a wrong step is
unspellable rather than merely wrong.

That is exactly the question [#39](https://github.com/gnamikawa/dotfiles-nix/issues/39)
withdrew pending this audit. This audit's answer to it: the role vocabulary
is trustworthy — it is Geist's own words, ten for ten — so withholding
`palette.nix` costs nothing in fidelity and buys a compliance guarantee.

### What is not checkable

Whether a surface *looks* Geist — typographic rhythm, spacing balance,
whether the overshoot curve feels right on an OSD — is not mechanisable. That
belongs to prototype tickets with the human present, not to a check.

---

## 7. What does not transfer to GTK4 CSS

### First: the version in the issue is wrong

The issue names GTK **4.22.4** as the authority. **This repo builds 4.20.3.**
`flake.lock:142-157` pins `nixpkgs` to rev
`549bd84d6279f9852cae6225e372cc67fb91a4c1`; `pkgs/by-name/gt/gtk4/package.nix`
at that rev is `version = "4.20.3"`. The `ags` and `astal` inputs both follow
the top-level `nixpkgs` (`flake.lock:6-8, 26-29`), so AGS builds against the
same GTK, and `modules/gtk.nix` sets only `gtk4.extraConfig` — no override.

Two 4.22-only features are therefore **unavailable**: `backdrop-filter` and
the `prefers-reduced-motion` media feature.

### The good news: `var()` is real

Custom properties and `var()` have full CSS-Variables-1 semantics since GTK
**4.16**, so they work on 4.20.3. Verified from source, not just docs:

- Declarable in **any** ruleset, not only `:root`
  (`gtkcssprovider.c:1287-1332`).
- **Inherited** down the CSS node tree, overridable per subtree
  (`gtkcssstaticstyle.c:860-897`).
- `var()` works **anywhere in a value**, including inside `calc()`, inside
  gradient functions, and **in shorthands** (`gtkcssreferencevalue.c:277-308`,
  `gtkcssprovider.c:1375-1398`).
- Fallbacks work and nest; cycles are detected rather than hanging.

So a generated token sheet can be a genuine variable sheet — one
`:root { --token: value; }` block — rather than textually inlined values.
`@define-color` and `@name` still work but GTK's own docs say to replace them
with `:root` plus custom properties, so the waybar-era idiom should not be
carried forward.

Two traps: an unresolvable `var()` becomes **`unset`** (inherit-or-initial)
plus a warning on stderr, not a dropped declaration — worth wiring a
`GtkCssProvider::parsing-error` handler. And custom properties are untyped
and non-interpolable: there is no `@property`, so a variable cannot be
animated (a property *referencing* one can).

### What Geist expresses that GTK CSS cannot

**Fonts can't ship through CSS.** There is no `@font-face` — GTK's at-rules
are exactly `@import`, `@media`, `@define-color`, `@keyframes`. Geist Sans
and Geist Mono must be installed via fontconfig, i.e. a Nix package, and only
then named in `font-family`.

**The type scale can't be utility classes the way Geist writes it.** GTK has
no pseudo-elements, no attribute selectors, no `:is()`/`:where()`/`:has()`,
and `:not()` takes a single simple selector. A GTK selector is `*`, a node
name, `#name`, `.class`, or a pseudo-class — nothing else parses. So each
Geist type class becomes a style class attached from GJS
(`widget.add_css_class(…)`), and every widget's internal node names
(`scale > trough > slider`) become part of the styling contract.

**The spacing scale can't drive layout.** There is no `display`, `position`,
`z-index`, `flex-*`, `grid-*`, `gap`, `align-items` or `justify-content`.
GTK's only CSS layout knob is `border-spacing`. Spacing reaches the UI
through `margin`/`padding`/`border-spacing` and through GJS widget
properties (`spacing`, `halign`, `hexpand`). Nor is there `width`/`height`/
`max-width` — only `min-width`/`min-height`, and **those take no
percentages** — so control heights are `min-height` plus layout, and page
widths have no expression at all.

**`rem` is a trap.** It is *not* the root font-size. `GTK_CSS_REM` multiplies
by `gtk_css_font_size_get_default_px()`, which reads the `gtk-font-name`
setting (`gtkcssnumbervalue.c:405-408`); setting `font-size` on the root node
does not change it. Likewise `pt`/`in`/`cm`/`mm` convert via `-gtk-dpi`, not
the web's fixed 96dpi. **Use px.**

**Rounded corners don't clip children.** There is no `overflow` property in
GTK CSS. `border-radius` is fully supported (1-4 values plus the elliptical
`/` form) but clipping is a widget property: `widget.overflow =
Gtk.Overflow.HIDDEN`, which pushes a rounded clip on the padding box
(`gtkwidget.c:12131-12136`).

**Frosted glass isn't available on 4.20.3.** No `backdrop-filter`. `filter:
blur()` blurs the widget's *own* content, not what is behind it, and
`opacity` fades text along with the surface. Translucency has to be
`background-color: rgba(…)` with the compositor blurring the layer (Hyprland
`blurls`) — a compositor concern, not CSS.

**A reduced-motion kill switch has to come from outside CSS** on 4.20.3,
since `prefers-reduced-motion` is unqueryable there. `@media` does work
(since 4.20) for `prefers-color-scheme` and `prefers-contrast`, but discrete
ident matching only — no `min-width`, no media types.

Also absent, each verified by absence from both registration tables:
`text-align`, `white-space`, `text-overflow`/ellipsis and `word-break`
(GtkLabel properties instead); `cursor`, `content`, `visibility`,
`pointer-events`, `user-select`, `accent-color`, `scrollbar-*`; `clip-path`,
`mask`, `mix-blend-mode`; CSS nesting, `@supports`, `@layer`, `@container`.

### What transfers cleanly — more than expected

- **The entire shadow family, verbatim.** `box-shadow` supports `inset`,
  spread, and comma-separated lists up to 64 shadows. Geist's deepest
  composite is five.
- **`--ds-motion-timing-swift` verbatim** — `cubic-bezier()` is supported
  exactly, overshoot included. (But no `linear()` easing and no `jump-*` step
  positions.)
- **`line-height`** as its own declaration (number, `%` or length, since
  4.6). Not via the `font` shorthand, which rejects the `14px/1.4` form. And
  it is a Pango text attribute — it will not space non-text children.
- **`letter-spacing`**, length only — no `normal`, no `%`. Geist's tracking is
  in px, so it transfers directly.
- **`font-feature-settings`**, so `"rlig" 1, "calt" 0, "ss11" 1` transfers
  exactly.
- **Colour functions beyond Geist's needs**: `rgb`/`rgba`/`hsl` legacy and
  modern, `hwb`, `oklab`, `oklch`, `color()`, `color-mix()`, relative colours,
  `calc()` inside colours. The missing `--ds-gray-alpha-*` scale (§4) is
  derivable with `color-mix()` rather than needing transcription.
- **`calc()` plus a large math set**: `min max clamp round mod rem abs sign
  hypot pow sqrt exp log` and the trig functions.
- **`transition`, `animation` and `@keyframes`**, over 58 animatable
  properties including `color`, `background-color`, `opacity`, `filter`,
  `box-shadow`, all four `border-*-radius`, `margin-*`, `padding-*`,
  `min-width`/`min-height` and `transform`. Transitions fire on CSS node
  state change — `:hover`, `:checked`, `:backdrop` — or on style classes
  added from GJS.
- **`:root` matches the CSS node of each toplevel**
  (`gtkcssselector.c:906-910`). In an AGS shell every surface — bar,
  notification, launcher, OSD, greeter — is its own toplevel, so a single
  `:root { --tokens }` block reaches all of them.

---

## UNVERIFIED

1. **The exact sRGB hex for Geist's dark `--ds-purple-200`.** Geist publishes
   only `hsl(281, 38%, 16%)`; reconstruction gives `#2E1938`, but since that
   HSL was itself rounded from an unpublished hex, it may be off by 1/255 per
   channel. Exhausted: the docs HTML (no hexes at all), the npm package
   (fonts only), an npm registry search (no first-party token package), and
   all three CSS chunks (only the dead generation-L `#341142`, the P3-only
   `oklch(25.91% .0921 314.41)`, and the HSL triple).
2. **Which colour token generation Vercel considers deprecated.** Established
   which wins the cascade *today* (H, by declaration order — and H is what
   `palette.nix` matches), but found no first-party statement. If the load
   order flips, the effective palette changes wholesale.
3. **No browser was run.** Cascade precedence is reasoned from the served CSS
   text and `<head>` order, not from a computed-style readout.
4. **P3 / wide-gamut values were not diffed step by step.** `palette.nix` is
   sRGB hex and cannot express P3, so this is out of scope rather than
   unreachable.
5. **The GTK audit read 4.22.4 sources throughout.** The two deltas that
   looked risky (`backdrop-filter`, `prefers-reduced-motion`) were diffed
   against 4.20.3 and are reported above. Every other property/parser was
   **not** diffed between the tags, so something listed as "OK" may be a
   4.21/4.22 addition. Anything load-bearing and absent from the 4.20 docs
   should be re-checked against the 4.20.3 tree.
6. **The GTK version is inferred from `flake.lock`, not evaluated.** No
   `nix eval` or build was run, and it was not checked whether another input
   pulls a second nixpkgs supplying a different gtk4 to some derivation.
7. **Geist's full stylistic-set list.** `ss11` is switched on globally and
   `ss01`/`ss08` glyph suffixes appear in the repo's fontspector reports, so
   at least those three exist. What each set does is in the binaries' GSUB
   table; no first-party page enumerates them.
8. **Geist Pixel's `ELSH` axis range** (min/max/default) is only in the
   binary `fvar` table. Irrelevant to the shell, noted for completeness.
9. **`var()` inside `@define-color`** is asserted unsupported from the parse
   path (`gtk_css_color_value_parse` is called directly with no
   `has_references` branch), not from docs or a test. Low stakes —
   `@define-color` is deprecated.
10. **Whether GTK's `box-shadow` blur radius is visually equivalent to the
    web's** for the same length. GTK stores a standard deviation internally;
    Geist's shadow blurs may not land identically. Not tested.
11. **§4's sweep of non-colour tokens is incomplete.** The extraction stopped
    before covering **grid tokens, breakpoints, and any motion tokens beyond
    the `--ds-motion-*` family**. The families reported in §4 (spacing, type,
    radii, shadows, focus, motion) were each read to completion and are
    accurate; what is not established is that they are *all* the families
    Geist publishes. Breakpoints and grid are web-layout concepts GTK cannot
    express (§7) so little is likely lost for the shell, but §4 should not be
    treated as an exhaustive inventory. Re-run against
    `02y9t7j2e779d.css` before the downstream `constants/` ticket commits to
    a file layout.
12. **`prefers-reduced-motion`'s value ident is `reduce`, not `reduced`** —
    GTK's docs Notes column says the latter, and matching is literal ident
    comparison, so `reduced` silently never matches. Moot on 4.20.3, where
    the feature is unregistered entirely; relevant if the pin moves to 4.22.

# Geist as the OS design system

All OS theming follows Vercel's Geist design system; `constants/palette.nix`
encodes its color scales, and every themed surface — window chrome, bars,
GTK/Qt applications, terminals, notifications, lock screens, input methods —
is measured against it. Adherence is expected by default: once the unified
theming work lands, a surface that diverges from Geist is a defect, and a
new surface must comply on arrival.

Rejected: catppuccin, despite four variant stylesheets having shipped in
the waybar tree (now slated for deletion). Catppuccin's advantage is real —
prebuilt ports exist for nearly every terminal, GTK theme, and application,
where Geist has none and every surface must be hand-rolled from the palette.
It lost anyway: Geist's restrained, monochrome-leaning language matches the
intended look of the desktop, and a design system is being adopted here as
a *standard to enforce*, not a skin to install — hand-rolling from one
palette attrset is the mechanism that makes unity checkable.

Consequence: prebuilt third-party themes are never adopted wholesale, even
when convenient; they may only be mined for implementation technique. The
cost is accepted deliberately — it is the price of one coherent system
rather than a collage of adjacent-but-different ports.

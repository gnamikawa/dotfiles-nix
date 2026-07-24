# Hyprland as the compositor

The compositor is Hyprland; sway is retired. The decision is bundled into
the Rewrite (the "Era change" milestone: Hyprland + assets-by-default +
Geist) — the assets-by-default migration of the compositor config
(ADR-0005) happens once, in Hyprland syntax, rather than migrating sway
config and converting later. No trial phase: the ecosystem was already
half-adopted (hyprlock), and the era's requirements map onto Hyprland
primitives — special workspaces are the Etc space nearly verbatim, window
pinning serves satellite windows, and HyprMon provides the keyboard-first
visual monitor arranger that the wlroots/sway ecosystem lacks. The
animation and effects system supplies the visual richness the Geist-era
overhaul (ADR-0006) wants and sway deliberately refuses to provide.

Rejected: staying on sway. Its stability reputation and minimalism were
the founding choice, but minimalism turned out to mean building every
desired behavior from scratch while still fighting regressions (the
wlroots 0.19 syncobj assertion forced a `WLR_DRM_NO_ATOMIC` workaround;
an output-power regression blanked the Cintiq). Known costs accepted:
Hyprland's NVIDIA posture is historically weaker (GEN-DPC carries the
nvidia bundle; migration includes the usual env-var work), and its
release cadence is faster and less conservative than sway's.

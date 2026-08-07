# First-principles information architecture for the desktop UI

The durable reference for the whole desktop UI — Firefox, GTK, Qt,
Hyprland, AGS. Every surface that exists, and every surface added later,
consults this document. Downstream tickets — surface inventory
([#99](https://github.com/gnamikawa/dotfiles-nix/issues/99)), per-surface
treatments, perimeter mechanics, the reforming pass against map
[#30](https://github.com/gnamikawa/dotfiles-nix/issues/30)'s code state —
cite it rather than re-derive it. Visual decisions are downstream and
belong in the companion doc (`docs/design/visual-language.md`,
[#98](https://github.com/gnamikawa/dotfiles-nix/issues/98)).

Produced under map
[#95](https://github.com/gnamikawa/dotfiles-nix/issues/95) from the
substrate in `docs/research/ia-three-circles.md`. Where a section header
below quotes the map's Notes verbatim, that phrasing is load-bearing —
the wording was pinned during grilling and is not shorthand.

## The load-bearing rule

**Every surface is defined by the response it requires.** Default is
nothing; interruption is earned. Before any visual design begins,
before any layout is chosen, before any widget is placed, the surface is
asked *what does the user need to do because of this?* — and if the
answer is *nothing*, the surface does not exist in the shell.

This is EEMUA 191 rationalization (Engineering Equipment and Materials
Users' Association, *Alarm Systems*) applied to consumer UI. The
industrial-alarm discipline states that a signal is an alarm only if it
requires operator response; a control-room screen crowded with
non-alarms is a failure mode with a name — alarm flood — and the
remedy is to remove signals, not to organise them differently. The
consumer equivalent is a shell full of numbers, icons, and pills that
nobody acts on: bandwidth counters, workspace pips, cryptocurrency
tickers, weather widgets. Each looks harmless individually and forms a
tax on attention collectively.

Attention is the scarce budget (Simon, 1971, *Designing Organizations
for an Information-Rich World*): "a wealth of information creates a
poverty of attention." Every visible thing is a withdrawal. A surface
justifies its withdrawal by naming the response it requires; nothing
else earns its pixels.

Source: *"The Lost Discipline of the Alarm"* (Interface Studies /
Saleh, YouTube `Ira28fgSF7M`).

## The four states

Every signal the shell can carry lands in exactly one of four states.
Each has a passing criterion; a signal that fails its criterion moves
down (toward nothing) rather than being redesigned in place.

### Nothing

The default. Canvas plus whatever work is focused. **Focused work IS the
screen.** The shell renders nothing of its own; chrome that would appear
in this state is deleted, not hidden. A signal reaches Nothing when it
fails the criteria for the other three.

### Summoned

Hidden until triggered → shown → hidden. Trigger classes:

- **Explicit** — hotkey, gesture, on-tablet button. User asked.
- **Contextual** — modifier hold, drawer pull, chord. User asked
  ambiguously; the shell offers.
- **System-initiated** — presented in response to user action elsewhere
  (a completed download, an opened application). Never in response to
  time passing alone.

A signal reaches Summoned when its answer is genuinely useful *when
asked* but carries no cost if never asked. Clock, wifi state, media
transport, calendar peek, launcher, notes search, todos list — all
summoned; none earn permanent chrome.

### Ambient

Persistent, calm, at the edge. Very high bar. A signal qualifies for
Ambient only if **all four** hold:

1. It changes continuously or unpredictably.
2. Missing a change carries real cost.
3. No other device in view answers the same question.
4. Summon-on-demand would arrive too late.

The four together — not any subset. Something that changes often but
carries no cost when missed fails (2); something a phone answers as
well fails (3); something the user can pull on demand when they wonder
fails (4). Under the four-part test the shortlist stays small.

**Accepted shortlist:** the safety class (mic / camera / screen-share /
recording active), an active countdown (meeting / build / timer),
battery critical.

**Failing candidates** (each fails ≥1 criterion and is summoned
cleanly instead): clock (fails 4 — pull to check), wifi state (fails 4),
bluetooth (fails 4), workspace (fails 2 — the compositor bind confirms
it), focused window (fails 2 — the window itself confirms it), IME
(fails 4), media playing (fails 2), network SSID (fails 4), CPU / RAM
(fails 4 unless a specific alert is defined, in which case it's
interruptive).

The workspaces bar on GEN-DPC (`bar/Bar.tsx`) is a known exception in
transition — workspace state fails the ambient qualifier under this
rule and belongs in Summoned or on the compositor's own overlay. The
surface inventory ticket decides its final home.

### Interruptive

Earned; requires action. Three channels below. A signal reaches
Interruptive only when the response cannot wait for a summon.

## The three interruptive channels

Interruption splits by *origin*, not by app or urgency slider. The
splits are structural — treatment differs enough that mixing them
degrades all three.

### Emergency

Machine emergencies — compositor died, disk hard-fail, unexpected
outbound network activity, battery hard threshold. Distinct treatment;
action-required; blocks until acknowledged. Rare by design — power comes
from rarity. On GEN-DPC the reserved edge on the Cintiq plus the desktop
speakers carries these; on laptop the reserved-edge equivalent is a
laptop-friendly overlay the surface inventory ticket names.

An emergency that fires often is a rationalization failure, not a UI
problem. The fix is to demote (into a regular notification or a
summonable status) rather than to soften the treatment.

### Regular notification

Non-urgent informational — build done, download complete, package
update available. Toast-style: appears, dwells, decays. Sound optional,
motion small enough not to steal gaze — the user's ADHD-I profile
includes gaze-bolt on fast peripheral motion, so peripheral animation is
subtractive.

Content is the whole message. Regular notifications do **not** link
back to an app — if the user needs the app, they open it.

### Human presence ping

Discord DM, Outlook DM, incoming call. **Sound only, no visual.** The
*fact* of contact interrupts; the content is summoned by opening the
originating app. This is Weiser-style calm-technology re-encoding
(Weiser & Brown, 1996, *The Coming Age of Calm Technology*): move the
representation to the periphery when the user isn't ready to receive,
keep the affordance in the centre when the user turns to it.

Splitting signal from content also defuses the visual-toast failure mode
where every message must be judged in a two-second window. The judgment
becomes: *am I taking this now?* — a decision the sound suffices for.

### Signal decoupled from content

The channel is not the message. For humans, the sound is the signal;
the app is the content. For machines (regular notifications) the toast
carries both. For emergencies the reserved-edge treatment is both. This
is a design commitment, not a fallback — the user has confirmed
(three-circles §3.3) that toast bodies during hyperfocus are
subtractive; the sound cleanly requests attention without stealing it.

## Nothing persists in the shell

No logs, no inbox, no notification history, no dashboard of past state.
Ephemeral or summoned-fresh. If the shell notification passed and the
user did not act, the shell does not remember it. The originating app
remembers (Discord's own notification history, `journalctl -u` for
services, package-manager logs for installs). The shell is not a
long-term store.

This is the anti-guilt corollary of the load-bearing rule. If attention
was the scarce thing at the moment, missing something wasn't the
failure — it was the correct behaviour. A persistent notification centre
is a mechanism for punishing the user for their own attention economy;
the shell does not carry that mechanism.

Long-term storage of things the user *cares* about (habits, journal,
capture, calendar) belongs in the sqlite life-database plus Outlook
(three-circles §3.5, axes 2 and 14) — user-summoned, structured,
outside the shell.

## Perimeter senders: per-app hybrid classification

The video's structural argument (senders ≠ receivers) has a weaker form
on a single-user desktop but is still present at the perimeter — every
process that can produce a notification is a sender whose incentives are
not the user's. Firefox, Slack, Discord, systemd, cron, browser
extensions, Steam, whatever else.

Classification is **per-app default plus per-signal override**. Each
perimeter sender enters with a channel default (Discord → human
presence ping; systemd → regular notification; disk-full daemon →
emergency); individual signals can override (Discord's own "message
sent" toast → suppressed; systemd's cert-expiry warning → emergency).
The mechanism the surface inventory ticket names must express both.

The three levers named in the source video apply and are recorded here
for downstream tickets:

- **Admission control at send time** — a sender that violates the
  channel discipline can be muted at the perimeter, not routed to a
  quieter panel.
- **Rate limits per sender** — a sender that produces N notifications
  per unit time is capped. Overflow is dropped, not queued.
- **Earned interrupt rights** — a sender that has produced only false
  alarms loses channel privilege until the user restores it.

These are principles the perimeter mechanism must express; the concrete
implementation is downstream. See map's *Not yet specified* → *Perimeter
mechanics*.

## Authorities and how they layer

Three sources govern the desktop UI. Each covers a different layer;
disputes resolve top-down.

### Information Architecture for the Web and Beyond (Rosenfeld / Morville / Arango, 4th ed.)

Methodological upstream. Names the three-circles research pass (Context,
Content, Users) that produced the substrate; provides the
organization / labeling / navigation systems vocabulary the surface
inventory ticket uses; establishes the top-down / bottom-up split for
sitemap work. Local PDF:
`/home/genzo/Documents/Information_Architecture_For_The_Web_And_Beyond_Fourth_Edition.pdf`.

When another authority conflicts with the polar-bear book's methodology,
the methodology wins — the disputed decision is missing a research step,
not a rule.

### "The Lost Discipline of the Alarm" (Interface Studies / Saleh)

Interruption discipline. Provides EEMUA 191 rationalization, the
alarm-flood / nuisance / standing vocabulary, Simon's attention budget,
Weiser's calm-technology framing, and McFarlane's four interruption
modes (immediate / negotiated / mediated / scheduled). Also the three
levers above (admission control at send, per-sender rate limits, earned
interrupt rights). Source: `https://youtu.be/Ira28fgSF7M`.

This authority governs one IA dimension — interruption discipline. It
is not the whole IA. Surface homes, taxonomy, navigation, and content
strategy are the polar-bear book's territory; interruption channels are
Saleh's.

### Refactoring UI (Wathan & Schoger)

Visual authority. Downstream — once the IA has named a surface, RUI
governs its hierarchy, spacing, type, colour, and depth. It does not
name surfaces itself. Local PDF:
`/home/genzo/Documents/Refactoring UI.pdf`. Full extraction and
`geistdesign` cross-reference lives in the companion doc
(`docs/design/visual-language.md`, #98).

When RUI's visual advice contradicts an IA rule, the IA rule wins —
visual polish does not licence a surface into existence.

### Layering summary

Polar-bear book → surface exists and where. Saleh → does it interrupt,
and how. RUI → what it looks like once the first two have settled. Skip
any layer and the answer is under-specified.

## Design posture: laptop-first

**Every design begins on the laptop.** Real-estate is scarce
(GEN-LPC's `eDP-1` at 2560×1440 scale 1.5 is 1707×960 logical), battery
cost of animation matters, lid-close and wake are lifecycle events, and
the single-screen assumption forces disciplined use of chrome. Desktop's
multi-monitor plus Cintiq degrade gracefully *from* this baseline — a
laptop-clean design gains breathing room on the desktop; a
desktop-first design forces the laptop into compromises.

Consequence: **every Cintiq-only surface must have a laptop-friendly
equivalent** (three-circles §3.5, axis 10). The
`drawer` / `Cintiq bento` split in §3.10 obeys this — the drawer is
universal and identical on both hosts so muscle memory transfers; the
bento is bonus real-estate that adds nothing load-bearing.

Consequence: **peripheral animation is disallowed on the laptop** —
gaze-bolt fires there. If a signal needs animation to earn attention on
laptop, it fails the ambient qualifier and belongs in Interruptive.

The Cintiq Pro 22 on GEN-DPC is a permanent ambient dashboard, not a
drawing surface (three-circles §3.10). This is a role reframing from
`CONTEXT.md:129`'s original "drawing on the Cintiq" exemption; the
constitution supersedes.

## Method: start with a feature, not a layout

Refactoring UI ch. 1: don't begin with the frame and fill it in — begin
with the feature and let the frame emerge. Applied to the desktop UI:
the surface inventory (#99) is built by walking the ~85 flows in
three-circles §3.6 and asking, per flow, *where does this happen?* The
answer names a surface; the collection of surfaces is the inventory.

This is the opposite of "shells usually have a top bar, a bottom bar,
and a system tray, so let's decide what goes in each." Starting from
convention imports every convention's failure mode along with the
frame. Starting from the feature exposes what's needed; a bar is one
possible shape, not the starting assumption.

Corollary: **shell surfaces are named after what they do**, not after
where they live. "The drawer" is *a place for actions the user reaches
for on any host*, not "the panel at the bottom" — the definition
survives layout changes. The surface inventory ticket enforces this
naming.

## Reforming stance: relative to map #30

Map [#30](https://github.com/gnamikawa/dotfiles-nix/issues/30) closed
COMPLETED 2026-08-04 with a live shell in master — AGS bar
(workspaces-only), auth screen, session lock, `geistdesign` package,
ADRs 0005–0008. Map #95 is **Reforming**: the #30 code state is
authoritative *Content* (three-circles §2), not authoritative *IA*.
Every decision in master is audited against this constitution; those
that pass stay, those that fail get rework tickets and are replaced —
not defended because they shipped.

This posture is a commitment. It resolves the ambiguity where "we
already have X" becomes an argument for keeping X. Reforming names the
comparison: the current thing versus the IA's answer. If those match,
the current thing stays. If they don't, the current thing is a rework
target.

Explicit reforming targets already named in three-circles §3.12:

- The **AGS bar** grows only the passive next-todo pill, ambient
  countdown, and safety-class row (all primary-only per §3.10).
- The **auth screen** rail audited against the drawer's canonical shape
  under the single-source rule.
- **mako** replaced by an AGS notification surface with three
  sub-channels (regular / human presence / emergency).
- **waybar** replaced on GEN-LPC by a minimal edge strip plus the
  drawer.
- **dmenu** replaced by an AGS launcher with scope extended to games
  and to projects under `~/repositories` (ADR-0008).
- **hyprlock** on GEN-LPC replaced by the AGS locker (already used on
  GEN-DPC) when the reinstall lands.

New surfaces (the drawer, the Cintiq bento, the day-guide surface, the
reserved edge, the yeet-thoughts capture) reach master through the same
per-surface treatment tickets that audit existing surfaces; nothing gets
a shortcut for being new.

## Corollaries the surface inventory (#99) inherits

Recorded so the inventory ticket cites this doc, not the map's Notes,
for these.

- **Single source of truth per signal** (three-circles §3.5, axis 5) —
  never render the same underlying state in two surfaces. Applied
  strictly to the safety-class icons, the ambient countdown, and the
  calendar peek.
- **Silent measurement / no accountability shape** (axis 2) — capture
  everything; surface nothing shaped like a streak, red day, count, or
  scoreboard.
- **Invitation without enforcement** (axis 3) — surface presence is a
  summoning affordance, not an accountability signal. No completion
  checkboxes; Goodhart dissolves because the question isn't asked.
- **Real-world equivalents preferred** (axis 4) — kitchen twist for
  timer, desk-with-bills for object permanence, iPad Action Center for
  the cross-host drawer. Skeuomorphism as interaction metaphor, not as
  decoration.
- **Desk-clutter reinforcement for habits** (axis 6) — habits show as
  visible undone things; presence is the reminder, absence the reward.
- **Legible presence, dormant vs bugged** (axis 7) — anxiety-relief
  surfaces render "nothing to worry about right now" as an active,
  confirmable state, not as absence.
- **Task-inertia handling: per-event opt-in, not per-channel**
  (axis 8) — the shell does not attempt to interrupt hyperfocus by
  default; the user pre-authorises escalation for specific obligations.
  Rare by design; power comes from rarity.
- **No discrete modes** (axis 15) — the IA does not gate behaviour by
  mode. One continuous session; sender-driven interruption discipline
  instead of mode-gating.

## Non-goals

Named to prevent scope drift.

- **Not a visual specification.** RUI extraction lives in the companion
  doc; this document names surfaces and their states, not their colours
  or type.
- **Not a keybinding reference.** Binds appear where they're
  load-bearing to a surface's trigger; the full compositor binds table
  is `assets/home/.config/hypr/binds.conf`.
- **Not an implementation guide.** How AGS, GTK, or Hyprland realise a
  surface belongs in the per-surface treatment ticket or the relevant
  ADR.
- **Not a product roadmap.** Delivery order is the map's business; this
  document names the rules, not the sequence.

## Applying the constitution to a new signal

The routing procedure. Anyone (human or agent) adding a signal to the
desktop UI walks this before touching a widget.

1. **Name the response required.** If none, stop — the signal doesn't
   belong in the shell. Put it in an app or in a log.
2. **Ask whether the response can wait for a summon.** If yes → *Summoned*.
   Name the trigger and the surface (drawer, launcher, overlay).
3. **Ask the four-part ambient qualifier.** If all four hold →
   *Ambient*. Otherwise back to Summoned.
4. **Classify the interruption channel** (emergency / regular / human
   presence). Human-origin defaults to sound-only; machine-origin
   defaults to toast; system-danger defaults to emergency.
5. **Check the single-source rule.** Is this state rendered anywhere
   else? If yes, one of the two loses. The other is deleted.
6. **Check the laptop-first constraint.** Does the surface degrade
   cleanly to `eDP-1` at logical 1707×960 with no peripheral animation?
   If no, redesign.
7. **Cite the sources.** Ambient qualifier → this doc §Ambient. Channel
   → this doc §Three interruptive channels. Visual → visual-language.md
   (#98) plus `geistdesign` tokens.

Skipping any step is a bug in the surface, not in the routing.

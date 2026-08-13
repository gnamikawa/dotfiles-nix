# IA strategy for the desktop UI

The durable reference for the whole desktop UI — Firefox, GTK, Qt,
Hyprland, AGS. Every surface that exists, and every surface added later,
consults this document. Downstream tickets — surface inventory
([#99](https://github.com/gnamikawa/dotfiles-nix/issues/99)), per-surface
treatments, perimeter mechanics, the reforming pass against map
[#30](https://github.com/gnamikawa/dotfiles-nix/issues/30)'s code state —
cite it rather than re-derive it. Visual decisions are downstream — they belong to Design, specifically the
IA style guide deliverable (see `docs/ia/README.md`).

Produced under map
[#95](https://github.com/gnamikawa/dotfiles-nix/issues/95) from the
substrate in `docs/research/ia-three-circles.md`. The document records the
current design position. Earlier map notes began from an almost-empty screen,
but prototyping established that useful passive information is welcome when
its value justifies its footprint.

This document is the **Strategy** artifact of the desktop UI's IA effort.
For the full Research → Strategy → Design → Implementation → Administration
process and where each phase's artifacts live, see `docs/ia/README.md`.

## Terms

Definitions used throughout the rest of this document. Terms that appear
only once are defined at their point of use instead.

- **Signal** — an atomic piece of information or event the user might see
  or hear about: a new DM, a battery-level tick, a completed download, a
  mic-active status. The unit routed by this document.
- **Surface** — a piece of the system UI that presents something to the
  user: a bar, a panel, the notification area, the lock screen, an
  overlay. A signal is routed _to_ a surface. Distinct from the system UI,
  which is the collective term for all surfaces.
- **System UI** — the UI surrounding applications: bars, panels, overlays,
  notifications, launcher, workspace UI, lock screen, drawer, and Cintiq
  dashboard. Does not include the applications themselves.
- **Channel** — a subdivision of the Interruptive state. Three channels
  exist (Emergency / Regular notification / Human presence ping); they
  split by _origin_, described in §The three interruptive channels.
- **Strategy** — this document, and its phase in the RMA process
  (see `docs/ia/README.md`). Named at the phase level so a reader knows
  what belongs here (rules, routing, taxonomies) and what does not
  (visuals, keybindings, implementation).

Personal / user-context terms used later in this document:

- **ADHD-I** — Attention Deficit Hyperactivity Disorder, Inattentive
  presentation. The user's diagnostic profile. Two of its consequences
  are load-bearing for this document: hyperfocus and gaze-bolt.
- **Hyperfocus** — the deep-attention state where breaking focus is
  expensive; interruption discipline is calibrated around not paying that
  cost casually.
- **Gaze-bolt** — the involuntary snap of visual attention toward fast
  peripheral motion. The reason peripheral animation is disallowed on
  the laptop.
- **Peripheral animation** — animation near the edges of the visual field
  (e.g., a toast sliding in from a screen corner while the user is
  fixating on the centre).

## The load-bearing rule

**Every surface must name its purpose and justify its attention cost.** A
surface may answer a summon, provide useful passive context, or request a
response. Passive information is allowed to remain on screen; it does not
need to manufacture an action to justify its existence. Interruption is
still earned.

Before visual design begins, the surface is asked: _what purpose does this
serve, how often is that purpose useful, and what attention does it consume?_
A passive surface is legitimate when its repeated at-a-glance value is worth
its permanent footprint. A surface with no useful purpose still does not
exist merely because system UIs conventionally contain one.

This is EEMUA 191 rationalization (Engineering Equipment and Materials
Users' Association, _Alarm Systems_) applied to consumer UI. The
industrial-alarm discipline states that a signal is an alarm only if it
requires operator response; a control-room screen crowded with
non-alarms is a failure mode with a name — alarm flood — and the
remedy is to remove signals, not to organise them differently. The consumer
equivalent is treating every piece of information as something that must
demand attention. Passive information is not an alarm. It may be present
without asking for action, provided its usefulness outweighs the attention
and space it consumes.

Attention is the scarce budget (Simon, 1971, _Designing Organizations
for an Information-Rich World_): "a wealth of information creates a
poverty of attention." Every visible thing is a withdrawal. Passive
information can earn those pixels through repeated usefulness; an
interruption must additionally justify taking attention now.

Source: _"The Lost Discipline of the Alarm"_ (Interface Studies /
Saleh, YouTube `Ira28fgSF7M`).

## The three states

Every signal the system UI can carry lands in exactly one of three states.
The states describe how a surface relates to attention.

### Summoned

Hidden until triggered → shown → hidden. Trigger classes:

- **Explicit** — hotkey, gesture, on-tablet button. User asked.
- **Contextual** — modifier hold, drawer pull, chord. User asked
  ambiguously; the system UI offers.
- **System-initiated** — presented in response to user action elsewhere
  (a completed download, an opened application). Never in response to
  time passing alone.

A signal reaches Summoned when its answer is useful _when asked_ but does not
need a permanent place. Clock, wifi state, media transport, calendar peek,
launcher, notes search, and todos may be Summoned, but this is no longer their
mandatory classification: downstream surface design may keep useful subsets
passively visible.

### Ambient

Persistent, calm, and available at a glance. Ambient information does not
need to require a response. It earns its place when the user wants its
repeated at-a-glance value and its visual treatment remains quieter than the
focused work.

The following four-part test identifies information that **must not be
summon-only** because hiding it would create real cost. It is not a universal
admission test for all Ambient information. All four must hold:

1. It changes continuously or unpredictably.
2. Missing a change carries real cost.
3. No other device in view answers the same question.
4. Summon-on-demand would arrive too late.

For mandatory Ambient treatment, the four apply together — not as a subset.
Something that changes often but
carries no cost when missed fails (2); something a phone answers as
well fails (3); something the user can pull on demand when they wonder
fails (4). Under the four-part test the shortlist stays small.

**Mandatory Ambient shortlist:** the safety class (mic / camera / screen-share /
recording active), an active countdown (meeting / build / timer),
battery critical.

**Optional Ambient candidates** (each fails ≥1 mandatory criterion and
therefore _can_ be summoned cleanly, but may remain visible by design): clock
(fails 4 — pull to check), wifi state (fails 4),
bluetooth (fails 4), workspace (fails 2 — the compositor bind confirms
it), focused window (fails 2 — the window itself confirms it), IME
(fails 4), media playing (fails 2), network SSID (fails 4), CPU / RAM
(fails 4).

Any Ambient signal with a defined alert threshold has the
threshold-crossing routed to Interruptive, not to the Ambient surface. The
raw indicator stays Ambient; the threshold-crossing is a separate signal,
routed to the channel that fits its origin (battery hard threshold →
Emergency; CPU > X% for Y seconds → Regular notification or Emergency
depending on severity).

The workspaces bar on GEN-DPC (`bar/Bar.tsx`) is a live optional-Ambient
candidate. The surface inventory ticket decides whether its at-a-glance
usefulness justifies the space or whether the compositor overlay already
answers the need well enough.

### Interruptive

Earned; requires action. Three channels below. A signal reaches
Interruptive only when the response cannot wait for a summon.

## The three interruptive channels

The three channels split by _origin_: system-danger events, machine
processes, and human contact. Not by app, not by urgency setting.
Mixing origins degrades all three.

One commitment runs across all three: **the channel is not the message.**
Each channel handles the _signal_ (the fact that something wants attention)
and the _content_ (the message itself) differently:

- Human presence: sound is the signal; the app is the content. The two are
  decoupled.
- Regular notification: the toast is both.
- Emergency: the reserved-edge treatment is both.

Decoupling for human presence is a deliberate commitment, not a fallback
(three-circles §3.3).

### Emergency

Machine emergencies — compositor died, disk hard-fail, unexpected
outbound network activity, battery hard threshold. Distinct treatment;
action-required; blocks until acknowledged. Rare by design — power comes
from rarity. On GEN-DPC the reserved edge on the Cintiq — a strip of the
Cintiq's display designated for emergency signals only — plus the desktop
speakers carries these. On laptop the reserved-edge equivalent is a
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
back to an app — if the user needs the app, they open it. Nor do they
carry action buttons (Reply / Mark done / Dismiss); the toast is a
message, not an interface.

### Human presence ping

Discord DM, Outlook DM, incoming call. **Sound only, no visual.** The
_fact_ of contact interrupts; the content is summoned by opening the
originating app. This is Weiser-style calm-technology re-encoding
(Weiser & Brown, 1996, _The Coming Age of Calm Technology_): move the
representation to the periphery when the user isn't ready to receive,
keep the affordance in the centre when the user turns to it.

Splitting signal from content also defuses the visual-toast failure mode
where every message must be judged in a two-second window. The judgment
becomes: _am I taking this now?_ — a decision the sound suffices for.

## Ephemeral by default

No logs, no inbox, no notification history, no dashboard of past state.
Ephemeral or summoned-fresh. If the system UI notification passed and the
user did not act, the system UI does not remember it. The originating app
remembers (Discord's own notification history, `journalctl -u` for
services, package-manager logs for installs). The system UI is not a
long-term store.

This is the anti-guilt corollary of the load-bearing rule. If attention
was the scarce thing at the moment, missing something wasn't the
failure — it was the correct behaviour. A persistent notification centre
is a mechanism for punishing the user for their own attention economy;
the system UI does not carry that mechanism.

Long-term storage of things the user _cares_ about (habits, journal,
capture, calendar) belongs in the sqlite life-database plus Outlook
(three-circles §3.5, axes 2 and 14) — user-summoned, structured,
outside the system UI.

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
implementation is downstream. See map's _Not yet specified_ → _Perimeter
mechanics_.

## Authorities and how they layer

Three sources govern the desktop UI. Each covers a different layer;
disputes resolve top-down.

### Information Architecture for the Web and Beyond (Rosenfeld / Morville / Arango, 4th ed.)

Methodological upstream — informally, the _polar-bear book_ (from its
cover art). Names the three-circles research pass (Context, Content,
Users) that produced the substrate; provides the organization / labeling /
navigation systems vocabulary the surface inventory ticket uses;
establishes the top-down / bottom-up split for sitemap work.

When another authority conflicts with the polar-bear book's methodology,
the methodology wins — the disputed decision is missing a research step,
not a rule.

### "The Lost Discipline of the Alarm" (Interface Studies / Saleh)

Interruption discipline. Provides EEMUA 191 rationalization, the
alarm-flood / nuisance / standing vocabulary, Simon's attention budget,
Weiser's calm-technology framing, and McFarlane's four interruption modes:

- **Immediate** — deliver the interruption the moment it arrives, regardless
  of what the user is doing.
- **Negotiated** — announce that something wants attention and let the user
  choose when to receive it.
- **Mediated** — route through a broker that decides on the user's behalf
  when the delivery happens.
- **Scheduled** — deliver at a pre-arranged time (batched, digest-style).

Also the three levers above (admission control at send, per-sender rate
limits, earned interrupt rights). Source: `https://youtu.be/Ira28fgSF7M`.

This authority governs one IA dimension — interruption discipline. It
is not the whole IA. Surface homes, taxonomy, navigation, and content
strategy are the polar-bear book's territory; interruption channels are
Saleh's.

### Refactoring UI (Wathan & Schoger)

Visual authority. Downstream — once the IA has named a surface, RUI
governs its hierarchy, spacing, type, colour, and depth. It does not
name surfaces itself. Full extraction and `geistdesign` cross-reference
belongs to Design, specifically the IA style guide.

When RUI's visual advice contradicts an IA rule, the IA rule wins —
visual polish does not licence a surface into existence.

### Layering summary

Polar-bear book → surface exists and where. Saleh → does it interrupt,
and how. RUI → what it looks like once the first two have settled. Skip
any layer and the answer is under-specified.

## Design posture: laptop-first

**Every design begins on the laptop.** Real-estate is scarce
(GEN-LPC's `eDP-1` at 2560×1440 scale 1.5 is 1707×960 logical), lid-close and wake are lifecycle events, and
the single-screen assumption forces disciplined use of chrome. Desktop's
multi-monitor plus Cintiq degrade gracefully _from_ this baseline — a
laptop-clean design gains breathing room on the desktop; a
desktop-first design forces the laptop into compromises.

Consequence: **every Cintiq-only surface must have a laptop-friendly
equivalent** (three-circles §3.5, axis 10). The
`drawer` / `Cintiq bento` split in §3.10 obeys this — the drawer (the
cross-host, keyboard-summoned actions menu) is universal and identical on
both hosts so muscle memory transfers; the bento (the Cintiq-only bonus
composition of ambient panels) adds nothing load-bearing.

Consequence: **peripheral animation is disallowed on the laptop** —
gaze-bolt fires there. If a signal needs animation to earn attention on
laptop, it fails the four-part test and belongs in Interruptive.

The Cintiq Pro 22 on GEN-DPC is a permanent ambient dashboard, not a
drawing surface (three-circles §3.10). This is a role reframing from
`CONTEXT.md:129`'s original "drawing on the Cintiq" exemption; the
strategy supersedes.

## Method: start with a feature, not a layout

Refactoring UI ch. 1: don't begin with the frame and fill it in — begin
with the feature and let the frame emerge. Applied to the desktop UI:
the surface inventory (#99) is built by walking the ~85 flows in
three-circles §3.6 and asking, per flow, _where does this happen?_ The
answer names a surface; the collection of surfaces is the inventory.

This is the opposite of "system UIs usually have a top bar, a bottom bar,
and a system tray, so let's decide what goes in each." Starting from
convention imports every convention's failure mode along with the
frame. Starting from the feature exposes what's needed; a bar is one
possible shape, not the starting assumption.

Corollary: **system UI surfaces are named after what they do**, not after
where they live. "The drawer" is _a place for actions the user reaches
for on any host_, not "the panel at the bottom" — the definition
survives layout changes. The surface inventory ticket enforces this
naming.

## Reforming stance: relative to map #30

Map [#30](https://github.com/gnamikawa/dotfiles-nix/issues/30) closed
COMPLETED 2026-08-04 with a live system UI in master — AGS bar
(workspaces-only), auth screen, session lock, `geistdesign` package,
ADRs 0005–0008. Map #95 is **Reforming**: the #30 code state is
authoritative _Content_ (three-circles §2), not authoritative _IA_.
Every decision in master is audited against this strategy; those
that pass stay, those that fail get rework tickets and are replaced —
not defended because they shipped.

This posture is a commitment. It resolves the ambiguity where "we
already have X" becomes an argument for keeping X. Reforming names the
comparison: the current thing versus the IA's answer. If those match,
the current thing stays. If they don't, the current thing is a rework
target.

Explicit reforming targets already named in three-circles §3.12:

- The **AGS bar** is not held to the Mandatory Ambient shortlist alone. Its
  workspace display and any proposed passive information are evaluated
  together for at-a-glance usefulness and attention cost.
- The **auth screen** rail audited against the drawer's shape — under the
  single-source rule, actions must be presented one way, not two.
- **mako** replaced by an AGS notification surface with three
  sub-channels (regular / human presence / emergency).
- **dmenu** replaced by an AGS launcher with scope extended to games
  and to projects under `~/repositories` (ADR-0008).

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
  checkboxes; Goodhart's law (a measure becoming a target ceases to be a
  good measure) dissolves because the question isn't asked.
- **Real-world equivalents preferred** (axis 4) — kitchen twist for
  timer, desk-with-bills for object permanence, iPad Action Center for
  the cross-host drawer. Skeuomorphism (UI patterns that mimic real-world
  objects) as interaction metaphor, not as decoration.
- **Desk-clutter reinforcement for habits** (axis 6) — habits show as
  visible undone things; presence is the reminder, absence the reward.
- **Legible presence, dormant vs bugged** (axis 7) — anxiety-relief
  surfaces render "nothing to worry about right now" as an active,
  confirmable state, not as absence.
- **Task-inertia handling: per-event opt-in, not per-channel**
  (axis 8) — the system UI does not attempt to interrupt hyperfocus by
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

## Applying the strategy to a new signal

The routing procedure. Anyone (human or agent) adding a signal to the
desktop UI walks this before touching a widget.

1. **Name the purpose.** Does the surface answer a user request, provide
   passive context, or proactively ask for attention? If it does none of
   these usefully, it does not exist in the system UI — it belongs in an
   application or a log.
2. **For requested information, choose Summoned.** Name the trigger and the
   surface (drawer, launcher, overlay).
3. **For passive information, choose Ambient deliberately.** State the
   repeated at-a-glance value and compare it with the permanent space and
   attention cost. Apply the four-part test to determine whether it must
   remain visible; failing the test makes Ambient optional, not forbidden.
4. **For information that proactively takes attention, choose Interruptive
   and classify the channel** (emergency / regular / human
   presence). Human-origin defaults to sound-only; machine-origin
   defaults to toast; system-danger defaults to emergency.
5. **Check the single-source rule.** Is this state rendered anywhere
   else? If yes, pick a winner. The loser is deleted.
6. **Check the laptop-first constraint.** Does the surface degrade
   cleanly to `eDP-1` at logical 1707×960 with no peripheral animation?
   If no, redesign.
7. **Cite the sources.** Four-part test → this doc §Ambient. Channel
   → this doc §Three interruptive channels. Visual → Design (IA style
   guide) plus `geistdesign` tokens.

Skipping any step is a bug in the surface, not in the routing.

# Glovebox Visual System — Flat Dark

**Status:** approved 2026-09-10. Supersedes `2026-08-01-glovebox-instrument-panel-design.md` in
full. Screen flow, copy and onboarding order remain governed by
`2026-08-01-glovebox-ui-ux-and-onboarding.md`.

**Why this exists:** the instrument-panel system solved the problem it was written for — a flat
bone-on-black app where unselected controls were invisible — and created a bigger one. Brushed-metal
faceplates, per-side bevels, an opaque edge band under every control, glowing red telltales for
onboarding progress and a tracked uppercase label above every value add up to an interface that
reads as software from a decade ago. The housing was the loudest thing on every screen, and the
number each screen exists to show was competing with the fittings around it.

**Direction:** depth by value, not by light. Four levels of one near-black neutral, one hairline,
no gradients, no textures, no inner shadows. Hierarchy is carried by type and by space. Motion is
the press language, not ornament.

---

## 1. Surfaces

Four values, and nothing between them.

| Token | Value | What it is |
| --- | --- | --- |
| `color.housing` | `#0A0B0D` | The app background. Not pure black: a flat `#000` makes every surface above it read as a floating rectangle. |
| `color.surface` | `#131518` | A card, a panel, a list container. |
| `color.surfaceHi` | `#1B1E23` | A row inside a panel, a selected neutral control, a secondary button. |
| `color.sunken` | `#08090B` | Below the background: input fields, meter tracks, empty sockets. |

There is exactly one border in the system — `color.hairline`, `rgba(255,255,255,0.07)` — drawn on
all four sides. `color.hairlineLit` (`0.20`) is the same edge with focus or selection on it. A
per-side border is what made the old surfaces three-dimensional, so no component draws one.

`shadow.ambient` survives as a wide, near-invisible drop so a floating surface does not end at a
hard line. It is not how depth is communicated.

## 2. Colour

Colour is spent only where it means something.

- **Red** `#E5484D` — overdue, destructive, and a rejected input. Never a primary button.
- **Green** `#3DD68C` — a settled good fact. Only ever a tick.
- **White** — the one primary action on a screen, and a chosen chip.

Text is one neutral at three levels of presence (`text`, `textMuted`, `textFaint`) and never a
fourth.

## 3. Type

`legend` is the change with the widest blast radius. It used to be 12pt, 600, `letterSpacing: 1.2`,
`textTransform: uppercase` — a dashboard convention, and applied to thirty labels at once the single
most dated thing in the app. Shouting is not hierarchy. It is now 13/500, sentence case, and it gets
out of the way of the figure under it.

`hero`, `title` and `heading` carry negative tracking; `readout` is 24pt tabular with `-0.4`. Body
is 16/23.

## 4. Motion

One press language, in `usePressScale` / `PressableScale`: a pressable surface scales to `0.97` over
120ms on a strong ease-out, and back. It replaces the machined travel — a face moving 2px into a
hard edge band — that the old material needed in order to feel like a control. Opacity-only press
feedback is not an option anywhere in the app; it reads as lag rather than as acknowledgement.

Everything the user waits on stays under 300ms (`motion.press` 120, `fast` 160, `base` 220).
Entering and exiting use `motion.easeOut`, because the first frame is the one being watched.

Existing considered motion is unchanged: the option-card stagger (45ms), the analyzing bar, the
cost meter filling a block a year, the odometer drums.

## 5. What changed per component

| Component | Before | After |
| --- | --- | --- |
| `Surface` (`Raised`/`Well`/`Panel`) | Metal gradient, brushed-texture overlay, per-side bevel, hard edge band | Flat fills at three values, one hairline |
| `Button` | Gradient face over an opaque band, 2px travel, disabled at 40% opacity | Flat fill, scale-on-press, disabled is its own unlit surface |
| `Chip` | Metal pill with bevel | Flat pill, white when chosen, scale-on-press |
| `OptionCards` | Gradient card, machined socket and stud | Flat card, lit hairline when chosen, ring and dot |
| `StepLamps` | A row of glowing red telltales | A segmented neutral rule — red is the alarm colour and progress is not an alarm |
| `Badge` (`due`) | Solid red block | Red wash, red label, pill radius |
| `ListRow` | Inset well with a flipped bevel | One value above whatever it sits on, no border |
| `ProgressBar` / `Segments` | Metal fill in a machined slot | White fill in a sunken track |
| `Field` | Recessed well, lit top border on focus | Sunken field, brighter hairline on focus |

## 6. Compatibility

Every token key from the panel system is still exported, so no screen had to be rewritten to move.
`material.edgeHeight`, `edgePressed` and `pressTravel` are pinned to `0` and `material.metalFace`
is a flat pair, so a call site that has not been converted cannot reintroduce a bevel or a ramp.
`color.edge` is now a light hairline and `color.edgeSolid` is the sunken value, which is what those
call sites actually wanted.

`NotifyBanner` is exempt from all of the above: it is the OS speaking over the app, drawn in iOS's
own dark-appearance material, and it has to look borrowed.

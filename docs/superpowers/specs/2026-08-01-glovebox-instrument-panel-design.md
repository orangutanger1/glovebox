# Glovebox Visual System — Instrument Panel

**Status:** approved 2026-08-01. Supersedes the color, surface, and component sections of
`2026-08-01-glovebox-ui-ux-and-onboarding.md`. That document remains the source of truth for
screen flow, copy, and onboarding order; everything visual is defined here.

**Why this exists:** the bone-on-near-black system shipped legible but flat. Every surface was the
same value, every control was a rectangle, and nothing on screen said "car". Two consequences: the
app read as a template, and unselected chips (`transparent` fill, `#2C2E32` border on `#0D0E0F`,
~1.3:1) were invisible as controls — users saw bare text where buttons were.

**Direction:** an automotive instrument cluster seen under glass. Brushed metal faceplates with real
bevels, controls that physically depress, numbers presented as readouts, and a blurred glass pane
over the metal at the screen edges. Depth is structural, not decorative — it is how the eye tells a
button from a slot.

---

## 1. The material model

Everything in the app is one of three materials. No surface exists that is not one of these.

| Material | What it is | Where it appears |
| --- | --- | --- |
| **Housing** | `#0F1113`, matte, unlit. The body the instruments are mounted in. | Screen background. Nothing else. |
| **Metal** | `#454A50` brushed faceplate, lit from above. | Cards, buttons, chips, list panels, input wells. |
| **Glass** | Blurred dark pane floating over metal. | Sticky headers, sticky footers, in-app modal scrims. Not the RevenueCat paywall — that is a native modal configured in the RevenueCat dashboard and is not stylable from here. |

### Metal

A vertical `LinearGradient`, lighter at the top:

```
colors: ["#4E545B", "#3A3E43"]   // metal ±6% lightness
start:  { x: 0, y: 0 }
end:    { x: 0, y: 1 }
```

Never a flat `#454A50` fill. The gradient is what makes it metal rather than grey.

### Glass

`BlurView` from `expo-blur`, `tint="dark"`, `intensity={40}`, with a `#FFFFFF` @ 6% hairline on the
edge that faces the content. Glass never appears inside a scrolling list — see §7.

### Bevel

React Native has no inset box-shadow. Depth is built from per-side borders, which RN supports
natively (`borderTopColor` / `borderBottomColor` on a view with `borderWidth: 1`).

```
RAISED (buttons, cards, chips)      INSET (inputs, list rows, gauge wells)
  borderTopColor:    hairline         borderTopColor:    edge
  borderBottomColor: edge             borderBottomColor: hairline
  + ambient drop shadow               + no drop shadow
```

Flipping those two colors is the entire depth system. A raised control is lit on top; an inset
well is shadowed on top because it is below the faceplate. Getting this backwards makes buttons
look like holes.

### Hard edge

Raised controls also carry a **hard bottom edge** — a solid, unblurred 3px band of `edge` beneath
the face, implemented as the parent view's background with the gradient face inset by 3px at the
bottom. This is what makes a press read as a press: the edge shrinks to 1px and the face moves down
2px, so the control visibly travels into its housing.

### New dependencies

- `expo-linear-gradient` — metal faces. Required; RN has no gradient primitive.
- `expo-blur` — glass panes.
- `expo-haptics` — already installed, currently unused. Wire it to press.

---

## 2. Color

```ts
const palette = {
  housing: "#0F1113",  // app background
  metal:   "#454A50",  // surface base; gradient runs ±6% around it
  white:   "#FFFFFF",  // primary text, primary button fill
  red:     "#C1121F",  // overdue and destructive ONLY
};
```

Everything else is derived from white at an alpha. No new hues enter the system.

```ts
const derived = {
  text:      "#FFFFFF",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.35)",
  hairline:  "rgba(255,255,255,0.10)",  // lit bevel edge
  hairlineLit: "rgba(255,255,255,0.30)", // focused input top edge
  edge:      "rgba(0,0,0,0.55)",         // shadowed bevel edge, hard bottom edge
  metalHi:   "#4E545B",
  metalLo:   "#3A3E43",
};
```

### Red is reserved

`red` appears in exactly two situations: a service that is **overdue**, and a **destructive**
action (delete a vehicle, delete a record). It is never a primary button, never a decorative
accent, never a nav highlight. A driver who sees red in this app is being told something is wrong.

Primary buttons are white. They are the highest-contrast element on a dark screen and need no hue
to be the loudest thing present.

### Status scale

There is no green and no amber. Health is expressed by weight and light, which is both tighter as
a palette and more literal as instrumentation — a dashboard lamp is either lit or it is not.

| State | Treatment |
| --- | --- |
| **Overdue** | Red lamp glyph, lit. 3px red stripe on the card's left edge. Label in `text`, full weight. |
| **Due soon** | Unlit lamp. Label in `text`, full weight. No color. |
| **Healthy** | No lamp. Label in `textMuted`. Recedes into the panel. |

The lamp is a filled circle with a soft red glow behind it (a larger, low-opacity red circle),
sized 10px. It is the only glowing element in the app.

---

## 3. Tokens

`src/design/tokens.ts` is rewritten. Structure is preserved so component call sites change
minimally; values and the `material` block are new.

```ts
export const tokens = {
  color: { ...palette, ...derived },
  material: {
    metalFace: ["#4E545B", "#3A3E43"],   // LinearGradient colors, vertical
    edgeHeight: 3,                        // hard bottom edge, raised controls
    edgePressed: 1,
    pressTravel: 2,                       // translateY on press
  },
  space:  { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },   // unchanged
  radius: { sm: 8, md: 14, lg: 18, pill: 999 },
  text: {
    hero:    { fontSize: 34, fontWeight: "700", lineHeight: 40 },
    title:   { fontSize: 28, fontWeight: "700", lineHeight: 34 },
    heading: { fontSize: 20, fontWeight: "600", lineHeight: 25 },
    body:    { fontSize: 17, fontWeight: "400", lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
    // Dashboard legend. Every label that names a value uses this.
    legend:  { fontSize: 12, fontWeight: "600", letterSpacing: 1.2,
               textTransform: "uppercase" },
    // Every number the user reads. Always one step larger than its legend.
    readout: { fontSize: 22, fontWeight: "600",
               fontVariant: ["tabular-nums"] },
  },
  shadow: {
    ambient: { shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 10,
               shadowOffset: { width: 0, height: 4 } },
  },
};
```

No screen may use a raw hex or a magic number. That constraint carries over unchanged.

---

## 4. Typography

No custom font file ships. Genericness is killed by treatment, not by a typeface — an added font
is weight, a licensing question, and a load-time risk for a gain the treatment already delivers.

- **Legends** — every label that names a value (`ODOMETER`, `NEXT DUE`, `LAST SERVICE`) is
  uppercase, tracked `1.2`, 12px, `textMuted`.
- **Readouts** — every number the user reads is `tabular-nums`, 22px, and sits directly beneath its
  legend with 2px of space. Legend and readout are a unit; they never appear apart.
- **Body** — system SF, unchanged, for sentences.

A legend/readout pair is the app's signature. Where the old design wrote "Odometer: 84,210" in a
row, this writes the legend above the number.

---

## 5. Components

All live in `src/design/`. Public props are unchanged except where noted, so screens need edits
only where they pass a new variant.

### Button

| Variant | Face | Text |
| --- | --- | --- |
| `primary` | white | `housing` |
| `secondary` | metal gradient | `text` |
| `danger` | `red` | white |

Raised bevel, hard bottom edge, radius `md`. Press: `translateY: 2`, edge 3→1,
`Haptics.impactAsync(Light)`. Disabled: 40% opacity, no edge, no haptic.

The press must move the control. Opacity-only feedback is the single most template-looking thing a
button can do and is explicitly out.

### Card

Metal gradient, radius `md`, raised bevel, `shadow.ambient`. New optional `status` prop:
`"overdue"` adds a 3px `red` left stripe running the card's full height, inside the radius.

### ListRow

Inset well — flipped bevel, no drop shadow, radius `sm`. Rows sit in a metal panel and read as
slots milled into it. Consecutive rows share a single `hairline` divider rather than each carrying
a full border.

### Field

Inset well. Radius `sm`. Background `housing` (darker than the panel it sits in — a recess, not a
raised patch). Focus lights the top border to `hairlineLit`. Label above the input uses `legend`.

Keeps the numeric `InputAccessoryView` with a **Done** button added while fixing the stuck-keypad
bug — the iOS number pad has no return key, so a numeric field without an accessory is a keyboard
the user cannot dismiss. The Done label uses `white`, not red.

### Chip

Raised metal pill, radius `pill`, minHeight 44. Selected: white fill, `housing` text, edge retained.
Unselected: metal gradient, `text` label — a visible control, which is the direct fix for the
invisible-chip defect.

### Badge

Legend type on a metal pill. Overdue badges are red-filled with white text; every other badge is
metal with `textMuted`.

### Gauge — new

The readout block that carries the Garage screen. Renders a legend, a readout, an optional unit
suffix in `textMuted`, and an optional lamp. Used for next-due, odometer, and last-service.

```
 ┌──────────────────────────────┐
 │  NEXT DUE                ◉   │   legend + lamp
 │  320 mi                      │   readout + unit
 └──────────────────────────────┘
```

This component is why the app stops looking generic. It should be built first and reviewed on
device before the rest of the pass proceeds.

### Screen

Unchanged in structure. Keeps the `KeyboardAvoidingView` and `keyboardShouldPersistTaps="handled"`
added while fixing the keyboard bugs. Background becomes `housing`.

---

## 6. Screen-level changes

Screen logic, routes, copy, and onboarding order are untouched. Only these visual passes apply:

- **Garage (`app/index.tsx`)** — vehicle cards become `Card` with `Gauge` for next-due. Overdue
  vehicles get the stripe and lamp.
- **Vehicle detail** — header is a glass pane over the metal record list. Odometer and last-service
  become gauges.
- **Log a service** — fields become inset wells; Save is a primary button in a glass footer.
- **Onboarding** — the six screens keep their flow verbatim. Buttons, chips, and fields inherit the
  new components; nothing else changes.
- **Settings** — list rows become inset wells. Delete actions are `danger`.

---

## 7. Performance and constraints

- **Blur is expensive.** At most one `BlurView` per screen, only on a sticky header or footer, never
  inside a `ScrollView`'s content and never in a list row. A list of 40 blurred rows will drop
  frames on an iPhone 11.
- **Gradients are cheap but not free.** One `LinearGradient` per control is fine; do not nest them.
- **Shadows on Android** are ignored in favor of `elevation`, but this app is iOS-only per the
  plan's global constraints, so `shadow*` props are used directly.
- **The bevel must survive dark mode toggling.** `userInterfaceStyle` is `automatic` in `app.json`;
  every color in this system is explicit, so nothing adapts and nothing breaks. No component may
  rely on `useColorScheme`.

## 8. Removing NativeWind

`nativewind`, `react-native-css-interop`, `tailwindcss`, `tailwind.config.js`, `global.css`, the
`global.css` import in `app/_layout.tsx`, and the `nativewind/babel` preset are all removed.

Justification: the codebase contains zero `className` usages, and there is no `metro.config.js`
calling `withNativeWind`, which NativeWind v4 requires. The dependency is doing nothing today and
is a live build hazard — a future `.css` import would fail in a way that is hard to diagnose. This
visual system is entirely inline-style and token-driven, so nothing depends on it.

## 9. Out of scope

- Custom font files.
- Animation beyond press feedback. No scroll parallax, no shared-element transitions.
- Any change to onboarding flow, copy, screen order, or the paywall placement.
- Green or amber. If a future state genuinely needs a third status color, it comes back through
  this document, not into a component ad hoc.

/**
 * The flat dark visual system. See
 * docs/superpowers/specs/2026-09-10-glovebox-flat-dark-design.md.
 *
 * This replaces the machined instrument-panel material — brushed-metal
 * faceplates, per-side bevels, hard opaque edge bands under every control.
 * That system was legible but it dated the app: three-dimensional plastic on a
 * phone screen reads as software from a decade ago, and the eye spends its
 * attention on the housing rather than on the one number the screen exists to
 * show.
 *
 * What replaces it is depth by value, not by light. Surfaces sit at four
 * levels of the same near-black neutral, separated by a single hairline; there
 * are no gradients, no textures and no inner shadows. Hierarchy is carried by
 * type and by space. Colour is spent only where it means something: red for
 * overdue and destructive, green for a settled fact, and white for the one
 * primary action on a screen.
 *
 * The key names are unchanged from the panel system so that no screen had to
 * be rewritten to move; the values behind them are new.
 */
export const tokens = {
  color: {
    /** The app background. Not pure black — a flat #000 makes every surface
     *  above it look like a floating rectangle, and OLED smearing on scroll is
     *  worse against it. */
    housing: "#0A0B0D",
    /** A card, a panel, a list container. One step up from the background. */
    surface: "#131518",
    /** A card on a card, and the selected state of a neutral control. */
    surfaceHi: "#1B1E23",
    /** Below the background: input wells, progress tracks, empty sockets. */
    sunken: "#08090B",

    white: "#FFFFFF",
    /** Overdue and destructive, and nothing else. Brighter and less brown than
     *  the old signal red, which went muddy against a flat dark surface. */
    red: "#E5484D",
    /** The confirmed telltale — a system that is on and working. Only ever
     *  marks a good, settled fact. */
    green: "#3DD68C",

    // Text is one neutral at three weights of presence. Never a fourth.
    text: "#EDEEF0",
    textMuted: "rgba(237,238,240,0.62)",
    textFaint: "rgba(237,238,240,0.38)",

    /** The only border in the system. One hairline, one value, every surface. */
    hairline: "rgba(255,255,255,0.07)",
    /** The same hairline with the light on it: focus, and a selected edge. */
    hairlineLit: "rgba(255,255,255,0.20)",
    /** Kept for the screens that drew the old dark bevel edge. It is now the
     *  same hairline, so a stray border cannot reintroduce a bevel. */
    edge: "rgba(255,255,255,0.05)",
    /** Kept for the screens that drew the old hard band. It is now simply the
     *  sunken surface, which is what those call sites actually wanted: a track
     *  or a socket beneath the thing on top of it. */
    edgeSolid: "#08090B",

    /** A neutral fill for bars, meters and inactive segments. Alpha, so it
     *  sits correctly on whichever surface it lands on. */
    metalHi: "rgba(237,238,240,0.45)",
    metalLo: "rgba(237,238,240,0.10)",

    redGlow: "rgba(229,72,77,0.40)",
    redWash: "rgba(229,72,77,0.12)",
    greenGlow: "rgba(61,214,140,0.40)",
    greenWash: "rgba(61,214,140,0.12)",
  },

  material: {
    /** Flat. Kept as a two-stop pair so any remaining gradient call site
     *  renders a solid surface rather than a ramp. */
    metalFace: ["#131518", "#131518"] as const,
    /** The chosen state of a neutral control: one value up, not a new hue. */
    metalFaceLit: ["#1B1E23", "#1B1E23"] as const,
    /** The press language is now scale, not travel. These are kept at zero so
     *  a control that still reads them cannot reintroduce the bevel. */
    edgeHeight: 0,
    edgePressed: 0,
    pressTravel: 0,
    /** What a pressed control scales to. Subtle enough to be felt rather than
     *  watched, which is the entire job of press feedback. */
    pressScale: 0.97,
  },

  /** Under 300ms for anything the user is waiting on. Entering and exiting are
   *  ease-out: the movement has to start immediately, because the first frame
   *  is the one being watched. */
  motion: {
    press: 120,
    fast: 160,
    base: 220,
    /** A strong ease-out. The built-in curves are too weak to read as
     *  intentional at these durations. */
    easeOut: [0.23, 1, 0.32, 1] as const,
    easeInOut: [0.77, 0, 0.175, 1] as const,
  },

  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 10, md: 14, lg: 20, pill: 999 },

  text: {
    hero: { fontSize: 32, fontWeight: "700" as const, lineHeight: 38, letterSpacing: -0.6 },
    title: { fontSize: 26, fontWeight: "700" as const, lineHeight: 32, letterSpacing: -0.4 },
    heading: { fontSize: 19, fontWeight: "600" as const, lineHeight: 25, letterSpacing: -0.2 },
    body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 23 },
    caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 19 },
    /** Attribution, and nothing else. Read once, by the one reader who goes
     *  looking, and never competing with the figure it vouches for. */
    footnote: { fontSize: 11, fontWeight: "400" as const, lineHeight: 15 },

    /** The label that names a value. It used to be tracked and uppercased on
     *  every screen, which is a dashboard convention and, applied to thirty
     *  labels at once, the single most dated thing in the app: shouting is not
     *  hierarchy. It is now a small, quiet, sentence-case label that gets out
     *  of the way of the number under it. */
    legend: { fontSize: 13, fontWeight: "500" as const, letterSpacing: 0.1 },
    /** Every number the user reads. Always paired with a legend above it. */
    readout: {
      fontSize: 24,
      fontWeight: "600" as const,
      letterSpacing: -0.4,
      fontVariant: ["tabular-nums"] as ("tabular-nums")[],
    },
    /** Inline numerics inside a sentence. */
    numeric: { fontVariant: ["tabular-nums"] as ("tabular-nums")[] },
  },

  shadow: {
    /** Depth is value, not shade. What is left is a wide, almost invisible
     *  ambient that keeps a surface from being a flat sticker at the edges. */
    ambient: {
      shadowColor: "#000",
      shadowOpacity: 0.5,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
    },
  },
};

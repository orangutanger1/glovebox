/**
 * The instrument-panel visual system. See
 * docs/superpowers/specs/2026-08-01-glovebox-instrument-panel-design.md.
 *
 * Three materials and nothing else: housing (the matte body), metal (lit
 * faceplates), glass (blurred panes at the screen edges). Depth is built from
 * per-side border colors because React Native has no inset shadow — a raised
 * control is lit on its top edge, an inset well is shadowed on its top edge.
 * Flipping those two colors is the whole system.
 */
export const tokens = {
  color: {
    housing: "#0F1113",
    metal: "#454A50",
    white: "#FFFFFF",
    red: "#C1121F",

    // Derived from white at an alpha. No new hues enter the system.
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.55)",
    textFaint: "rgba(255,255,255,0.35)",
    hairline: "rgba(255,255,255,0.10)",
    hairlineLit: "rgba(255,255,255,0.30)",
    edge: "rgba(0,0,0,0.55)",
    /** The hard band under a raised control. Opaque, so it reads as a machined
     *  edge rather than a soft shadow. Darker than the housing it sits on. */
    edgeSolid: "#07080A",
    metalHi: "#4E545B",
    metalLo: "#3A3E43",

    // Red is reserved: overdue and destructive only. Never a primary button.
    redGlow: "rgba(193,18,31,0.45)",
    redWash: "rgba(193,18,31,0.14)",
  },

  material: {
    /** LinearGradient colors for a metal face. Vertical, lighter at the top. */
    metalFace: ["#4E545B", "#3A3E43"] as const,
    /** Solid, unblurred band under a raised control. Shrinks on press. */
    edgeHeight: 3,
    edgePressed: 1,
    pressTravel: 2,
  },

  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 14, lg: 18, pill: 999 },

  text: {
    hero: { fontSize: 34, fontWeight: "700" as const, lineHeight: 40 },
    title: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
    heading: { fontSize: 20, fontWeight: "600" as const, lineHeight: 25 },
    body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },

    /** Dashboard legend. Every label that names a value uses this. */
    legend: {
      fontSize: 12,
      fontWeight: "600" as const,
      letterSpacing: 1.2,
      textTransform: "uppercase" as const,
    },
    /** Every number the user reads. Always paired with a legend above it. */
    readout: {
      fontSize: 22,
      fontWeight: "600" as const,
      fontVariant: ["tabular-nums"] as ("tabular-nums")[],
    },
    /** Inline numerics inside a sentence. */
    numeric: { fontVariant: ["tabular-nums"] as ("tabular-nums")[] },
  },

  shadow: {
    ambient: {
      shadowColor: "#000",
      shadowOpacity: 0.45,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
  },
};

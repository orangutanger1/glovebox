import { LIGHT } from "./palette";

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
  /**
   * TEMPORARY. Deleted in the materials migration — see
   * docs/superpowers/plans/2026-08-27-warm-garage-visual-redesign.md Task 3.
   * Every key here maps an old instrument-panel name onto the light palette so
   * the tree renders while components are migrated one file at a time.
   */
  color: {
    housing: LIGHT.base,
    metal: LIGHT.card,
    white: "#FFFFFF",
    red: LIGHT.overdue,
    text: LIGHT.ink,
    textMuted: LIGHT.inkMuted,
    textFaint: LIGHT.inkFaint,
    hairline: LIGHT.hairline,
    hairlineLit: LIGHT.hairline,
    edge: LIGHT.hairline,
    edgeSolid: LIGHT.cardSunken,
    metalHi: LIGHT.card,
    metalLo: LIGHT.cardSunken,
    redGlow: LIGHT.overdueWash,
    redWash: LIGHT.overdueWash,
  },

  material: {
    metalFace: [LIGHT.card, LIGHT.card] as const,
    edgeHeight: 0,
    edgePressed: 0,
    pressTravel: 0,
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
    /**
     * The one drop shadow in the system. `shadowOpacity` is deliberately absent:
     * it is the only theme-dependent part, it lives on `Palette`, and baking a
     * value in here would hand every call site a shadow that reads as depth on
     * warm paper and as a smudge on near-black. Spread it and supply the
     * opacity: `{ ...tokens.shadow.soft, shadowOpacity: c.shadowOpacity }`.
     */
    soft: {
      shadowColor: "#000",
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
  },
};

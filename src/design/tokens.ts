/**
 * The measurements, and only the measurements.
 *
 * Colour lives in `palette.ts` and is read through `useTheme()`, because a
 * frozen module-scope object cannot answer which of two themes is on the glass.
 * What is left here is theme-independent: spacing, radius, and the type scale.
 */
export const tokens = {
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

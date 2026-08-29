/**
 * The two palettes, and nothing else.
 *
 * Colour left `tokens.ts` when the app grew a second theme: a frozen object
 * read at module scope cannot answer "which theme is on the glass". Every
 * consumer reads a palette through `useTheme()`; nothing imports LIGHT or DARK
 * directly except the provider and its tests.
 *
 * `shadowOpacity` and `blurTint` live here because they are theme-dependent and
 * there is nowhere else honest to put them: a shadow that reads as depth on
 * warm paper is invisible on near-black, and vice versa.
 */
export type Palette = {
  /** The screen. Nothing else. */
  base: string;
  /** Raised surfaces: cards, buttons, list panels. */
  card: string;
  /** Recessed surfaces: input wells, unselected chips, gauge tracks. */
  cardSunken: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  hairline: string;
  /** The brand. Primary CTAs. */
  accent: string;
  /** Text and glyphs on top of `accent`. */
  onAccent: string;
  soon: string;
  ok: string;
  /** Reserved: overdue state and destructive actions. Never a primary button. */
  overdue: string;
  overdueWash: string;
  shadowOpacity: number;
  blurTint: "light" | "dark";
};

export const LIGHT = Object.freeze({
  base: "#F7F4EF",
  card: "#FFFFFF",
  cardSunken: "#F2EEE8",
  ink: "#14161A",
  inkMuted: "#5C6068",
  inkFaint: "#8A8E96",
  hairline: "rgba(20,22,26,0.08)",
  accent: "#C2611A",
  onAccent: "#FFFFFF",
  soon: "#E08A1E",
  ok: "#1F7A5C",
  overdue: "#C1121F",
  overdueWash: "rgba(193,18,31,0.08)",
  shadowOpacity: 0.06,
  blurTint: "light",
} satisfies Palette);

export const DARK = Object.freeze({
  base: "#101215",
  card: "#191C20",
  cardSunken: "#22262B",
  ink: "#F5F3EF",
  inkMuted: "rgba(245,243,239,0.60)",
  inkFaint: "rgba(245,243,239,0.38)",
  hairline: "rgba(255,255,255,0.08)",
  accent: "#E8933D",
  onAccent: "#101215",
  soon: "#F0A73C",
  ok: "#3E9B7A",
  overdue: "#E0313D",
  overdueWash: "rgba(224,49,61,0.14)",
  shadowOpacity: 0.35,
  blurTint: "dark",
} satisfies Palette);

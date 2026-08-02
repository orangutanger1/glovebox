export const tokens = {
  color: {
    bg: "#0D0E0F",         // near-black, neutral, never pure #000
    surface: "#17181A",
    surfaceAlt: "#202225",
    border: "#2C2E32",
    text: "#F4F2EE",       // warm off-white
    textMuted: "#9A9AA0",
    accent: "#EDE3D2",     // bone — the only non-semantic color
    onAccent: "#0D0E0F",   // text on a bone fill
    due: "#E5484D",
    soon: "#E8A33D",
    ok: "#6FA98A",         // text only, never a filled badge
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  text: {
    hero: { fontSize: 34, fontWeight: "700" as const, lineHeight: 40 },
    title: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
    heading: { fontSize: 20, fontWeight: "600" as const, lineHeight: 25 },
    body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
    numeric: { fontSize: 17, fontVariant: ["tabular-nums"] as ("tabular-nums")[] },
  },
};

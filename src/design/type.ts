import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import { DMMono_400Regular, DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import { isDesignV2 } from "./theme";
import { getLanguage } from "../i18n";

/**
 * A v2's two faces: Bricolage Grotesque for what the eye lands on (the
 * greeting, the one big figure, headlines, the car's line) and DM Mono for
 * readings and the few small spaced labels, the way an odometer prints. Body
 * copy stays the system face.
 *
 * Every style falls back to the system face, same size, until the fonts have
 * loaded, outside v2, and in Japanese and Korean (neither face has the glyphs).
 * Not in `tokens.text`: those are shared by both arms and not arm-themed.
 */
export const FONT_ASSETS = {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  DMMono_400Regular,
  DMMono_500Medium,
};

let loaded = false;
export function markFontsLoaded(): void {
  loaded = true;
}
/** Test seam. */
export function resetFontsLoaded(): void {
  loaded = false;
}

const NO_LATIN_FACE = new Set(["ja", "ko"]);

function on(): boolean {
  return loaded && isDesignV2() && !NO_LATIN_FACE.has(getLanguage());
}

export type V2Style = {
  fontFamily?: string;
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontWeight?: "400" | "500" | "600" | "700" | "800";
  textTransform?: "uppercase";
  fontVariant?: "tabular-nums"[];
};

function face(family: string, systemWeight: V2Style["fontWeight"], base: V2Style): V2Style {
  // A custom family carries its own weight; setting fontWeight as well makes
  // iOS synthesise a bolder one.
  return on() ? { ...base, fontFamily: family } : { ...base, fontWeight: systemWeight };
}

const TAB: "tabular-nums"[] = ["tabular-nums"];

export const v2 = {
  greeting: () => face("BricolageGrotesque_800ExtraBold", "700", { fontSize: 30, lineHeight: 34, letterSpacing: -0.8 }),
  figure: () =>
    face("BricolageGrotesque_800ExtraBold", "700", { fontSize: 68, lineHeight: 68, letterSpacing: -2.5, fontVariant: TAB }),
  headline: () => face("BricolageGrotesque_700Bold", "700", { fontSize: 20, lineHeight: 26, letterSpacing: -0.4 }),
  bubble: () => face("BricolageGrotesque_500Medium", "500", { fontSize: 16, lineHeight: 20 }),
  label: () => {
    const upper = !NO_LATIN_FACE.has(getLanguage());
    return face("DMMono_500Medium", "600", {
      fontSize: 11,
      letterSpacing: upper ? 1.6 : 0.2,
      ...(upper ? { textTransform: "uppercase" as const } : {}),
    });
  },
  value: () => face("DMMono_500Medium", "600", { fontSize: 13, fontVariant: TAB }),
  odometer: () => face("DMMono_500Medium", "600", { fontSize: 24, fontVariant: TAB }),
};

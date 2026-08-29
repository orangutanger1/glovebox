import { getState, setState } from "../db/state";

export const THEME_KEY = "theme";

export type ThemeMode = "system" | "light" | "dark";

const MODES: readonly ThemeMode[] = ["system", "light", "dark"];

/**
 * Validated on read, not trusted. A build that once wrote a mode this version
 * does not have would otherwise resolve to `undefined` and render a themeless
 * tree — the same failure shape `resumeRoute` exists to prevent for routes.
 */
export function getThemeMode(): ThemeMode {
  const stored = getState(THEME_KEY);
  return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : "system";
}

export function setThemeMode(mode: ThemeMode): void {
  setState(THEME_KEY, mode);
}

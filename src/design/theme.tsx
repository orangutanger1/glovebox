import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { DARK, LIGHT, type Palette } from "./palette";
import { getThemeMode, setThemeMode, type ThemeMode } from "./themeState";

const PaletteContext = createContext<Palette>(LIGHT);
const ModeContext = createContext<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>({
  mode: "system",
  setMode: () => {},
});

/**
 * Light is the default, and `system` is the default *mode* — so a phone in dark
 * mode gets the dark palette without being asked, and a phone with no
 * preference gets light. The context default above is LIGHT rather than a
 * throwing sentinel because a component rendered outside the provider is a test
 * harness, and a themeless crash there teaches nothing about the component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getThemeMode());
  const scheme = useColorScheme();

  const setMode = useCallback((next: ThemeMode) => {
    setThemeMode(next);
    setModeState(next);
  }, []);

  const resolved = mode === "system" ? (scheme === "dark" ? DARK : LIGHT) : mode === "dark" ? DARK : LIGHT;
  const modeValue = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ModeContext.Provider value={modeValue}>
      <PaletteContext.Provider value={resolved}>{children}</PaletteContext.Provider>
    </ModeContext.Provider>
  );
}

export function useTheme(): Palette {
  return useContext(PaletteContext);
}

export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  return useContext(ModeContext);
}

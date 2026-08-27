/**
 * The provider, which `tests/theme.test.ts` does not reach: that file covers the
 * palettes and the persisted mode as pure values, and would still pass if
 * `ThemeProvider` resolved the wrong one of them. Everything the rest of the
 * redesign renders hangs off this component, so the resolution table is asserted
 * directly: the seed from the database, the two system-scheme branches, and an
 * explicit choice overriding the phone.
 */
jest.mock("../src/db/client", () => {
  const Sqlite = require("better-sqlite3");
  const db = new Sqlite(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, params: unknown[] = []) => db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) => db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

// The scheme the phone reports is the one input to this component that is not
// the database. Mocked at its own module rather than through the "react-native"
// barrel, whose export is a getter that cannot be spied on.
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(() => "light"),
}));

import { Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { getDb } from "../src/db/client";
import { DARK, LIGHT } from "../src/design/palette";
import { ThemeProvider, useTheme, useThemeMode } from "../src/design/theme";
import { getThemeMode, setThemeMode, type ThemeMode } from "../src/design/themeState";

const reportedScheme = require("react-native/Libraries/Utilities/useColorScheme")
  .default as jest.Mock;

let setModeFromTree!: (m: ThemeMode) => void;

function Probe() {
  const palette = useTheme();
  const { mode, setMode } = useThemeMode();
  setModeFromTree = setMode;
  return <Text testID="probe">{`${mode}|${palette.base}`}</Text>;
}

/** Mounts the provider and returns a reader of "<mode>|<palette.base>". */
function mount() {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
  });
  return () => tree.root.findByProps({ testID: "probe" }).props.children as string;
}

beforeEach(() => {
  // The mocked database is one module-scoped instance shared by every test, so
  // the stored choice is cleared rather than left to the previous test.
  getDb().runSync("DELETE FROM app_state WHERE key = ?", ["theme"]);
  reportedScheme.mockReturnValue("light");
});

describe("ThemeProvider", () => {
  test("seeds system mode and light paper when nothing has been chosen", () => {
    expect(mount()()).toBe(`system|${LIGHT.base}`);
  });

  test("resolves the dark palette when the phone reports dark", () => {
    reportedScheme.mockReturnValue("dark");
    expect(mount()()).toBe(`system|${DARK.base}`);
  });

  test("lets an explicit light choice win over a dark phone", () => {
    setThemeMode("light");
    reportedScheme.mockReturnValue("dark");
    expect(mount()()).toBe(`light|${LIGHT.base}`);
  });

  test("honours an explicit dark choice on a light phone", () => {
    setThemeMode("dark");
    expect(mount()()).toBe(`dark|${DARK.base}`);
  });

  test("writes a mode change through to the database before re-rendering", () => {
    const read = mount();
    expect(read()).toBe(`system|${LIGHT.base}`);

    act(() => setModeFromTree("dark"));
    expect(read()).toBe(`dark|${DARK.base}`);
    // Persisted, not just held in state: the next cold start reads this.
    expect(getThemeMode()).toBe("dark");

    act(() => setModeFromTree("light"));
    expect(read()).toBe(`light|${LIGHT.base}`);
    expect(getThemeMode()).toBe("light");
  });
});

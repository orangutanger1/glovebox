let v2On = true;
let lang = "en";
jest.mock("../src/design/theme", () => ({ isDesignV2: () => v2On, isRedesign: () => true }));
jest.mock("../src/i18n", () => ({ getLanguage: () => lang }));
jest.mock("@expo-google-fonts/bricolage-grotesque", () => ({
  BricolageGrotesque_500Medium: 1,
  BricolageGrotesque_700Bold: 2,
  BricolageGrotesque_800ExtraBold: 3,
}));
jest.mock("@expo-google-fonts/dm-mono", () => ({ DMMono_400Regular: 4, DMMono_500Medium: 5 }));

import { markFontsLoaded, resetFontsLoaded, v2 } from "../src/design/type";

beforeEach(() => {
  v2On = true;
  lang = "en";
  resetFontsLoaded();
});

test("no custom family before the fonts load", () => {
  expect(v2.figure().fontFamily).toBeUndefined();
  expect(v2.figure().fontSize).toBe(68);
});

test("custom family once loaded, in v2", () => {
  markFontsLoaded();
  expect(v2.figure().fontFamily).toBe("BricolageGrotesque_800ExtraBold");
  expect(v2.label().fontFamily).toBe("DMMono_500Medium");
  expect(v2.label().textTransform).toBe("uppercase");
});

test("a custom family carries its own weight", () => {
  markFontsLoaded();
  expect(v2.greeting().fontWeight).toBeUndefined();
});

test("system font outside v2", () => {
  markFontsLoaded();
  v2On = false;
  expect(v2.greeting().fontFamily).toBeUndefined();
  expect(v2.greeting().fontWeight).toBe("700");
});

test.each(["ja", "ko"])("system font and no uppercase in %s", (l) => {
  markFontsLoaded();
  lang = l;
  expect(v2.greeting().fontFamily).toBeUndefined();
  expect(v2.label().textTransform).toBeUndefined();
});

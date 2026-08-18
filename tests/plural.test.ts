import { LANGUAGES, resetFormatters, setLanguage, t } from "../src/i18n";
import { selectPlural } from "../src/i18n/plural";

/**
 * The plural table, against the two things that can be wrong with it.
 *
 * Build 1.0(11) was rejected in review for crashing on launch: `t()` built an
 * `Intl.PluralRules`, iOS Hermes does not have that constructor, and the
 * TypeError took the process with it. Node has full ICU, so every existing test
 * passed anyway. The suite now runs with the device's Intl surface
 * (tests/hermes-runtime.js), which is what makes the second half of this file an
 * assertion rather than a simulation.
 *
 * Unchecked casts, deliberately: one reads a global the setup file removed, the
 * other the real implementation it parked. There is no input here to validate.
 */
const intl = Intl as { PluralRules?: typeof Intl.PluralRules };

/** Node's own CLDR data, kept aside by the setup file. The table is the app's
 *  answer; this is what that answer is graded against. */
const ICU = (globalThis as unknown as { ICU: { PluralRules: typeof Intl.PluralRules } }).ICU
  .PluralRules;

/** Every operand shape the sixteen rules distinguish, over the range a count in
 *  this app actually falls in, plus the round millions and the fractions. */
const COUNTS = [
  ...Array.from({ length: 201 }, (_, i) => i),
  221, 302, 411, 512, 613, 714, 1000, 1001, 1002, 1005, 1011, 1012, 1021, 1024,
  1000000, 2000000, 1000001, 3000000,
  0.5, 1.5, 2.5, 1.05, 100.5,
];

describe.each(LANGUAGES)("%s selects the CLDR category", (language) => {
  const icu = new ICU(language);

  test("for every count the app can print", () => {
    const wrong = COUNTS.filter((count) => selectPlural(language, count) !== icu.select(count));
    expect(wrong).toEqual([]);
  });

  test("and never a category the language does not have", () => {
    const allowed = icu.resolvedOptions().pluralCategories;
    const used = [...new Set(COUNTS.map((count) => selectPlural(language, count)))];
    expect(used.filter((category) => !allowed.includes(category))).toEqual([]);
  });
});

describe("on a runtime with no Intl.PluralRules, which is every iPhone", () => {
  test("the constructor really is absent", () => {
    expect(intl.PluralRules).toBeUndefined();
  });

  test("the screen that crashed in review renders its sentence", () => {
    setLanguage("en");
    resetFormatters();
    // pain.overdue.headline is the first plural the onboarding flow reaches:
    // question six, and every relaunch after it, because the flow resumes there.
    const headline = t("pain.overdue.headline", { count: 3 });
    expect(headline).toContain("3");
    expect(headline).not.toContain("{");
  });

  test("and Polish still gets the ending its grammar needs", () => {
    setLanguage("pl");
    resetFormatters();
    const few = t("onboardingC.results.overdue", { count: 2 });
    const many = t("onboardingC.results.overdue", { count: 5 });
    expect(few).not.toEqual(many);
    expect(few).not.toContain("{");
    expect(many).not.toContain("{");
  });

  // The language is module state, so the file puts it back where it found it.
  afterAll(() => {
    setLanguage("en");
    resetFormatters();
  });
});

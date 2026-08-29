import { en } from "../src/i18n/catalog/en";
import { LANGUAGES, resetFormatters, setLanguage, t, type Vars } from "../src/i18n";

/**
 * Renders every string of every shipped language, the way the app would.
 *
 * This is the test that stands in for opening the app sixteen times. A catalog
 * can pass key-parity and still be broken on the glass: a placeholder renamed by
 * a translator leaves `{count}` printed in the middle of a sentence, a plural
 * entry missing the category a language actually selects renders empty, and a key
 * that no catalog defines silently prints itself. All three are invisible to a
 * type check and obvious here.
 *
 * Counts are chosen to hit every CLDR category in the set: 1 (one), 2 and 3 (few
 * in Polish), 5 and 11 (many), 0 and 21 (other in some, few/many in others), and
 * 1.5, which is the fractional case Polish spells differently again.
 */
const COUNTS = [0, 1, 2, 3, 5, 11, 21, 1.5];

/** A plausible value per placeholder, by name — numbers where the sentence does
 *  arithmetic on them, already-formatted strings where the app formats first. */
const SAMPLES: Record<string, string | number> = {
  count: 3,
  total: 12,
  logged: 4,
  soon: 2,
  index: 3,
  min: "1900",
  max: "2028",
  value: 51771,
  apps: 9,
  negative: 691,
  step: 3,
  name: "2019 Civic",
  vehicle: "2019 Civic",
  service: "Oil Change",
  date: "14 Sep 2026",
  distance: "51,771 mi",
  projected: "63,771 mi",
  unit: "mi",
  from: "mi",
  to: "km",
  example: "80,467 km",
  cost: "79",
  default: "6 months · 5,000 mi",
  language: "English (US)",
};

const varsFor = (key: string, count?: number): Vars => {
  const entry = en[key];
  const values = typeof entry === "string" ? [entry] : Object.values(entry);
  const vars: Vars = {};
  for (const value of values) {
    for (const [, name] of value.matchAll(/\{(\w+)\}/g)) {
      const sample = SAMPLES[name];
      if (sample === undefined) throw new Error(`no sample value for {${name}} in ${key}`);
      vars[name] = sample;
    }
  }
  if (count !== undefined) vars.count = count;
  return vars;
};

describe.each(LANGUAGES)("%s renders every string", (language) => {
  beforeAll(() => {
    setLanguage(language);
    resetFormatters();
  });

  test("with no placeholder left unfilled and nothing blank", () => {
    for (const key of Object.keys(en)) {
      const counts = typeof en[key] === "string" ? [undefined] : COUNTS;
      for (const count of counts) {
        const rendered = t(key, varsFor(key, count));
        expect({ key, count, has: rendered.includes("{") }).toEqual({
          key,
          count,
          has: false,
        });
        expect(rendered.trim().length).toBeGreaterThan(0);
        // A key rendering as itself means no catalog defines it — the one failure
        // the fallback chain cannot paper over.
        expect(rendered).not.toBe(key);
      }
    }
  });

  test("without borrowing English for a key its own catalog should own", () => {
    // Regional overlays are supposed to fall through, so they are exempt; a base
    // language that renders the English sentence has a hole in its catalog.
    if (language === "en" || language.includes("-")) return;
    const englishByKey = new Map<string, string>();
    setLanguage("en");
    resetFormatters();
    for (const key of Object.keys(en)) englishByKey.set(key, t(key, varsFor(key, 3)));

    setLanguage(language);
    resetFormatters();
    const identical = Object.keys(en).filter(
      (key) => t(key, varsFor(key, 3)) === englishByKey.get(key)
    );

    // A translated catalog still renders some strings identically to English, and
    // every one of those has a reason:
    //   unit./service./intervals.  a language borrows the word outright (Garage,
    //                              Service, km) or the abbreviation is universal
    //   *.status.ok, badge.pro     "OK" and "Pro" crossed intact
    //   language.system            "System" is the same word in most of the set
    //   *Placeholder, *.model      a car brand, a model name, or a number
    //   *.onFileValue, vehicle.row.*  pure templates: "{logged} / {total}"
    //   system.csv.*               the export's cell values are held stable on
    //                              purpose, so a spreadsheet parses the same file
    //                              whatever language wrote it
    //   vehicle.body.*             body styles a market names in English:
    //                              SUV everywhere, plus Sedan/Hatchback/
    //                              Pickup/Van where that is the owner's word.
    //                              wagon and coupe stay guarded — those are
    //                              Kombi, Break, Perua, Coupé.
    const BORROWED =
      /^(unit|service|intervals)\.|\.status\.ok$|^offer\.badge\.pro$|^language\.system$|^(garage\.title|layout\.garage)$|Placeholder(\.|$)|^onboardingA\.odometer\.placeholder\.|^onboardingA\.vehicle\.model$|^vehicleForms\.new\.name$|^onboardingC\.(question|results\.onFileValue)$|^vehicle\.row\.date|^system\.csv\.|^onboardingB\.service\.legend$|^vehicle\.body\.(sedan|hatchback|suv|pickup|van)$/;
    for (const key of identical) expect({ language, key }).toEqual({ language, key: expect.stringMatching(BORROWED) });
  });
});

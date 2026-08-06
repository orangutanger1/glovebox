import { en, FRAGMENTS } from "../src/i18n/catalog/en";
import { CATALOGS } from "../src/i18n/catalog";
import type { Entry } from "../src/i18n/catalog/types";
import {
  LANGUAGES,
  formatDate,
  formatNumber,
  formatShortDate,
  resetFormatters,
  resolveLanguage,
  setLanguage,
  t,
  type Language,
} from "../src/i18n";
import { serviceName } from "../src/schedule/names";

/** Languages with a full catalog of their own; the rest are regional overlays. */
const BASE: Language[] = ["de", "fr", "it", "es", "pt-BR", "nl", "sv", "pl", "ja", "ko"];
const OVERLAY: Language[] = ["en-GB", "en-AU", "en-CA", "fr-CA", "es-MX"];

const placeholders = (entry: Entry): string[] => {
  const values = typeof entry === "string" ? [entry] : Object.values(entry);
  const names = new Set<string>();
  for (const value of values) {
    for (const match of value.matchAll(/\{(\w+)\}/g)) names.add(match[1]);
  }
  return [...names].sort();
};

afterEach(() => {
  setLanguage("en");
  resetFormatters();
});

describe("the English catalog", () => {
  test("no two fragments claim the same key", () => {
    const total = Object.values(FRAGMENTS).reduce((n, f) => n + Object.keys(f).length, 0);
    expect(Object.keys(en)).toHaveLength(total);
  });

  test("every key is namespaced by the fragment that owns it", () => {
    for (const [name, fragment] of Object.entries(FRAGMENTS)) {
      for (const key of Object.keys(fragment)) {
        expect(key.startsWith(`${name}.`)).toBe(true);
      }
    }
  });

  test("no value smuggles a unit into the sentence", () => {
    // Distances are formatted by src/units/format, so a literal unit in copy is
    // a string that cannot follow a metric reader. The unit fragment is the one
    // place the abbreviations are allowed to live.
    const offenders: string[] = [];
    for (const [key, entry] of Object.entries(en)) {
      if (key.startsWith("unit.")) continue;
      const values = typeof entry === "string" ? [entry] : Object.values(entry);
      for (const value of values) {
        if (/\b(miles|mileage)\b/i.test(value)) offenders.push(key);
      }
    }
    expect(offenders).toEqual(["onboardingA.odometer.title.mi"]);
  });
});

describe("every shipped language", () => {
  test("is registered, or is English itself", () => {
    for (const language of LANGUAGES) {
      if (language === "en") continue;
      expect(Object.keys(CATALOGS)).toContain(language);
    }
  });

  test.each(BASE)("%s translates every key and invents none", (language) => {
    expect(Object.keys(CATALOGS[language]).sort()).toEqual(Object.keys(en).sort());
  });

  test.each(OVERLAY)("%s overrides only keys that exist", (language) => {
    const keys = Object.keys(CATALOGS[language]);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) expect(en[key]).toBeDefined();
  });

  test.each([...BASE, ...OVERLAY])("%s keeps every placeholder", (language) => {
    for (const [key, entry] of Object.entries(CATALOGS[language])) {
      expect({ key, vars: placeholders(entry) }).toEqual({ key, vars: placeholders(en[key]) });
    }
  });

  test.each([...BASE, ...OVERLAY])("%s answers with a plural for every counted key", (language) => {
    for (const [key, entry] of Object.entries(CATALOGS[language])) {
      if (typeof en[key] === "string") continue;
      expect(typeof entry).not.toBe("string");
      if (typeof entry === "string") continue;
      expect(entry.other).toBeTruthy();
      const allowed = new Intl.PluralRules(language).resolvedOptions().pluralCategories;
      expect(Object.keys(entry).filter((c) => !allowed.includes(c as Intl.LDMLPluralRule))).toEqual(
        []
      );
    }
  });

  test("Polish carries the three forms Polish grammar needs", () => {
    // The one language in the set where one/other is not merely coarse but
    // wrong: 2 przeglądy and 5 przeglądów take different endings.
    const plural = Object.entries(CATALOGS.pl).filter(([, v]) => typeof v !== "string");
    expect(plural.length).toBeGreaterThan(0);
    for (const [key, entry] of plural) {
      expect({ key, forms: Object.keys(entry as object).sort() }).toEqual({
        key,
        forms: ["few", "many", "one", "other"],
      });
    }
  });
});

describe("resolving a language from the phone", () => {
  test("takes an exact regional match before the base language", () => {
    expect(resolveLanguage(["en-AU"])).toBe("en-AU");
    expect(resolveLanguage(["fr-CA", "fr-FR"])).toBe("fr-CA");
  });

  test("falls back to the base language for a region we do not ship", () => {
    expect(resolveLanguage(["de-AT"])).toBe("de");
    expect(resolveLanguage(["es-AR"])).toBe("es");
  });

  test("sends a near neighbour's speakers somewhere readable", () => {
    expect(resolveLanguage(["pt-PT"])).toBe("pt-BR");
    expect(resolveLanguage(["nb-NO"])).toBe("sv");
  });

  test("honours the phone's preference order, not ours", () => {
    expect(resolveLanguage(["ja-JP", "de-DE"])).toBe("ja");
    expect(resolveLanguage(["de-DE", "ja-JP"])).toBe("de");
  });

  test("skips a language we do not ship and tries the next one", () => {
    expect(resolveLanguage(["th-TH", "it-IT"])).toBe("it");
  });

  test("ends at English rather than at nothing", () => {
    expect(resolveLanguage([])).toBe("en");
    expect(resolveLanguage(["th-TH"])).toBe("en");
  });

  test("tolerates an underscore tag", () => {
    expect(resolveLanguage(["pt_BR"])).toBe("pt-BR");
  });
});

describe("t", () => {
  test("fills placeholders and groups numbers for the reader", () => {
    setLanguage("en");
    expect(t("unit.mi", { value: 51771 })).toBe("51,771 mi");
    setLanguage("de");
    resetFormatters();
    expect(t("unit.km", { value: 51771 })).toBe("51.771 km");
  });

  test("picks the plural form the language actually uses", () => {
    // The count is interpolated into every form, so two renderings always
    // differ by the digit. What is being asserted is the wording around it:
    // blank the number out and English changes, Japanese does not.
    const sentence = (count: number) =>
      t("offer.trial.cta", { count }).replace(String(count), "#");

    setLanguage("en");
    expect(sentence(1)).not.toBe(sentence(3));
    setLanguage("ja");
    resetFormatters();
    // Japanese has one form: the same sentence for one and for many, which is
    // correct rather than a missing translation.
    expect(sentence(1)).toBe(sentence(3));
  });

  test("falls through an overlay to its base language and then to English", () => {
    setLanguage("en-GB");
    // An overlay defines a handful of keys; everything else has to still answer.
    for (const key of Object.keys(en)) expect(t(key)).not.toBe(key);
  });

  test("renders the key rather than a blank when nothing defines it", () => {
    expect(t("garage.nothing.like.this")).toBe("garage.nothing.like.this");
  });

  test("leaves a placeholder alone when its value was not passed", () => {
    // Better a visible {name} in review than a sentence with a hole in it.
    expect(t("settings.language")).toBe("Language: {language}");
  });
});

describe("dates and numbers follow the language", () => {
  test("the same day reads as that language writes days", () => {
    setLanguage("en");
    const iso = "2026-09-14T12:00:00.000Z";
    const english = formatDate(iso);
    setLanguage("ja");
    resetFormatters();
    expect(formatDate(iso)).not.toBe(english);
    expect(formatDate(iso)).toContain("2026");
  });

  test("a short date drops the year, in every language", () => {
    setLanguage("de");
    resetFormatters();
    expect(formatShortDate("2026-09-14T12:00:00.000Z")).not.toContain("2026");
  });

  test("grouping is the language's, not the source's", () => {
    setLanguage("pl");
    resetFormatters();
    // Polish groups with a space; asserting the digits and the absence of a
    // comma rather than the exact space, which ICU renders as U+00A0.
    const grouped = formatNumber(51771);
    expect(grouped).not.toContain(",");
    expect(grouped.replace(/\D/g, "")).toBe("51771");
  });
});

describe("service names", () => {
  test("are the reader's words, never the database's", () => {
    setLanguage("de");
    const german = serviceName("Oil Change");
    expect(german).not.toBe("Oil Change");
    setLanguage("en");
    expect(serviceName("Oil Change")).toBe("Oil Change");
  });

  test("name the local legal test rather than translating the word inspection", () => {
    setLanguage("en-GB");
    expect(serviceName("Inspection")).toBe("MOT");
    setLanguage("de");
    expect(serviceName("Inspection")).not.toBe("Inspection");
  });

  test("hand back a type the app has never heard of unchanged", () => {
    // An override the owner typed themselves. Their word for it is the honest
    // answer; inventing a translation would be worse.
    expect(serviceName("Timing Belt")).toBe("Timing Belt");
  });
});

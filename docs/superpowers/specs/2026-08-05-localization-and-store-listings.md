# Glovebox - Localization, Units, and Per-Market Store Listings

Date: 2026-08-05
Status: in app, shipped; on the store, staged behind review

---

## 0. What this is

Glovebox shipped English-only, miles-only, with one App Store listing. This pass
made the app speak sixteen languages, read distances in the unit the market
drives in, and gave fifteen storefronts a listing written from that country's own
search vocabulary rather than a translation of the American one.

The brief came from three ASO write-ups. Their four claims, and what was done
about each:

| Claim | What was done |
|---|---|
| Don't launch in the US first | **Rejected, on the user's instruction.** The US stays primary. Everything else here is compatible with that: the other fifteen listings ship alongside it, so momentum can start wherever it starts. |
| One language = one keyword field; en-GB and en-US index separately | Taken. `en-GB`, `en-AU` and `en-CA` are separate listings with separate keyword fields and their own spelling, units, and legal test. That is four English keyword fields, not one. |
| Translate the pitch, not the app | Taken. Every listing is written per market, and the app itself changes with it: the inspection, its cadence, the distance unit, the interval defaults. |
| Google Translate gives you the dictionary word, not the searched word | Taken, and it is the load-bearing piece. Every keyword field is built from terms harvested out of that storefront's live autocomplete. |

The fourth claim is the one that pays. German owners search **Scheckheft** and
**Ölwechsel**; a dictionary would have produced *Fahrzeugwartungsprotokoll*, which
nobody types. French owners search **vidange**, not *changement d'huile* - except
in Québec, where *vidange* means garbage collection and the search term really is
**changement d'huile**. Swedes search the phrase **digital servicebok** verbatim.
Those are three keyword fields that a translation pass would have got wrong.

---

## 1. Which markets, and why

`research/locales.py` harvests each national storefront's autocomplete;
`.claude/`-side research collected fleet size, fleet age, iOS share and the
inspection regime per country with sources. The ship list is the intersection:
enough cars, enough iOS, enough app spend.

| Locale | Cars | Fleet age | iOS | Legal test | Note |
|---|---|---|---|---|---|
| en-US | 291M | 12.6 yr | 57% | state-level | primary, unchanged |
| en-GB | 38.3M | 9.7 yr | 53.9% | MOT, annual | best non-US market: hard yearly deadline |
| de-DE | 49.3M | 10.3 yr | 35% | TÜV/HU, 2 yr | largest EU fleet; also serves AT (Pickerl) and CH (MFK) |
| ja | 61.8M | 9.0 yr | 63.6% | 車検, 2 yr | #1 per-capita App Store spend |
| fr-FR | 39.7M | 11.0 yr | 30% | contrôle technique, 2 yr | |
| it | 41.3M | 13.0 yr | 30% | revisione, 2 yr | highest EU motorisation, 701/1000 |
| es-ES | 26.5M | 14.5 yr | 30% | ITV, 2 yr then annual past 10 | old fleet, strong independent-garage demand |
| en-CA | 24.6M | 10.5 yr | 65.9% | **none** | highest iOS share in the set |
| en-AU | 16.1M | 11.3 yr | 63.7% | state-based | #2 per-capita spend |
| pl | 20.5M | 15.2 yr | 35.2% | przegląd, annual | best CEE fleet case |
| ko | 26.6M | - | 34.6% | 정기검사, 2 yr | 38.4% of fleet is 10 yr+ |
| pt-BR | 39.5M | 11.4 yr | 22.4% | **none** | third-largest fleet |
| nl-NL | 9.6M | 12.1 yr | 33.4% | APK, annual | strictly enforced |
| sv | 5.0M | - | 58.8% | besiktning | best revenue per translated string in the Nordics |
| es-MX | - | **16.2 yr** | 21.3% | state emissions only | oldest fleet measured anywhere; cheap variant of es-ES |
| fr-CA | - | - | 65.9% | **none in Québec** | overlay on fr-FR, not a separate translation |

Dropped after measuring: **Turkey** (202 cars/1000 and 25.8% iOS - fleet-rich on
paper, poor on both multipliers), **Saudi Arabia** (11.3M vehicles cannot pay for
a right-to-left layout pass), **Czechia** and **Hungary** (small fleets, low
spend, and their autocomplete returned almost nothing).

Two locales have listings that are **judgement, not evidence**: Polish, whose
storefront returned three completions for thirteen seeds, and Canadian French,
where sixteen of nineteen completions were other apps' names. Both listings say
so in their own `notes.reasoning`, and the Polish one carries a concrete
suggestion for validating it later (two-word prefixes, or a one-week Search Ads
Discovery campaign read for impressions).

---

## 2. Distance, which was never really about language

The app was miles-only, and not by configuration: the string `mi` was concatenated
into text at some forty sites, and `service_intervals.miles` was a column name.
Shipping that into Germany would have asked an owner to type 51,771 into a field
labelled miles.

- **One unit for the whole app**, in `app_state.distance_unit`, not one per
  vehicle. A garage with two cars measured differently is a bug, not a feature,
  and "oil change every 10,000" has exactly one meaning across the garage.
- **First launch picks from the phone's region**; every launch after that reads
  what is stored, so a user who changed it keeps their choice. Only the US, the
  UK and Myanmar get miles.
- **Migration 4 renames the column** `service_intervals.miles` -> `distance`. The
  values were already correct; only the label was a lie.
- **Switching units converts every stored reading** inside one transaction, and
  the confirmation dialog names the number out loud ("A 50,000 mi reading becomes
  80,467 km") because relabelling the digits and leaving them alone would turn a
  51,771 mi car into a 51,771 km car.
- **Interval defaults are metric numbers, not conversions.** Oil is 10,000 km, not
  8,047 km. Inspection cadence is per market: 12 months in the UK and the
  Netherlands, 24 in Germany, and **null** in Canada and Brazil, where there is no
  test and inventing a deadline would be a lie the app tells every month.

---

## 3. The in-app system

- `src/i18n/` - `catalog/en/*.ts` is 18 fragments and 366 keys, the single source
  of truth; `catalog/<lang>.ts` is one file per language; regional files
  (`enGB`, `enAU`, `enCA`, `frCA`, `esMX`) are **overlays** holding only the keys
  whose wording differs, so a fix to the base language reaches them.
- `t(key, vars)` interpolates `{name}` placeholders and selects plurals through
  `Intl.PluralRules`, which is why Polish gets its four forms and Japanese its
  one without either being special-cased.
- Dates and numbers go through `Intl.DateTimeFormat` / `NumberFormat`, and every
  distance goes through `formatDistance`, so "51 771 km" is grouped the way the
  reader's language groups it.
- Language is `app_state.app_language`, defaulting to the phone. The picker is
  Settings -> Language; changing it bumps a locale epoch that remounts the tree,
  because a screen holding sentences from the previous language is worse than a
  flash.
- `service.Inspection` is the one string that is not a translation. It is MOT,
  TÜV (HU), contrôle technique, revisione, ITV, APK, besiktning, przegląd
  techniczny, 車検, 정기검사, Roadworthy, or Safety Inspection, each with the
  cadence that market actually runs.

Two tests defend this. `tests/i18n.test.ts` checks the machinery. 
`tests/localization-smoke.test.ts` renders **every key in every language** at
eight plural counts with every placeholder filled, and fails on an unfilled
`{placeholder}`, an empty render, a key that renders as itself, or a base
language quietly serving the English sentence. The allowlist of legitimately
identical strings is enumerated in that file with a reason per entry.

---

## 4. The listings

`store/staged/<locale>.json` is one file per locale: name, subtitle, keywords,
promo text, description, plus a `notes` block recording which harvested terms were
used, which were rejected as other apps' names, and what came from judgement
rather than evidence. `store/stage-locales.py` expands them into the canonical
`app-info/` + `version/1.0/` layout `asc` reads, checking every length on the way.

Four English keyword fields, none of them the same:

| | name | subtitle |
|---|---|---|
| en-US | Glovebox: Car Maintenance Log | Service Reminders & Repair Log |
| en-GB | Glovebox: Car Service Log | MOT & Oil Change Reminders |
| en-AU | Glovebox: Car Service Log | Rego, Mileage & Oil Reminders |
| en-CA | Glovebox: Car Maintenance Log | Oil Change & Tire Reminders |

The rest, each built on its market's own head term: **Auto Wartung / Digitales
Scheckheft & TÜV**, **Entretien auto / Carnet auto, rappel vidange**,
**Manutenzione Auto / Scadenze, tagliandi, revisione**, **Mantenimiento coche /
Historial, ITV y kilometraje**, **Bitácora del Auto**, **Manutenção do Carro**,
**Auto-onderhoud / APK, beurt en kilometerstand**, **Digital servicebok /
Bilservice, besiktning, däck**, **Książka serwisowa**, **車の整備記録・車検・
オイル交換**, **차계부 정비 기록**.

Three rules were enforced on every one of them:

1. **No word twice.** Apple indexes name + subtitle + keywords as one bag, so a
   word in the name is not repeated in the keyword field. Verified per locale.
2. **No keyword the app cannot honour.** The largest cluster in the German
   harvest is *Fahrtenbuch* - a tax trip log. The largest in the Japanese harvest
   is 燃費 - fuel economy. Both were dropped, along with Spanish *gastos*,
   Brazilian expense tracking and Korean 정비소 booking. Ranking for a feature the
   app does not have buys a one-star review, not a user.
3. **No invented deadline.** Canada, Brazil and Québec have no periodic test, and
   their listings say so and sell manufacturer intervals and resale proof instead.

Cross-checked, all fifteen: within every Apple limit (longest: `it` subtitle at
30/30, `en-GB` keywords at 100/100), no space after any comma, valid JSON, both
URL lines byte-identical to en-US.

---

## 5. Launch order

1. **1.0 ships in the US.** In review now; nothing here touches it.
2. **The moment it leaves review, `./store/apply-when-ready.sh` pushes the fifteen
   listings.** The script refuses to run in `WAITING_FOR_REVIEW` - adding
   localizations to a version Apple is reading either restarts the clock or gets
   the submission flagged. Verified: it refuses today.
3. **The next binary carries the app localizations.** `CFBundleLocalizations` in
   `app.json` already declares all sixteen, so the store page shows the language
   list; the strings ship with the build after 1.0.
4. **Search Ads follow the organic data, not the other way round.** The existing
   $33 test campaign (`research/asa/campaign-plan.md`) is US-only. Its per-locale
   siblings should wait for two weeks of organic impression data per storefront -
   the harvest says what people type, not how many, and Discovery-campaign
   impressions are the cheapest way to buy that number for Poland and Québec,
   where the harvest failed.

Expansion order once there is data, by expected return: **en-GB** (annual MOT,
53.9% iOS, top-5 market), **ja** (#1 spend, 車検 ritual), **en-CA** and **en-AU**
(65.9% and 63.7% iOS, cheap English variants), **de-DE**, then the rest.

---

## 6. What is deliberately not done

- **Localized screenshots.** All six screenshots are English. Apple falls back to
  the primary language's screenshots for any locale that has none, so nothing is
  broken - but the article's point stands: a German listing with English
  screenshots reads unfinished, and this is the largest remaining conversion
  gap. It needs a simulator run per locale, which this environment cannot do.
- **RTL.** Arabic and Hebrew need a layout pass, not a catalog.
- **Per-vehicle units.** Considered and rejected in §2.
- **Price localization.** Still USD-converted defaults; PPP tiers are a separate
  question from language.

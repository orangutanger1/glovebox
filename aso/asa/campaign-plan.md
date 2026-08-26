# Apple Search Ads plan — Wrenchy

Generated 2026-08-26T22:14:51.000Z from `/home/myen/glovebox/aso/en-US/scored.json`.

Re-rendered 2026-08-26T22:27:03.342Z from `campaign-plan.json` — `ship ads plan --render`.

This plan is **bound to a live account**: 71 Apple object id(s) recorded by `ship ads sync`, last at 2026-08-26T22:13:56.194Z. Hand-set bids, pruned ad groups and keywords outside the ASO set exist **only** in `campaign-plan.json`, so `ship ads plan` refuses to overwrite it without `--force`. To refresh this document alone, use `ship ads plan --render`.

- **Market**: US (locale en-US)
- **Daily budget**: $32.00 across 4 campaigns — campaign — Apple Search Ads has no ad-group budget
- **Split**: exact $12.00 · discovery $15.00 · competitor $4.00 · brand $1.00
- **Bids**: $0.30–$1.50 — 10 distinct bid(s)
- **Stamped parameters are historical**: this plan was generated for $30.00/day with bids `$0.65 (--bid) × (0.75 + demand/200), clamped to [$0.30, $1.00]`, and has since been changed by hand or adopted from the account. Every number above and below is read from the campaigns, which is what `ship ads sync` pushes; `params` in `campaign-plan.json` records the run that first created them and is not re-derived.
- **Demand floor**: aso.minVolume 0
- **What an install is worth**: unknown — --no-ltv-check

## Kill rule

`installs === 0 AND taps >= 6 AND spend > $2.20` → **pause the keyword**.

waste line = 2 × target CPI $1.10; 6 taps is the sample size at which a 40% tap→install keyword would have converted with 95% probability

Concretely: negate a keyword once it has taken at least 6 taps and spent more than $2.20 without an install. Both conditions, not either: at 40% tap→install, three taps produce nothing 22% of the time, so a spend threshold alone negates healthy keywords. `ship ads mine` applies exactly this rule from the search-term report and stamps these numbers into every artifact.

## Wrenchy · Exact · US

One ad group per keyword, for creative control: an ad group is the smallest object that can carry its own Custom Product Page and its own bid. Budget is set on the campaign — Apple has no ad-group budget.

$12.00/day ($360.00 over 30 days) · US · 15 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| EX · oil change reminder | oil change reminder `EXACT` $0.77 | 88 | $0.77 | — | Car Maintenance Reminders (172)<br>Car oil change tracker (1)<br>Oil Change Reminder (1) |
| EX · auto maintenance log | auto maintenance log `EXACT` $0.77 | 88 | $0.77 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>MyAutoLog: Car Maintenance Log (61) |
| EX · free car maintenance tracker | free car maintenance tracker `EXACT` $0.74 | 77 | $0.74 | — | Vehicle Maintenance Tracker (2886)<br>CARFAX Car Care (126227)<br>Maintenance: Car Tracker (0) |
| EX · auto maintenance tracker | auto maintenance tracker `EXACT` $0.77 | 88 | $0.77 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>MyAutoLog: Car Maintenance Log (61) |
| EX · vehicle maintenance log | vehicle maintenance log `EXACT` $0.75 | 81 | $0.75 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>Vehicle Maintenance Log: VML (7) |
| EX · fuel monitor service reminder | fuel monitor service reminder `EXACT` $0.77 | 88 | $0.77 | — | Fuel Monitor Service Reminder (2)<br>Fuelly: MPG & Service Tracker (29392)<br>Fuel Pass BD (0) |
| EX · vehicle maintenance tracker | vehicle maintenance tracker `EXACT` $0.77 | 88 | $0.77 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>Vehicle Service Manager (26) |
| EX · car maintenance reminder | car maintenance reminder `EXACT` $0.72 | 70 | $0.72 | — | Car Maintenance Reminders (172)<br>CARFAX Car Care (126227)<br>Car Maintenance Tracker: CarIQ (2) |
| EX · car maintenance tracker | car maintenance tracker `EXACT` $0.78 | 90 | $0.78 | — | CARFAX Car Care (126227)<br>Vehicle Maintenance Tracker (2886)<br>Car Maintenance Reminders (172) |
| EX · car maintenance log | car maintenance log `EXACT` $0.78 | 90 | $0.78 | — | Vehicle Maintenance Tracker (2886)<br>CARFAX Car Care (126227)<br>Car Maintenance Reminders (172) |
| EX · car service tracker | car service tracker `EXACT` $0.75 | 81 | $0.75 | — | CARFAX Car Care (126247)<br>Vehicle Maintenance Tracker (2887)<br>Fuelly: MPG & Service Tracker (29392) |
| EX · vehicle maintenance journal | vehicle maintenance journal `EXACT` $0.71 | 67 | $0.71 | — | Car Maintenance Tracker: CarIQ (2)<br>Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247) |
| EX · vehicle maintenance | vehicle maintenance `EXACT` $0.73 | 74 | $0.73 | — | CARFAX Car Care (126247)<br>Vehicle Maintenance Tracker (2887)<br>Vehicle Service Manager (26) |
| EX · auto maintenance | auto maintenance `EXACT` $0.73 | 74 | $0.73 | — | MyAutoLog: Car Maintenance Log (61)<br>Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247) |
| EX · auto maintenance fuel diary | auto maintenance fuel diary `EXACT` $0.68 | 60 | $0.68 | — | Auto Maintenance Fuel Diary (0)<br>Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247) |

## Wrenchy · Discovery · US

Broad match plus Search Match, with every Exact term negated so the two cannot cannibalise each other.

$15.00/day ($450.00 over 30 days) · US · 1 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| DISC · US | car maintenance `BROAD` $0.75<br>service reminder `BROAD` $0.75<br>oil change `BROAD` $0.75<br>oil change reminder `BROAD` $0.75<br>auto maintenance log `BROAD` $0.75<br>free car maintenance tracker `BROAD` $0.75<br>auto maintenance tracker `BROAD` $0.75<br>vehicle maintenance log `BROAD` $0.75<br>fuel monitor service reminder `BROAD` $0.75<br>vehicle maintenance tracker `BROAD` $0.75<br>car maintenance reminder `BROAD` $0.75<br>car maintenance tracker `BROAD` $0.75<br>car maintenance log `BROAD` $0.75<br>car service tracker `BROAD` $0.75<br>vehicle maintenance journal `BROAD` $0.75<br>vehicle maintenance `BROAD` $0.75<br>auto maintenance `BROAD` $0.75<br>auto maintenance fuel diary `BROAD` $0.75 | 81 | $0.75 | — | — |

Negatives: `oil change reminder` (EXACT), `auto maintenance log` (EXACT), `free car maintenance tracker` (EXACT), `auto maintenance tracker` (EXACT), `vehicle maintenance log` (EXACT), `fuel monitor service reminder` (EXACT), `vehicle maintenance tracker` (EXACT), `car maintenance reminder` (EXACT), `car maintenance tracker` (EXACT), `car maintenance log` (EXACT), `car service tracker` (EXACT), `vehicle maintenance journal` (EXACT), `vehicle maintenance` (EXACT), `auto maintenance` (EXACT), `auto maintenance fuel diary` (EXACT), `wrenchy` (EXACT), `segway-ninebot` (EXACT), `segway` (EXACT), `ninebot` (EXACT), `jiffy lube` (EXACT), `throo drivers` (EXACT), `spark driver` (EXACT), `throo` (EXACT), `spark` (EXACT), `scooter` (EXACT), `electric scooter` (EXACT), `oil change coupon` (EXACT), `valvoline` (EXACT), `take 5 oil change` (EXACT)

## Wrenchy · Competitor · US

Exact match on the apps you are compared to; your own name is negated here so Brand keeps that traffic at its own price.

$4.00/day ($120.00 over 30 days) · US · 6 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| COMP · fuelly | fuelly `EXACT` $1.50 | 81 | $1.50 | — | Vehicle Maintenance Tracker (2887) |
| COMP · drivvo | drivvo `EXACT` $1.50 | 81 | $1.50 | — | Vehicle Maintenance Tracker (2887) |
| COMP · simply auto | simply auto `EXACT` $1.50 | 81 | $1.50 | — | Vehicle Maintenance Tracker (2887) |
| COMP · carfax car care | carfax car care `EXACT` $1.50 | 81 | $1.50 | — | Vehicle Maintenance Tracker (2887) |
| COMP · autosist | autosist `EXACT` $1.50 | 81 | $1.50 | — | Vehicle Maintenance Tracker (2887) |
| COMP · fuelio | fuelio `EXACT` $1.50 | 81 | $1.50 | — | Vehicle Maintenance Tracker (2887) |

Negatives: `wrenchy` (EXACT)

## Wrenchy · Brand · US

Your own name is the cheapest tap you will ever buy, and the one a competitor buys if you do not.

$1.00/day ($30.00 over 30 days) · US · 1 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| BRAND · wrenchy | wrenchy `EXACT` $0.30<br>wrenchy `BROAD` $0.30<br>wrenchy app `EXACT` $0.30<br>wrenchy car `EXACT` $0.30<br>wrenchy car service log `EXACT` $0.30 | 100 | $0.30 | — | — |

Sanity-check each bid against the incumbents: a keyword whose top 3 are 50k-rating
apps will not convert at any bid you can afford, however high its opportunity score.

This file is **desired state**. What is live is in `snapshot.json` (`ship ads snapshot`);
`ship ads sync` reconciles the two by Apple object id and prints every transition first.

Push with `ship ads sync` (dry-run first: `ship ads sync --dry-run`), then close the loop
with `ship ads mine`, which turns the search-term report back into keywords.

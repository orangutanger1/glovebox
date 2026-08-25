# Apple Search Ads plan — Wrenchy

Generated 2026-08-25T04:47:38.193Z from `/home/myen/glovebox/aso/en-US/scored.json`.

- **Market**: US (locale en-US)
- **Daily budget**: $10.00 across 4 campaigns — campaign — Apple Search Ads has no ad-group budget
- **Split**: exact $5.00 · discovery $2.50 · competitor $1.50 · brand $1.00 — default 50/25/15/10 exact/discovery/competitor/brand, overridable with --split; a skipped campaign redistributes its share
- **Bids**: $0.35 (realised CPT) × (0.75 + demand/200), clamped to [$0.30, $2.00] — 6 distinct bid(s)
- **Demand floor**: aso.minVolume 0
- **What an install is worth**: 32 customer(s), 0 trial(s), 0 subscription(s), $0.00 revenue, $0.00 MRR — nothing has monetised, so no CPI is profitable

## Kill rule

`installs === 0 AND taps >= 6 AND spend > $2.20` → **pause the keyword**.

waste line = 2 × target CPI $1.10; 6 taps is the sample size at which a 40% tap→install keyword would have converted with 95% probability

Concretely: negate a keyword once it has taken at least 6 taps and spent more than $2.20 without an install. Both conditions, not either: at 40% tap→install, three taps produce nothing 22% of the time, so a spend threshold alone negates healthy keywords. `ship ads mine` applies exactly this rule from the search-term report and stamps these numbers into every artifact.

## Wrenchy · Exact · US

One ad group per keyword, for creative control: an ad group is the smallest object that can carry its own Custom Product Page and its own bid. Budget is set on the campaign — Apple has no ad-group budget.

$5.00/day ($150.00 over 30 days) · US · 15 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| EX · oil change reminder | oil change reminder `EXACT` $0.42 | 88 | $0.42 | — | Car Maintenance Reminders (172)<br>Car oil change tracker (1)<br>Oil Change Reminder (1) |
| EX · auto maintenance log | auto maintenance log `EXACT` $0.42 | 88 | $0.42 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>MyAutoLog: Car Maintenance Log (61) |
| EX · free car maintenance tracker | free car maintenance tracker `EXACT` $0.40 | 77 | $0.40 | — | Vehicle Maintenance Tracker (2886)<br>CARFAX Car Care (126227)<br>Maintenance: Car Tracker (0) |
| EX · auto maintenance tracker | auto maintenance tracker `EXACT` $0.42 | 88 | $0.42 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>MyAutoLog: Car Maintenance Log (61) |
| EX · vehicle maintenance log | vehicle maintenance log `EXACT` $0.40 | 81 | $0.40 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>Vehicle Maintenance Log: VML (7) |
| EX · fuel monitor service reminder | fuel monitor service reminder `EXACT` $0.42 | 88 | $0.42 | — | Fuel Monitor Service Reminder (2)<br>Fuelly: MPG & Service Tracker (29392)<br>Fuel Pass BD (0) |
| EX · vehicle maintenance tracker | vehicle maintenance tracker `EXACT` $0.42 | 88 | $0.42 | — | Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247)<br>Vehicle Service Manager (26) |
| EX · car maintenance reminder | car maintenance reminder `EXACT` $0.39 | 70 | $0.39 | — | Car Maintenance Reminders (172)<br>CARFAX Car Care (126227)<br>Car Maintenance Tracker: CarIQ (2) |
| EX · car maintenance tracker | car maintenance tracker `EXACT` $0.42 | 90 | $0.42 | — | CARFAX Car Care (126227)<br>Vehicle Maintenance Tracker (2886)<br>Car Maintenance Reminders (172) |
| EX · car maintenance log | car maintenance log `EXACT` $0.42 | 90 | $0.42 | — | Vehicle Maintenance Tracker (2886)<br>CARFAX Car Care (126227)<br>Car Maintenance Reminders (172) |
| EX · car service tracker | car service tracker `EXACT` $0.40 | 81 | $0.40 | — | CARFAX Car Care (126247)<br>Vehicle Maintenance Tracker (2887)<br>Fuelly: MPG & Service Tracker (29392) |
| EX · vehicle maintenance journal | vehicle maintenance journal `EXACT` $0.38 | 67 | $0.38 | — | Car Maintenance Tracker: CarIQ (2)<br>Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247) |
| EX · vehicle maintenance | vehicle maintenance `EXACT` $0.39 | 74 | $0.39 | — | CARFAX Car Care (126247)<br>Vehicle Maintenance Tracker (2887)<br>Vehicle Service Manager (26) |
| EX · auto maintenance | auto maintenance `EXACT` $0.39 | 74 | $0.39 | — | MyAutoLog: Car Maintenance Log (61)<br>Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247) |
| EX · auto maintenance fuel diary | auto maintenance fuel diary `EXACT` $0.37 | 60 | $0.37 | — | Auto Maintenance Fuel Diary (0)<br>Vehicle Maintenance Tracker (2887)<br>CARFAX Car Care (126247) |

## Wrenchy · Discovery · US

Broad match plus Search Match, with every Exact term negated so the two cannot cannibalise each other.

$2.50/day ($75.00 over 30 days) · US · 1 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| DISC · US | oil change reminder `BROAD` $0.40<br>auto maintenance log `BROAD` $0.40<br>free car maintenance tracker `BROAD` $0.40<br>auto maintenance tracker `BROAD` $0.40<br>vehicle maintenance log `BROAD` $0.40<br>fuel monitor service reminder `BROAD` $0.40<br>vehicle maintenance tracker `BROAD` $0.40<br>car maintenance reminder `BROAD` $0.40<br>car maintenance tracker `BROAD` $0.40<br>car maintenance log `BROAD` $0.40<br>car service tracker `BROAD` $0.40<br>vehicle maintenance journal `BROAD` $0.40<br>vehicle maintenance `BROAD` $0.40<br>auto maintenance `BROAD` $0.40<br>auto maintenance fuel diary `BROAD` $0.40 | 81 | $0.40 | — | — |

Negatives: `oil change reminder` (EXACT), `auto maintenance log` (EXACT), `free car maintenance tracker` (EXACT), `auto maintenance tracker` (EXACT), `vehicle maintenance log` (EXACT), `fuel monitor service reminder` (EXACT), `vehicle maintenance tracker` (EXACT), `car maintenance reminder` (EXACT), `car maintenance tracker` (EXACT), `car maintenance log` (EXACT), `car service tracker` (EXACT), `vehicle maintenance journal` (EXACT), `vehicle maintenance` (EXACT), `auto maintenance` (EXACT), `auto maintenance fuel diary` (EXACT), `wrenchy` (EXACT)

## Wrenchy · Competitor · US

Exact match on the apps you are compared to; your own name is negated here so Brand keeps that traffic at its own price.

$1.50/day ($45.00 over 30 days) · US · 3 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| COMP · vehicle maintenance tracker | vehicle maintenance tracker `EXACT` $0.40 | 81 | $0.40 | — | Vehicle Maintenance Tracker (2887) |
| COMP · carfax car care | carfax car care `EXACT` $0.40 | 81 | $0.40 | — | CARFAX Car Care (126247) |
| COMP · myautolog | myautolog `EXACT` $0.40 | 81 | $0.40 | — | MyAutoLog: Car Maintenance Log (61) |

Negatives: `wrenchy` (EXACT)

## Wrenchy · Brand · US

Your own name is the cheapest tap you will ever buy, and the one a competitor buys if you do not.

$1.00/day ($30.00 over 30 days) · US · 1 ad group(s)

| ad group | keywords | demand | bid | product page | incumbents |
| --- | --- | ---: | ---: | --- | --- |
| BRAND · wrenchy | wrenchy `EXACT` $0.44<br>wrenchy `BROAD` $0.44 | 100 | $0.44 | — | — |

Sanity-check each bid against the incumbents: a keyword whose top 3 are 50k-rating
apps will not convert at any bid you can afford, however high its opportunity score.

This file is **desired state**. What is live is in `snapshot.json` (`ship ads snapshot`);
`ship ads sync` reconciles the two by Apple object id and prints every transition first.

Push with `ship ads sync` (dry-run first: `ship ads sync --dry-run`), then close the loop
with `ship ads mine`, which turns the search-term report back into keywords.

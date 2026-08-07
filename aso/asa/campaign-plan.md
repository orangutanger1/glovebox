# Apple Search Ads plan — Glovebox

Generated 2026-08-07T19:27:28.088Z from `/home/myen/idea6/aso/en-US/scored.json`.

- **Campaign**: Glovebox · Exact · US
- **Market**: US (locale en-US)
- **Daily budget**: $10.00 across 15 ad groups
- **Starting bid**: $0.30 — perKeywordDailyBudget / 5 taps, clamped to [0.30, 2.00]
- **Structure**: one exact-match ad group per keyword, so every keyword has its own budget and its own verdict.

## Kill rule

`spend > monthlyRevenuePerSubscriber AND conversions === 0` over 7 days → **pause the keyword**.

A keyword that burns $4.99 — one month of subscription revenue — without a single conversion has already lost money on the best case it will ever have. Pause it; do not "give it more data".

Concretely: after 7 days, pause any keyword that has spent more than $4.99 with zero conversions.

## Ad groups

| keyword | opportunity | daily | bid | median ratings | weak apps (top 10) | exact title matches | incumbents |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| service link | 86.0 | $0.67 | $0.30 | 23 | 8 | 0 | ServiceLink for Business (22)<br>ServiceLink Flex (23)<br>EXOS Signing Agent (63) |
| servicelink flex | 80.0 | $0.67 | $0.30 | 38 | 9 | 1 | ServiceLink Flex (23)<br>SalesLink Flex (2)<br>Salesforce Field Service (19986) |
| oil change reminder | 79.0 | $0.67 | $0.30 | 13 | 8 | 1 | Car Maintenance Reminders (172)<br>Car oil change tracker (1)<br>Valvoline Instant Oil Change (2258) |
| service titan field | 76.0 | $0.67 | $0.30 | 54 | 7 | 0 | ServiceTitan Field (4417)<br>ServiceTitan Field Pro (87)<br>Titan GPS FieldDocs (4) |
| free car maintenance tracker | 76.0 | $0.67 | $0.30 | 54 | 7 | 0 | Vehicle Maintenance Tracker (2870)<br>Car Maintenance Tracker: CarIQ (2)<br>CARFAX Car Care (125652) |
| service fusion | 75.0 | $0.67 | $0.30 | 34 | 9 | 2 | Service Fusion By EverPro (18)<br>Service Fusion (1421)<br>FusionPay (5) |
| service logistics go | 75.0 | $0.67 | $0.30 | 178 | 7 | 0 | Porter - Logistics Service App (1994)<br>GOFO DRIVER (178)<br>GoShare: Deliver, Move, LTL (13394) |
| service channel provider | 74.0 | $0.67 | $0.30 | 298 | 7 | 0 | ServiceChannel Provider (123)<br>ServiceChannel (745)<br>My Spectrum (3415653) |
| service titan | 73.0 | $0.67 | $0.30 | 101 | 4 | 0 | ServiceTitan Mobile (1634)<br>ServiceTitan Field (4417)<br>ServiceTitan Field Pro (87) |
| car maintenance reminder | 73.0 | $0.67 | $0.30 | 87 | 8 | 1 | CARFAX Car Care (125652)<br>Car Maintenance Tracker: CarIQ (2)<br>Vehicle Maintenance Tracker (2870) |
| servicenow events | 70.0 | $0.67 | $0.30 | 155 | 3 | 1 | ServiceNow Events (273)<br>ServiceNow Agent (2477)<br>My ServiceNow (37) |
| field service lightning | 68.0 | $0.67 | $0.30 | 201 | 6 | 0 | Salesforce Field Service (19986)<br>Salesforce (350221)<br>Field Lightning Scanner (1) |
| car maintenance log | 55.0 | $0.67 | $0.30 | 50 | 8 | 5 | CARFAX Car Care (125652)<br>Vehicle Maintenance Tracker (2870)<br>Car Maintenance Reminders (172) |
| car maintenance tracker | 55.0 | $0.67 | $0.30 | 114 | 6 | 3 | CARFAX Car Care (125652)<br>Vehicle Maintenance Tracker (2870)<br>Fuelly: MPG & Service Tracker (29331) |
| service finance company, llc | 55.0 | $0.67 | $0.30 | 1441 | 3 | 0 | Service Finance Borrower App (71)<br>Service Finance Dealer App (130)<br>CFC Mobile Access (8987) |

Sanity-check each bid against the incumbents: a keyword whose top 3 are 50k-rating
apps will not convert at any bid you can afford, however high its opportunity score.

Push with `ship ads sync` (dry-run first: `ship ads sync --dry-run`).

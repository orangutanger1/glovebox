# Wrenchy — TikTok Content Strategy (Slideshow-First)

Built entirely from what the app actually is and does. Nothing below invents a
feature, a claim, or a number.

## What the app is (the strategy's foundation)

- **App:** Wrenchy: Car Service Log — logs every service per car, computes due
  dates by time AND mileage ("whichever comes first"), and sends exactly one
  reminder per service, on the day it's due.
- **Core differentiation (architectural, real):** no account, no login, no
  server, no sync. Local SQLite, append-only writes, undo everywhere, CSV
  export free forever. "Records cannot be lost."
- **Target audience (verbatim from the listing):** daily drivers, DIY
  mechanics, car flippers, and anyone who wants proof of maintenance history
  when it's time to sell.
- **Pre-written hooks that already exist in the app's copy** (use them
  verbatim — they were mined from 1,400+ competitor reviews):
  - "Cars don't warn you. This does."
  - "Deferred maintenance is not saved money. It is the same money later, with a tow in front of it."
  - "Nothing is missed on purpose. It is missed on an ordinary Tuesday."
  - "A glovebox is not an index." / "A spreadsheet cannot tap you on the shoulder."
  - "The shop's records are the shop's."
  - "Unproven service is unperformed service."
  - "A full history is worth more than a clean one."
  - "They know your history. You do not."
- **Hard, true stat for hooks:** 691 of 1,715 App Store reviews of competing
  maintenance apps are 1–3 stars. Top complaint themes across 9 competitors:
  lost records/sync (179 mentions), price (87), forced accounts (83), crashes (59).
- **Signature visuals:** instrument-cluster UI (matte black, metal faceplates,
  red/green telltale lamps), the animated rolling odometer, the red "overdue"
  card ("400 mi over"), the live "Working out the schedule." computation screen.

## Production notes for every slideshow

- 6–8 slides, 2.5–3.5s each. First slide IS the hook — treat it like a
  thumbnail: max ~8 words, huge type.
- Dark instrument-cluster UI is the brand. Use the app's real screenshots
  wherever possible; native TikTok look beats polished ad look.
- Slideshows on TikTok autoplay with a sound loop — pick a moody/mechanical
  trending sound, sync slide cuts to it where possible.
- Never claim the app does things it doesn't (no health score, no PDF export,
  no backup/sync). Honesty is itself a content angle (see #3).
- CTA conventions: "link in bio" for downloads, "save this" for checklists,
  "comment below" for discussion bait. Don't stack CTAs.

## Content pillars (ratio to aim for over a month)

- Problem/pain-point (~35%) — the "ordinary Tuesday" anxiety angle
- Proof & money (~25%) — resale value, upsell protection, costs
- Exposé/myths (~20%) — competitor reviews, data loss, dealer myths
- Tool/demo (~20%) — 10-second log, cluster UI, odometer, CSV export

---

# Slideshow Concepts (ranked strongest → weakest)

## 1. The 1-Star Bloodbath (competitor review exposé)

**Concept:** Use real, verifiable market data as the hook. "I read 1,715
reviews of car maintenance apps. Here's what people are furious about." This
is native TikTok exposé format, and it's true — the numbers come from the
actual review mining in the app's own onboarding.

**Target audience:** Anyone who already has (or considered) a maintenance app
and got burned; skeptical car people who hate apps.

**Slide-by-slide:**
1. **Hook:** "I read 1,715 reviews of car maintenance apps. 691 are 1–3 stars."
2. "The #1 complaint isn't price. It's this:" → **"ALL of the service dates went to Jan 1, 0001."** (real quoted complaint theme: lost records/sync, 179 mentions)
3. "Complaint #2: forced accounts." → "One bad login and years of service history disappear."
4. "Complaint #3: subscriptions holding records hostage."
5. "So I built the opposite." → (screenshot: garage screen) "No account. No login. No server."
6. "Records live on your phone only. CSV export free forever — so they're never hostage."
7. **CTA:** "It's called Wrenchy. Your records can't disappear." + link in bio.

**Visual direction:** Slides 1–4 are text-on-dark with big numbers styled like
odometer digits; screenshot quote-cards of the complaint themes (paraphrased,
never invent quotes). Slides 5–7: real Wrenchy garage screenshots on the matte
black cluster background, green lamps for the "settled facts."

**CTA:** Link in bio → download.

**Caption:** "I mined every review of every car maintenance app before building one. The pattern was brutal — and it's why Wrenchy has no account and no server. Your records live on your phone, period. 🔧"

**Hashtags:** #cartok #carapps #carcare #appreview #mechanic

**Content goal:** Awareness + downloads. Strongest because it leads with a
shocking true number and positions against a shared enemy.

---

## 2. "When Was Your Last Oil Change?" (comment-bait + relatable)

**Concept:** Almost nobody knows. Turn the guess into a comment game, then
reveal the app computes it in one screen.

**Target audience:** Daily drivers — the widest possible audience.

**Slide-by-slide:**
1. **Hook:** "Be honest: when was your last oil change?"
2. "If your answer is 'uhh… spring? maybe last year?' — that's normal. Memory isn't a system."
3. "Receipts in the glovebox prove it happened. They never tell you what's due NEXT." ("A glovebox is not an index")
4. "Your shop knows your history. You don't." ("They know your history. You do not.")
5. (Screenshot: vehicle detail with last-service gauges) "This is 30 seconds of setup, one time."
6. (Screenshot: due list + reminder) "Then the app tells you — by date OR miles, whichever comes first. One reminder. On the day it's due. Nothing else."
7. **CTA:** "Cars don't warn you. This does." — link in bio.

**Visual direction:** Slide 1: plain text on dark, huge. Slides 2–4: minimal
typography (the app's own one-liners work as slide text). Slides 5–6: real
screenshots of the cluster gauges and due list. Slide 7: paywall headline
"Cars don't warn you. This does." as the closer.

**CTA:** Link in bio; also "comment your mileage and I'll tell you what's probably overdue" to farm comments.

**Caption:** "Comment your answer — no judgment. 🛢️ Mine was 'I genuinely don't remember.' That's why every service in Wrenchy gets exactly one reminder, on the day it's due. By miles or by months, whichever comes first."

**Hashtags:** #oilchange #cartok #carcaretips #dailycar #relatable

**Content goal:** Comments (reach) + downloads.

---

## 3. The Resale Receipt (money/pro proof)

**Concept:** At trade-in or private sale, the buyer discounts what you can't
show them. A full maintenance log is negotiable evidence. High save-rate
money content.

**Target audience:** People selling/trading a car in the next 1–3 years;
car flippers.

**Slide-by-slide:**
1. **Hook:** "The dealership will lowball you. Your maintenance log is how you fight back."
2. "'A full history is worth more than a clean one. The buyer discounts what you cannot show them. So does the dealer.'" (app's own copy — use as a quote card)
3. "Two identical cars. One has printed proof of every oil change, rotation, and repair."
4. "The other has 'uh, I think I did the brakes?' Which one gets the better offer?"
5. (Screenshot: full swipeable service history) "This is what you hand them."
6. (Screenshot: CSV export) "And it exports to CSV — free, forever. Your records are never hostage to a subscription."
7. **CTA:** "Start the log now — before you need it. Wrenchy. Link in bio."

**Visual direction:** Slides 2–4: typographic quote cards on the dark cluster
background, red vs green lamp motif (red = unproven car, green = documented
car). Slide 5: screen recording still of the history list. Slide 6: the CSV
export screen.

**CTA:** Link in bio; "save this for when you sell."

**Caption:** "Unproven service is unperformed service. A warranty claim, a resale, an argument with a shop — each one asks for the record. Wrenchy keeps every one, on your phone, exportable forever. Save this before your next sale. 💸"

**Hashtags:** #usedcar #carselling #cartok #carflip #resale

**Content goal:** Saves + downloads. Money content gets bookmarked.

---

## 4. The Ordinary Tuesday (problem → solution, emotional)

**Concept:** Services aren't missed on purpose — they're missed on an
ordinary Tuesday when life happens. The most emotionally resonant line in
the app, expanded into a story slideshow.

**Target audience:** Daily drivers, busy people, commuters.

**Slide-by-slide:**
1. **Hook:** "Nobody forgets their oil change on purpose."
2. "It happens like this: work is chaos. The check-engine light 'looks fine.' You'll do it next month."
3. "Nothing is missed on purpose. It is missed on an ordinary Tuesday." (quote card)
4. "Deferred maintenance is not saved money. It is the same money later, with a tow in front of it." (quote card — this line stops scrolls)
5. (Screenshot: red overdue card, "400 mi over") "This red light is the whole product."
6. (Screenshot: one reminder notification) "One notification. The day it's due. No spam, no account, no server."
7. **CTA:** "Let your phone worry about it so you don't have to. Wrenchy — link in bio."

**Visual direction:** Slides 1–4: dark typographic cards, story pacing (this
one can run longer, 4s/slide). Slide 5: the red overdue card screenshot — the
red telltale lamp aesthetic does the anxiety work. Slide 6: notification
banner mockup over a blurred dashboard photo.

**CTA:** Link in bio.

**Caption:** "It is the same money later, with a tow in front of it. Write that down. 🔧 Wrenchy watches every service your car is due for — date or mileage, whichever comes first — so a busy Tuesday doesn't turn into a $900 one."

**Hashtags:** #cartok #carcare #carmaintenance #adulting #cars

**Content goal:** Awareness + shares ("send to someone whose car is screaming").

---

## 5. The 10-Second Log (feature demo, proof of speed)

**Concept:** The core loop really is ~10 seconds: service chips → date →
prefilled odometer → save. Show, don't claim.

**Target audience:** DIY mechanics and anyone who thinks "apps like this are
always a chore."

**Slide-by-slide:**
1. **Hook:** "Logging an oil change should take less time than opening the hood."
2. "Here's the entire process:" (screenshot: service chips — Oil, Tires, Brakes, Wipers, Battery…)
3. "Pick the service. One tap." (screenshot: chips selected)
4. "Today or yesterday. Odometer is prefilled — it estimates the current reading for you." (screenshot: date + odometer field)
5. "Cost and notes if you want. Skip if you don't." (screenshot: cost/notes)
6. "Done. Reminders rescheduled automatically — by months AND miles, whichever comes first." (screenshot: updated due list)
7. **CTA:** "Ten seconds. Forever on record. Wrenchy — link in bio."

**Visual direction:** Real screenshots of every step, numbered 1→4 as big
overlays. Keep the rolling-odometer moment on slide 4 (screenshot mid-roll if
possible — it's the app's signature animation).

**CTA:** Link in bio.

**Caption:** "POV: the shop calls it 'service history,' you call it 10 seconds. 🔧 Every entry in Wrenchy takes ~10 taps, prefills your odometer, and reschedules your reminders on the spot. By time or mileage — whichever comes first."

**Hashtags:** #diymechanic #oilchange #cartok #carcare #apptok

**Content goal:** Downloads (removes effort objection).

---

## 6. Spreadsheet Can't Tap You on the Shoulder (comparison)

**Concept:** Direct comparison vs. the three ways people track today:
memory, glovebox receipts, spreadsheet. Structured "before vs after."

**Target audience:** Organized people who already track (spreadsheet crowd)
and people who don't (receipts crowd).

**Slide-by-slide:**
1. **Hook:** "You track your car's maintenance 1 of 3 ways. All 3 fail the same way."
2. "Memory: fails the day two cars or two services overlap."
3. "Receipts in the glovebox: prove it happened. Never tell you what's due next. A glovebox is not an index."
4. "A spreadsheet cannot tap you on the shoulder. It holds the history fine. It just never opens itself to warn you." (quote card)
5. (Screenshot: garage with multiple cars + due lamps) "Wrenchy: history AND the shoulder tap. One reminder per service, the day it's due."
6. (Screenshot: CSV export) "And yes — it exports to CSV, free forever, so your spreadsheet people keep their spreadsheet."
7. **CTA:** "Pick your lane? Or upgrade. Link in bio."

**Visual direction:** Slides 2–4: three "failing system" cards with simple
icons (brain 🧠, folder 📁, sheet 📊) on the dark background. Slide 5–6: real
garage screenshots. Slide 6 explicitly shows the CSV screen.

**CTA:** Link in bio.

**Caption:** "A spreadsheet holds the history fine. It just never opens itself to warn you. 📊 Wrenchy does both: permanent log, one reminder per service on the day it's due, CSV export free forever. Your spreadsheet can retire."

**Hashtags:** #spreadsheet #carcare #cartok #organization #carmaintenance

**Content goal:** Saves + downloads.

---

## 7. "The Shop's Records Are the Shop's" (myth-busting)

**Concept:** Bust the myth that "my shop/mechanic keeps all my records."
They don't have to give them to you, they vanish if you move or switch shops.

**Target audience:** People who use a shop or dealer for service.

**Slide-by-slide:**
1. **Hook:** "'Don't worry, we keep all your records here.' …Do they?"
2. "The shop's records are the shop's. Complete until you change shops, move, or sell."
3. "Try getting 5 years of service history out of a dealer when you're selling the car yourself. Go ahead, I'll wait."
4. "And at the service desk? They know your history. You do not." (quote card) "Not a question to be guessing at while somebody quotes you for one."
5. (Screenshot: vehicle history) "Your copy lives on YOUR phone. No account. No server. Nobody can hold it."
6. **CTA:** "Own your records. Wrenchy — link in bio."

**Visual direction:** Slides 2–4: typographic quote cards, slight "interrogation"
vibe (dark, high contrast, the red lamp motif on slide 4). Slide 5: history
screenshot with a padlock-style caption "100% private. Always yours."

**CTA:** Link in bio.

**Caption:** "The shop's records are the shop's. Yours are yours. 📁 Wrenchy keeps a permanent copy of every service on your phone — no account, no server, exportable to CSV anytime. Walk in knowing. Nothing gets sold to you twice."

**Hashtags:** #mechanic #carservice #cartok #cartips #usedcar

**Content goal:** Awareness + comments (this one provokes shop stories).

---

## 8. Apps You Need If You Own a Car (app-discovery listicle)

**Concept:** Classic "apps that feel illegal to know" format, honestly
scoped: 1 category, Wrenchy featured among real use cases (no fake
competitor bashing here, no invented features).

**Target audience:** Broad car-owning TikTok; the discovery/playlist crowd.

**Slide-by-slide:**
1. **Hook:** "An app every car owner should have in 2026 (and no, it's not CarPlay)."
2. "It's a car maintenance log called Wrenchy. Here's what it actually does — no fluff:"
3. "✅ Every service on record: oil, tires, brakes, wipers, battery, registration — 13 service types."
4. "✅ Reminds you by date OR mileage. Whichever comes first. One notification per service, the day it's due."
5. "✅ Full history per car — with an 8-second undo, because typos happen."
6. "✅ No account. No login. No server. Your data stays on your phone. CSV export free forever."
7. **CTA:** "Free to try for one car. Link in bio. 🔧"

**Visual direction:** Checklist cards, green checkmarks in the app's green
"settled fact" color; one real screenshot per feature on slides 3–6. Keep
icons minimal and mechanical.

**CTA:** Link in bio.

**Caption:** "Not sponsored, just true: the maintenance app I wish existed when my Corolla's history lived in a shoebox. No account, no server, one reminder per service on its due date. 🔧"

**Hashtags:** #appsyouneed #cartok #carapps #carmaintenance #carcaretips

**Content goal:** Awareness + downloads.

---

## 9. First Car Owner Starter Pack (things I wish I knew sooner)

**Concept:** "Things I wish I knew before my first car" — maintenance
intervals most new owners don't know (tires, rotation, brakes), ending with
"you don't have to memorize any of this."

**Target audience:** New/young drivers, first-car owners (huge TikTok demo).

**Slide-by-slide:**
1. **Hook:** "Things I wish I knew before my first car, part 1: maintenance isn't just oil."
2. "Oil: roughly every 6 months or 5,000 miles — whichever comes FIRST. Short trips count."
3. "Tire rotation: about every 6,000 miles. Skip it and your tires wear unevenly."
4. "Brakes, coolant, wipers, battery — they all have intervals. Your manual has the list."
5. "'Whichever comes first' is the part everyone misses. Time matters even when you barely drive."
6. (Screenshot: due list showing several services + dates/mileages) "I stopped memorizing this. My phone does the math now — date OR miles."
7. **CTA:** "First car? Set this up once and forget it. Wrenchy — link in bio."

**Visual direction:** Slides 2–5: clean interval cards styled like the app's
service chips, with a small gauge graphic per service. Slide 6: real due-list
screenshot. Educational tone, no app on slides 2–5 — value first.

**CTA:** Link in bio.

**Caption:** "Save this before your first oil change. The 'whichever comes first' part is the one that gets people — time ages your car even when you don't drive it. Wrenchy tracks both for every service, then reminds you on the day. 🧰"

**Hashtags:** #firstcar #newdriver #cartips #carmaintenance #cartok

**Content goal:** Saves + follows + downloads.

---

## 10. The Data Loss Horror Story (relatable cautionary tale)

**Concept:** Tell the composite true story from competitor reviews: years of
logged services, an app update/account hiccup, and everything gone. Named as
a pattern, never attributed to one competitor.

**Target audience:** People who already use a tracking app (retention-
stealing from competitors); spreadsheet-to-app migrants.

**Slide-by-slide:**
1. **Hook:** "3 years of car records. Gone in one app update."
2. "This isn't hypothetical — it's the most common complaint in reviews of car maintenance apps." (179 mentions of lost records/sync across 9 competitors)
3. "Why it happens: your records live on a server, tied to a login. Login breaks, sync breaks, records 'break.'" ("ALL of the service dates went to Jan 1, 0001" — real review theme)
4. "Wrenchy is built the opposite way: no account, no server, no sync to break. Your data lives in your phone and nowhere else."
5. (Screenshot: history list) "Append-only records. 8-second undo. Deletes leave a paper trail."
6. (Screenshot: CSV export) "And export to CSV is free forever — records are never hostage."
7. **CTA:** "If your current app needs a login to show you your own oil changes… maybe ask it why. Wrenchy — link in bio."

**Visual direction:** Slides 1–3: ominous dark cards, red lamp motif, glitch-
style text treatment on slide 3. Slides 4–6: calm green-lamp Wrenchy
screenshots. The contrast tells the story.

**CTA:** Link in bio.

**Caption:** "'Literally paid to lose my data.' — the most common 1-star review of car maintenance apps, basically every time. Wrenchy has no account and no server, so there's nothing to lose you didn't already have: your phone. 🔧"

**Hashtags:** #appfail #cartok #dataprivacy #carapps #techfail

**Content goal:** Awareness + competitor-conquest downloads.

---

## 11. POV: Buying a Used Car With No Records (relatable scenario)

**Concept:** The flip side of #3 — you're the buyer, the seller has "no
paperwork," and that's a pricing negotiation. Ends with "be the seller with
the folder."

**Target audience:** Used-car buyers, flippers, negotiation-content fans.

**Slide-by-slide:**
1. **Hook:** "POV: the used car is 'super clean, always maintained.'"
2. "'Do you have the records?' …'It was all done, I just didn't keep them.'"
3. "A full history is worth more than a clean one. The buyer discounts what you cannot show them. So does the dealer." (quote card)
4. "Every missing record is a discount — real or imagined. You're paying for their lost receipts."
5. (Screenshot: full history view) "The seller WITH the log gets the money."
6. "Start logging now. Not when you list the car — now. It takes 10 seconds per service."
7. **CTA:** "Be the seller with the folder. Wrenchy — link in bio."

**Visual direction:** Slide 1–2: conversation-style text cards (green bubble /
gray bubble, TikTok-native format). Slides 3–4: quote cards. Slides 5–6:
history screenshots.

**CTA:** Link in bio.

**Caption:** "'It was all done, I just didn't keep the records' — the 4 most expensive words in a used car deal. 📁 Wrenchy turns 10 seconds per service into a full history buyers can actually see. Start before you need it."

**Hashtags:** #usedcar #usedcars #carbuying #cartok #carmeeting

**Content goal:** Saves + shares + downloads.

---

## 12. "Nothing Gets Sold to You Twice" (upsell protection)

**Concept:** Walking into a shop without records means paying for services
you may already have had. The app makes you walk in knowing.

**Target audience:** People suspicious of upsells — very relatable, slightly
spicy angle.

**Slide-by-slide:**
1. **Hook:** "The mechanic says you need it. Do you remember if it was already done?"
2. "Without records, every service recommendation is 'trust me.'"
3. "'You walk in knowing. Nothing gets sold to you twice.'" (paywall impact line, verbatim)
4. "Last oil change: date and miles. Last rotation, brakes, battery, coolant. On your phone in 5 seconds."
5. (Screenshot: vehicle cluster with gauges) "Show them, or just know. Either way you're not guessing."
6. **CTA:** "They know your history. Make sure you do too. Wrenchy — link in bio."

**Visual direction:** Slides 1–3: tension-building text cards. Slide 4: list
screenshot cropped tight. Slide 5: the signature cluster gauges — this is the
most beautiful screen in the app, let it carry the slide.

**CTA:** Link in bio.

**Caption:** "Not a question to be guessing at while somebody quotes you for one. 🧾 Wrenchy keeps the exact date and mileage of every service — so the next 'you're due for a flush' gets met with actual data."

**Hashtags:** #mechanictips #cartok #carservice #cartips #upsell

**Content goal:** Awareness + comments (upsell stories = gold).

---

## 13. DIY Mechanic's Workbench Log (niche)

**Concept:** For the wrench-at-home crowd: you did the work yourself, so the
"receipt" is only the log. Track what you did, when, at what mileage —
including parts costs.

**Target audience:** DIY mechanics, garage TikTok, project car owners.

**Slide-by-slide:**
1. **Hook:** "If you wrench your own car, the log IS the receipt."
2. "No shop stamp. No invoice. Just you, your torque wrench, and your memory. Guess which one fails first."
3. "Unproven service is unperformed service. A warranty claim, a resale, an argument with a shop: each asks for the record." (quote card)
4. (Screenshot: service chips + cost field) "Log it as you finish: service, mileage, parts cost, notes ('used 5W-30, OEM filter')."
5. (Screenshot: costs/insights) "See what the car actually costs you per service — from the entries you priced. No made-up numbers." (note: honesty caption is a real feature)
6. "Track intervals by miles — set them to match your manual, your climate, or how hard you use it." (real Pro feature: custom intervals)
7. **CTA:** "Built for people with grease on their hands. Wrenchy — link in bio."

**Visual direction:** Workshop photo backgrounds with Wrenchy UI cards
overlaid. Slide 5: insights screenshot. Slide 6: interval editor screenshot.

**CTA:** Link in bio.

**Caption:** "You trust your torque wrench. Don't trust your memory more. 🔩 Wrenchy logs every DIY service with mileage, parts cost, and notes — and warns you by miles OR months, whichever comes first. CSV export free forever."

**Hashtags:** #diymechanic #garagelife #wrenching #projectcar #cartok

**Content goal:** Downloads in the highest-intent niche.

---

## 14. Multi-Car Household Chaos (relatable, family)

**Concept:** Two cars, a spouse who "handles" one of them, and nobody knows
when anything is due. Free tier = 1 car; Pro = unlimited — present it
naturally, not as an ad.

**Target audience:** Couples/families with 2+ vehicles; car flippers.

**Slide-by-slide:**
1. **Hook:** "Our family has 3 cars and zero idea when anything was last done."
2. "Car 1: 'I think my husband handles it.' Car 2: 'I think the dealership does.' Car 3: it's 12 years old and nobody's asking."
3. (Screenshot: garage screen with multiple vehicle cards) "Every car. One screen. Red lamp = overdue, green = fine."
4. (Screenshot: coming-up list) "The 'coming up' list shows what's due across the whole garage."
5. "Log each service in ~10 seconds. Reminders fire on the due date — by months or miles."
6. "First car is free. More cars is what Pro is for. That's the whole business model — no ads, no data selling, there's no server to sell it from."
7. **CTA:** "Your garage, on one screen. Link in bio."

**Visual direction:** Slide 2: funny text card. Slides 3–4: real garage
screenshots with the red/green lamps visible — the dashboard metaphor does
the work. Slide 6: keep pricing honest and light.

**CTA:** Link in bio.

**Caption:** "Car 1 is my wife's. Car 2 is mine. Car 3 is 'the reliable one' until it isn't. 🚗 Wrenchy puts the whole garage on one screen — overdue in red, fine in green, one reminder per service on its due date."

**Hashtags:** #familycar #cartok #carmaintenance #momsoftiktok #parenthood

**Content goal:** Awareness + Pro subscriptions.

---

## 15. Myth: "My Car Reminds Me" (dashboard light myth)

**Concept:** Bust the myth that the car's own service light or dealer
notifications are enough. Cars don't warn you — this does. (App paywall
headline = the punchline.)

**Target audience:** People who rely on the dash light / dealer texts.

**Slide-by-slide:**
1. **Hook:** "'My car tells me when it needs service.' Does it, though?"
2. "Your dash light tracks ONE service, by the factory's generic schedule. Not your driving."
3. "It doesn't know your tires, brakes, battery, wipers, or registration. And it says nothing about your history."
4. "Cars don't warn you. This does." (quote card — the app's own headline)
5. (Screenshot: 13 service types / due list) "Every service, on YOUR schedule — custom intervals for how you actually drive."
6. (Screenshot: one notification) "One reminder per service. The day it's due. Nothing else, ever."
7. **CTA:** "Link in bio."

**Visual direction:** Slide 1–3: myth-buster text cards. Slide 4: the paywall
headline as a full-slide typographic card — it's designed for exactly this.
Slides 5–6: real screenshots.

**CTA:** Link in bio.

**Caption:** "Your dash light is a suggestion for one fluid. Wrenchy watches all 13 service types on your schedule — months or miles, whichever comes first — and pings you once, on the day. 🚨"

**Hashtags:** #cartok #dashboardlight #carcaretips #carmaintenance #cars

**Content goal:** Awareness + downloads.

---

## 16. The Honest App (meta / brand-values post)

**Concept:** A transparency post about what the app deliberately does NOT
have: no accounts, no tracking, no fake features, export never paywalled.
Plays to the privacy audience and builds trust with skeptics.

**Target audience:** Privacy-minded users, r/degoogle-style crowds,
subscription-fatigued people.

**Slide-by-slide:**
1. **Hook:** "This car app has no login. That's the point."
2. "No account. No login. No server. No sync to break." (verbatim from the listing)
3. "Your maintenance records stay on your phone — the same way a paper logbook lives in your glovebox."
4. "CSV export is free forever. A subscription should never hold your records hostage."
5. "We don't pretend: no fake 'health scores,' no made-up numbers. Estimates are labeled. Totals say 'from 3 services you priced.'" (real honesty features)
6. "One subscription: unlimited cars + custom intervals. One car? Free."
7. **CTA:** "If that sounds like your kind of software: Wrenchy. Link in bio."

**Visual direction:** Minimal typographic cards, the purple-glow privacy
frame from the store screenshots as slide 2's backdrop. Slide 5: show a real
est.-labeled odometer reading or "From N services you priced" caption — proof,
not claims.

**CTA:** Link in bio.

**Caption:** "No account. No server. No sync to break. Export to CSV free forever, because your records should never be hostage to a subscription. Wrenchy — a maintenance log your phone keeps, and only your phone. 🔒🔧"

**Hashtags:** #privacy #dataprivacy #carapps #cartok #nofrills

**Content goal:** Trust-building, shares, follows; slower but compounding.

---

# Top 5 and why

**1. The 1-Star Bloodbath (#1)** — Lead with a shocking, verifiable number
and a shared enemy. Exposé content is one of TikTok's highest-performing
genres, and the app has real mined data to back every claim. It also does the
hardest job at once: awareness AND differentiation AND objection-handling
(data loss, accounts, subscriptions) in one post.

**2. "When Was Your Last Oil Change?" (#2)** — The widest audience (every car
owner), zero prerequisite knowledge, and a built-in comment mechanic ("comment
your answer") that the algorithm rewards. The app's one-liners ("a glovebox
is not an index") are pre-written, memorable slide copy.

**3. The Resale Receipt (#3)** — Money content earns saves and shares, the
two signals that extend reach beyond followers. It targets the
highest-willingness-to-pay moment (selling a car) and uses the app's own
strongest line: "A full history is worth more than a clean one."

**4. The Ordinary Tuesday (#4)** — Pure relatability with the two most
quotable lines the app owns. Emotional storytelling slideshows travel further
than product demos, and the red overdue-card screenshot is a visual punchline
that needs no explanation.

**5. The 10-Second Log (#5)** — The objection every "I'd never keep up with
that app" viewer has, killed with screenshots. Short, high-retention, and the
prefilled odometer / rolling digit UI is genuinely distinctive on screen.
This one converts watches into installs.

---

# Video Concepts (for later — motion earns its keep here)

1. **The rolling odometer reveal.** Record the `OdometerRoll` animation
   settling digit by digit, synced to a mechanical/trending sound. Hook: "the
   most satisfying 3 seconds in a maintenance app." Pure aesthetic motion —
   slides can't do this.
2. **10-second log, real-time, screen-recorded.** Film a thumb completing an
   actual log entry with a running timer overlay. The speed claim becomes
   proof. End on the reminder rescheduling animation.
3. **"Working out the schedule" screen-capture.** Show the live computation
   ("{count} service intervals applied · 9,500 mi a year…") with voiceover:
   "watch my app do the math I've been avoiding for 4 years." Motion + a
   counting-up animation is the hook.
4. **POV drive + notification skit.** Dashcam/POV driving clip → the one due-
   date notification banner drops in with a sound → cut to logging it in the
   parking lot in 10 seconds. Demonstrates the reminder actually arriving.
5. **Garage tour with the cluster UI.** Walk the multi-vehicle garage screen
   on camera, zooming into red vs. green lamps, gauges, and the coming-up
   list — like a car reviewer walks a dashboard. The instrument-cluster design
   is the show.
6. **Before/after glovebox purge.** Physically dump a folder of crumpled
   receipts on a table, then open the app's history view. Real-world → app
   transition shot. Tangible, satisfying, classic TikTok transformation.
7. **Green-screen duet on a dealer/service-desk video.** React to a "you need
   a flush" upsell story with the app's history screen green-screened in:
   "here's what walking in knowing looks like." Reactive formats borrow reach.
8. **Comment-reply video.** Answer the top comment on slideshow #2 ("comment
   your mileage…") with the interval math on screen. Comment-reply videos
   recycle engaged viewers and feed the algorithm.

## Posting cadence suggestion

Start with 3 slideshows/week from the top 5 (rotate hooks), one video every
1–2 weeks once slideshows prove the angles. Re-cut winning slideshows with
new first-slide hooks — the hook, not the body, is what you're testing.

---

# Slide Background Spec (per slide)

## Setup (applies to every post)

- **Canvas:** 1080 × 1920 (9:16). Export as PNG/JPG. TikTok photo posts.
- **Base color:** matte black `#0F1113` with subtle vignette + light film grain.
  All "card" backgrounds sit on this base.
- **Type:** big bold sans for hooks (fill most of the slide), the app's
  uppercase-tracked small-caps style for labels, tabular numerals for any
  numbers. Numbers styled like odometer digits are the brand tell.
- **Assets already in the repo:**
  - `design-source/brushed_metal.jpeg` — faceplate texture for stat cards
  - `design-source/odometer.jpeg` — reference for digit styling
  - `design-source/instrument_cluster.jpeg` — cluster reference / backdrop
  - `design-source/radial.jpeg` — soft radial glow (use tinted red or green)
  - `design-source/icons.jpeg` — service-chip icon style reference
- **App screenshots:** not in the repo — capture from the running app in the
  iOS simulator (dark mode, populated with realistic data), or screenshot the
  5 live App Store frames. You need: garage, vehicle cluster, due list,
  service chips, odometer field mid-roll, cost/notes, history list, CSV export
  screen, interval editor, insights ("from N services you priced"), est.-labeled odometer, and the paywall headline card.
- **One photo you shoot:** a dark driveway/parked-car shot (night, headlights
  or streetlight) — reused across posts as the photo backdrop.

## Background types (defined once, referenced below)

- **A — Solid dark card:** #0F1113 + vignette + grain. Hook/claim text huge.
- **B — Metal stat card:** `brushed_metal` band, digits set like odometer
  numerals. For numbers and counts.
- **C — Lamp glow card:** `radial` glow tinted red (pain/danger slides) or
  green (reassurance/resolution slides) bleeding from one edge.
- **D — Screenshot, full:** real app screen floating on dark, soft shadow.
- **E — Screenshot, cropped:** tight crop of the interesting region only
  (a red "400 mi over" card, the odometer digits, one due-list row).
- **F — Quote card:** app copy set as a typographic quote, thin green
  underline. No attribution needed.
- **G — Photo:** your dark car photo (or engine bay / glovebox shot),
  darkened ~40% so text pops.
- **H — Closer:** "Cars don't warn you. This does." headline card + a green
  CTA strip ("Wrenchy — App Store"). Same last slide style on every post =
  brand recognition.

## Per-slide backgrounds

**#1 The 1-Star Bloodbath**
1: A · 2: B (691/1,715 as odometer digits) · 3: C-red · 4: C-red · 5: D garage · 6: E CSV crop · 7: H

**#2 "When Was Your Last Oil Change?"**
1: A · 2: A · 3: F ("a glovebox is not an index") · 4: F ("they know your history") · 5: D cluster gauges · 6: E due-list crop + notification banner mock · 7: H

**#3 The Resale Receipt**
1: A · 2: F ("a full history is worth more…") · 3: C split (red half / green half) · 4: A · 5: E history-list crop · 6: D CSV export · 7: C-green

**#4 The Ordinary Tuesday**
1: A · 2: G dashboard/commute photo · 3: F ("missed on an ordinary Tuesday") · 4: F ("same money later, with a tow in front of it") · 5: E red overdue card crop · 6: G photo + notification banner mock · 7: H

**#5 The 10-Second Log**
1: A · 2: D service chips · 3: E chips-selected crop · 4: D odometer field (mid-roll if you can catch it) · 5: D cost/notes · 6: D updated due list · 7: H

**#6 Spreadsheet Can't Tap You on the Shoulder**
1: A · 2: A (🧠 memory card) · 3: A (📁 receipts card) · 4: F ("a spreadsheet cannot tap you on the shoulder") · 5: D garage multi-vehicle · 6: D CSV export · 7: C-green

**#7 "The Shop's Records Are the Shop's"**
1: A · 2: A · 3: A · 4: C-red · 5: D history + small padlock caption "100% private. Always yours." · 6: C-green

**#8 Apps You Need If You Own a Car**
1: A · 2: A · 3: D garage · 4: D due list · 5: D history w/ undo · 6: D CSV · 7: C-green checklist card

**#9 First Car Owner Starter Pack**
1: A · 2–5: A with a small chip-style interval graphic per service (icon style from `design-source/icons.jpeg`) · 6: D due list · 7: C-green

**#10 The Data Loss Horror Story**
1: A · 2: B ("179 mentions") · 3: C-red (glitch text treatment on the review theme) · 4: C red→green gradient · 5: D history · 6: D CSV · 7: A

**#11 POV: Buying a Used Car With No Records**
1: G used-car-lot photo · 2: A styled as chat bubbles (green/gray) · 3: F · 4: A · 5: D history · 6: A · 7: C-green

**#12 "Nothing Gets Sold to You Twice"**
1: A · 2: A · 3: F ("you walk in knowing…") · 4: E history/date-mileage crop · 5: D cluster gauges (let this screen carry the slide) · 6: C-green

**#13 DIY Mechanic's Workbench Log**
1: G engine-bay photo · 2: A · 3: F ("unproven service…") · 4: D chips + cost field · 5: D insights ("from 3 services you priced") · 6: D interval editor · 7: C-green

**#14 Multi-Car Household Chaos**
1: A · 2: A (the three-cars joke card) · 3: D garage with red/green lamps visible · 4: D coming-up list · 5: D log-a-service · 6: A · 7: C-green

**#15 Myth: "My Car Reminds Me"**
1: A · 2: A · 3: A · 4: F but oversized — the "Cars don't warn you. This does." headline AS the quote card · 5: D due list / 13 service types · 6: E notification crop · 7: A

**#16 The Honest App**
1: A · 2: G with `radial` purple glow (matches the store's privacy frame) · 3: A · 4: D CSV export · 5: E est.-labeled odometer crop · 6: A · 7: C-green

## Two rules that keep the set coherent

1. **Red for the problem, green for the resolution.** Never red on the last
   two slides of a post — every post must end in a green-lamp slide.
2. **Screenshots beat mockups.** Whenever a type D/E slide is possible, use a
   real screenshot with real (realistic) data — the honesty of the UI is the
   differentiator, and "est." labels and red overdue cards are the details
   people screenshot and share.

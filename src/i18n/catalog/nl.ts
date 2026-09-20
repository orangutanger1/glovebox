import type { Fragment } from "./types";

/**
 * Dutch (nl-NL). Register: je/jij throughout, which is what Dutch consumer
 * utilities use; "u" would make a maintenance log sound like a bank.
 *
 * Deliberate terms a reviewer would otherwise query:
 * - `service.Inspection` is **APK** (Algemene Periodieke Keuring), the legally
 *   mandated Dutch roadworthiness test. No Dutch owner searches "inspectie".
 * - `service.Registration` is **Wegenbelasting**, the everyday name for the
 *   recurring motorrijtuigenbelasting every Dutch keeper pays.
 * - "Onderhoud" is the log/upkeep word (the thing you record); "beurt" /
 *   "onderhoudsbeurt" is the periodic service an owner books, so counted
 *   services read "3 onderhoudsbeurten" while the logged act reads "onderhoud
 *   vastleggen". "aan de beurt" carries "due" everywhere.
 * - Overdue is "te laat" in badges and prose; a distance overrun is
 *   "overschreden", because Dutch "over" means "left" — the opposite of the
 *   English "over".
 * - "Kilometerstand" is the odometer word Dutch drivers use and search, so it
 *   stays even in the "({unit})" labels, where "Kilometerstand (km)" reads the
 *   way Dutch forms actually print it. The unit-switch dialog uses the neutral
 *   "stand" because it can be talking about miles.
 * - Garage vocabulary: olie verversen, banden rouleren, remmen controleren,
 *   bougies, interieurfilter, koelvloeistof verversen.
 */
export const nl: Fragment = {
  // garage
  "garage.title": "Garage",
  "garage.logService": "Onderhoud vastleggen",
  "garage.addVehicle": "Voertuig toevoegen",
  "garage.comingUp": "Binnenkort",
  "garage.quickLog": "Vastleggen met één tik",
  "garage.empty":
    "Nog geen voertuigen. Voeg er een toe, dan begint Wrenchy de administratie bij te houden.",
  "garage.storeUnreachable":
    "De store is niet bereikbaar. Probeer het opnieuw met een betere verbinding.",

  "garage.badge.overdue": "Te laat",
  "garage.badge.dueSoon": "Binnenkort",

  "garage.odometer": "Kilometerstand",
  "garage.odometer.notSet": "Niet ingevuld",

  "garage.over": "{distance} overschreden",
  "garage.dueNow": "nu aan de beurt",
  "garage.dueSoon": "binnenkort aan de beurt",
  "garage.onSchedule": "op schema",

  "garage.noSchedule": "Nog geen schema",
  "garage.noSchedule.detail": "vastgelegd, niet gevolgd",
  "garage.nothingLogged": "Niets vastgelegd",
  "garage.nothingLogged.detail": "leg onderhoud vast",

  "garage.openHistory": "Historie openen",
  "garage.openAndLog": "Openen en onderhoud vastleggen",

  // vehicle
  "vehicle.title": "Voertuig",

  "vehicle.body.sedan": "Sedan",
  "vehicle.body.hatchback": "Hatchback",
  "vehicle.body.coupe": "Coupé",
  "vehicle.body.wagon": "Stationwagen",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pick-up",
  "vehicle.body.van": "Bestelwagen",

  "vehicle.odometer": "Kilometerstand",
  "vehicle.odometer.notSet": "Niet ingevuld",
  "vehicle.lastService": "Laatste onderhoud",
  "vehicle.lastService.none": "Nog niets",

  "vehicle.due": "Nu aan de beurt",
  "vehicle.history": "Historie",
  "vehicle.history.empty": "Nog geen onderhoud vastgelegd. Leg vast wat er als laatste is gedaan.",

  "vehicle.over": "{distance} overschreden",
  "vehicle.dueOn": "aan de beurt op {date}",
  "vehicle.dueNow": "nu aan de beurt",
  "vehicle.dueSoon": "binnenkort aan de beurt",

  "vehicle.badge.overdue": "Te laat",
  "vehicle.badge.soon": "Binnenkort",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Verwijder",
  "vehicle.serviceDeleted": "Onderhoud verwijderd",
  "vehicle.undo": "Herstel",
  "vehicle.logService": "Onderhoud vastleggen",

  "vehicle.edit.title": "Voertuig bewerken",
  "vehicle.edit.odometerHint": "Een stand die je hier invult vervangt de huidige, ook als die lager is. Laat leeg om hem te behouden.",
  "vehicle.deleteVehicle": "Voertuig verwijderen",
  "vehicle.delete.title": "{name} verwijderen?",
  "vehicle.delete.body":
    "Het verdwijnt uit je garage, samen met de onderhoudshistorie. Wat je al hebt geëxporteerd blijft in dat bestand staan.",
  "vehicle.delete.cancel": "Annuleer",
  "vehicle.delete.confirm": "Verwijder",

  // service
  "service.Oil Change": "Olie verversen",
  "service.Tire Rotation": "Banden rouleren",
  "service.Brake Inspection": "Remmen controleren",
  "service.Air Filter": "Luchtfilter",
  "service.Cabin Air Filter": "Interieurfilter",
  "service.Wiper Blades": "Ruitenwissers",
  "service.Battery Check": "Accu controleren",
  "service.Coolant Flush": "Koelvloeistof verversen",
  "service.Transmission Fluid": "Transmissieolie",
  "service.Spark Plugs": "Bougies",
  "service.Registration": "Wegenbelasting",
  "service.Inspection": "APK",
  "service.Other": "Overig",

  // unit
  "unit.mi": "{value} mi",
  "unit.km": "{value} km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  // layout
  "layout.garage": "Garage",
  "layout.settings": "Instellingen",
  "layout.intervals": "Onderhoudsintervallen",
  "layout.addVehicle": "Voertuig toevoegen",
  "layout.vehicle": "Voertuig",
  "layout.logService": "Onderhoud vastleggen",
  "layout.fatal.retry": "Opnieuw proberen",
  "layout.fatal.title": "Wrenchy kon je administratie niet openen.",
  "layout.fatal.body":
    "Er is niets verwijderd en de database is teruggezet naar de laatste goede versie. Open de app opnieuw. Blijft dit gebeuren, neem dan contact op met support voordat je opnieuw installeert, want opnieuw installeren is wat de gegevens echt kwijtmaakt.",

  // plan
  "plan.line.nothing": "Niets vastgelegd",
  "plan.line.about": "rond {date}",
  "plan.line.noInterval": "Geen interval ingesteld",

  // language
  "language.title": "Taal",
  "language.intro":
    "Wrenchy volgt je telefoon, tenzij je hier een taal kiest. De namen van het onderhoud gebruiken de woorden die garages in die taal gebruiken.",
  "language.system": "Systeem",

  // system
  "system.notify.title": "{service} is aan de beurt",
  "system.notify.title.named": "{name}, {service} is aan de beurt",
  "system.notify.body": "{vehicle} · Laatst gedaan op {date}.",
  // The two nudges an unfinished onboarding gets, two hours and a day
  // after the user walked away from it.
  "system.resume.first.title": "Je schema is bijna klaar",
  "system.resume.first.title.named": "{name}, je schema is bijna klaar",
  "system.resume.first.body": "{vehicle} · Nog één minuut en elke onderhoudsdatum staat vast.",
  "system.resume.second.title": "Ga verder waar je was",
  "system.resume.second.title.named": "{name}, ga verder waar je was",
  "system.resume.second.body": "{vehicle} · Alles wat je invulde is bewaard. Eén minuut en het is af.",
  "system.resume.third.title": "Je schema staat klaar",
  "system.resume.third.title.named": "{name}, je schema staat klaar",
  "system.resume.third.body": "{vehicle} · Rond het instellen af en zie precies wat wanneer moet.",
  "system.resume.fourth.title": "Twee minuten tot een volledig schema",
  "system.resume.fourth.title.named": "{name}, twee minuten tot je schema",
  "system.resume.fourth.body": "{vehicle} · Elke beurt gedateerd en bijgehouden. Rond het vandaag af.",
  "system.resume.fifth.title": "Nog bewaard, nog klaar",
  "system.resume.fifth.title.named": "{name}, nog bewaard, nog klaar",
  "system.resume.fifth.body": "{vehicle} · Je instelling staat waar je hem liet. Eén minuut en klaar.",
  "system.resume.sixth.title": "Je auto verdient een schema",
  "system.resume.sixth.title.named": "{name}, je auto verdient een schema",
  "system.resume.sixth.body": "{vehicle} · De meesten zijn binnen twee minuten klaar. Jij bent halverwege.",
  "system.resume.seventh.title": "Je instelling is er nog",
  "system.resume.seventh.title.named": "{name}, je instelling is er nog",
  "system.resume.seventh.body": "{vehicle} · Wanneer je wilt: één minuut en het is af.",
  "system.resume.ask.first.title": "Je schema staat klaar",
  "system.resume.ask.first.title.named": "{name}, je schema staat klaar",
  "system.resume.ask.first.body": {
    one: "{vehicle} · 1 beurt vraagt aandacht. Pro neemt het vanaf hier over.",
    other: "{vehicle} · {count} beurten vragen aandacht. Pro regelt ze allemaal.",
  },
  "system.resume.ask.first.body.zero": "{vehicle} · Elke beurt gedateerd en bijgehouden. Pro neemt het vanaf hier over.",
  "system.resume.ask.second.title": "Eén tik en je bent gedekt",
  "system.resume.ask.second.title.named": "{name}, één tik en je bent gedekt",
  "system.resume.ask.second.body": "{vehicle} · Je schema staat en is bewaard. Eén tik en Pro draait het.",
  "system.resume.ask.third.title": "Je schema wacht op je",
  "system.resume.ask.third.title.named": "{name}, je schema wacht op je",
  "system.resume.ask.third.body": "{vehicle} · Niets opnieuw invullen. Eén tik en elke beurt wordt bijgehouden.",
  "system.resume.ask.fourth.title": "Met Pro glipt niets door",
  "system.resume.ask.fourth.title.named": "{name}, met Pro glipt niets door",
  "system.resume.ask.fourth.body": "{vehicle} · Je schema is bewaard. De meesten vinden in de eerste maand een vergeten beurt.",
  "system.resume.ask.fifth.title": "Je schema is nog bewaard",
  "system.resume.ask.fifth.title.named": "{name}, je schema is nog bewaard",
  "system.resume.ask.fifth.body": "{vehicle} · Eén tik en Pro pakt elke onderhoudsdatum vanaf hier op.",
  "system.resume.ask.sixth.title": "De teller loopt door",
  "system.resume.ask.sixth.title.named": "{name}, de teller loopt door",
  "system.resume.ask.sixth.body": "{vehicle} · Je schema staat klaar om bij te blijven. Eén tik en je bent gedekt.",
  "system.resume.ask.seventh.title": "Een maand later, nog steeds klaar",
  "system.resume.ask.seventh.title.named": "{name}, nog steeds klaar",
  "system.resume.ask.seventh.body": "{vehicle} · Je schema is bewaard en wacht. Eén tik en Pro neemt het over.",

  "system.notify.when.today": "Vandaag",
  "system.notify.when.tomorrow": "Morgen",
  "system.notify.when.days": { one: "Over {count} dag", other: "Over {count} dagen" },
  "system.notify.when.months": { one: "Over {count} maand", other: "Over {count} maanden" },

  "system.csv.header.vehicle": "Voertuig",
  "system.csv.header.service": "Onderhoud",
  "system.csv.header.date": "Datum",
  "system.csv.header.odometer": "Kilometerstand ({unit})",
  "system.csv.header.cost": "Kosten",
  "system.csv.header.notes": "Notities",
  "system.csv.header.deleted": "Verwijderd",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Pro proberen",
  "system.quickaction.trial.subtitle": "Een jaar Pro voor de aanbiedingsprijs",
  "system.quickaction.feedback.title": "Feedback sturen",
  "system.quickaction.feedback.subtitle": "Vertel ons wat er misging",

  "system.vehicle.fallback": "Mijn auto",

  // settings
  "settings.title": "Instellingen",
  "settings.privacy":
    "Je administratie staat alleen op deze telefoon. Geen account, geen server. Exporteren kan altijd, want daar zit nooit een slot op.",
  "settings.section.data": "Gegevens",
  "settings.section.reminders": "Herinneringen",
  "settings.section.membership": "Abonnement",
  "settings.section.preferences": "Voorkeuren",

  "settings.export": "Alle gegevens exporteren (CSV)",
  "settings.export.error": "Het deelvenster kon niet worden geopend. Je gegevens zijn onveranderd.",

  "settings.intervals": "Onderhoudsintervallen",


  "settings.language": "Taal: {language}",
  "settings.units": "Eenheden: {unit}",
  "settings.units.title": "Overschakelen naar {unit}?",
  "settings.units.body":
    "Elke opgeslagen stand en elk interval wordt omgerekend van {from} naar {to}. Een stand van 50.000 {from} wordt {example}.",
  "settings.units.cancel": "Annuleer",
  "settings.units.confirm": "Reken om",

  "settings.reminders.enable": "Herinneringen inschakelen",
  "settings.reminders.blocked": "Herinneringen geblokkeerd, open iOS-instellingen",
  "settings.reminders.none": "Herinneringen aan, nog niets aan de beurt",
  "settings.reminders.on": {
    one: "Herinneringen aan, {count} ingepland",
    other: "Herinneringen aan, {count} ingepland",
  },
  "settings.reminders.onNext": {
    one: "Herinneringen aan, {count} ingepland, volgende {date}",
    other: "Herinneringen aan, {count} ingepland, volgende {date}",
  },
  "settings.reminders.scheduled": "Herinneringen ingepland.",
  "settings.reminders.denied": "Herinneringen geweigerd. Je kunt ze aanzetten in iOS-instellingen.",
  "settings.reminders.error": "Kon geen toestemming voor meldingen vragen.",
  "settings.reminders.openSettings":
    "Open iOS-instellingen › Wrenchy › Berichtgeving om herinneringen weer aan te zetten.",

  "settings.manage": "Abonnement beheren",
  "settings.manage.error":
    "Kon de abonnementsinstellingen niet openen. Probeer het opnieuw met een betere verbinding.",
  "settings.upgrade": "Upgraden naar Pro",
  "settings.restore": "Aankopen herstellen",
  "settings.restore.done": "Pro hersteld.",
  "settings.restore.none": "Geen aankoop gevonden.",
  "settings.store.error":
    "De store is niet bereikbaar. Probeer het opnieuw met een betere verbinding.",
  "settings.pro.on": "Pro staat aan. Bedankt.",
  "settings.offer.applied": "Die aanbieding is toegepast. Verder hoef je niets te doen.",

  "settings.replay": "Introductie opnieuw doorlopen",
  "settings.replay.title": "Introductie opnieuw doorlopen?",
  "settings.replay.body":
    "Je voertuigen en gegevens blijven staan. Loop je de stappen opnieuw door, dan komt er een voertuig bij dat je daarna kunt verwijderen.",
  "settings.replay.cancel": "Annuleer",
  "settings.replay.confirm": "Opnieuw",

  // insights
  "insights.title": "Kosten",
  "insights.subtitle": "Wat de garage heeft gekost, rechtstreeks uit je logboek.",
  "insights.total.label": "Tot nu toe vastgelegd",
  "insights.total.priced": {
    one: "Uit {count} beurt met prijs.",
    other: "Uit {count} beurten met prijs.",
  },
  "insights.total.unpriced": {
    one: "Bij {count} andere beurt ontbreken de kosten.",
    other: "Bij {count} andere beurten ontbreken de kosten.",
  },
  "insights.byVehicle.title": "Per voertuig",
  "insights.byService.title": "Waar het heen gaat",
  "insights.byMonth.title": "Laatste 12 maanden",
  "insights.empty.title": "Nog niets met een prijs",
  "insights.empty.body": "Vul kosten in als je een beurt vastlegt, dan staat het hier. Eerdere beurten kun je ook aanpassen.",
  "insights.empty.cta": "Naar mijn garage",
  "insights.open": "Kosten bekijken",

  // intervals
  "intervals.title": "Onderhoudsintervallen",
  "intervals.intro":
    "Hoe vaak elk onderhoud aan de beurt is. Pas ze aan op je eigen auto, het instructieboekje, het klimaat waarin je rijdt of hoe zwaar je de auto belast.",
  "intervals.custom": "EIGEN",

  "intervals.untracked": "niet gevolgd",
  "intervals.months": { one: "{count} maand", other: "{count} maanden" },
  "intervals.monthsAndDistance": {
    one: "{count} maand · {distance}",
    other: "{count} maanden · {distance}",
  },

  "intervals.help":
    "Aan de beurt zodra het eerste van de twee bereikt is. Laat een veld leeg om het te negeren, dus alleen afstand of alleen maanden is ook een geldig schema. Maak beide leeg om terug te gaan naar de standaard ({default}).",
  "intervals.field.months": "Om de (maanden)",
  "intervals.field.distance": "Om de ({unit})",
  "intervals.error.positive":
    "Gebruik hele getallen boven nul, of laat een veld leeg om het te negeren.",
  "intervals.save": "Interval bewaren",
  "intervals.cancel": "Annuleer",

  // vehicleForms
  "vehicleForms.new.title": "Voertuig toevoegen",
  "vehicleForms.new.save": "Bewaar",
  "vehicleForms.new.name": "Naam",
  "vehicleForms.new.namePlaceholder": "Civic 2019",
  "vehicleForms.new.odometer": "Huidige kilometerstand ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Onderhoud vastleggen",
  "vehicleForms.log.save": "Bewaar",
  "vehicleForms.log.error":
    "Bewaren is niet gelukt. Wat je hebt ingevuld staat er nog. Probeer het opnieuw.",
  "vehicleForms.number.invalid": "Dit getal kon niet worden gelezen. Alleen cijfers — 84.210 of 45,5.",
  "vehicleForms.log.what": "Wat",
  "vehicleForms.log.when": "Wanneer",
  "vehicleForms.log.today": "Vandaag",
  "vehicleForms.log.yesterday": "Gisteren",
  "vehicleForms.log.otherDate": "Andere datum",
  "vehicleForms.log.odometer": "Kilometerstand ({unit})",
  "vehicleForms.log.cost": "Kosten (optioneel)",
  "vehicleForms.log.notes": "Notities (optioneel)",

  // onboardingA
  "onboardingA.continue": "Verder",

  "onboardingA.welcome.headline":
    "Nooit meer gokken wanneer je de olie voor het laatst hebt ververst.",
  "onboardingA.welcome.start": "Beginnen",
  "onboardingA.welcome.privacy": "Geen account. Niets verlaat je telefoon.",

  // The introduction, on the screen before the quiz. The name is read
  // back on both ask screens and in every reminder, and nowhere else.
  "onboardingA.name.title": "Hoe mogen we je noemen?",
  "onboardingA.name.label": "Je naam",
  "onboardingA.name.continue": "Verder",

  "onboardingA.vehicle.title": "Wat rijd je?",
  "onboardingA.vehicle.year": "Bouwjaar",
  "onboardingA.vehicle.make": "Merk",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.model": "Model",

  "onboardingA.odometer.title.mi": "Hoeveel mijl staat erop?",
  "onboardingA.odometer.title.km": "Hoeveel kilometer staat erop?",
  "onboardingA.odometer.field": "Kilometerstand ({unit})",
  "onboardingA.odometer.placeholder.mi": "84.210",
  "onboardingA.odometer.placeholder.km": "135.600",
  "onboardingA.odometer.caption": "Een ruwe schatting is prima.",
  "onboardingA.odometer.required": "Voer de stand in om door te gaan.",

  "onboardingA.drive.title": "Hoeveel rijd je ermee?",
  "onboardingA.drive.legend": "Afstand per jaar ({unit})",
  "onboardingA.drive.low.mi": "Tot 5.000",
  "onboardingA.drive.low.km": "Tot 8.000",
  "onboardingA.drive.average.mi": "5.000 tot 10.000",
  "onboardingA.drive.average.km": "8.000 tot 16.000",
  "onboardingA.drive.high.mi": "10.000 tot 15.000",
  "onboardingA.drive.high.km": "16.000 tot 24.000",
  "onboardingA.drive.very_high.mi": "Boven 15.000",
  "onboardingA.drive.very_high.km": "Boven 24.000",
  "onboardingA.drive.projection": "Volgend jaar rond deze tijd ongeveer {distance}.",
  "onboardingA.drive.caption": "Ongeveer is prima.",

  // onboardingB
  "onboardingB.continue": "Verder",

  "onboardingB.service.title": "Wat heb je als laatste laten doen?",
  "onboardingB.service.subtitle": "Bij benadering is prima.",
  "onboardingB.service.legend": "Onderhoud",
  "onboardingB.service.when": "{service}: wanneer was dat?",
  "onboardingB.service.whenOther": "Wanneer was dat onderhoud?",
  "onboardingB.service.whenPending": "Wanneer was dat?",
  "onboardingB.service.somethingElse": "Iets anders",
  "onboardingB.service.ago.now": "Zojuist",
  "onboardingB.service.ago.lastMonth": "Vorige maand",
  "onboardingB.service.ago.months3": "3 maanden geleden",
  "onboardingB.service.ago.months6": "6 maanden geleden",
  "onboardingB.service.ago.notSure": "Weet ik niet",

  "onboardingB.tracking.title": "Hoe hou je het nu bij?",
  "onboardingB.tracking.legend": "Nu",
  "onboardingB.tracking.memory": "Uit mijn hoofd",
  "onboardingB.tracking.receipts": "Bonnetjes in de auto",
  "onboardingB.tracking.spreadsheet": "Een spreadsheet",
  "onboardingB.tracking.dealer": "Mijn garage houdt het bij",
  "onboardingB.tracking.nothing": "Helemaal niets",

  "onboardingB.worry.title": "Wat wil je voorkomen?",
  "onboardingB.worry.subtitle": "Kies er zoveel als er kloppen.",
  "onboardingB.worry.bills": "Onverwachte reparatiekosten",
  "onboardingB.worry.missed": "Onderhoud missen",
  "onboardingB.worry.records": "De administratie kwijtraken",
  "onboardingB.worry.resale": "Restwaarde",
  "onboardingB.worry.upsell": "Onnodig werk",

  "onboardingB.analyzing.title": "Het schema wordt berekend.",
  "onboardingB.analyzing.odometer": "{vehicle} op {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} onderhoudsinterval toegepast",
    other: "{count} onderhoudsintervallen toegepast",
  },
  "onboardingB.analyzing.rate": "{distance} per jaar",
  "onboardingB.analyzing.rateProjected": "{distance} per jaar, dus {projected} volgend jaar",
  "onboardingB.analyzing.clear": "Vandaag hoeft er niets te gebeuren",
  "onboardingB.analyzing.due": {
    one: "{count} vraagt aandacht, {soon} binnenkort",
    other: "{count} vragen aandacht, {soon} binnenkort",
  },
  "onboardingB.analyzing.percent": "{percent}%",

  // onboardingC
  "onboardingC.back": "Terug",
  "onboardingC.question": "Vraag {step} / {total}",

  "onboardingC.schedule.title": {
    one: "Eén beurt, vanaf vandaag in de gaten.",
    other: "{count} beurten, vanaf vandaag in de gaten.",
  },
  "onboardingC.schedule.onWatch": "In de gaten",
  "onboardingC.schedule.status.fresh": "Vanaf vandaag",
  "onboardingC.schedule.line.fresh": "Vanaf vandaag in de gaten",
  "onboardingC.results.overdue": {
    one: "Eén onderhoudsbeurt is al te laat.",
    other: "{count} onderhoudsbeurten zijn al te laat.",
  },
  "onboardingC.results.subtitle": "Je {vehicle}, {distance} per jaar.",
  "onboardingC.results.continue": "Verder",
  "onboardingC.results.onFile": "Vastgelegd",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Nu",
  "onboardingC.results.status.soon": "Binnenkort",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "Geen gegevens",

  // The two odometer gauges on the payoff page: the reading typed, and where
  // it lands in a year at the stated rate.
  "onboardingC.outlook.odometer": "Vandaag",
  "onboardingC.outlook.projected": "Over een jaar",
  "onboardingC.cost.title": "{percent}% van de auto's op de weg is te laat voor een beurt.",
  "onboardingC.cost.percent": "{percent}%",
  "onboardingC.cost.tireRotations": "Bandenwissel te laat",
  "onboardingC.cost.oilChanges": "Olieverversing te laat",
  "onboardingC.cost.tracked": "Wrenchy houdt bij welke beurten je auto nodig heeft.",
  "onboardingC.cost.source": "{overdue}. Amerikaanse cijfers.",
  "onboardingC.cost.continue": "Doorgaan",

  "onboardingC.compare.title": "Op eigen houtje, of volgens een schema.",
  "onboardingC.compare.subtitle": "Je {vehicle}, op allebei de manieren.",
  "onboardingC.compare.dated": "Beurten met een datum",
  "onboardingC.compare.remembered": "Beurten die je zelf moet onthouden",
  "onboardingC.compare.alone": "Op eigen houtje",
  "onboardingC.compare.withApp": "Met Wrenchy",
  "onboardingC.compare.ofTotal": "{count} van {total}",
  "onboardingC.compare.source": "Geteld uit je eigen antwoorden. Geen gemiddelden, geen schattingen.",
  "onboardingC.compare.continue": "Verder",

  "onboardingC.symptoms.next": "Verder",
  "onboardingC.symptoms.last": "En wat doe ik daaraan",

  "onboardingC.help.title": "Alle drie zijn hetzelfde probleem.",
  "onboardingC.help.subtitle": "Niets staat opgeschreven waar het je kan waarschuwen.",
  "onboardingC.help.continue": "Verder",

  "onboardingC.reviews.title": "Deze app bestaat vanwege deze reviews.",
  "onboardingC.reviews.subtitle": {
    one:
      "{count} van de {total} App Store-reviews van apps die dit al doen is één tot drie sterren.",
    other:
      "{count} van de {total} App Store-reviews van apps die dit al doen zijn één tot drie sterren.",
  },
  "onboardingC.reviews.continue": "Verder",
  "onboardingC.reviews.mentioning": "Reviews over",

  // pain
  "pain.overdue.legend": "Te laat",
  "pain.overdue.headline": {
    one: "Eén onderhoudsbeurt is al te laat",
    other: "{count} onderhoudsbeurten zijn al te laat",
  },
  "pain.overdue.body": "Op je {vehicle}, vandaag. Het lampje gaat pas branden ná de schade, niet ervoor.",
  "pain.overdue.fix": "Afgeteld op datum en op afstand, gemeld voordat het onder nul gaat.",

  "pain.blind.legend": "Geen historie",
  "pain.blind.headline": {
    one: "Van {count} van de {total} onderhoudsbeurten is niets vastgelegd",
    other: "Van {count} van de {total} onderhoudsbeurten is niets vastgelegd",
  },
  "pain.blind.body": "Tot iets anders blijkt, geldt elk daarvan als openstaand.",
  "pain.blind.fix": "Leg er één vast en het hele schema begint. Dertig seconden, eenmalig.",

  "pain.memory.legend": "Uit je hoofd",
  "pain.memory.headline": "De enige kopie zit in je hoofd",
  "pain.memory.body": "Je geheugen houdt stand tot iemand aan de balie vraagt: wanneer precies?",
  "pain.memory.fix": "Op deze telefoon geschreven en daar gebleven. Geen account om het achter kwijt te raken.",

  "pain.nothing.legend": "Niet bijgehouden",
  "pain.nothing.headline": "Over deze auto is niets vastgelegd",
  "pain.nothing.body": "De auto houdt als enige de administratie bij, en hij vertelt het je door stuk te gaan.",
  "pain.nothing.fix": "Eén tik legt een beurt vast. Daarna bestaat de historie buiten de auto.",

  "pain.receipts.legend": "In het dashboardkastje",
  "pain.receipts.headline": "Een dashboardkastje is geen register",
  "pain.receipts.body": "Bonnen bewijzen wat er is gedaan. Wat er nu aankomt zeggen ze nooit.",
  "pain.receipts.fix": "Dezelfde bonnen als regels met datum, te sorteren, te zoeken en te exporteren.",

  "pain.spreadsheet.legend": "In een spreadsheet",
  "pain.spreadsheet.headline": "Een spreadsheet tikt je niet op de schouder",
  "pain.spreadsheet.body": "Hij bewaart de historie prima. Hij gaat alleen nooit zelf open om je te waarschuwen.",
  "pain.spreadsheet.fix": "Dezelfde regels, plus een melding op de dag dat een beurt valt.",

  "pain.dealer.legend": "Bij de garage",
  "pain.dealer.headline": "De administratie van de garage is van de garage",
  "pain.dealer.body": "Compleet tot je van garage wisselt, verhuist of verkoopt, en zichtbaar voor hen, niet voor jou.",
  "pain.dealer.fix": "Je eigen kopie, op je eigen telefoon, altijd te exporteren.",

  "pain.bills.legend": "De rekening",
  "pain.bills.headline": "Achterstallig onderhoud is geen bespaard geld",
  "pain.bills.body": "Het is hetzelfde geld later, met een sleepwagen ervoor.",
  "pain.bills.fix": "Elk interval afgeteld, zodat de goedkope klus goedkoop blijft.",

  "pain.missed.legend": "De misser",
  "pain.missed.headline": "Niets herinnert je eraan tot het te laat is",
  "pain.missed.body": "Niemand slaat een beurt met opzet over. Je slaat hem over op een gewone dinsdag.",
  "pain.missed.fix": "Eén melding per beurt, op de dag dat hij valt. Verder niets.",

  "pain.records.legend": "Het bewijs",
  "pain.records.headline": "Onbewezen onderhoud is niet-uitgevoerd onderhoud",
  "pain.records.body": "Een garantieclaim, een verkoop, een discussie met de garage: elk vraagt om het bewijs.",
  "pain.records.fix":
    "Een gedateerd logboek, en een spreadsheet zodra je die nodig hebt.",

  "pain.resale.legend": "Verkoop",
  "pain.resale.headline": "Een volledige historie is meer waard dan een schone",
  "pain.resale.body": "De koper trekt af wat je niet kunt laten zien. De dealer ook.",
  "pain.resale.fix": "Exporteer de hele historie en geef hem mee.",

  "pain.upsell.legend": "De balie",
  "pain.upsell.headline": "Zij kennen je historie. Jij niet.",
  "pain.upsell.body": "Geen vraag om naar te gissen terwijl iemand je er een offerte voor geeft.",
  "pain.upsell.fix": "De datum en de kilometerstand, aan de balie in twee tikken.",

  "pain.vehicleFallback": "auto",

  // evidence
  "evidence.records.label":
    "verloren gegevens, mislukte synchronisaties, geen manier om de data eruit te krijgen",
  "evidence.records.answer":
    "SQLite op je telefoon, en het hele logboek komt er als CSV uit.",

  "evidence.price.label": "de prijs, de paywall, of wat het uiteindelijk bleek te kosten",
  "evidence.price.answer":
    "Eén abonnement, verder niets te koop. Elke auto, elke registratie.",

  "evidence.account.label": "een account en een login voordat er iets werkte",
  "evidence.account.answer": "Geen account. Er is niets om op in te loggen.",

  "evidence.crashes.label": "crashes, vastlopers en bestanden die niet opengingen",
  "evidence.crashes.answer":
    "Je gegevens staan in een database op de telefoon, niet in een bestand dat kan weigeren te openen.",

  // features
  "features.history.title": "Elk onderhoud, voor altijd bewaard",
  "features.history.subtitle":
    "Datum, kilometerstand, kosten en notities van elke beurt, bewaard zolang je de auto hebt.",

  "features.due.title": "Aan de beurt op datum en op afstand",
  "features.due.subtitle":
    "Wat het eerst komt: de kilometers die je rijdt of de maanden die verstrijken.",

  "features.reminders.title": "Eén herinnering per onderhoud",
  "features.reminders.subtitle": "Op de dag dat het aan de beurt is, en verder nooit iets.",

  "features.export.title": "Alles exporteren als CSV",
  "features.export.subtitle": "Haal je hele logboek er wanneer je wilt uit als spreadsheet.",

  "features.costs.title": "Zie wat het je kost",
  "features.costs.subtitle":
    "Totalen per voertuig, per beurt en per maand, opgeteld uit de kosten die je invult.",

  "features.garage.title": "Onbeperkt voertuigen",
  "features.garage.subtitle": "Elke auto, bestelwagen en vrachtwagen die je hebt, op één plek.",

  "features.intervals.title": "Je eigen onderhoudsintervallen",
  "features.intervals.subtitle":
    "Pas ze aan zodra het instructieboekje het oneens is met de standaardwaarden.",

  // offer

  "offer.features.title": "Dit is wat je krijgt.",

  "offer.plan.title": "Dit is het plan.",
  "offer.plan.subtitle": {
    one: "{count} onderhoudsbeurt op schema voor je {vehicle}.",
    other: "{count} onderhoudsbeurten op schema voor je {vehicle}.",
  },
  "offer.plan.cta": "Herinneringen aanzetten",
  "offer.plan.decline": "Nu niet",
  "offer.notify.title": "Mis nooit meer een onderhoudsbeurt.",
  "offer.notify.off": "Herinneringen uit",
  "offer.notify.body": "Laatst gedaan op {date}.",
  "offer.plan.status.due": "Nu",
  "offer.plan.status.soon": "Binnenkort",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "Geen gegevens",

  "offer.paywall.title": "Mis nooit meer een beurt.",
  "offer.paywall.title.named": "{name}, mis nooit meer een beurt.",
  "offer.paywall.subtitle": "Elke onderhoudsbeurt en elke kilometerstand, vastgelegd.",
  "offer.paywall.vehicle": "Vastgelegd",
  "offer.paywall.scheduled": "Nu gevolgd",
  "offer.paywall.services": { one: "onderhoudsbeurt", other: "onderhoudsbeurten" },
  "offer.paywall.dueNow": "Vandaag te laat",
  "offer.paywall.nextUp": "Volgende waarschuwing",
  "offer.paywall.none": "Geen",
  "offer.paywall.point.tracked.title": "{vehicle} staat vastgelegd",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} beurt in de gaten, op datum en op afstand",
    other: "{count} beurten in de gaten, op datum en op afstand",
  },
  "offer.paywall.point.due.title": {
    one: "{count} beurt vandaag te laat",
    other: "{count} beurten vandaag te laat",
  },
  "offer.paywall.point.due.subtitle": "Volgende waarschuwing {date}",
  "offer.paywall.point.due.noNext": "Nog geen waarschuwing nodig",
  "offer.paywall.point.history.title": "De volledige historie bij verkoop",
  "offer.paywall.point.history.subtitle": "Elke beurt, kostenpost en stand, voor altijd bewaard en te exporteren.",
  "offer.paywall.point.reminders.title": "Een herinnering vóór elke beurt",
  "offer.paywall.point.reminders.subtitle": "Op de dag zelf, en nooit zeurend.",

  "offer.deal.title": "Tijdelijke aanbieding",
  "offer.deal.pct": "{pct}% korting",
  "offer.trial.cta": "Aanbieding claimen",
  "offer.trial.decline": "Ik betaal liever de volle prijs",
  "offer.trial.gets.reminders": "Herinnering voor elke beurt",
  "offer.trial.gets.due": "Aan de beurt op datum en afstand",
  "offer.trial.gets.history": "Elke beurt blijft bewaard",
  "offer.trial.gets.costs": "Zie wat je auto kost",
  "offer.trial.gets.garage": "Onbeperkt voertuigen",
  "offer.trial.gets.intervals": "Je eigen intervallen",
  "offer.trial.gets.export": "Alles exporteren als CSV",

  "offer.winback.title": "Je bent gestopt met vastleggen.",
  "offer.winback.decline": "Breng me gewoon naar mijn garage",
  "offer.winback.body":
    "Je gegevens staan precies waar je ze hebt achtergelaten. Niets is verlopen, niets is verwijderd en niets hoeft opnieuw te worden ingesteld.",
  "offer.winback.feedback": "Vertel ons wat er misging",
  "offer.winback.feedbackNote": "Een kort formulier, opent in Safari",
  "offer.winback.caption": "Of probeer het nog eens: een jaar Pro voor de aanbiedingsprijs. Altijd opzegbaar.",
  "subscribed.title": "Pro staat aan.",
  "subscribed.body": "{vehicle} staat nu in het schema. Je hoort het voordat een beurt verloopt, niet erna.",
  "subscribed.unlocked": "Nu actief",
  "subscribed.cta": "Bekijk het schema",
  "fuel.title": "Brandstof",
  "fuel.log": "Tankbeurt vastleggen",
  "fuel.seeAll": "Alle tankbeurten",
  "fuel.summary.last": "Laatste tank",
  "fuel.summary.average": "Gemiddeld",
  "fuel.summary.needFirst": "Leg een tankbeurt vast, dan staat die hier.",
  "fuel.summary.needSecond": "Nog één volle tank en je eerste cijfer verschijnt.",
  "fuel.history.title": "Tankbeurten",
  "fuel.history.empty": "Nog geen tankbeurten vastgelegd.",
  "fuel.row.partial": "Deels getankt",
  "fuel.deleted": "Tankbeurt verwijderd",
  "fuel.undo": "Ongedaan maken",
  "fuel.swipe.delete": "Verwijderen",
  "fuel.form.title": "Tankbeurt vastleggen",
  "fuel.form.odometer": "Kilometerteller ({unit})",
  "fuel.form.volume": "Brandstof ({unit})",
  "fuel.form.cost": "Totaal betaald (optioneel)",
  "fuel.form.full": "Vol getankt",
  "fuel.form.fullHint": "Laat dit aan staan, tenzij je niet helemaal vol hebt getankt.",
  "fuel.form.when": "Wanneer",
  "fuel.form.today": "Vandaag",
  "fuel.form.yesterday": "Gisteren",
  "fuel.form.otherDate": "Andere dag",
  "fuel.form.save": "Tankbeurt opslaan",
  "fuel.form.error": "Deze tankbeurt kon niet worden opgeslagen.",
  "fuel.form.needOdometer": "Vul de kilometerstand in en hoeveel brandstof erin ging.",
  "fuel.form.sameOdometer": "Dat is de stand van je vorige tankbeurt. Vul in wat de teller nu aangeeft.",
  "fuel.card.title": "Brandstof",
  "fuel.card.spend": "Brandstofkosten",
  "fuel.card.perDistance": "Kosten per 100 {unit}",
  "fuel.card.efficiency": "Verbruik",
  "fuel.card.months": "Laatste 12 maanden",
  "fuel.card.fills": { one: "Uit {count} tankbeurt met prijs.", other: "Uit {count} tankbeurten met prijs." },
  "fuel.card.unpriced": { one: "Bij {count} andere tankbeurt staat geen bedrag.", other: "Bij {count} andere tankbeurten staat geen bedrag." },
  "fuel.card.locked.title": "Zie wat brandstof je kost",
  "fuel.card.locked.body": "Je tankbeurten staan er al in. Pro maakt er verbruik, uitgaven en kosten per afstand van.",
  "fuel.card.locked.cta": "Brandstofinzicht ontgrendelen",
  "fuel.card.empty": "Leg twee volle tanks vast, dan vult dit zich.",
  "unit.gal": "{value} gal",
  "unit.litre": "{value} L",
  "unit.gal.label": "gal",
  "unit.litre.label": "L",
  "unit.mpg": "{value} mpg",
  "unit.l100km": "{value} L/100km",
  "unit.mpg.label": "mpg",
  "unit.l100km.label": "L/100km",
  "system.csv.fuel.volume": "Brandstof ({unit})",
  "system.csv.fuel.full": "Vol getankt",
  "system.csv.cell.yes": "Ja",
  "system.csv.cell.no": "Nee",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Sluiten",
  "paywall.period.week": "Wekelijks",
  "paywall.period.month": "Maandelijks",
  "paywall.period.year": "Jaarlijks",
  "paywall.per.week": "per week",
  "paywall.per.month": "per maand",
  "paywall.billed.month": "{price} per maand afgeschreven",
  "paywall.billed.year": "{price} per jaar afgeschreven",
  "paywall.save": "Bespaar {pct}%",
  "paywall.intro.label": "Je eerste week",
  "paywall.cta.week": "Doorgaan met wekelijks",
  "paywall.cta.month": "Doorgaan met maandelijks",
  "paywall.cta.year": "Doorgaan met jaarlijks",
  "paywall.legal.week": "Verlengt voor {price} per week. Altijd opzegbaar.",
  "paywall.legal.month": "Verlengt voor {price} per maand. Altijd opzegbaar.",
  "paywall.legal.year": "Verlengt voor {price} per jaar. Altijd opzegbaar.",
  "paywall.terms": "Voorwaarden",
  "paywall.privacy": "Privacy",
  "paywall.restore": "Herstellen",
  "paywall.included": "Inbegrepen bij Pro",
  "paywall.loading": "Prijzen laden",
  "paywall.retry": "Opnieuw proberen",
  "paywall.review.quote": 
    "Compared to other apps I tried like MyAutoLog, Carfax, or what have you not, this app absolutely surpasses them all in terms of functionality, design, and ease of use.",
  "paywall.review.name": "Tracy D.",
};

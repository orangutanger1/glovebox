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
  "garage.odometer.estimated": "Kilometerstand (schatting)",

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
  "vehicle.odometer.estimated": "Kilometerstand (schatting)",
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
  "system.notify.title": "Jouw {vehicle}: {service} is aan de beurt",
  "system.notify.body": "Laatst gedaan op {date}.",

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

  "system.quickaction.trial.title": "Pro gratis proberen",
  "system.quickaction.trial.subtitle": {
    one: "{count} dag, daarna loopt het door tenzij je opzegt",
    other: "{count} dagen, daarna loopt het door tenzij je opzegt",
  },
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

  "onboardingA.vehicle.title": "Wat rijd je?",
  "onboardingA.vehicle.year": "Bouwjaar",
  "onboardingA.vehicle.makeOptional": "Merk (optioneel)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.modelOptional": "Model (optioneel)",

  "onboardingA.odometer.title.mi": "Hoeveel mijl staat erop?",
  "onboardingA.odometer.title.km": "Hoeveel kilometer staat erop?",
  "onboardingA.odometer.field": "Kilometerstand ({unit})",
  "onboardingA.odometer.placeholder.mi": "84.210",
  "onboardingA.odometer.placeholder.km": "135.600",
  "onboardingA.odometer.caption": "Een ruwe schatting is prima.",

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
  "onboardingB.analyzing.done": "Klaar",
  "onboardingB.analyzing.progress": "Meting {index} van {total}",

  // onboardingC
  "onboardingC.back": "Terug",
  "onboardingC.question": "Vraag {step} / {total}",

  "onboardingC.results.overdue": {
    one: "Eén onderhoudsbeurt is al te laat.",
    other: "{count} onderhoudsbeurten zijn al te laat.",
  },
  "onboardingC.results.noBaseline": {
    one: "{count} onderhoudsbeurt heeft nog geen gegevens.",
    other: "{count} onderhoudsbeurten hebben nog geen gegevens.",
  },
  "onboardingC.results.noneYet": "Er is nog niets te laat.",
  "onboardingC.results.clear": "Niets is te laat, en niets komt in de buurt.",
  "onboardingC.results.subtitle": "Je {vehicle}, {distance} per jaar.",
  "onboardingC.results.continue": "Verder",
  "onboardingC.results.dueNow": "Nu aan de beurt",
  "onboardingC.results.soon": "Binnenkort",
  "onboardingC.results.onFile": "Vastgelegd",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Nu",
  "onboardingC.results.status.soon": "Binnenkort",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "Geen gegevens",

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
  "onboardingC.reviews.scroll": "Scroll om alle vier te lezen",
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
  "pain.records.fix": "Een gedateerd logboek, te exporteren als CSV. Voor altijd gratis, voor iedereen.",

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
  "evidence.records.answer": "SQLite op je telefoon. Exporteren naar CSV, voor altijd gratis.",

  "evidence.price.label": "de prijs, de paywall, of wat het uiteindelijk bleek te kosten",
  "evidence.price.answer": "De gratis versie is een volwaardige app. Eén auto, onbeperkte historie.",

  "evidence.account.label": "een account en een login voordat er iets werkte",
  "evidence.account.answer": "Geen account. Er is niets om op in te loggen.",

  "evidence.crashes.label": "crashes, vastlopers en bestanden die niet opengingen",
  "evidence.crashes.answer": "Verwijderde regels worden gemarkeerd, nooit echt weggegooid.",

  // features
  "features.history.title": "Elk onderhoud, voor altijd bewaard",
  "features.history.subtitle":
    "Datum, kilometerstand, kosten en notities, met verwijderde regels gemarkeerd in plaats van weggegooid.",

  "features.due.title": "Aan de beurt op datum en op afstand",
  "features.due.subtitle": "Wat het eerst komt, geteld vanaf de intervallen per onderhoud.",

  "features.reminders.title": "Eén herinnering per onderhoud",
  "features.reminders.subtitle": "Op de dag dat het aan de beurt is, en verder nooit iets.",

  "features.export.title": "Alles exporteren als CSV",
  "features.export.subtitle":
    "Voor altijd gratis voor iedereen, zodat je administratie nooit gegijzeld wordt door een abonnement.",

  "features.costs.title": "Zie wat het je kost",
  "features.costs.subtitle":
    "Totalen per voertuig, per beurt en per maand, opgeteld uit de kosten die je invult.",

  "features.garage.title": "Onbeperkt voertuigen",
  "features.garage.subtitle": "Elke auto, bestelwagen en vrachtwagen die je hebt, op één plek.",

  "features.intervals.title": "Je eigen onderhoudsintervallen",
  "features.intervals.subtitle":
    "Pas ze aan zodra het instructieboekje het oneens is met de standaardwaarden.",

  // offer
  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratis",

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
  "offer.plan.status.due": "Nu",
  "offer.plan.status.soon": "Binnenkort",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "Geen gegevens",

  "offer.paywall.title": "Auto’s waarschuwen niet. Dit wel.",
  "offer.paywall.subtitle": "Elke onderhoudsbeurt en elke kilometerstand, vastgelegd.",
  "offer.paywall.cta": "Mijn auto vastleggen",
  "offer.paywall.vehicle": "Vastgelegd",
  "offer.paywall.scheduled": "Nu gevolgd",
  "offer.paywall.services": { one: "onderhoudsbeurt", other: "onderhoudsbeurten" },
  "offer.paywall.dueNow": "Vandaag te laat",
  "offer.paywall.nextUp": "Volgende waarschuwing",
  "offer.paywall.none": "Geen",

  "offer.paywall.impact.legend": "Wat dat waard is",
  "offer.paywall.impact.warned": "Gewaarschuwd voordat het geld kost, niet erna.",
  "offer.paywall.impact.upsell": "Je komt binnen met de feiten. Niets wordt je twee keer verkocht.",
  "offer.paywall.impact.resale": "Een volledig logboek bij verkoop, en dat zie je terug in de prijs.",

  "offer.trial.title": { one: "Probeer het {count} dag.", other: "Probeer het {count} dagen." },
  "offer.trial.cta": {
    one: "Start mijn {count} gratis dag",
    other: "Start mijn {count} gratis dagen",
  },
  "offer.trial.decline": "Nee bedankt, laat de gratis app zien",
  "offer.trial.subtitle": "Volledige Pro, gratis. Vandaag wordt er niets afgeschreven.",
  "offer.trial.legend": "Zo verloopt de proefperiode",
  "offer.trial.now.title": "Vandaag",
  "offer.trial.now.body": "Alles gaat open: je plan, je herinneringen, je volledige logboek.",
  "offer.trial.runs.title": "Zolang hij loopt",
  "offer.trial.runs.body": "Elke beurt die je auto nodig heeft wordt bewaakt, niet onthouden.",
  "offer.trial.ends.title": "Als hij afloopt",
  "offer.trial.ends.body": "Hij verlengt tegen de prijs op het volgende scherm. Je beslist daarvoor.",

  "offer.winback.title": "Je bent gestopt met vastleggen.",
  "offer.winback.decline": "Breng me gewoon naar mijn garage",
  "offer.winback.body":
    "Je gegevens staan precies waar je ze hebt achtergelaten. Niets is verlopen, niets is verwijderd en niets hoeft opnieuw te worden ingesteld.",
  "offer.winback.feedback": "Vertel ons wat er misging",
  "offer.winback.feedbackNote": "Een kort formulier, opent in Safari",
  "offer.winback.caption": {
    one: "Of geef het nog één kans: {count} dag Pro, gratis. Zeg op voordat het afloopt en je betaalt niets.",
    other:
      "Of geef het nog één kans: {count} dagen Pro, gratis. Zeg op voordat ze aflopen en je betaalt niets.",
  },
  "subscribed.title": "Pro staat aan.",
  "subscribed.body": "{vehicle} staat nu in het schema. Je hoort het voordat een beurt verloopt, niet erna.",
  "subscribed.unlocked": "Ook ontgrendeld",
  "subscribed.cta": "Bekijk het schema",
};

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
  "system.notify.title": "{vehicle}: {service} aan de beurt",
  "system.notify.body": "Laatst gedaan op {date}.",

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
  "onboardingA.welcome.privacy":
    "Alles blijft op deze telefoon, zonder account en zonder iets om uit te loggen.",

  "onboardingA.vehicle.title": "Wat rijd je?",
  "onboardingA.vehicle.year": "Bouwjaar",
  "onboardingA.vehicle.makeOptional": "Merk (optioneel)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",
  "onboardingA.vehicle.saved": 'Bewaard als "{name}", en je kunt het later hernoemen.',
  "onboardingA.vehicle.modelOptional": "Model (optioneel)",
  "onboardingA.vehicle.hint":
    "Het bouwjaar is genoeg om te beginnen. Merk en model zorgen er alleen voor dat herinneringen de auto bij naam noemen.",

  "onboardingA.odometer.title.mi": "Hoeveel mijl staat erop?",
  "onboardingA.odometer.title.km": "Hoeveel kilometer staat erop?",
  "onboardingA.odometer.field": "Kilometerstand ({unit})",
  "onboardingA.odometer.placeholder.mi": "84.210",
  "onboardingA.odometer.placeholder.km": "135.600",
  "onboardingA.odometer.caption":
    "Een ruwe schatting is prima, en het is het getal dat bepaalt wanneer onderhoud op afstand aan de beurt is.",
  "onboardingA.odometer.later": "Ik vul het later in",

  "onboardingA.drive.title": "Hoeveel rijd je ermee?",
  "onboardingA.drive.subtitle":
    "Ongeveer, want dit is het getal dat van een afstandsinterval een datum maakt.",
  "onboardingA.drive.legend": "Afstand per jaar ({unit})",
  "onboardingA.drive.low.mi": "Tot 5.000",
  "onboardingA.drive.low.km": "Tot 8.000",
  "onboardingA.drive.average.mi": "5.000 tot 10.000",
  "onboardingA.drive.average.km": "8.000 tot 16.000",
  "onboardingA.drive.high.mi": "10.000 tot 15.000",
  "onboardingA.drive.high.km": "16.000 tot 24.000",
  "onboardingA.drive.very_high.mi": "Boven 15.000",
  "onboardingA.drive.very_high.km": "Boven 24.000",
  "onboardingA.drive.projection":
    "In dat tempo staat deze auto over een jaar op ongeveer {distance}.",
  "onboardingA.drive.caption":
    "Wordt gebruikt om onderhoud te dateren dat op afstand aan de beurt is in plaats van op de kalender.",

  // onboardingB
  "onboardingB.continue": "Verder",

  "onboardingB.service.title": "Wat heb je als laatste laten doen?",
  "onboardingB.service.subtitle": "Bij benadering is prima, want je kunt het later corrigeren.",
  "onboardingB.service.legend": "Onderhoud",
  "onboardingB.service.caption": "Kies er een, en de rest kun je altijd nog vastleggen.",
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
  "onboardingB.tracking.subtitle": "Wat het ook is, het is meer dan de meeste mensen doen.",
  "onboardingB.tracking.legend": "Nu",
  "onboardingB.tracking.caption":
    "Wat je ook kiest, Wrenchy exporteert alles wat je vastlegt gratis als CSV.",
  "onboardingB.tracking.memory": "Uit mijn hoofd",
  "onboardingB.tracking.receipts": "Bonnetjes in de auto",
  "onboardingB.tracking.spreadsheet": "Een spreadsheet",
  "onboardingB.tracking.dealer": "Mijn garage houdt het bij",
  "onboardingB.tracking.nothing": "Helemaal niets",

  "onboardingB.worry.title": "Wat wil je voorkomen?",
  "onboardingB.worry.subtitle":
    "Kies er zoveel als er kloppen, want hiermee bepaal je wat de app je voorlegt.",
  "onboardingB.worry.caption":
    "Dit is de laatste, en het volgende scherm gaat over je auto in plaats van over de app.",
  "onboardingB.worry.bills": "Onverwachte reparatiekosten",
  "onboardingB.worry.missed": "Onderhoud missen",
  "onboardingB.worry.records": "De administratie kwijtraken",
  "onboardingB.worry.resale": "Restwaarde",
  "onboardingB.worry.upsell": "Onnodig werk",
  "onboardingB.worry.optional":
    "Allemaal optioneel. Sla het over en het volgende scherm komt alleen uit je auto.",

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
  "onboardingC.results.noneLogged": "Niets van wat je hebt vastgelegd is te laat.",
  "onboardingC.results.noneYet": "Er is nog niets te laat.",
  "onboardingC.results.clear": "Niets is te laat, en niets komt in de buurt.",
  "onboardingC.results.subtitle":
    "Berekend voor je {vehicle} op basis van {distance} per jaar en wat je hebt vastgelegd.",
  "onboardingC.results.continue": "Verder",
  "onboardingC.results.dueNow": "Nu aan de beurt",
  "onboardingC.results.soon": "Binnenkort",
  "onboardingC.results.onFile": "Vastgelegd",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Nu",
  "onboardingC.results.status.soon": "Binnenkort",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.next":
    "De volgende valt op {date}, en wat het eerst komt telt: de datum of de afstand.",
  "onboardingC.results.countdown":
    "Elk onderhoud telt af op datum en op afstand, en wat het eerst komt telt.",

  "onboardingC.symptoms.next": "Verder",
  "onboardingC.symptoms.last": "En wat doe ik daaraan",

  "onboardingC.help.title": "Alle drie zijn hetzelfde probleem.",
  "onboardingC.help.subtitle":
    "Er staat niets opgeschreven in een vorm die je kan waarschuwen, en dat is precies wat Wrenchy doet.",
  "onboardingC.help.continue": "Verder",

  "onboardingC.reviews.title": "Deze app bestaat vanwege deze reviews.",
  "onboardingC.reviews.subtitle": {
    one: "{count} van de {total} App Store-reviews van de {apps} apps die dit al doen is één tot drie sterren.",
    other:
      "{count} van de {total} App Store-reviews van de {apps} apps die dit al doen zijn één tot drie sterren.",
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
  "pain.overdue.body":
    "Op je {vehicle}, vandaag. Het dashboard gaat er niets over zeggen, want het lampje gaat pas branden ná de schade, niet ervoor.",
  "pain.overdue.fix":
    "Elk onderhoud telt af op datum en op afstand, en wordt gemeld voordat het getal negatief wordt.",

  "pain.blind.legend": "Geen historie",
  "pain.blind.headline": {
    one: "Van {count} van de {total} onderhoudsbeurten is niets vastgelegd",
    other: "Van {count} van de {total} onderhoudsbeurten is niets vastgelegd",
  },
  "pain.blind.body":
    "Wrenchy kan niet bewijzen wat het nooit heeft gezien, en jij ook niet. Tot het tegendeel blijkt, geldt elk daarvan als aan de beurt.",
  "pain.blind.fix":
    "Leg er een vast en het hele schema begint te lopen. Dertig seconden per stuk, eenmalig.",

  "pain.memory.legend": "Uit je hoofd",
  "pain.memory.headline": "De enige kopie zit in je hoofd",
  "pain.memory.body":
    "Je zei dat je op je geheugen vaart. Dat houdt stand tot de vraag \u201cwanneer precies?\u201d wordt gesteld: aan de balie, bij de verkoop, of met een lampje aan op de snelweg.",
  "pain.memory.fix":
    "Elk onderhoud dat je vastlegt wordt op deze telefoon opgeslagen en blijft daar. Geen account waarachter het kwijt kan raken.",

  "pain.nothing.legend": "Niet bijgehouden",
  "pain.nothing.headline": "Over deze auto is niets vastgelegd",
  "pain.nothing.body":
    "Niet wanneer de olie voor het laatst is ververst, en niet bij welke kilometerstand dat was. De auto houdt als enige de historie bij, en die vertelt het je door kapot te gaan.",
  "pain.nothing.fix":
    "Eén tik legt onderhoud vast. Vanaf dat moment bestaat de historie ergens anders dan in de auto.",

  "pain.receipts.legend": "In het dashboardkastje",
  "pain.receipts.headline": "Een dashboardkastje is geen register",
  "pain.receipts.body":
    "Bonnetjes bewijzen dát er onderhoud is geweest. Ze zeggen niet wat er hierna aan de beurt is, ze liggen niet op volgorde, en thermisch papier vervaagt tot een leeg vel.",
  "pain.receipts.fix":
    "Dezelfde bonnetjes als regels met datum die je kunt sorteren, doorzoeken en exporteren als CSV.",

  "pain.spreadsheet.legend": "In een spreadsheet",
  "pain.spreadsheet.headline": "Een spreadsheet tikt je niet op de schouder",
  "pain.spreadsheet.body":
    "De historie bewaren gaat prima. Hij opent zichzelf alleen nooit, en het enige wat je eruit nodig hebt is een waarschuwing waar je niet aan dacht te gaan zoeken.",
  "pain.spreadsheet.fix": "Dezelfde regels, plus één melding op de dag dat onderhoud aan de beurt is.",

  "pain.dealer.legend": "Bij de garage",
  "pain.dealer.headline": "De administratie van de garage is van de garage",
  "pain.dealer.body":
    "Compleet, tot je van garage wisselt, verhuist of de auto verkoopt, en zichtbaar voor degene die je offerte opstelt in plaats van voor jou.",
  "pain.dealer.fix": "Je eigen kopie, op je eigen telefoon, te exporteren wanneer je maar wilt.",

  "pain.bills.legend": "De rekening",
  "pain.bills.headline": "Achterstallig onderhoud is geen bespaard geld",
  "pain.bills.body":
    "Het is hetzelfde geld, later, met een sleepwagen ervoor. De klussen die duur mislopen zijn de goedkope die niemand bijhield.",
  "pain.bills.fix": "Elk interval telt af, zodat de goedkope klus een goedkope klus blijft.",

  "pain.missed.legend": "De misser",
  "pain.missed.headline": "Niets herinnert je eraan tot het te laat is",
  "pain.missed.body":
    "Onderhoud wordt nooit met opzet overgeslagen. Het wordt gemist op een gewone dinsdag, en de week erna weer, en de kilometerstand loopt door.",
  "pain.missed.fix": "Eén melding per onderhoud, op de dag dat het aan de beurt is. Verder niets, nooit.",

  "pain.records.legend": "Het bewijs",
  "pain.records.headline": "Onbewezen onderhoud is niet-uitgevoerd onderhoud",
  "pain.records.body":
    "Een garantieclaim, een verkoop, een discussie met de garage: ze vragen allemaal om het bewijs, niet om jouw herinnering eraan.",
  "pain.records.fix":
    "Een logboek met datums dat je kunt exporteren als CSV. Voor altijd gratis, voor iedereen, met of zonder abonnement.",

  "pain.resale.legend": "Verkoop",
  "pain.resale.headline": "Een volledige historie is meer waard dan een schone",
  "pain.resale.body":
    "De koper trekt af wat je niet kunt laten zien, en de handelaar die hem inruilt ook. De auto is alleen waard wat je erover kunt bewijzen.",
  "pain.resale.fix":
    "Exporteer de hele historie naar CSV en geef die mee. Daar zit niets van achter het abonnement.",

  "pain.upsell.legend": "De balie",
  "pain.upsell.headline": "Zij kennen je historie. Jij niet.",
  "pain.upsell.body":
    "\u201cWanneer zijn je remmen voor het laatst nagekeken?\u201d is geen vraag om naar te gokken terwijl iemand je er een offerte voor geeft.",
  "pain.upsell.fix": "De datum en de kilometerstand, aan de balie in twee tikken op je scherm.",

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

  "features.garage.title": "Meer dan één voertuig",
  "features.garage.subtitle": "De hele garage, elk met een eigen schema.",

  "features.intervals.title": "Je eigen onderhoudsintervallen",
  "features.intervals.subtitle":
    "Pas ze aan zodra het instructieboekje het oneens is met de standaardwaarden.",

  // offer
  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratis",

  "offer.features.title": "Dit is wat je krijgt.",
  "offer.features.subtitle":
    "Alles staat in één bestand op deze telefoon, zonder account en zonder server.",
  "offer.features.cta": "Verder",

  "offer.plan.title": "Dit is het plan.",
  "offer.plan.subtitle": {
    one: "{count} onderhoudsbeurt op schema voor je {vehicle}, geteld op datum en op afstand.",
    other: "{count} onderhoudsbeurten op schema voor je {vehicle}, geteld op datum en op afstand.",
  },
  "offer.plan.cta": "Herinneringen aanzetten",
  "offer.plan.decline": "Nu niet",
  "offer.plan.status.due": "Nu",
  "offer.plan.status.soon": "Binnenkort",
  "offer.plan.status.ok": "OK",
  "offer.plan.note": "Eén melding per onderhoud op de dag dat het aan de beurt is.",
  "offer.plan.noteMore": {
    one: "Plus nog {count} verderop, en één melding per onderhoud op de dag dat het aan de beurt is.",
    other:
      "Plus nog {count} verderop, en één melding per onderhoud op de dag dat het aan de beurt is.",
  },

  "offer.paywall.title": "Auto’s waarschuwen niet. Dit wel.",
  "offer.paywall.subtitle":
    "Elke onderhoudsbeurt en elke kilometerstand, vastgelegd. De garage ziet een boekje, geen gok.",
  "offer.paywall.cta": "Mijn auto vastleggen",
  "offer.paywall.vehicle": "Vastgelegd",
  "offer.paywall.scheduled": "Nu gevolgd",
  "offer.paywall.services": { one: "onderhoudsbeurt", other: "onderhoudsbeurten" },
  "offer.paywall.dueNow": "Vandaag te laat",
  "offer.paywall.nextUp": "Volgende waarschuwing",
  "offer.paywall.none": "Geen",
  "offer.paywall.caption":
    "Alles wat je net hebt ingesteld staat al op deze telefoon. Geen account, geen server, niets gaat weg.",

  "offer.trial.title": { one: "Probeer het {count} dag.", other: "Probeer het {count} dagen." },
  "offer.trial.subtitle": {
    one: "Neem {count} dag Pro voor niets en beslis pas als je auto je echt iets heeft verteld.",
    other: "Neem {count} dagen Pro voor niets en beslis pas als je auto je echt iets heeft verteld.",
  },
  "offer.trial.cta": {
    one: "Start mijn {count} gratis dag",
    other: "Start mijn {count} gratis dagen",
  },
  "offer.trial.decline": "Nee bedankt, laat de gratis app zien",
  "offer.trial.caption": "Zeg op in Instellingen voordat het afloopt en je betaalt niets.",

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
};

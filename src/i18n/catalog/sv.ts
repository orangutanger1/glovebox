import type { Fragment } from "./types";

/**
 * Swedish (sv-SE). Register: du.
 *
 * Deliberate choices a reviewer would otherwise question:
 * - `service.Inspection` is **Kontrollbesiktning**, the legal name of the test
 *   (Transportstyrelsen's own word, and what the reminder letter says). It is the
 *   longest label in the catalog; the everyday short form "besiktning" is the
 *   swap if a chip row ever wraps, but there is only this one key and the formal
 *   name is what an owner recognises as the thing the law makes them do.
 * - `service.Registration` is **Fordonsskatt** — the recurring bill a Swedish
 *   owner actually pays, not a literal "registrering".
 * - `service.Tire Rotation` is **Hjulskifte**: the six-month / 10 000 km item in
 *   `SERVICE_INTERVALS` is the seasonal wheel change every Swedish owner books
 *   twice a year, and that is the word they say for it.
 * - Counted services are "servicepunkter" ("service" has no usable Swedish
 *   plural); uncounted ones stay the mass noun "service".
 * - "due" is rendered with Swedish garage idiom — "dags", "snart dags",
 *   "försenad", "ska göras" — never the financial "förfaller".
 * - `onboardingA.odometer.title.mi` says "miles", not "mil": a Swedish "mil" is
 *   ten kilometres, so the dictionary word would be wrong by a factor of ten.
 * - Literal figures use the Swedish thousands space, non-breaking so a chip
 *   cannot break inside a number; `unit.mi` / `unit.km` keep the abbreviations
 *   and take a non-breaking space before them, which is Swedish typography.
 * - `pain.memory.body` moves the American "a light on at 70" to 110, the Swedish
 *   motorway speed, because it is a motorway image and not a number.
 * - `system.csv.cell.deleted` stays the English cell value on purpose.
 */
export const sv: Fragment = {
  "evidence.records.label": "förlorade uppgifter, trasig synk, ingen väg att få ut datan",
  "evidence.records.answer": "SQLite i din telefon. Exportera till CSV, gratis för alltid.",

  "evidence.price.label": "priset, betalväggen eller vad det visade sig kosta",
  "evidence.price.answer": "Gratisversionen är en fullt användbar app. En bil, obegränsad historik.",

  "evidence.account.label": "konto och inloggning innan något fungerade",
  "evidence.account.answer": "Inget konto. Det finns ingenting att logga in på.",

  "evidence.crashes.label": "krascher, appen som låser sig, filer som inte gick att öppna",
  "evidence.crashes.answer": "Borttagna poster markeras bara som raderade, de kastas aldrig.",

  "features.history.title": "Varje service, sparad för alltid",
  "features.history.subtitle":
    "Datum, mätarställning, kostnad och anteckningar. Borttagna rader markeras som raderade i stället för att kastas.",

  "features.due.title": "Dags efter datum och sträcka",
  "features.due.subtitle": "Det som kommer först, räknat från intervallen för varje service.",

  "features.reminders.title": "En påminnelse per service",
  "features.reminders.subtitle": "Den dag det ska göras, och aldrig något annat.",

  "features.export.title": "Exportera allt som CSV",
  "features.export.subtitle":
    "Gratis för alla, för alltid, så att dina uppgifter aldrig sitter fast bakom ett abonnemang.",

  "features.garage.title": "Fler än ett fordon",
  "features.garage.subtitle": "Hela garaget, var och en med sitt eget schema.",

  "features.intervals.title": "Dina egna serviceintervall",
  "features.intervals.subtitle":
    "Ändra vilket som helst när instruktionsboken säger något annat än standardvärdena.",

  "garage.title": "Garaget",
  "garage.logService": "Logga en service",
  "garage.addVehicle": "Lägg till fordon",
  "garage.comingUp": "Närmast",
  "garage.quickLog": "Logga med en tryckning",
  "garage.empty": "Inga fordon än. Lägg till ett och Wrenchy börjar föra dess historik.",
  "garage.storeUnreachable": "Kunde inte nå App Store. Försök igen med bättre uppkoppling.",

  "garage.badge.overdue": "Försenad",
  "garage.badge.dueSoon": "Snart dags",

  "garage.odometer": "Mätarställning",
  "garage.odometer.notSet": "Inte angiven",
  "garage.odometer.estimated": "Mätarställning (ca)",

  "garage.over": "{distance} över",
  "garage.dueNow": "dags nu",
  "garage.dueSoon": "snart dags",
  "garage.onSchedule": "enligt plan",

  "garage.noSchedule": "Inget schema än",
  "garage.noSchedule.detail": "loggad, inte bevakad",
  "garage.nothingLogged": "Inget loggat",
  "garage.nothingLogged.detail": "lägg till en service",

  "garage.openHistory": "Öppna historiken",
  "garage.openAndLog": "Öppna och logga en service",

  "intervals.title": "Serviceintervall",
  "intervals.intro":
    "Hur ofta varje service ska göras. Ändra vilket som helst så att det passar din egen bil, instruktionsboken, klimatet du kör i eller hur hårt du använder den.",
  "intervals.custom": "EGET",

  "intervals.untracked": "bevakas inte",
  "intervals.months": { one: "{count} månad", other: "{count} månader" },
  "intervals.monthsAndDistance": {
    one: "{count} månad · {distance}",
    other: "{count} månader · {distance}",
  },

  "intervals.help":
    "Det som kommer först gäller. Lämna ett fält tomt för att strunta i det, så bara sträcka eller bara månader är ett giltigt schema. Töm båda för att gå tillbaka till standard ({default}).",
  "intervals.field.months": "Var (månader)",
  "intervals.field.distance": "Var ({unit})",
  "intervals.error.positive":
    "Använd hela tal större än noll, eller lämna fältet tomt för att strunta i det.",
  "intervals.save": "Spara intervall",
  "intervals.cancel": "Avbryt",

  "language.title": "Språk",
  "language.intro":
    "Wrenchy följer din telefon om du inte väljer ett språk här. Servicenamnen använder de ord verkstäderna använder på det språket.",
  "language.system": "System",

  "layout.garage": "Garaget",
  "layout.settings": "Inställningar",
  "layout.intervals": "Serviceintervall",
  "layout.addVehicle": "Lägg till fordon",
  "layout.vehicle": "Fordon",
  "layout.logService": "Logga en service",
  "layout.fatal.retry": "Försök igen",
  "layout.fatal.title": "Wrenchy kunde inte öppna dina uppgifter.",
  "layout.fatal.body":
    "Ingenting har raderats, och databasen återställdes till sitt senast fungerande läge. Öppna appen igen. Om det fortsätter hända, kontakta supporten innan du installerar om, för det är ominstallationen som faktiskt skulle förlora uppgifterna.",

  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratis",

  "offer.features.title": "Det här får du.",

  "offer.plan.title": "Så här ser planen ut.",
  "offer.plan.subtitle": {
    one: "{count} servicepunkt i schemat för din {vehicle}.",
    other: "{count} servicepunkter i schemat för din {vehicle}.",
  },
  "offer.plan.cta": "Slå på påminnelser",
  "offer.plan.decline": "Inte nu",
  "offer.notify.title": "Missa aldrig en service.",
  "offer.notify.off": "P\u00e5minnelser av",

  "offer.paywall.title": "Bilar varnar inte. Det här gör det.",
  "offer.paywall.subtitle": "Varje service och varje mätarställning, på pränt.",
  "offer.paywall.cta": "Håll bilen på pränt",
  "offer.paywall.vehicle": "På pränt",
  "offer.paywall.scheduled": "Nu bevakat",
  "offer.paywall.services": { one: "servicepunkt", other: "servicepunkter" },
  "offer.paywall.dueNow": "Försenat i dag",
  "offer.paywall.nextUp": "Nästa varning",
  "offer.paywall.none": "Ingen",

  "offer.paywall.impact.legend": "Vad det är värt",
  "offer.paywall.impact.warned": "Varnad innan det kostar, inte efter.",
  "offer.paywall.impact.upsell": "Du går in och vet. Inget säljs till dig två gånger.",
  "offer.paywall.impact.resale": "En komplett logg vid försäljning, och det syns på priset.",

  "offer.trial.title": { one: "Testa i {count} dag.", other: "Testa i {count} dagar." },
  "offer.trial.cta": {
    one: "Starta min {count} gratisdag",
    other: "Starta mina {count} gratisdagar",
  },
  "offer.trial.decline": "Nej tack, visa gratisappen",
  "offer.trial.subtitle": "Hela Pro, gratis. Inget dras i dag.",
  "offer.trial.legend": "Så fungerar provperioden",
  "offer.trial.now.title": "I dag",
  "offer.trial.now.body": "Allt låses upp: din plan, dina påminnelser, hela loggboken.",
  "offer.trial.runs.title": "Under provperioden",
  "offer.trial.runs.body": "Varje service bilen ska ha bevakas, den behöver inte kommas ihåg.",
  "offer.trial.ends.title": "När den tar slut",
  "offer.trial.ends.body": "Den förnyas till priset på nästa skärm. Du bestämmer innan dess.",

  "offer.winback.title": "Du slutade logga.",
  "offer.winback.decline": "Ta mig bara till garaget",
  "offer.winback.body":
    "Dina uppgifter ligger exakt där du lämnade dem. Ingenting har gått ut, ingenting har raderats och ingenting behöver ställas in igen.",
  "offer.winback.feedback": "Berätta vad som gick fel",
  "offer.winback.feedbackNote": "Ett kort formulär, öppnas i Safari",
  "offer.winback.caption": {
    one: "Eller ge det ett försök till: {count} dag av Pro, gratis. Säg upp innan den tar slut, då betalar du ingenting.",
    other:
      "Eller ge det ett försök till: {count} dagar av Pro, gratis. Säg upp innan de tar slut, då betalar du ingenting.",
  },

  "onboardingA.continue": "Fortsätt",

  "onboardingA.welcome.headline": "Sluta gissa när du senast bytte olja.",
  "onboardingA.welcome.start": "Kom igång",
  "onboardingA.welcome.privacy": "Inget konto. Inget lämnar telefonen.",

  "onboardingA.vehicle.title": "Vad kör du?",
  "onboardingA.vehicle.year": "Årsmodell",
  "onboardingA.vehicle.makeOptional": "Märke (valfritt)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.modelOptional": "Modell (valfritt)",

  "onboardingA.odometer.title.mi": "Hur många miles står den på?",
  "onboardingA.odometer.title.km": "Hur många kilometer står den på?",
  "onboardingA.odometer.field": "Mätarställning ({unit})",
  "onboardingA.odometer.placeholder.mi": "84\u00A0210",
  "onboardingA.odometer.placeholder.km": "135\u00A0600",
  "onboardingA.odometer.caption": "En ungefärlig siffra räcker.",

  "onboardingA.drive.title": "Hur långt kör du den?",
  "onboardingA.drive.legend": "Sträcka per år ({unit})",
  "onboardingA.drive.low.mi": "Under 5\u00A0000",
  "onboardingA.drive.low.km": "Under 8\u00A0000",
  "onboardingA.drive.average.mi": "5\u00A0000\u201310\u00A0000",
  "onboardingA.drive.average.km": "8\u00A0000\u201316\u00A0000",
  "onboardingA.drive.high.mi": "10\u00A0000\u201315\u00A0000",
  "onboardingA.drive.high.km": "16\u00A0000\u201324\u00A0000",
  "onboardingA.drive.very_high.mi": "Över 15\u00A0000",
  "onboardingA.drive.very_high.km": "Över 24\u00A0000",
  "onboardingA.drive.projection": "Ungefär {distance} den här tiden nästa år.",
  "onboardingA.drive.caption": "Ungefär räcker.",

  "onboardingB.continue": "Fortsätt",

  "onboardingB.service.title": "Vad gjordes senast?",
  "onboardingB.service.subtitle": "Nära nog räcker.",
  "onboardingB.service.legend": "Service",
  "onboardingB.service.when": "När gjordes {service}?",
  "onboardingB.service.whenOther": "När gjordes servicen?",
  "onboardingB.service.whenPending": "När var det?",
  "onboardingB.service.somethingElse": "Något annat",
  "onboardingB.service.ago.now": "Precis nu",
  "onboardingB.service.ago.lastMonth": "Förra månaden",
  "onboardingB.service.ago.months3": "3 månader sedan",
  "onboardingB.service.ago.months6": "6 månader sedan",
  "onboardingB.service.ago.notSure": "Osäker",

  "onboardingB.tracking.title": "Hur håller du koll i dag?",
  "onboardingB.tracking.legend": "I dag",
  "onboardingB.tracking.memory": "Minnet",
  "onboardingB.tracking.receipts": "Kvitton i bilen",
  "onboardingB.tracking.spreadsheet": "Ett kalkylblad",
  "onboardingB.tracking.dealer": "Verkstaden har det",
  "onboardingB.tracking.nothing": "Ingenting alls",

  "onboardingB.worry.title": "Vad vill du undvika?",
  "onboardingB.worry.subtitle": "Välj så många som stämmer.",
  "onboardingB.worry.bills": "Oväntade reparationer",
  "onboardingB.worry.missed": "Missa en service",
  "onboardingB.worry.records": "Tappa historiken",
  "onboardingB.worry.resale": "Andrahandsvärdet",
  "onboardingB.worry.upsell": "Onödiga extrajobb",

  "onboardingB.analyzing.title": "Räknar ut schemat.",
  "onboardingB.analyzing.odometer": "{vehicle} på {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} serviceintervall tillämpat",
    other: "{count} serviceintervall tillämpade",
  },
  "onboardingB.analyzing.rate": "{distance} per år",
  "onboardingB.analyzing.rateProjected": "{distance} per år, alltså {projected} nästa år",
  "onboardingB.analyzing.clear": "Inget behöver åtgärdas i dag",
  "onboardingB.analyzing.due": {
    one: "{count} behöver åtgärdas, {soon} på väg",
    other: "{count} behöver åtgärdas, {soon} på väg",
  },
  "onboardingB.analyzing.done": "Klart",
  "onboardingB.analyzing.progress": "Läser {index} av {total}",

  "onboardingC.back": "Tillbaka",
  "onboardingC.question": "Fråga {step} / {total}",

  "onboardingC.results.overdue": {
    one: "En service är redan försenad.",
    other: "{count} servicepunkter är redan försenade.",
  },
  "onboardingC.results.noBaseline": {
    one: "{count} service saknar ännu uppgifter.",
    other: "{count} servicetillfällen saknar ännu uppgifter.",
  },
  "onboardingC.results.noneYet": "Inget är försenat än.",
  "onboardingC.results.clear": "Inget är försenat, och inget är nära.",
  "onboardingC.results.subtitle": "Din {vehicle}, {distance} per år.",
  "onboardingC.results.continue": "Fortsätt",
  "onboardingC.results.dueNow": "Dags nu",
  "onboardingC.results.soon": "Snart",
  "onboardingC.results.onFile": "Loggat",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Dags",
  "onboardingC.results.status.soon": "Snart",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "Inga uppgifter",

  "onboardingC.symptoms.next": "Fortsätt",
  "onboardingC.symptoms.last": "Så vad gör jag",

  "onboardingC.help.title": "Alla tre är samma problem.",
  "onboardingC.help.subtitle": "Ingenting är skrivet ner där det kan varna dig.",
  "onboardingC.help.continue": "Fortsätt",

  "onboardingC.reviews.title": "Den här appen finns på grund av de här.",
  "onboardingC.reviews.subtitle": {
    one: "{count} av {total} App Store-recensioner av appar som redan gör det här är på en till tre stjärnor.",
    other:
      "{count} av {total} App Store-recensioner av appar som redan gör det här är på en till tre stjärnor.",
  },
  "onboardingC.reviews.continue": "Fortsätt",
  "onboardingC.reviews.scroll": "Skrolla för att läsa alla fyra",
  "onboardingC.reviews.mentioning": "Recensioner som nämner",

  "pain.overdue.legend": "Försenat",
  "pain.overdue.headline": {
    one: "En service är redan försenad",
    other: "{count} servicepunkter är redan försenade",
  },
  "pain.overdue.body": "På din {vehicle}, i dag. Lampan tänds efter skadan, inte före.",
  "pain.overdue.fix": "Nedräknat på datum och på sträcka, flaggat innan det går under noll.",

  "pain.blind.legend": "Inga uppgifter",
  "pain.blind.headline": {
    one: "{count} av {total} servicepunkter saknar uppgifter",
    other: "{count} av {total} servicepunkter saknar uppgifter",
  },
  "pain.blind.body": "Tills något säger annat räknas varenda en av dem som förfallen.",
  "pain.blind.fix": "Logga en så startar hela dess schema. Trettio sekunder, en gång.",

  "pain.memory.legend": "Ur minnet",
  "pain.memory.headline": "Enda kopian finns i huvudet",
  "pain.memory.body": "Minnet håller ända tills någon i kassan frågar: när exakt?",
  "pain.memory.fix": "Skrivet till den här telefonen och stannar där. Inget konto att tappa bort det bakom.",

  "pain.nothing.legend": "Obevakad",
  "pain.nothing.headline": "Ingenting om den här bilen är skrivet ner",
  "pain.nothing.body": "Bilen för den enda bokföringen, och sättet den berättar det på är att gå sönder.",
  "pain.nothing.fix": "En tryckning loggar en service. Därefter finns historiken utanför bilen.",

  "pain.receipts.legend": "I handskfacket",
  "pain.receipts.headline": "Ett handskfack är inget register",
  "pain.receipts.body": "Kvitton bevisar vad som gjordes. De säger aldrig vad som står på tur.",
  "pain.receipts.fix": "Samma kvitton som daterade rader att sortera, söka i och exportera.",

  "pain.spreadsheet.legend": "I ett kalkylblad",
  "pain.spreadsheet.headline": "Ett kalkylblad kan inte peta dig på axeln",
  "pain.spreadsheet.body": "Den håller historiken fint. Den öppnar sig bara aldrig själv för att varna dig.",
  "pain.spreadsheet.fix": "Samma rader, plus en avisering den dag en service förfaller.",

  "pain.dealer.legend": "Hos verkstaden",
  "pain.dealer.headline": "Verkstadens uppgifter är verkstadens",
  "pain.dealer.body": "Komplett tills du byter verkstad, flyttar eller säljer, och synlig för dem, inte för dig.",
  "pain.dealer.fix": "Din egen kopia, i din egen telefon, exporterbar när du vill.",

  "pain.bills.legend": "Räkningen",
  "pain.bills.headline": "Uppskjutet underhåll är inte sparade pengar",
  "pain.bills.body": "Det är samma pengar senare, med en bärgare framför.",
  "pain.bills.fix": "Varje intervall nedräknat, så att det billiga jobbet förblir billigt.",

  "pain.missed.legend": "Missen",
  "pain.missed.headline": "Ingenting påminner dig förrän det är för sent",
  "pain.missed.body": "Ingen missar en service med flit. Man missar den en helt vanlig tisdag.",
  "pain.missed.fix": "En avisering per service, den dag den förfaller. Inget annat.",

  "pain.records.legend": "Beviset",
  "pain.records.headline": "Obevisad service är ogjord service",
  "pain.records.body": "Ett garantiärende, en försäljning, ett gräl med verkstaden: alla frågar efter underlaget.",
  "pain.records.fix": "En daterad logg, exporterbar som CSV. Gratis för alltid, för alla.",

  "pain.resale.legend": "Försäljning",
  "pain.resale.headline": "En komplett historik är värd mer än en fläckfri",
  "pain.resale.body": "Köparen drar av för det du inte kan visa. Det gör handlaren också.",
  "pain.resale.fix": "Exportera hela historiken och lämna över den. Inget ligger bakom Pro.",

  "pain.upsell.legend": "Disken",
  "pain.upsell.headline": "De kan din historik. Du gör det inte.",
  "pain.upsell.body": "Ingen fråga att gissa på medan någon offererar just den.",
  "pain.upsell.fix": "Datumet och mätarställningen, uppe i kassan på två tryckningar.",

  "pain.vehicleFallback": "bil",

  "plan.line.nothing": "Inga uppgifter",
  "plan.line.about": "omkring {date}",
  "plan.line.noInterval": "Inget intervall satt",

  "service.Oil Change": "Oljebyte",
  "service.Tire Rotation": "Hjulskifte",
  "service.Brake Inspection": "Bromskontroll",
  "service.Air Filter": "Luftfilter",
  "service.Cabin Air Filter": "Kupéfilter",
  "service.Wiper Blades": "Torkarblad",
  "service.Battery Check": "Batterikontroll",
  "service.Coolant Flush": "Kylarvätskebyte",
  "service.Transmission Fluid": "Växellådsolja",
  "service.Spark Plugs": "Tändstift",
  "service.Registration": "Fordonsskatt",
  "service.Inspection": "Kontrollbesiktning",
  "service.Other": "Övrigt",

  "settings.title": "Inställningar",
  "settings.privacy":
    "Dina uppgifter finns bara i den här telefonen. Inget konto, ingen server. Exportera när du vill, för exporten är aldrig låst.",
  "settings.section.data": "Uppgifter",
  "settings.section.reminders": "Påminnelser",
  "settings.section.membership": "Medlemskap",
  "settings.section.preferences": "Inställningar",

  "settings.export": "Exportera alla uppgifter (CSV)",
  "settings.export.error": "Kunde inte öppna delningsrutan. Dina uppgifter är oförändrade.",

  "settings.intervals": "Serviceintervall",


  "settings.language": "Språk: {language}",
  "settings.units": "Enhet: {unit}",
  "settings.units.title": "Byt till {unit}?",
  "settings.units.body":
    "Alla mätarställningar och intervall du har sparat räknas om från {from} till {to}. En mätarställning på 50\u00A0000 {from} blir {example}.",
  "settings.units.cancel": "Avbryt",
  "settings.units.confirm": "Räkna om",

  "settings.reminders.enable": "Slå på påminnelser",
  "settings.reminders.blocked": "Påminnelser blockerade, öppna Inställningar",
  "settings.reminders.none": "Påminnelser på, inget att göra än",
  "settings.reminders.on": {
    one: "Påminnelser på, {count} schemalagd",
    other: "Påminnelser på, {count} schemalagda",
  },
  "settings.reminders.onNext": {
    one: "Påminnelser på, {count} schemalagd, nästa {date}",
    other: "Påminnelser på, {count} schemalagda, nästa {date}",
  },
  "settings.reminders.scheduled": "Påminnelserna är schemalagda.",
  "settings.reminders.denied": "Påminnelser nekade. Du kan slå på dem i Inställningar.",
  "settings.reminders.error": "Kunde inte begära tillstånd för notiser.",
  "settings.reminders.openSettings":
    "Öppna Inställningar › Wrenchy › Notiser för att slå på påminnelserna igen.",

  "settings.manage": "Hantera abonnemang",
  "settings.manage.error":
    "Kunde inte öppna abonnemangsinställningarna. Försök igen med bättre uppkoppling.",
  "settings.upgrade": "Uppgradera till Pro",
  "settings.restore": "Återställ köp",
  "settings.restore.done": "Pro återställt.",
  "settings.restore.none": "Inget köp hittades.",
  "settings.store.error": "Kunde inte nå App Store. Försök igen med bättre uppkoppling.",
  "settings.pro.on": "Pro är på. Tack.",
  "settings.offer.applied": "Erbjudandet är tillämpat. Inget mer att göra.",

  "settings.replay": "Gör introduktionen igen",
  "settings.replay.title": "Gör introduktionen igen?",
  "settings.replay.body":
    "Dina fordon och uppgifter behålls. Att gå igenom flödet igen lägger till ytterligare ett fordon, som du kan ta bort efteråt.",
  "settings.replay.cancel": "Avbryt",
  "settings.replay.confirm": "Gör igen",

  "system.notify.title": "Din {vehicle}: dags f\u00f6r {service}",
  "system.notify.body": "Gjordes senast {date}.",

  "system.notify.when.today": "Idag",
  "system.notify.when.tomorrow": "I morgon",
  "system.notify.when.days": { one: "Om {count} dag", other: "Om {count} dagar" },
  "system.notify.when.months": { one: "Om {count} m\u00e5nad", other: "Om {count} m\u00e5nader" },

  "system.csv.header.vehicle": "Fordon",
  "system.csv.header.service": "Service",
  "system.csv.header.date": "Datum",
  "system.csv.header.odometer": "Mätarställning ({unit})",
  "system.csv.header.cost": "Kostnad",
  "system.csv.header.notes": "Anteckningar",
  "system.csv.header.deleted": "Raderad",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Testa Pro gratis",
  "system.quickaction.trial.subtitle": {
    one: "{count} dag, sedan förnyas det om du inte säger upp",
    other: "{count} dagar, sedan förnyas det om du inte säger upp",
  },
  "system.quickaction.feedback.title": "Skicka feedback",
  "system.quickaction.feedback.subtitle": "Berätta vad som gick fel",

  "system.vehicle.fallback": "Min bil",

  "unit.mi": "{value}\u00A0mi",
  "unit.km": "{value}\u00A0km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  "vehicle.title": "Fordon",

  "vehicle.body.sedan": "Sedan",
  "vehicle.body.hatchback": "Halvkombi",
  "vehicle.body.coupe": "Coupé",
  "vehicle.body.wagon": "Kombi",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pickup",
  "vehicle.body.van": "Skåpbil",

  "vehicle.odometer": "Mätarställning",
  "vehicle.odometer.notSet": "Inte angiven",
  "vehicle.odometer.estimated": "Mätarställning (ca)",
  "vehicle.lastService": "Senaste service",
  "vehicle.lastService.none": "Ingen än",

  "vehicle.due": "Dags nu",
  "vehicle.history": "Historik",
  "vehicle.history.empty": "Ingen service loggad än. Logga det senaste du fick gjort.",

  "vehicle.over": "{distance} över",
  "vehicle.dueOn": "dags {date}",
  "vehicle.dueNow": "dags nu",
  "vehicle.dueSoon": "snart dags",

  "vehicle.badge.overdue": "Försenad",
  "vehicle.badge.soon": "Snart",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Ta bort",
  "vehicle.serviceDeleted": "Servicen togs bort",
  "vehicle.undo": "Ångra",
  "vehicle.logService": "Logga en service",

  "vehicle.deleteVehicle": "Ta bort fordon",
  "vehicle.delete.title": "Ta bort {name}?",
  "vehicle.delete.body":
    "Det lämnar garaget tillsammans med sin servicehistorik. Uppgifter du redan har exporterat finns kvar i den filen.",
  "vehicle.delete.cancel": "Avbryt",
  "vehicle.delete.confirm": "Ta bort",

  "vehicleForms.new.title": "Lägg till fordon",
  "vehicleForms.new.save": "Spara",
  "vehicleForms.new.name": "Namn",
  "vehicleForms.new.namePlaceholder": "Civic 2019",
  "vehicleForms.new.odometer": "Mätarställning nu ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Logga en service",
  "vehicleForms.log.save": "Spara",
  "vehicleForms.log.error": "Kunde inte spara. Det du skrev finns kvar. Försök igen.",
  "vehicleForms.log.what": "Vad",
  "vehicleForms.log.when": "När",
  "vehicleForms.log.today": "I dag",
  "vehicleForms.log.yesterday": "I går",
  "vehicleForms.log.otherDate": "Annat datum",
  "vehicleForms.log.odometer": "Mätarställning ({unit})",
  "vehicleForms.log.cost": "Kostnad (frivilligt)",
  "vehicleForms.log.notes": "Anteckningar (frivilligt)",
  "subscribed.title": "Pro är på.",
  "subscribed.body": "{vehicle} finns nu i schemat. Du får veta innan varje service förfaller, inte efteråt.",
  "subscribed.unlocked": "Även upplåst",
  "subscribed.cta": "Visa schemat",
};

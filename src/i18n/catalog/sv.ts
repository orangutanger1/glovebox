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
  "evidence.records.answer": "SQLite i din telefon, och hela loggen kommer ut som CSV.",

  "evidence.price.label": "priset, betalväggen eller vad det visade sig kosta",
  "evidence.price.answer": "Ett abonnemang, inget mer att köpa. Varje bil, varje post.",

  "evidence.account.label": "konto och inloggning innan något fungerade",
  "evidence.account.answer": "Inget konto. Det finns ingenting att logga in på.",

  "evidence.crashes.label": "krascher, appen som låser sig, filer som inte gick att öppna",
  "evidence.crashes.answer":
    "Dina poster ligger i en databas i telefonen, inte i en fil som kan vägra öppna sig.",

  "features.history.title": "Varje service, sparad för alltid",
  "features.history.subtitle":
    "Datum, mätarställning, kostnad och anteckningar från varje besök, sparade så länge du har bilen.",

  "features.due.title": "Dags efter datum och sträcka",
  "features.due.subtitle":
    "Det som kommer först: sträckan du kör eller månaderna som går.",

  "features.reminders.title": "En påminnelse per service",
  "features.reminders.subtitle": "Den dag det ska göras, och aldrig något annat.",

  "features.export.title": "Exportera allt som CSV",
  "features.export.subtitle": "Ta ut hela loggen som ett kalkylark när du vill.",

  "features.costs.title": "Se vad det kostar dig",
  "features.costs.subtitle":
    "Summor per fordon, per service och per månad, räknat på kostnaderna du loggar.",

  "features.garage.title": "Obegränsat antal fordon",
  "features.garage.subtitle": "Varje bil, skåpbil och lastbil du äger, samlat på ett ställe.",

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

  // insights
  "insights.title": "Kostnader",
  "insights.subtitle": "Vad garaget har kostat, direkt ur din logg.",
  "insights.total.label": "Registrerat hittills",
  "insights.total.priced": {
    one: "Från {count} service med pris.",
    other: "Från {count} servicetillfällen med pris.",
  },
  "insights.total.unpriced": {
    one: "{count} till service saknar kostnad.",
    other: "{count} till servicetillfällen saknar kostnad.",
  },
  "insights.byVehicle.title": "Per fordon",
  "insights.byService.title": "Vart det går",
  "insights.byMonth.title": "Senaste 12 månaderna",
  "insights.empty.title": "Inga priser än",
  "insights.empty.body": "Lägg till en kostnad när du loggar en service, så dyker den upp här. Tidigare servicetillfällen går också att ändra.",
  "insights.empty.cta": "Till mitt garage",
  "insights.open": "Visa kostnader",

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
  "offer.notify.body": "Gjordes senast {date}.",
  "offer.plan.status.due": "Dags",
  "offer.plan.status.soon": "Snart",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "Inga uppgifter",

  "offer.paywall.title": "Missa aldrig en service igen.",
  "offer.paywall.title.named": "{name}, missa aldrig en service igen.",
  "offer.paywall.subtitle": "Varje service och varje mätarställning, på pränt.",
  "offer.paywall.vehicle": "På pränt",
  "offer.paywall.scheduled": "Nu bevakat",
  "offer.paywall.services": { one: "servicepunkt", other: "servicepunkter" },
  "offer.paywall.dueNow": "Försenat i dag",
  "offer.paywall.nextUp": "Nästa varning",
  "offer.paywall.none": "Ingen",
  "offer.paywall.point.tracked.title": "{vehicle} finns på pränt",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} service bevakad, efter datum och sträcka",
    other: "{count} servicar bevakade, efter datum och sträcka",
  },
  "offer.paywall.point.due.title": {
    one: "{count} service försenad i dag",
    other: "{count} servicar försenade i dag",
  },
  "offer.paywall.point.due.subtitle": "Nästa varning {date}",
  "offer.paywall.point.due.noNext": "Ingen varning behövs ännu",
  "offer.paywall.point.history.title": "Hela historiken när du säljer",
  "offer.paywall.point.history.subtitle": "Varje service, kostnad och mätarställning, sparad för alltid och exporterbar.",
  "offer.paywall.point.reminders.title": "En påminnelse före varje",
  "offer.paywall.point.reminders.subtitle": "Samma dag det är dags, aldrig tjatigt.",

  "offer.deal.title": "Tidsbegränsat erbjudande",
  "offer.deal.pct": "{pct}% rabatt",
  "offer.deal.perWeek": "Bara {price} per vecka",
  "offer.trial.cta": "Ta erbjudandet",
  "offer.trial.decline": "Jag betalar hellre fullt pris",
  "offer.trial.gets.reminders": "Påminnelse före varje service",
  "offer.trial.gets.due": "Dags efter datum och sträcka",
  "offer.trial.gets.history": "Varje service sparas för alltid",
  "offer.trial.gets.costs": "Se vad bilen kostar",
  "offer.trial.gets.garage": "Obegränsat med fordon",
  "offer.trial.gets.intervals": "Egna serviceintervall",
  "offer.trial.gets.export": "Exportera allt som CSV",

  "offer.winback.title": "Du slutade logga.",
  "offer.winback.decline": "Ta mig bara till garaget",
  "offer.winback.body":
    "Dina uppgifter ligger exakt där du lämnade dem. Ingenting har gått ut, ingenting har raderats och ingenting behöver ställas in igen.",
  "offer.winback.feedback": "Berätta vad som gick fel",
  "offer.winback.feedbackNote": "Ett kort formulär, öppnas i Safari",
  "offer.winback.caption": "Eller ge det ett försök till: ett år Pro till erbjudandepriset. Avsluta när du vill.",

  "onboardingA.continue": "Fortsätt",

  "onboardingA.welcome.headline": "Sluta gissa när du senast bytte olja.",
  "onboardingA.welcome.start": "Kom igång",
  "onboardingA.welcome.privacy": "Inget konto. Inget lämnar telefonen.",

  // The introduction, on the screen before the quiz. The name is read
  // back on both ask screens and in every reminder, and nowhere else.
  "onboardingA.name.title": "Vad ska vi kalla dig?",
  "onboardingA.name.label": "Ditt namn",
  "onboardingA.name.continue": "Fortsätt",

  "onboardingA.vehicle.title": "Vad kör du?",
  "onboardingA.vehicle.year": "Årsmodell",
  "onboardingA.vehicle.make": "Märke",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.model": "Modell",

  "onboardingA.odometer.title.mi": "Hur många miles står den på?",
  "onboardingA.odometer.title.km": "Hur många kilometer står den på?",
  "onboardingA.odometer.field": "Mätarställning ({unit})",
  "onboardingA.odometer.placeholder.mi": "84\u00A0210",
  "onboardingA.odometer.placeholder.km": "135\u00A0600",
  "onboardingA.odometer.caption": "En ungefärlig siffra räcker.",
  "onboardingA.odometer.required": "Ange mätarställningen för att fortsätta.",

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
  "onboardingB.analyzing.percent": "{percent}\u00a0%",

  "onboardingC.back": "Tillbaka",
  "onboardingC.question": "Fråga {step} / {total}",

  "onboardingC.schedule.title": {
    one: "En service, bevakad från i dag.",
    other: "{count} servicar, bevakade från i dag.",
  },
  "onboardingC.schedule.onWatch": "Bevakade",
  "onboardingC.schedule.status.fresh": "Från i dag",
  "onboardingC.schedule.line.fresh": "Bevakad från i dag",
  "onboardingC.results.overdue": {
    one: "En service är redan försenad.",
    other: "{count} servicepunkter är redan försenade.",
  },
  "onboardingC.results.subtitle": "Din {vehicle}, {distance} per år.",
  "onboardingC.results.continue": "Fortsätt",
  "onboardingC.results.onFile": "Loggat",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Dags",
  "onboardingC.results.status.soon": "Snart",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "Inga uppgifter",

  // The two odometer gauges on the payoff page: the reading typed, and where
  // it lands in a year at the stated rate.
  "onboardingC.outlook.odometer": "Idag",
  "onboardingC.outlook.projected": "Om ett år",
  "onboardingC.cost.title": "{percent}% av bilarna på vägen är försenade med en service.",
  "onboardingC.cost.percent": "{percent}%",
  "onboardingC.cost.tireRotations": "Efter med däckrotation",
  "onboardingC.cost.oilChanges": "Efter med oljebyte",
  "onboardingC.cost.tracked": "Wrenchy håller koll på vilka servicetillfällen bilen behöver.",
  "onboardingC.cost.source": "{overdue}. Amerikanska siffror.",
  "onboardingC.cost.continue": "Fortsätt",

  "onboardingC.compare.title": "På egen hand, eller efter ett schema.",
  "onboardingC.compare.subtitle": "Din {vehicle}, skött på båda sätten.",
  "onboardingC.compare.dated": "Servicepunkter med ett datum",
  "onboardingC.compare.remembered": "Servicepunkter du måste hålla i huvudet",
  "onboardingC.compare.alone": "På egen hand",
  "onboardingC.compare.withApp": "Med Wrenchy",
  "onboardingC.compare.ofTotal": "{count} av {total}",
  "onboardingC.compare.source": "Räknat från dina egna svar. Inga genomsnitt, inga uppskattningar.",
  "onboardingC.compare.continue": "Fortsätt",

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
  "pain.records.fix": "En daterad logg, och ett kalkylark av den när du behöver det.",

  "pain.resale.legend": "Försäljning",
  "pain.resale.headline": "En komplett historik är värd mer än en fläckfri",
  "pain.resale.body": "Köparen drar av för det du inte kan visa. Det gör handlaren också.",
  "pain.resale.fix": "Exportera hela historiken och lämna över den.",

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

  "system.notify.title": "Dags för {service}",
  "system.notify.title.named": "{name}, dags för {service}",
  "system.notify.body": "{vehicle} · Gjordes senast {date}.",
  // The two nudges an unfinished onboarding gets, two hours and a day
  // after the user walked away from it.
  "system.resume.first.title": "Din plan är nästan klar",
  "system.resume.first.title.named": "{name}, din plan är nästan klar",
  "system.resume.first.body": "{vehicle} · En minut till så är varje servicedatum satt.",
  "system.resume.second.title": "Fortsätt där du slutade",
  "system.resume.second.title.named": "{name}, fortsätt där du slutade",
  "system.resume.second.body": "{vehicle} · Allt du fyllde i är sparat. En minut så är det klart.",
  "system.resume.third.title": "Din serviceplan väntar",
  "system.resume.third.title.named": "{name}, din serviceplan väntar",
  "system.resume.third.body": "{vehicle} · Slutför inställningen och se exakt vad som ska göras, och när.",
  "system.resume.fourth.title": "Två minuter till en full plan",
  "system.resume.fourth.title.named": "{name}, två minuter till en full plan",
  "system.resume.fourth.body": "{vehicle} · Varje intervall daterat och bevakat. Slutför i dag.",
  "system.resume.fifth.title": "Fortfarande sparat, fortfarande klart",
  "system.resume.fifth.title.named": "{name}, sparat och redo",
  "system.resume.fifth.body": "{vehicle} · Din inställning är kvar där du lämnade den. En minut kvar.",
  "system.resume.sixth.title": "Din bil förtjänar en plan",
  "system.resume.sixth.title.named": "{name}, din bil förtjänar en plan",
  "system.resume.sixth.body": "{vehicle} · De flesta blir klara på under två minuter. Du är halvvägs.",
  "system.resume.seventh.title": "Din inställning finns kvar",
  "system.resume.seventh.title.named": "{name}, din inställning finns kvar",
  "system.resume.seventh.body": "{vehicle} · När du vill: en minut så är det klart.",
  "system.resume.ask.first.title": "Din plan är klar",
  "system.resume.ask.first.title.named": "{name}, din plan är klar",
  "system.resume.ask.first.body": {
    one: "{vehicle} · 1 service behöver ses över. Pro tar över härifrån.",
    other: "{vehicle} · {count} servicar behöver ses över. Pro tar hand om varje.",
  },
  "system.resume.ask.first.body.zero": "{vehicle} · Varje service daterad och bevakad. Pro tar över härifrån.",
  "system.resume.ask.second.title": "Ett tryck från att vara täckt",
  "system.resume.ask.second.title.named": "{name}, ett tryck från täckt",
  "system.resume.ask.second.body": "{vehicle} · Din plan är byggd och sparad. Ett tryck så kör Pro den.",
  "system.resume.ask.third.title": "Din plan väntar",
  "system.resume.ask.third.title.named": "{name}, din plan väntar",
  "system.resume.ask.third.body": "{vehicle} · Inget att fylla i igen. Ett tryck så bevakas varje service.",
  "system.resume.ask.fourth.title": "Inget slinker förbi Pro",
  "system.resume.ask.fourth.title.named": "{name}, inget slinker förbi Pro",
  "system.resume.ask.fourth.body": "{vehicle} · Din plan är sparad. De flesta hittar en bortglömd service första månaden.",
  "system.resume.ask.fifth.title": "Din plan är fortfarande sparad",
  "system.resume.ask.fifth.title.named": "{name}, din plan är kvar",
  "system.resume.ask.fifth.body": "{vehicle} · Ett tryck så tar Pro över varje servicedatum härifrån.",
  "system.resume.ask.sixth.title": "Mätaren tickar på",
  "system.resume.ask.sixth.title.named": "{name}, mätaren tickar på",
  "system.resume.ask.sixth.body": "{vehicle} · Din plan är redo att hålla koll. Ett tryck så är du täckt.",
  "system.resume.ask.seventh.title": "En månad senare, fortfarande redo",
  "system.resume.ask.seventh.title.named": "{name}, fortfarande redo",
  "system.resume.ask.seventh.body": "{vehicle} · Din plan är sparad och väntar. Ett tryck så tar Pro över.",

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

  "system.quickaction.trial.title": "Testa Pro",
  "system.quickaction.trial.subtitle": "Ett år Pro till erbjudandepriset",
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

  "vehicle.edit.title": "Redigera fordon",
  "vehicle.edit.odometerHint": "En ställning som anges här ersätter fordonets, även om den är lägre. Lämna tomt för att behålla den.",
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
  "vehicleForms.number.invalid": "Det här talet gick inte att läsa. Bara siffror — 84 210 eller 45,5.",
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
  "subscribed.unlocked": "Nu på",
  "subscribed.cta": "Visa schemat",
  "fuel.title": "Bränsle",
  "fuel.log": "Logga tankning",
  "fuel.seeAll": "Visa alla tankningar",
  "fuel.summary.last": "Senaste tanken",
  "fuel.summary.average": "Snitt",
  "fuel.summary.needFirst": "Logga en tankning så dyker den upp här.",
  "fuel.summary.needSecond": "En full tank till, sedan kommer din första siffra.",
  "fuel.history.title": "Tankningar",
  "fuel.history.empty": "Inga tankningar loggade än.",
  "fuel.row.partial": "Deltankning",
  "fuel.deleted": "Tankning borttagen",
  "fuel.undo": "Ångra",
  "fuel.swipe.delete": "Ta bort",
  "fuel.form.title": "Logga tankning",
  "fuel.form.odometer": "Mätarställning ({unit})",
  "fuel.form.volume": "Bränsle ({unit})",
  "fuel.form.cost": "Totalt betalt (valfritt)",
  "fuel.form.full": "Tankade fullt",
  "fuel.form.fullHint": "Låt det vara på om du inte stannade före full tank.",
  "fuel.form.when": "När",
  "fuel.form.today": "I dag",
  "fuel.form.yesterday": "I går",
  "fuel.form.otherDate": "Annan dag",
  "fuel.form.save": "Spara tankning",
  "fuel.form.error": "Tankningen kunde inte sparas.",
  "fuel.form.needOdometer": "Fyll i mätarställningen och hur mycket bränsle som gick in.",
  "fuel.form.sameOdometer": "Det är ställningen från din senaste tankning. Ange vad mätaren visar nu.",
  "fuel.card.title": "Bränsle",
  "fuel.card.spend": "Bränslekostnad",
  "fuel.card.perDistance": "Kostnad per 100 {unit}",
  "fuel.card.efficiency": "Förbrukning",
  "fuel.card.months": "Senaste 12 månaderna",
  "fuel.card.fills": { one: "Från {count} tankning med pris.", other: "Från {count} tankningar med pris." },
  "fuel.card.unpriced": { one: "{count} tankning till saknar pris.", other: "{count} tankningar till saknar pris." },
  "fuel.card.locked.title": "Se vad bränslet kostar dig",
  "fuel.card.locked.body": "Dina tankningar finns redan här. Pro gör dem till förbrukning, kostnad och kostnad per sträcka.",
  "fuel.card.locked.cta": "Lås upp bränsleinsikter",
  "fuel.card.empty": "Logga två fulla tankar så fylls detta i.",
  "unit.gal": "{value} gal",
  "unit.litre": "{value} L",
  "unit.gal.label": "gal",
  "unit.litre.label": "L",
  "unit.mpg": "{value} mpg",
  "unit.l100km": "{value} L/100km",
  "unit.mpg.label": "mpg",
  "unit.l100km.label": "L/100km",
  "system.csv.fuel.volume": "Bränsle ({unit})",
  "system.csv.fuel.full": "Full tank",
  "system.csv.cell.yes": "Ja",
  "system.csv.cell.no": "Nej",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Stäng",
  "paywall.period.week": "Veckovis",
  "paywall.period.month": "Månadsvis",
  "paywall.period.year": "Årsvis",
  "paywall.per.week": "per vecka",
  "paywall.per.month": "per månad",
  "paywall.per.year": "per år",
  "paywall.billed.month": "{price} debiteras per månad",
  "paywall.billed.year": "{price} debiteras per år",
  "paywall.save": "Spara {pct}%",
  "paywall.intro.label": "Din första vecka",
  "paywall.cta.week": "Fortsätt veckovis",
  "paywall.cta.month": "Fortsätt månadsvis",
  "paywall.cta.year": "Fortsätt årsvis",
  "paywall.legal.week": "Förnyas för {price} per vecka. Avsluta när du vill.",
  "paywall.legal.month": "Förnyas för {price} per månad. Avsluta när du vill.",
  "paywall.legal.year": "Förnyas för {price} per år. Avsluta när du vill.",
  "paywall.terms": "Villkor",
  "paywall.privacy": "Integritet",
  "paywall.restore": "Återställ",
  "paywall.included": "Ingår i Pro",
  "paywall.loading": "Hämtar priser",
  "paywall.retry": "Försök igen",
  "paywall.review.quote": 
    "Compared to other apps I tried like MyAutoLog, Carfax, or what have you not, this app absolutely surpasses them all in terms of functionality, design, and ease of use.",
  "paywall.review.name": "Tracy D.",
  // survey
  "survey.source.title": "Hur hörde du talas om oss?",
  "survey.source.tiktok": "TikTok",
  "survey.source.instagram": "Instagram",
  "survey.source.youtube": "YouTube",
  "survey.source.app_store": "Sökning i App Store",
  "survey.source.friend": "En vän eller familjemedlem",
  "survey.source.other": "Någon annanstans",
  "survey.objection.title": "Vad höll dig tillbaka?",
  "survey.objection.subtitle": "Ett tryck. Det visar vad vi ska förbättra.",
  "survey.objection.price": "Det kostar för mycket",
  "survey.objection.try_first": "Jag vill testa först",
  "survey.objection.browsing": "Jag tittar bara runt",
  "survey.objection.no_car": "Jag har ingen bil",
  "survey.objection.other": "Något annat",
  "survey.objection.skip": "Hoppa över",
};

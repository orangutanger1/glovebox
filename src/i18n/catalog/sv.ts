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
  "layout.fatal.title": "Wrenchy kunde inte öppna dina uppgifter.",
  "layout.fatal.body":
    "Ingenting har raderats, och databasen återställdes till sitt senast fungerande läge. Öppna appen igen. Om det fortsätter hända, kontakta supporten innan du installerar om, för det är ominstallationen som faktiskt skulle förlora uppgifterna.",

  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratis",

  "offer.features.title": "Det här får du.",
  "offer.features.subtitle":
    "Allt ligger i en enda fil i den här telefonen, utan konto och utan server.",

  "offer.plan.title": "Så här ser planen ut.",
  "offer.plan.subtitle": {
    one: "{count} servicepunkt i schemat för din {vehicle}, räknad på datum och på sträcka.",
    other: "{count} servicepunkter i schemat för din {vehicle}, räknade på datum och på sträcka.",
  },
  "offer.plan.cta": "Slå på påminnelser",
  "offer.plan.decline": "Inte nu",
  "offer.notify.title": "Missa aldrig en service.",
  "offer.notify.decline": "Gör det senare",
  "offer.plan.status.due": "Dags",
  "offer.plan.status.soon": "Snart",
  "offer.plan.status.ok": "OK",
  "offer.plan.note": "En notis per service den dag den ska göras.",
  "offer.plan.noteMore": {
    one: "Dessutom {count} till längre fram, och en notis per service den dag den ska göras.",
    other: "Dessutom {count} till längre fram, och en notis per service den dag den ska göras.",
  },

  "offer.paywall.title": "Bilar varnar inte. Det här gör det.",
  "offer.paywall.subtitle":
    "Varje service och varje mätarställning hamnar på pränt. Verkstaden ser en servicebok, inte en gissning.",
  "offer.paywall.cta": "Håll bilen på pränt",
  "offer.paywall.vehicle": "På pränt",
  "offer.paywall.scheduled": "Nu bevakat",
  "offer.paywall.services": { one: "servicepunkt", other: "servicepunkter" },
  "offer.paywall.dueNow": "Försenat i dag",
  "offer.paywall.nextUp": "Nästa varning",
  "offer.paywall.none": "Ingen",
  "offer.paywall.caption":
    "Allt du just ställt in ligger redan i den här telefonen. Inget konto, ingen server, inget skickas vidare.",

  "offer.paywall.impact.legend": "Vad det är värt",
  "offer.paywall.impact.warned": "Du hör om en service innan den ska göras, inte efter reparationen.",
  "offer.paywall.impact.upsell": "Du kommer till verkstaden och vet vad som gjorts och när, så inget säljs till dig två gånger.",
  "offer.paywall.impact.resale": "Du lämnar en komplett servicebok till nästa ägare i stället för en axelryckning, och det syns på priset.",

  "offer.trial.title": { one: "Testa i {count} dag.", other: "Testa i {count} dagar." },
  "offer.trial.subtitle": {
    one: "Ta {count} dag av Pro utan att betala och bestäm dig när bilen faktiskt har berättat något.",
    other:
      "Ta {count} dagar av Pro utan att betala och bestäm dig när bilen faktiskt har berättat något.",
  },
  "offer.trial.cta": {
    one: "Starta min {count} gratisdag",
    other: "Starta mina {count} gratisdagar",
  },
  "offer.trial.decline": "Nej tack, visa gratisappen",

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
  "onboardingA.welcome.privacy":
    "Allt stannar i den här telefonen, utan konto och utan något att logga ut från.",

  "onboardingA.vehicle.title": "Vad kör du?",
  "onboardingA.vehicle.year": "Årsmodell",
  "onboardingA.vehicle.makeOptional": "Märke (valfritt)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",
  "onboardingA.vehicle.saved": "Sparad som \u201D{name}\u201D, och du kan byta namn senare.",
  "onboardingA.vehicle.modelOptional": "Modell (valfritt)",
  "onboardingA.vehicle.hint":
    "Årsmodellen räcker för att börja. Märke och modell finns bara för att påminnelserna ska kunna nämna bilen.",

  "onboardingA.odometer.title.mi": "Hur många miles står den på?",
  "onboardingA.odometer.title.km": "Hur många kilometer står den på?",
  "onboardingA.odometer.field": "Mätarställning ({unit})",
  "onboardingA.odometer.placeholder.mi": "84\u00A0210",
  "onboardingA.odometer.placeholder.km": "135\u00A0600",
  "onboardingA.odometer.caption":
    "En ungefärlig siffra räcker, och det är den som sätter datum på allt som ska göras efter sträcka.",
  "onboardingA.odometer.later": "Jag fyller i det senare",

  "onboardingA.drive.title": "Hur långt kör du den?",
  "onboardingA.drive.subtitle":
    "Ungefär, för det är den siffran som gör ett sträckintervall till ett datum.",
  "onboardingA.drive.legend": "Sträcka per år ({unit})",
  "onboardingA.drive.low.mi": "Under 5\u00A0000",
  "onboardingA.drive.low.km": "Under 8\u00A0000",
  "onboardingA.drive.average.mi": "5\u00A0000\u201310\u00A0000",
  "onboardingA.drive.average.km": "8\u00A0000\u201316\u00A0000",
  "onboardingA.drive.high.mi": "10\u00A0000\u201315\u00A0000",
  "onboardingA.drive.high.km": "16\u00A0000\u201324\u00A0000",
  "onboardingA.drive.very_high.mi": "Över 15\u00A0000",
  "onboardingA.drive.very_high.km": "Över 24\u00A0000",
  "onboardingA.drive.projection":
    "I den takten står bilen på ungefär {distance} den här tiden nästa år.",
  "onboardingA.drive.caption":
    "Används för att datera det som ska göras efter sträcka i stället för efter kalendern.",

  "onboardingB.continue": "Fortsätt",

  "onboardingB.service.title": "Vad gjordes senast?",
  "onboardingB.service.subtitle": "Ungefär rätt räcker, du kan rätta det senare.",
  "onboardingB.service.legend": "Service",
  "onboardingB.service.caption": "Välj en, resten kan du logga när som helst.",
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
  "onboardingB.tracking.subtitle": "Vad det än är, är det mer än de flesta gör.",
  "onboardingB.tracking.legend": "I dag",
  "onboardingB.tracking.caption":
    "Vad du än väljer exporterar Wrenchy allt du loggar som CSV, gratis.",
  "onboardingB.tracking.memory": "Minnet",
  "onboardingB.tracking.receipts": "Kvitton i bilen",
  "onboardingB.tracking.spreadsheet": "Ett kalkylblad",
  "onboardingB.tracking.dealer": "Verkstaden har det",
  "onboardingB.tracking.nothing": "Ingenting alls",

  "onboardingB.worry.title": "Vad vill du undvika?",
  "onboardingB.worry.subtitle": "Välj så många som stämmer, det avgör vad appen visar dig först.",
  "onboardingB.worry.caption":
    "Sista frågan, nästa skärm handlar om din bil i stället för om appen.",
  "onboardingB.worry.bills": "Oväntade reparationer",
  "onboardingB.worry.missed": "Missa en service",
  "onboardingB.worry.records": "Tappa historiken",
  "onboardingB.worry.resale": "Andrahandsvärdet",
  "onboardingB.worry.upsell": "Onödiga extrajobb",
  "onboardingB.worry.optional":
    "Allt är valfritt. Hoppa över, och nästa skärm byggs bara på din bil.",

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
  "onboardingC.results.noneLogged": "Inget du har loggat är försenat.",
  "onboardingC.results.noneYet": "Inget är försenat än.",
  "onboardingC.results.clear": "Inget är försenat, och inget är nära.",
  "onboardingC.results.subtitle":
    "Uträknat för din {vehicle} utifrån {distance} per år och det du har loggat.",
  "onboardingC.results.continue": "Fortsätt",
  "onboardingC.results.dueNow": "Dags nu",
  "onboardingC.results.soon": "Snart",
  "onboardingC.results.onFile": "Loggat",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Dags",
  "onboardingC.results.status.soon": "Snart",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.next": "Nästa hamnar {date}, det som kommer först av datum och sträcka.",
  "onboardingC.results.countdown":
    "Varje service räknas ner både på datum och på sträcka, det som kommer först gäller.",

  "onboardingC.symptoms.next": "Fortsätt",
  "onboardingC.symptoms.last": "Så vad gör jag",

  "onboardingC.help.title": "Alla tre är samma problem.",
  "onboardingC.help.subtitle":
    "Ingenting är skrivet ner i en form som kan varna dig, och det är precis det Wrenchy gör.",
  "onboardingC.help.continue": "Fortsätt",

  "onboardingC.reviews.title": "Den här appen finns på grund av de här.",
  "onboardingC.reviews.subtitle": {
    one: "{count} av de {total} recensionerna i App Store av de {apps} appar som redan gör det här är på en till tre stjärnor.",
    other:
      "{count} av de {total} recensionerna i App Store av de {apps} appar som redan gör det här är på en till tre stjärnor.",
  },
  "onboardingC.reviews.continue": "Fortsätt",
  "onboardingC.reviews.scroll": "Skrolla för att läsa alla fyra",
  "onboardingC.reviews.mentioning": "Recensioner som nämner",

  "pain.overdue.legend": "Försenat",
  "pain.overdue.headline": {
    one: "En service är redan försenad",
    other: "{count} servicepunkter är redan försenade",
  },
  "pain.overdue.body":
    "På din {vehicle}, i dag. Ingenting på instrumentpanelen kommer att nämna det, för lampan tänds efter skadan i stället för före.",
  "pain.overdue.fix":
    "Varje service räknas ner på datum och på sträcka, och flaggas innan siffran blir negativ.",

  "pain.blind.legend": "Inga uppgifter",
  "pain.blind.headline": {
    one: "{count} av {total} servicepunkter saknar uppgifter",
    other: "{count} av {total} servicepunkter saknar uppgifter",
  },
  "pain.blind.body":
    "Wrenchy kan inte bevisa något appen aldrig har sett, och det kan inte du heller. Tills något annat sägs behandlas var och en av dem som att den ska göras.",
  "pain.blind.fix": "Logga en och hela dess schema startar. Trettio sekunder styck, en gång.",

  "pain.memory.legend": "Ur minnet",
  "pain.memory.headline": "Enda kopian finns i huvudet",
  "pain.memory.body":
    "Du sa att du går på minnet. Minnet håller precis fram till att frågan \u201Dnär exakt?\u201D ställs vid verkstadsdisken, vid en försäljning eller med en lampa tänd i 110.",
  "pain.memory.fix":
    "Varje service du loggar skrivs till den här telefonen och stannar där. Inget konto som kan låsa in den.",

  "pain.nothing.legend": "Obevakad",
  "pain.nothing.headline": "Ingenting om den här bilen är skrivet ner",
  "pain.nothing.body":
    "Inte det senaste oljebytet, inte mätarställningen det gjordes vid. Bilen har enda historiken, och sättet den berättar den på är att gå sönder.",
  "pain.nothing.fix":
    "En tryckning loggar en service. Från och med då finns historiken någon annanstans än i bilen.",

  "pain.receipts.legend": "I handskfacket",
  "pain.receipts.headline": "Ett handskfack är inget register",
  "pain.receipts.body":
    "Kvitton bevisar att en service gjordes. De säger inget om vad som ska göras härnäst, de ligger i ingen ordning alls, och termopapper bleknar till blankt.",
  "pain.receipts.fix":
    "Samma kvitton som daterade rader du kan sortera, söka i och exportera som CSV.",

  "pain.spreadsheet.legend": "I ett kalkylblad",
  "pain.spreadsheet.headline": "Ett kalkylblad kan inte peta dig på axeln",
  "pain.spreadsheet.body":
    "Det håller historiken bra. Det öppnar sig bara aldrig självt, och det enda du behöver från det är en varning du inte kom på att leta efter.",
  "pain.spreadsheet.fix": "Samma rader, plus en notis den dag en service ska göras.",

  "pain.dealer.legend": "Hos verkstaden",
  "pain.dealer.headline": "Verkstadens uppgifter är verkstadens",
  "pain.dealer.body":
    "Kompletta precis fram till att du byter verkstad, flyttar eller säljer bilen, och synliga för den som skriver din offert i stället för för dig.",
  "pain.dealer.fix": "Din egen kopia, i din egen telefon, exporterbar när du vill.",

  "pain.bills.legend": "Räkningen",
  "pain.bills.headline": "Uppskjutet underhåll är inte sparade pengar",
  "pain.bills.body":
    "Det är samma pengar senare, med en bogsering framför. Jobben som går sönder dyrt är de billiga som ingen höll räkning på.",
  "pain.bills.fix": "Varje intervall räknas ner, så att det billiga jobbet förblir billigt.",

  "pain.missed.legend": "Missen",
  "pain.missed.headline": "Ingenting påminner dig förrän det är för sent",
  "pain.missed.body":
    "Ingen missar en service med flit. Den missas en vanlig tisdag, och sedan igen veckan efter, och mätaren fortsätter räkna.",
  "pain.missed.fix": "En notis per service, den dag den ska göras. Aldrig något annat.",

  "pain.records.legend": "Beviset",
  "pain.records.headline": "Obevisad service är ogjord service",
  "pain.records.body":
    "Ett garantiärende, en försäljning, ett gräl med en verkstad: alla frågar efter uppgifterna, inte efter vad du minns om dem.",
  "pain.records.fix":
    "En daterad logg du kan exportera som CSV. Gratis för alltid, för alla, prenumerant eller inte.",

  "pain.resale.legend": "Försäljning",
  "pain.resale.headline": "En komplett historik är värd mer än en fläckfri",
  "pain.resale.body":
    "Köparen prutar på det du inte kan visa, och det gör bilhandlaren som tar den i inbyte också. Bilen är bara värd det du kan bevisa om den.",
  "pain.resale.fix":
    "Exportera hela historiken till CSV och lämna över den. Ingenting av det är låst bakom abonnemanget.",

  "pain.upsell.legend": "Disken",
  "pain.upsell.headline": "De kan din historik. Du gör det inte.",
  "pain.upsell.body":
    "\u201DNär gjordes bromsarna senast?\u201D är ingen fråga att gissa på medan någon lämnar pris på just det.",
  "pain.upsell.fix": "Datumet och mätarställningen, framme vid disken på två tryck.",

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
};

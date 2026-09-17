import type { Fragment } from "./types";

/**
 * Polish (pl-PL). Register: **ty** — 2nd person singular, present tense or
 * imperative throughout. The impersonal "należy" is never used; it turns a
 * mechanic's note into a regulation. Past-tense 2nd person is avoided
 * everywhere because Polish inflects it for gender ("zapisałeś"/"zapisałaś"),
 * so "what you have logged" becomes "co masz zapisane".
 *
 * Deliberate terms a reviewer would otherwise query:
 * - `service.Inspection` is **Przegląd techniczny**, the SKP roadworthiness
 *   test every Polish owner books. Nobody searches "inspekcja".
 * - `service.Registration` is **Ubezpieczenie OC**. Poland has no annual road
 *   tax for private cars — podatek od środków transportowych covers lorries and
 *   buses, not passenger cars — so the honest recurring, legally compulsory,
 *   date-driven obligation on a Polish owner's calendar is the OC third-party
 *   policy renewal. It is the one thing that lapses on a date and costs money
 *   if missed, which is exactly the slot this service type occupies.
 * - Generic countable "service" is **serwis** (serwis / serwisy / serwisów),
 *   not "przegląd": bare "przegląd" would collide with the SKP visit above.
 * - Garage vocabulary: wymiana oleju, rotacja opon, kontrola hamulców, świece
 *   zapłonowe, filtr kabinowy, płyn chłodniczy, płyn w skrzyni biegów, pióra
 *   wycieraczek, kontrola akumulatora.
 * - Overdue is "po terminie" in badges and prose; a distance overrun is
 *   "ponad limit", because Polish "po" alone would read as a date.
 * - `{vehicle}` never sits in an oblique case. Polish would demand a case
 *   ending on a name the app cannot decline ("2014 Toyota Corolla"), so every
 *   sentence carrying it uses an appositive colon or comma instead.
 * - Plurals carry all four CLDR categories. `other` is the fractional form and
 *   takes the genitive singular (1,5 dnia / 2,5 serwisu), which is why it is
 *   never a copy of `many`.
 * - Digit grouping is Polish: a space from five digits up (135 600), none at
 *   four (5000). "a light on at 70" is 140 km/h here, the same drive.
 */
export const pl: Fragment = {
  // garage
  "garage.title": "Garaż",
  "garage.logService": "Zapisz serwis",
  "garage.addVehicle": "Dodaj pojazd",
  "garage.comingUp": "Wkrótce",
  "garage.quickLog": "Zapisz jednym dotknięciem",
  "garage.empty": "Nie ma jeszcze pojazdów. Dodaj jeden, a Wrenchy zacznie prowadzić jego zapisy.",
  "garage.storeUnreachable":
    "Nie udało się połączyć ze sklepem. Spróbuj ponownie przy lepszym połączeniu.",

  "garage.badge.overdue": "Po terminie",
  "garage.badge.dueSoon": "Wkrótce",

  "garage.odometer": "Przebieg",
  "garage.odometer.notSet": "Nie podano",
  "garage.odometer.estimated": "Przebieg (szac.)",

  "garage.over": "{distance} ponad limit",
  "garage.dueNow": "do wykonania",
  "garage.dueSoon": "wkrótce",
  "garage.onSchedule": "w terminie",

  "garage.noSchedule": "Brak harmonogramu",
  "garage.noSchedule.detail": "zapisane, nieśledzone",
  "garage.nothingLogged": "Brak wpisów",
  "garage.nothingLogged.detail": "dodaj serwis",

  "garage.openHistory": "Otwórz historię",
  "garage.openAndLog": "Otwórz i zapisz serwis",

  // evidence
  "evidence.records.label": "zgubione zapisy, nieudane synchronizacje, brak sposobu na wyjęcie danych",
  "evidence.records.answer": "SQLite w twoim telefonie, a cały rejestr wychodzi w CSV.",

  "evidence.price.label": "cena, paywall albo to, ile się w końcu okazało kosztować",
  "evidence.price.answer":
    "Jedna subskrypcja i nic więcej do kupienia. Każde auto, każdy wpis.",

  "evidence.account.label": "konto i logowanie, zanim cokolwiek zadziałało",
  "evidence.account.answer": "Bez konta. Nie ma się do czego logować.",

  "evidence.crashes.label": "awarie, zawieszenia i pliki, które nie chciały się otworzyć",
  "evidence.crashes.answer":
    "Twoje wpisy siedzą w bazie danych w telefonie, nie w pliku, który może się nie otworzyć.",

  // features
  "features.history.title": "Każdy serwis, zachowany na zawsze",
  "features.history.subtitle":
    "Data, przebieg, koszt i notatki z każdej wizyty, zapisane tak długo, jak masz to auto.",

  "features.due.title": "Termin według daty i przebiegu",
  "features.due.subtitle":
    "Liczy się to, co wypadnie pierwsze: przejechane kilometry albo minione miesiące.",

  "features.reminders.title": "Jedno przypomnienie na serwis",
  "features.reminders.subtitle": "W dniu, w którym wypada termin, i nic poza tym.",

  "features.export.title": "Eksport wszystkiego do CSV",
  "features.export.subtitle": "Cały rejestr wyciągniesz do arkusza, kiedy tylko zechcesz.",

  "features.costs.title": "Zobacz, ile cię to kosztuje",
  "features.costs.subtitle":
    "Sumy według pojazdu, przeglądu i miesiąca, policzone z kosztów, które wpisujesz.",

  "features.garage.title": "Nieograniczona liczba pojazdów",
  "features.garage.subtitle": "Każde auto, dostawczak i ciężarówka, jaką masz, w jednym miejscu.",

  "features.intervals.title": "Własne interwały serwisowe",
  "features.intervals.subtitle":
    "Zmień dowolny, gdy instrukcja mówi co innego niż ustawienia domyślne.",

  // insights
  "insights.title": "Koszty",
  "insights.subtitle": "Ile kosztował garaż, prosto z twojego dziennika.",
  "insights.total.label": "Zapisano do tej pory",
  "insights.total.priced": {
    one: "Z {count} przeglądu z ceną.",
    few: "Z {count} przeglądów z ceną.",
    many: "Z {count} przeglądów z ceną.",
    other: "Z {count} przeglądu z ceną.",
  },
  "insights.total.unpriced": {
    one: "Przy {count} kolejnym przeglądzie brakuje kosztu.",
    few: "Przy {count} kolejnych przeglądach brakuje kosztu.",
    many: "Przy {count} kolejnych przeglądach brakuje kosztu.",
    other: "Przy {count} kolejnych przeglądach brakuje kosztu.",
  },
  "insights.byVehicle.title": "Według pojazdu",
  "insights.byService.title": "Na co idzie",
  "insights.byMonth.title": "Ostatnie 12 miesięcy",
  "insights.empty.title": "Jeszcze nic z ceną",
  "insights.empty.body": "Dodaj koszt przy zapisywaniu przeglądu, a pojawi się tutaj. Wcześniejsze przeglądy też można edytować.",
  "insights.empty.cta": "Do mojego garażu",
  "insights.open": "Zobacz koszty",

  // intervals
  "intervals.title": "Interwały serwisowe",
  "intervals.intro":
    "Jak często wypada każdy serwis. Zmień dowolny, żeby pasował do twojego samochodu, do instrukcji, do klimatu, w jakim jeździsz, albo do tego, jak ostro go używasz.",
  "intervals.custom": "WŁASNY",

  "intervals.untracked": "nieśledzone",
  "intervals.months": {
    one: "{count} miesiąc",
    few: "{count} miesiące",
    many: "{count} miesięcy",
    other: "{count} miesiąca",
  },
  "intervals.monthsAndDistance": {
    one: "{count} miesiąc · {distance}",
    few: "{count} miesiące · {distance}",
    many: "{count} miesięcy · {distance}",
    other: "{count} miesiąca · {distance}",
  },

  "intervals.help":
    "Termin wypada wtedy, co pierwsze. Zostaw pole puste, żeby je pominąć — sam przebieg albo same miesiące to poprawny harmonogram. Wyczyść oba, żeby wrócić do domyślnego ({default}).",
  "intervals.field.months": "Co (miesiące)",
  "intervals.field.distance": "Co ({unit})",
  "intervals.error.positive":
    "Wpisz liczby całkowite większe od zera albo zostaw pole puste, żeby je pominąć.",
  "intervals.save": "Zapisz interwał",
  "intervals.cancel": "Anuluj",

  // language
  "language.title": "Język",
  "language.intro":
    "Wrenchy idzie za ustawieniem telefonu, chyba że wybierzesz język tutaj. Nazwy serwisów używają słów, których w tym języku używają warsztaty.",
  "language.system": "Systemowy",

  // layout
  "layout.garage": "Garaż",
  "layout.settings": "Ustawienia",
  "layout.intervals": "Interwały serwisowe",
  "layout.addVehicle": "Dodaj pojazd",
  "layout.vehicle": "Pojazd",
  "layout.logService": "Zapisz serwis",
  "layout.fatal.retry": "Spróbuj ponownie",
  "layout.fatal.title": "Wrenchy nie mógł otworzyć twoich zapisów.",
  "layout.fatal.body":
    "Nic nie zostało usunięte, a baza wróciła do ostatniego dobrego stanu. Otwórz aplikację ponownie. Jeśli to się powtarza, odezwij się do pomocy, zanim przeinstalujesz — to przeinstalowanie naprawdę usunęłoby zapisy.",

  // offer

  "offer.features.title": "Co dostajesz.",

  "offer.plan.title": "Oto plan.",
  "offer.plan.subtitle": {
    one: "{vehicle}: {count} serwis w harmonogramie.",
    few: "{vehicle}: {count} serwisy w harmonogramie.",
    many: "{vehicle}: {count} serwisów w harmonogramie.",
    other: "{vehicle}: {count} serwisu w harmonogramie.",
  },
  "offer.plan.cta": "Włącz przypomnienia",
  "offer.plan.decline": "Nie teraz",
  "offer.notify.title": "Nie przegap żadnego serwisu.",
  "offer.notify.off": "Przypomnienia wy\u0142\u0105czone",
  "offer.notify.body": "Ostatni raz: {date}.",
  "offer.plan.status.due": "Termin",
  "offer.plan.status.soon": "Wkrótce",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "Brak wpisu",

  "offer.paywall.title": "Nigdy więcej nie przegap serwisu.",
  "offer.paywall.title.named": "{name}, nigdy więcej nie przegap serwisu.",
  "offer.paywall.subtitle": "Każdy serwis i każdy stan licznika, zapisane.",
  "offer.paywall.vehicle": "Zapisany",
  "offer.paywall.scheduled": "Pod kontrolą",
  "offer.paywall.services": { one: "serwis", few: "serwisy", many: "serwisów", other: "serwisu" },
  "offer.paywall.dueNow": "Zaległe dziś",
  "offer.paywall.nextUp": "Następne ostrzeżenie",
  "offer.paywall.none": "Brak",
  "offer.paywall.point.tracked.title": "{vehicle} jest w rejestrze",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} serwis pilnowany, według daty i przebiegu",
    few: "{count} serwisy pilnowane, według daty i przebiegu",
    many: "{count} serwisów pilnowanych, według daty i przebiegu",
    other: "{count} serwisu pilnowanego, według daty i przebiegu",
  },
  "offer.paywall.point.due.title": {
    one: "{count} serwis zaległy dziś",
    few: "{count} serwisy zaległe dziś",
    many: "{count} serwisów zaległych dziś",
    other: "{count} serwisu zaległego dziś",
  },
  "offer.paywall.point.due.subtitle": "Następne ostrzeżenie {date}",
  "offer.paywall.point.due.noNext": "Na razie żadne ostrzeżenie nie jest potrzebne",
  "offer.paywall.point.history.title": "Pełna historia przy sprzedaży",
  "offer.paywall.point.history.subtitle": "Każdy serwis, koszt i odczyt, zachowany na zawsze i do wyeksportowania.",
  "offer.paywall.point.reminders.title": "Przypomnienie przed każdym",
  "offer.paywall.point.reminders.subtitle": "W dniu terminu, bez nagabywania.",


  "offer.deal.title": "To samo Pro, taniej.",
  "offer.deal.title.named": "{name}, to samo Pro taniej.",
  "offer.trial.cta": "Skorzystaj z oferty teraz",
  "offer.trial.decline": "Wolę zapłacić pełną cenę",
  "offer.trial.gets.reminders": "Przypomnienie przed każdym serwisem",
  "offer.trial.gets.due": "Termin według daty i przebiegu",
  "offer.trial.gets.history": "Każdy serwis zapisany na zawsze",
  "offer.trial.gets.costs": "Zobacz, ile kosztuje auto",
  "offer.trial.gets.garage": "Nieograniczona liczba pojazdów",
  "offer.trial.gets.intervals": "Własne interwały serwisowe",
  "offer.trial.gets.export": "Eksport wszystkiego do CSV",

  "offer.winback.title": "Dawno nic nie zapisujesz.",
  "offer.winback.decline": "Po prostu przejdź do garażu",
  "offer.winback.body":
    "Twoje zapisy są dokładnie tam, gdzie były. Nic nie wygasło, nic nie zostało usunięte i nic nie wymaga ustawiania od nowa.",
  "offer.winback.feedback": "Napisz, co poszło nie tak",
  "offer.winback.feedbackNote": "Krótki formularz, otwiera się w Safari",
  "offer.winback.caption": "Albo spróbuj jeszcze raz: rok Pro w cenie oferty. Anuluj w każdej chwili.",

  // onboardingA
  "onboardingA.continue": "Dalej",

  "onboardingA.welcome.headline": "Koniec ze zgadywaniem, kiedy była ostatnia wymiana oleju.",
  "onboardingA.welcome.start": "Zaczynajmy",
  "onboardingA.welcome.privacy": "Bez konta. Nic nie opuszcza telefonu.",

  // The introduction, on the screen before the quiz. The name is read
  // back on both ask screens and in every reminder, and nowhere else.
  "onboardingA.name.title": "Jak mamy się do ciebie zwracać?",
  "onboardingA.name.label": "Twoje imię",
  "onboardingA.name.continue": "Dalej",

  "onboardingA.vehicle.title": "Czym jeździsz?",
  "onboardingA.vehicle.year": "Rocznik",
  "onboardingA.vehicle.make": "Marka",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.model": "Model",

  "onboardingA.odometer.title.mi": "Ile ma mil przebiegu?",
  "onboardingA.odometer.title.km": "Ile ma kilometrów przebiegu?",
  "onboardingA.odometer.field": "Przebieg ({unit})",
  "onboardingA.odometer.placeholder.mi": "84 210",
  "onboardingA.odometer.placeholder.km": "135 600",
  "onboardingA.odometer.caption": "Wystarczy przybliżona liczba.",
  "onboardingA.odometer.required": "Podaj wskazanie licznika, aby kontynuować.",

  "onboardingA.drive.title": "Ile nim jeździsz?",
  "onboardingA.drive.legend": "Dystans na rok ({unit})",
  "onboardingA.drive.low.mi": "Poniżej 5000",
  "onboardingA.drive.low.km": "Poniżej 8000",
  "onboardingA.drive.average.mi": "5000 do 10 000",
  "onboardingA.drive.average.km": "8000 do 16 000",
  "onboardingA.drive.high.mi": "10 000 do 15 000",
  "onboardingA.drive.high.km": "16 000 do 24 000",
  "onboardingA.drive.very_high.mi": "Powyżej 15 000",
  "onboardingA.drive.very_high.km": "Powyżej 24 000",
  "onboardingA.drive.projection": "Za rok o tej porze około {distance}.",
  "onboardingA.drive.caption": "Wystarczy z grubsza.",

  // onboardingB
  "onboardingB.continue": "Dalej",

  "onboardingB.service.title": "Jaki był ostatni serwis?",
  "onboardingB.service.subtitle": "Wystarczy mniej więcej.",
  "onboardingB.service.legend": "Serwis",
  "onboardingB.service.when": "{service} — kiedy to było?",
  "onboardingB.service.whenOther": "Serwis — kiedy to było?",
  "onboardingB.service.whenPending": "Kiedy to było?",
  "onboardingB.service.somethingElse": "Coś innego",
  "onboardingB.service.ago.now": "Przed chwilą",
  "onboardingB.service.ago.lastMonth": "W zeszłym miesiącu",
  "onboardingB.service.ago.months3": "3 miesiące temu",
  "onboardingB.service.ago.months6": "6 miesięcy temu",
  "onboardingB.service.ago.notSure": "Nie wiem",

  "onboardingB.tracking.title": "Jak to teraz zapisujesz?",
  "onboardingB.tracking.legend": "Dziś",
  "onboardingB.tracking.memory": "Pamięć",
  "onboardingB.tracking.receipts": "Paragony w aucie",
  "onboardingB.tracking.spreadsheet": "Arkusz kalkulacyjny",
  "onboardingB.tracking.dealer": "Warsztat to prowadzi",
  "onboardingB.tracking.nothing": "W ogóle nijak",

  "onboardingB.worry.title": "Czego chcesz uniknąć?",
  "onboardingB.worry.subtitle": "Zaznacz tyle, ile pasuje.",
  "onboardingB.worry.bills": "Niespodziewane rachunki",
  "onboardingB.worry.missed": "Przegapiony serwis",
  "onboardingB.worry.records": "Utrata zapisów",
  "onboardingB.worry.resale": "Wartość przy sprzedaży",
  "onboardingB.worry.upsell": "Naciąganie w warsztacie",

  "onboardingB.analyzing.title": "Ustalam harmonogram.",
  "onboardingB.analyzing.odometer": "{vehicle}, przebieg {distance}",
  "onboardingB.analyzing.intervals": {
    one: "Zastosowano {count} interwał serwisowy",
    few: "Zastosowano {count} interwały serwisowe",
    many: "Zastosowano {count} interwałów serwisowych",
    other: "Zastosowano {count} interwału serwisowego",
  },
  "onboardingB.analyzing.rate": "{distance} rocznie",
  "onboardingB.analyzing.rateProjected": "{distance} rocznie, czyli {projected} za rok",
  "onboardingB.analyzing.clear": "Dziś nic nie wymaga uwagi",
  "onboardingB.analyzing.due": {
    one: "{count} wymaga uwagi, {soon} wkrótce",
    few: "{count} wymagają uwagi, {soon} wkrótce",
    many: "{count} wymaga uwagi, {soon} wkrótce",
    other: "{count} wymaga uwagi, {soon} wkrótce",
  },
  "onboardingB.analyzing.percent": "{percent}%",

  // onboardingC
  "onboardingC.back": "Wstecz",
  "onboardingC.question": "Pytanie {step} / {total}",

  "onboardingC.schedule.title": {
    one: "Jedna usługa, pod kontrolą od dziś.",
    few: "{count} usługi, pod kontrolą od dziś.",
    many: "{count} usług, pod kontrolą od dziś.",
    other: "{count} usługi, pod kontrolą od dziś.",
  },
  "onboardingC.schedule.onWatch": "Pod kontrolą",
  "onboardingC.schedule.status.fresh": "Od dziś",
  "onboardingC.schedule.line.fresh": "Pod kontrolą od dziś",
  "onboardingC.results.overdue": {
    one: "Jeden serwis jest już po terminie.",
    few: "{count} serwisy są już po terminie.",
    many: "{count} serwisów jest już po terminie.",
    other: "{count} serwisu jest już po terminie.",
  },
  "onboardingC.results.subtitle": "{vehicle}, {distance} rocznie.",
  "onboardingC.results.continue": "Dalej",
  "onboardingC.results.onFile": "Zapisane",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Termin",
  "onboardingC.results.status.soon": "Wkrótce",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "Brak wpisu",

  // The two odometer gauges on the payoff page: the reading typed, and where
  // it lands in a year at the stated rate.
  "onboardingC.outlook.odometer": "Dziś",
  "onboardingC.outlook.projected": "Za rok",
  "onboardingC.cost.title": "{percent}% aut na drogach ma zaległy przegląd.",
  "onboardingC.cost.percent": "{percent}%",
  "onboardingC.cost.tireRotations": "Zaległa rotacja opon",
  "onboardingC.cost.oilChanges": "Zaległa wymiana oleju",
  "onboardingC.cost.tracked": "Wrenchy pilnuje obsług, które należą się Twojemu autu.",
  "onboardingC.cost.source": "{overdue}. Dane amerykańskie.",
  "onboardingC.cost.continue": "Dalej",

  "onboardingC.compare.title": "Na własną rękę albo według planu.",
  "onboardingC.compare.subtitle": "{vehicle}, prowadzony na oba sposoby.",
  "onboardingC.compare.dated": "Przeglądy z datą",
  "onboardingC.compare.remembered": "Przeglądy, które musisz pamiętać",
  "onboardingC.compare.alone": "Na własną rękę",
  "onboardingC.compare.withApp": "Z Wrenchy",
  "onboardingC.compare.ofTotal": "{count} z {total}",
  "onboardingC.compare.source": "Policzone z twoich własnych odpowiedzi. Bez średnich i szacunków.",
  "onboardingC.compare.continue": "Dalej",

  "onboardingC.symptoms.next": "Dalej",
  "onboardingC.symptoms.last": "To co mam zrobić",

  "onboardingC.help.title": "Wszystkie trzy to ten sam problem.",
  "onboardingC.help.subtitle": "Nic nie jest zapisane tam, gdzie mogłoby cię ostrzec.",
  "onboardingC.help.continue": "Dalej",

  "onboardingC.reviews.title": "Ta aplikacja istnieje przez te recenzje.",
  "onboardingC.reviews.subtitle": {
    one: "{count} z {total} recenzji w App Store dla aplikacji, które już to robią, ma od jednej do trzech gwiazdek.",
    few: "{count} z {total} recenzji w App Store dla aplikacji, które już to robią, mają od jednej do trzech gwiazdek.",
    many: "{count} z {total} recenzji w App Store dla aplikacji, które już to robią, ma od jednej do trzech gwiazdek.",
    other:
      "{count} z {total} recenzji w App Store dla aplikacji, które już to robią, ma od jednej do trzech gwiazdek.",
  },
  "onboardingC.reviews.continue": "Dalej",
  "onboardingC.reviews.mentioning": "Recenzje wspominające o",

  // pain
  "pain.overdue.legend": "Po terminie",
  "pain.overdue.headline": {
    one: "Jeden serwis jest już po terminie",
    few: "{count} serwisy są już po terminie",
    many: "{count} serwisów jest już po terminie",
    other: "{count} serwisu jest już po terminie",
  },
  "pain.overdue.body": "{vehicle}, dzisiaj. Kontrolka zapala się po szkodzie, a nie przed nią.",
  "pain.overdue.fix": "Odliczane po dacie i po przebiegu, zgłaszane zanim wyjdzie na minus.",

  "pain.blind.legend": "Brak wpisu",
  "pain.blind.headline": {
    one: "{count} z {total} serwisów nie ma żadnego wpisu",
    few: "{count} z {total} serwisów nie mają żadnego wpisu",
    many: "{count} z {total} serwisów nie ma żadnego wpisu",
    other: "{count} z {total} serwisów nie ma żadnego wpisu",
  },
  "pain.blind.body": "Dopóki nic nie mówi inaczej, każda z nich liczy się jako zaległa.",
  "pain.blind.fix": "Zapisz jedną, a rusza cały jej harmonogram. Trzydzieści sekund, raz.",

  "pain.memory.legend": "Z pamięci",
  "pain.memory.headline": "Jedyna kopia jest w twojej głowie",
  "pain.memory.body": "Pamięć wystarcza dokładnie do chwili, gdy przy ladzie ktoś pyta: kiedy dokładnie?",
  "pain.memory.fix": "Zapisane na tym telefonie i tam zostaje. Żadnego konta, za którym można to zgubić.",

  "pain.nothing.legend": "Nieśledzone",
  "pain.nothing.headline": "Nic o tym samochodzie nie jest zapisane",
  "pain.nothing.body": "Jedyny rejestr prowadzi samochód, a mówi ci o nim, psując się.",
  "pain.nothing.fix": "Jedno dotknięcie zapisuje serwis. Od tej chwili historia istnieje poza autem.",

  "pain.receipts.legend": "W schowku",
  "pain.receipts.headline": "Schowek to nie skorowidz",
  "pain.receipts.body": "Paragony dowodzą, co zrobiono. Nigdy nie mówią, co wypada dalej.",
  "pain.receipts.fix": "Te same paragony jako datowane wiersze do sortowania, wyszukiwania i eksportu.",

  "pain.spreadsheet.legend": "W arkuszu",
  "pain.spreadsheet.headline": "Arkusz nie klepnie cię w ramię",
  "pain.spreadsheet.body": "Historię trzyma dobrze. Tylko nigdy nie otwiera się sam, żeby cię ostrzec.",
  "pain.spreadsheet.fix": "Te same wiersze, plus powiadomienie w dniu, w którym serwis wypada.",

  "pain.dealer.legend": "W warsztacie",
  "pain.dealer.headline": "Zapisy warsztatu należą do warsztatu",
  "pain.dealer.body": "Kompletna, dopóki nie zmienisz warsztatu, nie przeprowadzisz się albo nie sprzedasz auta, i widoczna dla nich, nie dla ciebie.",
  "pain.dealer.fix": "Twoja własna kopia, na twoim telefonie, do wyeksportowania kiedy chcesz.",

  "pain.bills.legend": "Rachunek",
  "pain.bills.headline": "Odłożona obsługa to nie zaoszczędzone pieniądze",
  "pain.bills.body": "To te same pieniądze później, z lawetą przed nimi.",
  "pain.bills.fix": "Każdy interwał odliczany, żeby tania robota została tania.",

  "pain.missed.legend": "Przeoczenie",
  "pain.missed.headline": "Nic nie przypomni, dopóki nie jest za późno",
  "pain.missed.body": "Nikt nie pomija serwisu celowo. Pomija się go w zwykły wtorek.",
  "pain.missed.fix": "Jedno powiadomienie na serwis, w dniu, w którym wypada. Nic poza tym.",

  "pain.records.legend": "Dowód",
  "pain.records.headline": "Nieudowodniony serwis to serwis niewykonany",
  "pain.records.body": "Gwarancja, sprzedaż, spór z warsztatem: każde pyta o zapis.",
  "pain.records.fix": "Datowany rejestr i arkusz z niego, kiedy będzie potrzebny.",

  "pain.resale.legend": "Sprzedaż",
  "pain.resale.headline": "Pełna historia jest warta więcej niż czysta",
  "pain.resale.body": "Kupujący odlicza to, czego nie możesz pokazać. Dealer tak samo.",
  "pain.resale.fix": "Wyeksportuj całą historię i przekaż ją.",

  "pain.upsell.legend": "Przy ladzie",
  "pain.upsell.headline": "Oni znają twoją historię. Ty nie.",
  "pain.upsell.body": "To nie jest pytanie do zgadywania, kiedy ktoś właśnie wycenia ci naprawę.",
  "pain.upsell.fix": "Data i stan licznika, wyciągnięte przy ladzie w dwa dotknięcia.",

  "pain.vehicleFallback": "Ten samochód",

  // plan
  "plan.line.nothing": "Brak wpisu",
  "plan.line.about": "około {date}",
  "plan.line.noInterval": "Brak interwału",

  // service
  "service.Oil Change": "Wymiana oleju",
  "service.Tire Rotation": "Rotacja opon",
  "service.Brake Inspection": "Kontrola hamulców",
  "service.Air Filter": "Filtr powietrza",
  "service.Cabin Air Filter": "Filtr kabinowy",
  "service.Wiper Blades": "Pióra wycieraczek",
  "service.Battery Check": "Kontrola akumulatora",
  "service.Coolant Flush": "Wymiana płynu chłodniczego",
  "service.Transmission Fluid": "Płyn w skrzyni biegów",
  "service.Spark Plugs": "Świece zapłonowe",
  "service.Registration": "Ubezpieczenie OC",
  "service.Inspection": "Przegląd techniczny",
  "service.Other": "Inne",

  // settings
  "settings.title": "Ustawienia",
  "settings.privacy":
    "Twoje zapisy żyją tylko w tym telefonie. Bez konta, bez serwera. Eksportuj, kiedy chcesz, bo eksport nigdy nie jest zablokowany.",
  "settings.section.data": "Dane",
  "settings.section.reminders": "Przypomnienia",
  "settings.section.membership": "Subskrypcja",
  "settings.section.preferences": "Ustawienia",

  "settings.export": "Eksportuj wszystkie zapisy (CSV)",
  "settings.export.error":
    "Nie udało się otworzyć okna udostępniania. Twoje zapisy są nienaruszone.",

  "settings.intervals": "Interwały serwisowe",


  "settings.language": "Język: {language}",
  "settings.units": "Jednostki: {unit}",
  "settings.units.title": "Przełączyć na {unit}?",
  "settings.units.body":
    "Każdy zapisany przebieg i interwał zostanie przeliczony z {from} na {to}. Odczyt 50 000 {from} stanie się {example}.",
  "settings.units.cancel": "Anuluj",
  "settings.units.confirm": "Przelicz",

  "settings.reminders.enable": "Włącz przypomnienia",
  "settings.reminders.blocked": "Przypomnienia zablokowane, otwórz Ustawienia iOS",
  "settings.reminders.none": "Przypomnienia włączone, nic jeszcze nie wypada",
  "settings.reminders.on": {
    one: "Przypomnienia włączone, {count} zaplanowane",
    few: "Przypomnienia włączone, {count} zaplanowane",
    many: "Przypomnienia włączone, {count} zaplanowanych",
    other: "Przypomnienia włączone, {count} zaplanowanego",
  },
  "settings.reminders.onNext": {
    one: "Przypomnienia włączone, {count} zaplanowane, następne {date}",
    few: "Przypomnienia włączone, {count} zaplanowane, następne {date}",
    many: "Przypomnienia włączone, {count} zaplanowanych, następne {date}",
    other: "Przypomnienia włączone, {count} zaplanowanego, następne {date}",
  },
  "settings.reminders.scheduled": "Przypomnienia zaplanowane.",
  "settings.reminders.denied":
    "Odmówiono zgody na przypomnienia. Możesz je włączyć w Ustawieniach iOS.",
  "settings.reminders.error": "Nie udało się poprosić o zgodę na powiadomienia.",
  "settings.reminders.openSettings":
    "Otwórz Ustawienia iOS › Wrenchy › Powiadomienia, żeby z powrotem włączyć przypomnienia.",

  "settings.manage": "Zarządzaj subskrypcją",
  "settings.manage.error":
    "Nie udało się otworzyć ustawień subskrypcji. Spróbuj ponownie przy lepszym połączeniu.",
  "settings.upgrade": "Przejdź na Pro",
  "settings.restore": "Przywróć zakupy",
  "settings.restore.done": "Pro przywrócone.",
  "settings.restore.none": "Nie znaleziono zakupu.",
  "settings.store.error":
    "Nie udało się połączyć ze sklepem. Spróbuj ponownie przy lepszym połączeniu.",
  "settings.pro.on": "Pro jest włączone. Dziękujemy.",
  "settings.offer.applied": "Ta oferta jest już zastosowana. Nic więcej do zrobienia.",

  "settings.replay": "Powtórz wprowadzenie",
  "settings.replay.title": "Powtórzyć wprowadzenie?",
  "settings.replay.body":
    "Twoje pojazdy i zapisy zostają. Przejście przez proces jeszcze raz dodaje kolejny pojazd, który potem możesz usunąć.",
  "settings.replay.cancel": "Anuluj",
  "settings.replay.confirm": "Powtórz",

  // system
  "system.notify.title": "{service} — termin",
  "system.notify.title.named": "{name}, {service} — termin",
  "system.notify.body": "{vehicle} · Ostatni raz: {date}.",
  // The two nudges an unfinished onboarding gets, two hours and a day
  // after the user walked away from it.
  "system.resume.first.title": "Konfiguracja w połowie",
  "system.resume.first.title.named": "{name}, konfiguracja w połowie",
  "system.resume.first.body": "{vehicle} · Jeszcze minuta i plan przeglądów będzie gotowy.",
  "system.resume.second.title": "Wróć do miejsca, w którym przerwano",
  "system.resume.second.title.named": "{name}, wróć do miejsca, w którym przerwano",
  "system.resume.second.body": "{vehicle} · Nic z wpisanych danych nie przepadło.",

  "system.notify.when.today": "Dzi\u015b",
  "system.notify.when.tomorrow": "Jutro",
  "system.notify.when.days": {
    one: "Za {count} dzie\u0144",
    few: "Za {count} dni",
    many: "Za {count} dni",
    other: "Za {count} dnia",
  },
  "system.notify.when.months": {
    one: "Za {count} miesi\u0105c",
    few: "Za {count} miesi\u0105ce",
    many: "Za {count} miesi\u0119cy",
    other: "Za {count} miesi\u0105ca",
  },

  "system.csv.header.vehicle": "Pojazd",
  "system.csv.header.service": "Serwis",
  "system.csv.header.date": "Data",
  "system.csv.header.odometer": "Przebieg ({unit})",
  "system.csv.header.cost": "Koszt",
  "system.csv.header.notes": "Notatki",
  "system.csv.header.deleted": "Usunięte",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Wypróbuj Pro",
  "system.quickaction.trial.subtitle": "Rok Pro w cenie oferty",
  "system.quickaction.feedback.title": "Wyślij opinię",
  "system.quickaction.feedback.subtitle": "Napisz, co poszło nie tak",

  "system.vehicle.fallback": "Mój samochód",

  // unit
  "unit.mi": "{value} mi",
  "unit.km": "{value} km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  // vehicle
  "vehicle.title": "Pojazd",

  "vehicle.body.sedan": "Sedan",
  "vehicle.body.hatchback": "Hatchback",
  "vehicle.body.coupe": "Coupé",
  "vehicle.body.wagon": "Kombi",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pickup",
  "vehicle.body.van": "Van",

  "vehicle.odometer": "Przebieg",
  "vehicle.odometer.notSet": "Nie podano",
  "vehicle.odometer.estimated": "Przebieg (szac.)",
  "vehicle.lastService": "Ostatni serwis",
  "vehicle.lastService.none": "Jeszcze żadnego",

  "vehicle.due": "Na teraz",
  "vehicle.history": "Historia",
  "vehicle.history.empty":
    "Nie ma jeszcze zapisanego serwisu. Zapisz ostatnią robotę, jaka była zrobiona.",

  "vehicle.over": "{distance} ponad limit",
  "vehicle.dueOn": "termin {date}",
  "vehicle.dueNow": "do wykonania",
  "vehicle.dueSoon": "wkrótce",

  "vehicle.badge.overdue": "Po terminie",
  "vehicle.badge.soon": "Wkrótce",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Usuń",
  "vehicle.serviceDeleted": "Serwis usunięty",
  "vehicle.undo": "Cofnij",
  "vehicle.logService": "Zapisz serwis",

  "vehicle.rename.title": "Zmień nazwę pojazdu",
  "vehicle.deleteVehicle": "Usuń pojazd",
  "vehicle.delete.title": "Usunąć {name}?",
  "vehicle.delete.body":
    "Znika z garażu razem z historią serwisową. Zapisy już wyeksportowane zostają w tamtym pliku.",
  "vehicle.delete.cancel": "Anuluj",
  "vehicle.delete.confirm": "Usuń",

  // vehicleForms
  "vehicleForms.new.title": "Dodaj pojazd",
  "vehicleForms.new.save": "Zapisz",
  "vehicleForms.new.name": "Nazwa",
  "vehicleForms.new.namePlaceholder": "Civic 2019",
  "vehicleForms.new.odometer": "Aktualny przebieg ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Zapisz serwis",
  "vehicleForms.log.save": "Zapisz",
  "vehicleForms.log.error": "Nie udało się zapisać. Twój wpis nadal tu jest. Spróbuj ponownie.",
  "vehicleForms.number.invalid": "Nie udało się odczytać tej liczby. Tylko cyfry — 84 210 lub 45,5.",
  "vehicleForms.log.what": "Co",
  "vehicleForms.log.when": "Kiedy",
  "vehicleForms.log.today": "Dziś",
  "vehicleForms.log.yesterday": "Wczoraj",
  "vehicleForms.log.otherDate": "Inna data",
  "vehicleForms.log.odometer": "Przebieg ({unit})",
  "vehicleForms.log.cost": "Koszt (opcjonalnie)",
  "vehicleForms.log.notes": "Notatki (opcjonalnie)",
  "subscribed.title": "Pro jest włączone.",
  "subscribed.body": "{vehicle} jest już w harmonogramie. Dostaniesz znać, zanim przegląd stanie się wymagalny, a nie po fakcie.",
  "subscribed.unlocked": "Teraz działa",
  "subscribed.cta": "Zobacz harmonogram",
  "fuel.title": "Paliwo",
  "fuel.log": "Zapisz tankowanie",
  "fuel.seeAll": "Zobacz wszystkie tankowania",
  "fuel.summary.last": "Ostatni bak",
  "fuel.summary.average": "Średnia",
  "fuel.summary.needFirst": "Zapisz tankowanie, a pojawi się tutaj.",
  "fuel.summary.needSecond": "Jeszcze jeden pełny bak i pojawi się pierwszy wynik.",
  "fuel.history.title": "Tankowania",
  "fuel.history.empty": "Nie zapisano jeszcze żadnego tankowania.",
  "fuel.row.partial": "Dolewka",
  "fuel.deleted": "Tankowanie usunięte",
  "fuel.undo": "Cofnij",
  "fuel.swipe.delete": "Usuń",
  "fuel.form.title": "Zapisz tankowanie",
  "fuel.form.odometer": "Licznik ({unit})",
  "fuel.form.volume": "Paliwo ({unit})",
  "fuel.form.cost": "Zapłacono łącznie (opcjonalnie)",
  "fuel.form.full": "Zatankowano do pełna",
  "fuel.form.fullHint": "Zostaw włączone, chyba że nie tankowałeś do pełna.",
  "fuel.form.when": "Kiedy",
  "fuel.form.today": "Dziś",
  "fuel.form.yesterday": "Wczoraj",
  "fuel.form.otherDate": "Inny dzień",
  "fuel.form.save": "Zapisz tankowanie",
  "fuel.form.error": "Nie udało się zapisać tankowania.",
  "fuel.form.needOdometer": "Podaj stan licznika i ile paliwa wlano.",
  "fuel.card.title": "Paliwo",
  "fuel.card.spend": "Wydatki na paliwo",
  "fuel.card.perDistance": "Koszt na 100 {unit}",
  "fuel.card.efficiency": "Spalanie",
  "fuel.card.months": "Ostatnie 12 miesięcy",
  "fuel.card.fills": { one: "Z {count} tankowania z ceną.", few: "Z {count} tankowań z ceną.", many: "Z {count} tankowań z ceną.", other: "Z {count} tankowania z ceną." },
  "fuel.card.unpriced": { one: "{count} kolejne tankowanie nie ma zapisanego kosztu.", few: "{count} kolejne tankowania nie mają zapisanego kosztu.", many: "{count} kolejnych tankowań nie ma zapisanego kosztu.", other: "{count} kolejnego tankowania nie ma zapisanego kosztu." },
  "fuel.card.locked.title": "Zobacz, ile kosztuje cię paliwo",
  "fuel.card.locked.body": "Twoje tankowania są już zapisane. Pro zamienia je w spalanie, wydatki i koszt na dystans.",
  "fuel.card.locked.cta": "Odblokuj analizę paliwa",
  "fuel.card.empty": "Zapisz dwa pełne baki, a pojawią się tu dane.",
  "unit.gal": "{value} gal",
  "unit.litre": "{value} L",
  "unit.gal.label": "gal",
  "unit.litre.label": "L",
  "unit.mpg": "{value} mpg",
  "unit.l100km": "{value} L/100km",
  "unit.mpg.label": "mpg",
  "unit.l100km.label": "L/100km",
  "system.csv.fuel.volume": "Paliwo ({unit})",
  "system.csv.fuel.full": "Pełny bak",
  "system.csv.cell.yes": "Tak",
  "system.csv.cell.no": "Nie",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Zamknij",
  "paywall.period.week": "Tygodniowo",
  "paywall.period.month": "Miesięcznie",
  "paywall.period.year": "Rocznie",
  "paywall.per.week": "tygodniowo",
  "paywall.per.month": "miesięcznie",
  "paywall.billed.month": "{price} pobierane co miesiąc",
  "paywall.billed.year": "{price} pobierane co rok",
  "paywall.save": "Oszczędzasz {pct}%",
  "paywall.intro.label": "Twój pierwszy tydzień",
  "paywall.cta.week": "Dalej z planem tygodniowym",
  "paywall.cta.month": "Dalej z planem miesięcznym",
  "paywall.cta.year": "Dalej z planem rocznym",
  "paywall.legal.week": "Odnawia się za {price} tygodniowo. Anuluj, kiedy chcesz.",
  "paywall.legal.month": "Odnawia się za {price} miesięcznie. Anuluj, kiedy chcesz.",
  "paywall.legal.year": "Odnawia się za {price} rocznie. Anuluj, kiedy chcesz.",
  "paywall.terms": "Regulamin",
  "paywall.privacy": "Prywatność",
  "paywall.restore": "Przywróć",
  "paywall.included": "W ramach Pro",
  "paywall.loading": "Wczytywanie cen",
  "paywall.retry": "Spróbuj ponownie",
  "paywall.review.quote": 
    "Compared to other apps I tried like MyAutoLog, Carfax, or what have you not, this app absolutely surpasses them all in terms of functionality, design, and ease of use.",
  "paywall.review.name": "Tracy D.",
};

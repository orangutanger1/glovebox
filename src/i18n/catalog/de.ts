import type { Fragment } from "./types";

/**
 * German (de-DE). Register: du throughout, which is what consumer utility apps
 * use in DE/AT/CH.
 *
 * Deliberate choices a reviewer would otherwise question:
 * - `service.Inspection` is "TÜV (HU)": the short form fits a 30-character row
 *   with a date beside it, TÜV is the word an owner says and searches, and the
 *   "(HU)" keeps it correct for the DEKRA/GTÜ half of the market.
 *   "Hauptuntersuchung" is the same thing spelled out and costs that row.
 * - `service.Registration` is "Kfz-Steuer", the recurring paperwork a German
 *   owner actually pays, not "Registrierung".
 * - Odometer is "Tachostand", not "Kilometerstand": the label is drawn against
 *   a gauge the user set to mi or km, and "Kilometerstand" names one of them.
 * - "When was the {service}?" became "{service} – wann zuletzt?" so the service
 *   noun never needs a gendered article the catalog cannot know.
 * - Service names are garage vocabulary (Ölwechsel, Reifenwechsel, Bremsen
 *   prüfen, Innenraumfilter, Kühlmittel wechseln), and compounds are split
 *   where German would normally glue them, to keep chips and buttons one line.
 * - pain.memory.body: "a light on at 70" is 120 (km/h) here, the same drive.
 */
export const de: Fragment = {
  // evidence
  "evidence.records.label": "verlorene Daten, fehlgeschlagene Syncs, kein Weg, sie herauszubekommen",
  "evidence.records.answer": "SQLite auf deinem Handy. CSV-Export, für immer kostenlos.",

  "evidence.price.label": "der Preis, die Paywall oder was es am Ende gekostet hat",
  "evidence.price.answer":
    "Die Gratisversion ist eine komplett nutzbare App. Ein Auto, unbegrenzte Historie.",

  "evidence.account.label": "ein Konto und ein Login, bevor überhaupt etwas ging",
  "evidence.account.answer": "Kein Konto. Es gibt nichts, wo du dich einloggen müsstest.",

  "evidence.crashes.label": "Abstürze, Hänger und Dateien, die sich nicht öffnen ließen",
  "evidence.crashes.answer": "Gelöschte Einträge werden markiert, nie verworfen.",

  // features
  "features.history.title": "Jeder Service, für immer erfasst",
  "features.history.subtitle":
    "Datum, Tachostand, Kosten und Notizen; gelöschte Zeilen werden markiert statt verworfen.",

  "features.due.title": "Fällig nach Datum und nach Strecke",
  "features.due.subtitle": "Was zuerst kommt, gezählt aus den Intervallen jedes Service.",

  "features.reminders.title": "Eine Erinnerung pro Service",
  "features.reminders.subtitle": "Am Tag der Fälligkeit, und sonst nie.",

  "features.export.title": "Alles als CSV exportieren",
  "features.export.subtitle":
    "Für immer kostenlos für alle, damit deine Daten nie an einem Abo hängen.",

  "features.garage.title": "Mehr als ein Fahrzeug",
  "features.garage.subtitle": "Die ganze Garage, jedes mit eigenem Plan.",

  "features.intervals.title": "Deine eigenen Serviceintervalle",
  "features.intervals.subtitle":
    "Überschreib jedes davon, wenn das Handbuch etwas anderes sagt als die Vorgabe.",

  // garage
  "garage.title": "Garage",
  "garage.logService": "Service eintragen",
  "garage.addVehicle": "Fahrzeug hinzufügen",
  "garage.empty": "Noch keine Fahrzeuge. Füg eins hinzu, dann führt Wrenchy das Buch.",
  "garage.storeUnreachable": "Store nicht erreichbar. Versuch es mit besserer Verbindung noch mal.",

  "garage.badge.overdue": "Überfällig",
  "garage.badge.dueSoon": "Bald fällig",

  "garage.odometer": "Tachostand",
  "garage.odometer.notSet": "Nicht gesetzt",
  "garage.odometer.estimated": "Tachostand (gesch.)",

  "garage.over": "{distance} drüber",
  "garage.dueNow": "jetzt fällig",
  "garage.dueSoon": "bald fällig",
  "garage.onSchedule": "im Plan",

  "garage.noSchedule": "Noch kein Plan",
  "garage.noSchedule.detail": "erfasst, nicht überwacht",
  "garage.nothingLogged": "Nichts erfasst",
  "garage.nothingLogged.detail": "Service eintragen",

  "garage.openHistory": "Historie öffnen",
  "garage.openAndLog": "Öffnen und Service eintragen",

  // intervals
  "intervals.title": "Serviceintervalle",
  "intervals.intro":
    "Wie oft jeder Service fällig wird. Ändere jedes davon so, dass es zu deinem Auto passt, zum Handbuch, zum Klima, in dem du fährst, oder dazu, wie hart du es rannimmst.",
  "intervals.custom": "EIGEN",

  "intervals.untracked": "nicht überwacht",
  "intervals.months": { one: "{count} Monat", other: "{count} Monate" },
  "intervals.monthsAndDistance": {
    one: "{count} Monat · {distance}",
    other: "{count} Monate · {distance}",
  },

  "intervals.help":
    "Fällig ist, was zuerst kommt. Lass ein Feld leer, um es zu ignorieren; nur Strecke oder nur Monate ist ein gültiger Plan. Leere beide, um zur Vorgabe zurückzugehen ({default}).",
  "intervals.field.months": "Alle (Monate)",
  "intervals.field.distance": "Alle ({unit})",
  "intervals.error.positive":
    "Nimm ganze Zahlen über null, oder lass ein Feld leer, um es zu ignorieren.",
  "intervals.save": "Intervall sichern",
  "intervals.cancel": "Abbrechen",

  // language
  "language.title": "Sprache",
  "language.intro":
    "Wrenchy folgt deinem Handy, solange du hier keine Sprache wählst. Die Servicenamen nutzen die Wörter, die Werkstätten in dieser Sprache benutzen.",
  "language.system": "System",

  // layout
  "layout.garage": "Garage",
  "layout.settings": "Einstellungen",
  "layout.intervals": "Serviceintervalle",
  "layout.addVehicle": "Fahrzeug hinzufügen",
  "layout.vehicle": "Fahrzeug",
  "layout.logService": "Service eintragen",
  "layout.fatal.title": "Wrenchy konnte deine Daten nicht öffnen.",
  "layout.fatal.body":
    "Nichts wurde gelöscht, und die Datenbank wurde auf ihren letzten guten Stand zurückgesetzt. Öffne die App neu. Wenn das immer wieder passiert, wende dich an den Support, bevor du neu installierst – neu installieren wäre das, was die Daten wirklich verlieren würde.",

  // offer
  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratis",

  "offer.features.title": "Das bekommst du.",

  "offer.plan.title": "Das ist der Plan.",
  "offer.plan.subtitle": {
    one: "{count} Service im Plan für {vehicle}.",
    other: "{count} Services im Plan für {vehicle}.",
  },
  "offer.plan.cta": "Erinnerungen einschalten",
  "offer.plan.decline": "Jetzt nicht",
  "offer.notify.title": "Verpasse keinen Service mehr.",
  "offer.plan.status.due": "Fällig",
  "offer.plan.status.soon": "Bald",
  "offer.plan.status.ok": "OK",

  "offer.paywall.title": "Autos warnen dich nicht. Das hier schon.",
  "offer.paywall.subtitle": "Jeder Service und jeder Tachostand, dokumentiert.",
  "offer.paywall.cta": "Mein Auto dokumentieren",
  "offer.paywall.vehicle": "Erfasst",
  "offer.paywall.scheduled": "Jetzt im Blick",
  "offer.paywall.services": { one: "Service", other: "Services" },
  "offer.paywall.dueNow": "Heute überfällig",
  "offer.paywall.nextUp": "Nächste Warnung",
  "offer.paywall.none": "Keine",

  "offer.paywall.impact.legend": "Was das wert ist",
  "offer.paywall.impact.warned": "Du erfährst von einem Service, bevor er fällig ist, nicht erst nach der Reparatur.",
  "offer.paywall.impact.upsell": "Du kommst in die Werkstatt und weißt, was wann gemacht wurde, also wird dir nichts zweimal verkauft.",
  "offer.paywall.impact.resale": "Du gibst dem nächsten Besitzer ein vollständiges Scheckheft statt Schulterzucken, und das zeigt sich im Preis.",

  "offer.trial.title": { one: "Teste es {count} Tag lang.", other: "Teste es {count} Tage lang." },
  "offer.trial.cta": { one: "{count} Gratistag starten", other: "{count} Gratistage starten" },
  "offer.trial.decline": "Nein danke, zeig mir die Gratisversion",

  "offer.winback.title": "Du hast aufgehört einzutragen.",
  "offer.winback.decline": "Bring mich einfach in meine Garage",
  "offer.winback.body":
    "Deine Daten sind genau da, wo du sie gelassen hast. Nichts ist abgelaufen, nichts wurde gelöscht, und nichts muss neu eingerichtet werden.",
  "offer.winback.feedback": "Sag uns, was schiefgelaufen ist",
  "offer.winback.feedbackNote": "Ein kurzes Formular, öffnet sich in Safari",
  "offer.winback.caption": {
    one: "Oder gib ihm noch eine Chance: {count} Tag Pro, gratis. Kündige vor Ablauf, dann zahlst du nichts.",
    other:
      "Oder gib ihm noch eine Chance: {count} Tage Pro, gratis. Kündige vor Ablauf, dann zahlst du nichts.",
  },

  // onboardingA
  "onboardingA.continue": "Weiter",

  "onboardingA.welcome.headline": "Nie wieder raten, wann der letzte Ölwechsel war.",
  "onboardingA.welcome.start": "Los geht's",
  "onboardingA.welcome.privacy": "Kein Konto. Nichts verlässt dein Handy.",

  "onboardingA.vehicle.title": "Was fährst du?",
  "onboardingA.vehicle.year": "Baujahr",
  "onboardingA.vehicle.makeOptional": "Marke (optional)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.body.title": "Was für ein Auto ist es?",
  "onboardingA.vehicle.modelOptional": "Modell (optional)",

  "onboardingA.odometer.title.mi": "Wie viele Meilen hat es drauf?",
  "onboardingA.odometer.title.km": "Wie viele Kilometer hat es drauf?",
  "onboardingA.odometer.field": "Tachostand ({unit})",
  "onboardingA.odometer.placeholder.mi": "84.210",
  "onboardingA.odometer.placeholder.km": "135.600",
  "onboardingA.odometer.caption": "Ein grober Wert reicht.",

  "onboardingA.drive.title": "Wie viel fährst du damit?",
  "onboardingA.drive.legend": "Strecke pro Jahr ({unit})",
  "onboardingA.drive.low.mi": "Unter 5.000",
  "onboardingA.drive.low.km": "Unter 8.000",
  "onboardingA.drive.average.mi": "5.000 bis 10.000",
  "onboardingA.drive.average.km": "8.000 bis 16.000",
  "onboardingA.drive.high.mi": "10.000 bis 15.000",
  "onboardingA.drive.high.km": "16.000 bis 24.000",
  "onboardingA.drive.very_high.mi": "Über 15.000",
  "onboardingA.drive.very_high.km": "Über 24.000",
  "onboardingA.drive.projection": "Etwa {distance} bis nächstes Jahr um diese Zeit.",
  "onboardingA.drive.caption": "Ungefähr reicht.",

  // onboardingB
  "onboardingB.continue": "Weiter",

  "onboardingB.service.title": "Was wurde zuletzt gemacht?",
  "onboardingB.service.subtitle": "Ungefähr genügt.",
  "onboardingB.service.legend": "Service",
  "onboardingB.service.when": "{service} – wann zuletzt?",
  "onboardingB.service.whenOther": "Service – wann zuletzt?",
  "onboardingB.service.whenPending": "Wann zuletzt?",
  "onboardingB.service.somethingElse": "Etwas anderes",
  "onboardingB.service.ago.now": "Gerade eben",
  "onboardingB.service.ago.lastMonth": "Letzten Monat",
  "onboardingB.service.ago.months3": "Vor 3 Monaten",
  "onboardingB.service.ago.months6": "Vor 6 Monaten",
  "onboardingB.service.ago.notSure": "Weiß nicht",

  "onboardingB.tracking.title": "Wie behältst du es bisher im Blick?",
  "onboardingB.tracking.legend": "Bisher",
  "onboardingB.tracking.memory": "Im Kopf",
  "onboardingB.tracking.receipts": "Rechnungen im Auto",
  "onboardingB.tracking.spreadsheet": "Eine Tabelle",
  "onboardingB.tracking.dealer": "Werkstatt führt Buch",
  "onboardingB.tracking.nothing": "Gar nicht",

  "onboardingB.worry.title": "Was willst du vermeiden?",
  "onboardingB.worry.subtitle": "Wähl aus, was zutrifft.",
  "onboardingB.worry.bills": "Überraschende Rechnungen",
  "onboardingB.worry.missed": "Service verpassen",
  "onboardingB.worry.records": "Daten verlieren",
  "onboardingB.worry.resale": "Wiederverkaufswert",
  "onboardingB.worry.upsell": "Aufgeschwatzt werden",

  "onboardingB.analyzing.title": "Der Plan wird berechnet.",
  "onboardingB.analyzing.odometer": "{vehicle} bei {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} Serviceintervall angewendet",
    other: "{count} Serviceintervalle angewendet",
  },
  "onboardingB.analyzing.rate": "{distance} pro Jahr",
  "onboardingB.analyzing.rateProjected": "{distance} pro Jahr, also {projected} bis nächstes Jahr",
  "onboardingB.analyzing.clear": "Heute braucht nichts Aufmerksamkeit",
  "onboardingB.analyzing.due": {
    one: "{count} braucht Aufmerksamkeit, {soon} in Kürze",
    other: "{count} brauchen Aufmerksamkeit, {soon} in Kürze",
  },
  "onboardingB.analyzing.done": "Fertig",
  "onboardingB.analyzing.progress": "Wert {index} von {total}",

  // onboardingC
  "onboardingC.back": "Zurück",
  "onboardingC.question": "Frage {step} / {total}",

  "onboardingC.results.overdue": {
    one: "Ein Service ist schon überfällig.",
    other: "{count} Services sind schon überfällig.",
  },
  "onboardingC.results.noneLogged": "Nichts von dem, was du erfasst hast, ist überfällig.",
  "onboardingC.results.noneYet": "Noch ist nichts überfällig.",
  "onboardingC.results.clear": "Nichts ist überfällig, und nichts steht kurz bevor.",
  "onboardingC.results.subtitle": "{vehicle}, {distance} pro Jahr.",
  "onboardingC.results.continue": "Weiter",
  "onboardingC.results.dueNow": "Jetzt fällig",
  "onboardingC.results.soon": "Bald",
  "onboardingC.results.onFile": "Erfasst",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Fällig",
  "onboardingC.results.status.soon": "Bald",
  "onboardingC.results.status.ok": "OK",

  "onboardingC.symptoms.next": "Weiter",
  "onboardingC.symptoms.last": "Und was mache ich jetzt",

  "onboardingC.help.title": "Alle drei sind dasselbe Problem.",
  "onboardingC.help.subtitle": "Nichts steht dort, wo es dich warnen könnte.",
  "onboardingC.help.continue": "Weiter",

  "onboardingC.reviews.title": "Diese App gibt es wegen dieser hier.",
  "onboardingC.reviews.subtitle": {
    one: "{count} von {total} App-Store-Bewertungen von Apps, die das schon machen, hat einen bis drei Sterne.",
    other:
      "{count} von {total} App-Store-Bewertungen von Apps, die das schon machen, haben einen bis drei Sterne.",
  },
  "onboardingC.reviews.continue": "Weiter",
  "onboardingC.reviews.scroll": "Scroll, um alle vier zu lesen",
  "onboardingC.reviews.mentioning": "Bewertungen über",

  // pain
  "pain.overdue.legend": "Überfällig",
  "pain.overdue.headline": {
    one: "Ein Service ist schon überfällig",
    other: "{count} Services sind schon überfällig",
  },
  "pain.overdue.body":
    "An deinem {vehicle}, heute. Kein Cockpit wird das erwähnen, denn die Lampe geht nach dem Schaden an, nicht davor.",
  "pain.overdue.fix":
    "Jeder Service nach Datum und nach Strecke heruntergezählt und gemeldet, bevor die Zahl ins Minus geht.",

  "pain.blind.legend": "Kein Eintrag",
  "pain.blind.headline": {
    one: "Zu {count} von {total} Services liegt nichts vor",
    other: "Zu {count} von {total} Services liegt nichts vor",
  },
  "pain.blind.body":
    "Wrenchy kann nichts belegen, was es nie gesehen hat, und du auch nicht. Bis etwas anderes gesagt wird, gilt jeder davon als fällig.",
  "pain.blind.fix": "Trag einen ein, und sein ganzer Plan läuft los. Je dreißig Sekunden, einmalig.",

  "pain.memory.legend": "Aus dem Kopf",
  "pain.memory.headline": "Die einzige Kopie steckt in deinem Kopf",
  "pain.memory.body":
    "Du hast gesagt, du gehst nach Gedächtnis. Das hält genau so lange, bis am Tresen, beim Verkauf oder mit einer Lampe bei 120 die Frage \u201ewann genau?\u201c kommt.",
  "pain.memory.fix":
    "Jeder Service, den du einträgst, wird auf dieses Handy geschrieben und bleibt da. Kein Konto, hinter dem er verloren geht.",

  "pain.nothing.legend": "Nicht erfasst",
  "pain.nothing.headline": "Zu diesem Auto ist nichts festgehalten",
  "pain.nothing.body":
    "Weder der letzte Ölwechsel noch der Stand, bei dem er war. Das Auto führt das einzige Protokoll, und es teilt es dir mit, indem es liegen bleibt.",
  "pain.nothing.fix":
    "Ein Tippen trägt einen Service ein. Ab dann gibt es die Historie auch woanders als im Auto.",

  "pain.receipts.legend": "Im Handschuhfach",
  "pain.receipts.headline": "Ein Handschuhfach ist kein Verzeichnis",
  "pain.receipts.body":
    "Rechnungen belegen, dass ein Service stattgefunden hat. Sie sagen dir nicht, was als Nächstes ansteht, sie liegen in keiner Reihenfolge, und Thermopapier verblasst zu einem leeren Blatt.",
  "pain.receipts.fix":
    "Dieselben Rechnungen als datierte Zeilen, die du sortieren, durchsuchen und als CSV exportieren kannst.",

  "pain.spreadsheet.legend": "In einer Tabelle",
  "pain.spreadsheet.headline": "Eine Tabelle kann dir nicht auf die Schulter tippen",
  "pain.spreadsheet.body":
    "Sie hält die Historie gut fest. Sie öffnet sich nur nie von selbst, und das Einzige, was du von ihr brauchst, ist eine Warnung, nach der du gar nicht gesucht hättest.",
  "pain.spreadsheet.fix":
    "Dieselben Zeilen, plus eine Mitteilung an dem Tag, an dem ein Service fällig wird.",

  "pain.dealer.legend": "In der Werkstatt",
  "pain.dealer.headline": "Die Daten der Werkstatt gehören der Werkstatt",
  "pain.dealer.body":
    "Vollständig, bis du die Werkstatt wechselst, umziehst oder das Auto verkaufst, und einsehbar für den, der deinen Kostenvoranschlag schreibt, nicht für dich.",
  "pain.dealer.fix":
    "Deine eigene Kopie, auf deinem eigenen Handy, exportierbar, wann immer du willst.",

  "pain.bills.legend": "Die Rechnung",
  "pain.bills.headline": "Aufgeschobene Wartung ist kein gespartes Geld",
  "pain.bills.body":
    "Es ist dasselbe Geld später, mit einem Abschlepper davor. Die Arbeiten, die teuer schiefgehen, sind die billigen, die keiner mitgezählt hat.",
  "pain.bills.fix":
    "Jedes Intervall wird heruntergezählt, damit die billige Arbeit eine billige Arbeit bleibt.",

  "pain.missed.legend": "Das Versäumnis",
  "pain.missed.headline": "Nichts erinnert dich, bis es zu spät ist",
  "pain.missed.body":
    "Ein Service wird nie mit Absicht verpasst. Er wird an einem ganz normalen Dienstag verpasst, und dann wieder in der Woche darauf, und der Tacho läuft weiter.",
  "pain.missed.fix": "Eine Mitteilung pro Service, am Tag der Fälligkeit. Sonst nie etwas anderes.",

  "pain.records.legend": "Der Nachweis",
  "pain.records.headline": "Ein Service ohne Nachweis gilt als nicht gemacht",
  "pain.records.body":
    "Ein Garantiefall, ein Verkauf, eine Diskussion mit der Werkstatt: Jedes davon fragt nach dem Beleg, nicht nach deiner Erinnerung daran.",
  "pain.records.fix":
    "Ein datiertes Protokoll, das du als CSV exportierst. Für immer kostenlos, für alle, ob mit Abo oder ohne.",

  "pain.resale.legend": "Wiederverkauf",
  "pain.resale.headline": "Eine lückenlose Historie ist mehr wert als eine saubere",
  "pain.resale.body":
    "Der Käufer zieht ab, was du ihm nicht zeigen kannst, und der Händler bei der Inzahlungnahme genauso. Das Auto ist nur so viel wert, wie du belegen kannst.",
  "pain.resale.fix":
    "Exportier die ganze Historie als CSV und gib sie weiter. Nichts davon hängt hinter dem Abo.",

  "pain.upsell.legend": "Der Tresen",
  "pain.upsell.headline": "Die kennen deine Historie. Du nicht.",
  "pain.upsell.body":
    "\u201eWann waren die Bremsen zuletzt dran?\u201c ist keine Frage, bei der man raten sollte, während einem jemand genau dafür ein Angebot macht.",
  "pain.upsell.fix": "Datum und Tachostand, am Tresen mit zwei Tippern aufgerufen.",

  "pain.vehicleFallback": "Auto",

  // plan
  "plan.line.nothing": "Kein Eintrag",
  "plan.line.about": "etwa {date}",
  "plan.line.noInterval": "Kein Intervall gesetzt",

  // service
  "service.Oil Change": "Ölwechsel",
  "service.Tire Rotation": "Reifenwechsel",
  "service.Brake Inspection": "Bremsen prüfen",
  "service.Air Filter": "Luftfilter",
  "service.Cabin Air Filter": "Innenraumfilter",
  "service.Wiper Blades": "Wischerblätter",
  "service.Battery Check": "Batterie prüfen",
  "service.Coolant Flush": "Kühlmittel wechseln",
  "service.Transmission Fluid": "Getriebeöl",
  "service.Spark Plugs": "Zündkerzen",
  "service.Registration": "Kfz-Steuer",
  "service.Inspection": "TÜV (HU)",
  "service.Other": "Sonstiges",

  // settings
  "settings.title": "Einstellungen",
  "settings.privacy":
    "Deine Daten liegen nur auf diesem Handy. Kein Konto, kein Server. Exportieren jederzeit, denn der Export ist nie gesperrt.",

  "settings.export": "Alle Daten exportieren (CSV)",
  "settings.export.error": "Das Teilen-Fenster ließ sich nicht öffnen. Deine Daten sind unverändert.",

  "settings.intervals": "Serviceintervalle",

  "settings.theme.label": "Erscheinungsbild",
  "settings.theme.system": "System",
  "settings.theme.light": "Hell",
  "settings.theme.dark": "Dunkel",

  "settings.language": "Sprache: {language}",
  "settings.units": "Einheit: {unit}",
  "settings.units.title": "Auf {unit} umstellen?",
  "settings.units.body":
    "Jeder gespeicherte Tachostand und jedes Intervall wird von {from} in {to} umgerechnet. Aus 50.000 {from} wird {example}.",
  "settings.units.cancel": "Abbrechen",
  "settings.units.confirm": "Umrechnen",

  "settings.reminders.enable": "Erinnerungen aktivieren",
  "settings.reminders.blocked": "Erinnerungen blockiert, iOS-Einstellungen öffnen",
  "settings.reminders.none": "Erinnerungen an, noch nichts fällig",
  "settings.reminders.on": {
    one: "Erinnerungen an, {count} geplant",
    other: "Erinnerungen an, {count} geplant",
  },
  "settings.reminders.onNext": {
    one: "Erinnerungen an, {count} geplant, nächste {date}",
    other: "Erinnerungen an, {count} geplant, nächste {date}",
  },
  "settings.reminders.scheduled": "Erinnerungen geplant.",
  "settings.reminders.denied":
    "Erinnerungen abgelehnt. Du kannst sie in den iOS-Einstellungen aktivieren.",
  "settings.reminders.error": "Die Mitteilungsberechtigung konnte nicht angefragt werden.",
  "settings.reminders.openSettings":
    "Öffne iOS-Einstellungen › Wrenchy › Mitteilungen, um Erinnerungen wieder zu aktivieren.",

  "settings.manage": "Abo verwalten",
  "settings.manage.error":
    "Die Abo-Einstellungen ließen sich nicht öffnen. Versuch es mit besserer Verbindung noch mal.",
  "settings.upgrade": "Auf Pro upgraden",
  "settings.restore": "Käufe wiederherstellen",
  "settings.restore.done": "Pro wiederhergestellt.",
  "settings.restore.none": "Kein Kauf gefunden.",
  "settings.store.error": "Store nicht erreichbar. Versuch es mit besserer Verbindung noch mal.",
  "settings.pro.on": "Pro ist aktiv. Danke.",
  "settings.offer.applied": "Das Angebot ist aktiv. Sonst gibt es nichts zu tun.",

  "settings.replay": "Einführung wiederholen",
  "settings.replay.title": "Einführung wiederholen?",
  "settings.replay.body":
    "Deine Fahrzeuge und Daten bleiben erhalten. Wenn du den Ablauf noch einmal durchgehst, kommt ein weiteres Fahrzeug dazu, das du danach löschen kannst.",
  "settings.replay.cancel": "Abbrechen",
  "settings.replay.confirm": "Wiederholen",

  // system
  "system.notify.title": "Ihr {vehicle}: {service} ist f\u00e4llig",
  "system.notify.body": "Zuletzt {date}.",

  "system.notify.when.today": "Heute",
  "system.notify.when.tomorrow": "Morgen",
  "system.notify.when.days": { one: "In {count} Tag", other: "In {count} Tagen" },
  "system.notify.when.months": { one: "In {count} Monat", other: "In {count} Monaten" },

  "system.csv.header.vehicle": "Fahrzeug",
  "system.csv.header.service": "Service",
  "system.csv.header.date": "Datum",
  "system.csv.header.odometer": "Tachostand ({unit})",
  "system.csv.header.cost": "Kosten",
  "system.csv.header.notes": "Notizen",
  "system.csv.header.deleted": "Gelöscht",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Pro gratis testen",
  "system.quickaction.trial.subtitle": {
    one: "{count} Tag, danach verlängert es sich, wenn du nicht kündigst",
    other: "{count} Tage, danach verlängert es sich, wenn du nicht kündigst",
  },
  "system.quickaction.feedback.title": "Feedback senden",
  "system.quickaction.feedback.subtitle": "Sag uns, was schiefgelaufen ist",

  "system.vehicle.fallback": "Mein Auto",

  // unit
  "unit.mi": "{value} mi",
  "unit.km": "{value} km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  // vehicle
  "vehicle.title": "Fahrzeug",

  "vehicle.body.sedan": "Limousine",
  "vehicle.body.hatchback": "Schrägheck",
  "vehicle.body.coupe": "Coupé",
  "vehicle.body.wagon": "Kombi",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pick-up",
  "vehicle.body.van": "Van",

  "vehicle.odometer": "Tachostand",
  "vehicle.odometer.notSet": "Nicht gesetzt",
  "vehicle.odometer.estimated": "Tachostand (gesch.)",
  "vehicle.lastService": "Letzter Service",
  "vehicle.lastService.none": "Noch keiner",

  "vehicle.due": "Jetzt fällig",
  "vehicle.history": "Historie",
  "vehicle.history.empty": "Noch kein Service erfasst. Trag das Letzte ein, was gemacht wurde.",

  "vehicle.over": "{distance} drüber",
  "vehicle.dueOn": "fällig {date}",
  "vehicle.dueNow": "jetzt fällig",
  "vehicle.dueSoon": "bald fällig",

  "vehicle.badge.overdue": "Überfällig",
  "vehicle.badge.soon": "Bald",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Löschen",
  "vehicle.serviceDeleted": "Service gelöscht",
  "vehicle.undo": "Rückgängig",
  "vehicle.logService": "Service eintragen",

  "vehicle.deleteVehicle": "Fahrzeug löschen",
  "vehicle.delete.title": "{name} löschen?",
  "vehicle.delete.body":
    "Es verlässt deine Garage samt Servicehistorie. Schon exportierte Daten bleiben in dieser Datei.",
  "vehicle.delete.cancel": "Abbrechen",
  "vehicle.delete.confirm": "Löschen",

  // vehicleForms
  "vehicleForms.new.title": "Fahrzeug hinzufügen",
  "vehicleForms.new.save": "Sichern",
  "vehicleForms.new.name": "Name",
  "vehicleForms.new.namePlaceholder": "2019 Civic",
  "vehicleForms.new.odometer": "Aktueller Tachostand ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Service eintragen",
  "vehicleForms.log.save": "Sichern",
  "vehicleForms.log.error": "Speichern nicht möglich. Deine Eingabe ist noch da. Versuch es erneut.",
  "vehicleForms.log.what": "Was",
  "vehicleForms.log.when": "Wann",
  "vehicleForms.log.today": "Heute",
  "vehicleForms.log.yesterday": "Gestern",
  "vehicleForms.log.otherDate": "Anderes Datum",
  "vehicleForms.log.odometer": "Tachostand ({unit})",
  "vehicleForms.log.cost": "Kosten (optional)",
  "vehicleForms.log.notes": "Notizen (optional)",
};

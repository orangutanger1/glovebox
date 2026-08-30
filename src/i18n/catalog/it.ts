import type { Fragment } from "./types";

/**
 * Italian (it-IT). Register: tu throughout.
 *
 * Two deliberate word choices a reviewer would otherwise question. First,
 * `service.Inspection` is "Revisione" — the legal roadworthiness test Italian
 * owners book every two years, never the dictionary "ispezione" — and
 * `service.Registration` is "Bollo auto", the annual road tax an Italian owner
 * actually pays. Second, a due-able service event is a "tagliando", which is the
 * word owners say and search, while the log/history sense stays "manutenzione"
 * ("storico", "manutenzione eliminata", the CSV column). State words are one
 * term each: scaduto (overdue), da fare (due), a breve (soon).
 *
 * `{service}` is interpolated with a capitalised service name of any gender and
 * number ("Cambio olio", "Revisione", "Candele"), so the two "when" legends are
 * built to need no article or participle agreement.
 */
export const it: Fragment = {
  "evidence.records.label": "registrazioni perse, sincronizzazioni fallite, dati impossibili da esportare",
  "evidence.records.answer": "SQLite sul tuo telefono. Esportazione in CSV, gratis per sempre.",

  "evidence.price.label": "il prezzo, il paywall, o quanto è costato alla fine",
  "evidence.price.answer": "La versione gratuita è un'app completa. Un'auto, storico illimitato.",

  "evidence.account.label": "un account e un login prima di poter fare qualsiasi cosa",
  "evidence.account.answer": "Nessun account. Non c'è nulla a cui accedere.",

  "evidence.crashes.label": "crash, blocchi e file che non si aprivano",
  "evidence.crashes.answer": "Le voci eliminate vengono marcate, mai buttate via.",

  "features.history.title": "Ogni manutenzione, conservata per sempre",
  "features.history.subtitle":
    "Data, contachilometri, costo e note, con le righe eliminate marcate invece che buttate via.",

  "features.due.title": "Scadenze per data e per chilometri",
  "features.due.subtitle":
    "Vale la prima delle due, calcolata dagli intervalli di ogni tagliando.",

  "features.reminders.title": "Un promemoria per tagliando",
  "features.reminders.subtitle": "Il giorno della scadenza, e nient'altro, mai.",

  "features.export.title": "Esporta tutto in CSV",
  "features.export.subtitle":
    "Gratis per sempre e per tutti, così i tuoi dati non restano in ostaggio di un abbonamento.",

  "features.garage.title": "Più di un veicolo",
  "features.garage.subtitle": "Tutto il garage, ognuno con le sue scadenze.",

  "features.intervals.title": "I tuoi intervalli dei tagliandi",
  "features.intervals.subtitle":
    "Cambia quello che vuoi quando il libretto dice diverso dai valori predefiniti.",

  "garage.title": "Garage",
  "garage.logService": "Registra un tagliando",
  "garage.addVehicle": "Aggiungi veicolo",
  "garage.empty": "Ancora nessun veicolo. Aggiungine uno e Wrenchy inizia a tenerne lo storico.",
  "garage.storeUnreachable": "Store non raggiungibile. Riprova con una connessione migliore.",

  "garage.badge.overdue": "Scaduto",
  "garage.badge.dueSoon": "A breve",

  "garage.odometer": "Contachilometri",
  "garage.odometer.notSet": "Non impostato",
  "garage.odometer.estimated": "Contachilometri (stima)",

  "garage.over": "{distance} oltre",
  "garage.dueNow": "da fare ora",
  "garage.dueSoon": "da fare a breve",
  "garage.onSchedule": "in regola",

  "garage.noSchedule": "Nessuna scadenza",
  "garage.noSchedule.detail": "registrato, non monitorato",
  "garage.nothingLogged": "Niente registrato",
  "garage.nothingLogged.detail": "aggiungi un tagliando",

  "garage.openHistory": "Apri lo storico",
  "garage.openAndLog": "Apri e registra un tagliando",

  "intervals.title": "Intervalli dei tagliandi",
  "intervals.intro":
    "Ogni quanto scade ciascun tagliando. Cambia quello che vuoi per adattarlo alla tua auto, al libretto, al clima in cui guidi o a quanto la sfrutti.",
  "intervals.custom": "SU MISURA",

  "intervals.untracked": "non monitorato",
  "intervals.months": { one: "{count} mese", other: "{count} mesi" },
  "intervals.monthsAndDistance": {
    one: "{count} mese · {distance}",
    other: "{count} mesi · {distance}",
  },

  "intervals.help":
    "Scade alla prima delle due condizioni. Lascia vuoto un campo per ignorarlo: solo chilometri o solo mesi è una scadenza valida. Svuota entrambi per tornare al valore predefinito ({default}).",
  "intervals.field.months": "Ogni (mesi)",
  "intervals.field.distance": "Ogni ({unit})",
  "intervals.error.positive":
    "Usa numeri interi maggiori di zero, oppure lascia vuoto un campo per ignorarlo.",
  "intervals.save": "Salva intervallo",
  "intervals.cancel": "Annulla",

  "language.title": "Lingua",
  "language.intro":
    "Wrenchy segue la lingua del telefono se non ne scegli una qui. I nomi dei tagliandi usano le parole che in quella lingua si usano in officina.",
  "language.system": "Sistema",

  "layout.garage": "Garage",
  "layout.settings": "Impostazioni",
  "layout.intervals": "Intervalli dei tagliandi",
  "layout.addVehicle": "Aggiungi veicolo",
  "layout.vehicle": "Veicolo",
  "layout.logService": "Registra un tagliando",
  "layout.fatal.retry": "Riprova",
  "layout.fatal.title": "Wrenchy non è riuscito ad aprire i tuoi dati.",
  "layout.fatal.body":
    "Non è stato eliminato nulla e il database è stato riportato al suo ultimo stato valido. Riapri l'app. Se continua a succedere, contatta l'assistenza prima di reinstallare: è la reinstallazione che farebbe perdere davvero i dati.",

  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratis",

  "offer.features.title": "Cosa ottieni.",

  "offer.plan.title": "Ecco il piano.",
  "offer.plan.subtitle": {
    one: "{count} tagliando programmato per la tua {vehicle}.",
    other: "{count} tagliandi programmati per la tua {vehicle}.",
  },
  "offer.plan.cta": "Attiva i promemoria",
  "offer.plan.decline": "Non ora",
  "offer.notify.title": "Non perdere mai una manutenzione.",
  "offer.plan.status.due": "Da fare",
  "offer.plan.status.soon": "A breve",
  "offer.plan.status.ok": "OK",

  "offer.paywall.title": "Le auto non avvisano. Questo sì.",
  "offer.paywall.subtitle": "Ogni tagliando e ogni lettura, a libretto.",
  "offer.paywall.cta": "Mettere l’auto a libretto",
  "offer.paywall.vehicle": "A libretto",
  "offer.paywall.scheduled": "Ora seguiti",
  "offer.paywall.services": { one: "tagliando", other: "tagliandi" },
  "offer.paywall.dueNow": "In ritardo oggi",
  "offer.paywall.nextUp": "Prossimo avviso",
  "offer.paywall.none": "Nessuno",

  "offer.paywall.impact.legend": "Quanto vale",
  "offer.paywall.impact.warned": "Avvisato prima che costi, non dopo.",
  "offer.paywall.impact.upsell": "Entri sapendo. Niente ti viene venduto due volte.",
  "offer.paywall.impact.resale": "Uno storico completo alla rivendita, e si vede sul prezzo.",

  "offer.trial.title": { one: "Provalo per {count} giorno.", other: "Provalo per {count} giorni." },
  "offer.trial.cta": { one: "Attiva {count} giorno gratis", other: "Attiva {count} giorni gratis" },
  "offer.trial.decline": "No grazie, mostrami l'app gratuita",

  "offer.winback.title": "Hai smesso di registrare.",
  "offer.winback.decline": "Portami solo al mio garage",
  "offer.winback.body":
    "I tuoi dati sono esattamente dove li hai lasciati. Niente è scaduto, niente è stato eliminato e non c'è nulla da riconfigurare.",
  "offer.winback.feedback": "Dicci cosa non ha funzionato",
  "offer.winback.feedbackNote": "Un modulo breve, si apre in Safari",
  "offer.winback.caption": {
    one: "Oppure riprova: {count} giorno di Pro, gratis. Disdici prima della fine e non paghi nulla.",
    other:
      "Oppure riprova: {count} giorni di Pro, gratis. Disdici prima della fine e non paghi nulla.",
  },

  "onboardingA.continue": "Continua",

  "onboardingA.welcome.headline": "Non indovinare più quando hai fatto l'ultimo cambio olio.",
  "onboardingA.welcome.start": "Inizia",
  "onboardingA.welcome.privacy": "Nessun account. Niente esce dal telefono.",

  "onboardingA.vehicle.title": "Cosa guidi?",
  "onboardingA.vehicle.year": "Anno",
  "onboardingA.vehicle.makeOptional": "Marca (facoltativo)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.modelOptional": "Modello (facoltativo)",

  "onboardingA.odometer.title.mi": "Quante miglia ha?",
  "onboardingA.odometer.title.km": "Quanti chilometri ha?",
  "onboardingA.odometer.field": "Contachilometri ({unit})",
  "onboardingA.odometer.placeholder.mi": "84.210",
  "onboardingA.odometer.placeholder.km": "135.600",
  "onboardingA.odometer.caption": "Va bene un numero approssimativo.",

  "onboardingA.drive.title": "Quanto la guidi?",
  "onboardingA.drive.legend": "Distanza all'anno ({unit})",
  "onboardingA.drive.low.mi": "Meno di 5.000",
  "onboardingA.drive.low.km": "Meno di 8.000",
  "onboardingA.drive.average.mi": "Da 5.000 a 10.000",
  "onboardingA.drive.average.km": "Da 8.000 a 16.000",
  "onboardingA.drive.high.mi": "Da 10.000 a 15.000",
  "onboardingA.drive.high.km": "Da 16.000 a 24.000",
  "onboardingA.drive.very_high.mi": "Oltre 15.000",
  "onboardingA.drive.very_high.km": "Oltre 24.000",
  "onboardingA.drive.projection": "Circa {distance} tra un anno.",
  "onboardingA.drive.caption": "Va bene a occhio.",

  "onboardingB.continue": "Continua",

  "onboardingB.service.title": "Qual è l'ultima cosa che hai fatto fare?",
  "onboardingB.service.subtitle": "Va bene anche approssimativo.",
  "onboardingB.service.legend": "Tagliando",
  "onboardingB.service.when": "{service}: quando?",
  "onboardingB.service.whenOther": "Quando è stato fatto?",
  "onboardingB.service.whenPending": "Quando è stato?",
  "onboardingB.service.somethingElse": "Altro",
  "onboardingB.service.ago.now": "Adesso",
  "onboardingB.service.ago.lastMonth": "Il mese scorso",
  "onboardingB.service.ago.months3": "3 mesi fa",
  "onboardingB.service.ago.months6": "6 mesi fa",
  "onboardingB.service.ago.notSure": "Non lo so",

  "onboardingB.tracking.title": "Come tieni traccia adesso?",
  "onboardingB.tracking.legend": "Oggi",
  "onboardingB.tracking.memory": "A memoria",
  "onboardingB.tracking.receipts": "Ricevute in auto",
  "onboardingB.tracking.spreadsheet": "Un foglio di calcolo",
  "onboardingB.tracking.dealer": "Ci pensa l'officina",
  "onboardingB.tracking.nothing": "Proprio nulla",

  "onboardingB.worry.title": "Cosa vuoi evitare?",
  "onboardingB.worry.subtitle": "Scegline quante ti riguardano.",
  "onboardingB.worry.bills": "Riparazioni a sorpresa",
  "onboardingB.worry.missed": "Saltare un tagliando",
  "onboardingB.worry.records": "Perdere lo storico",
  "onboardingB.worry.resale": "Valore di rivendita",
  "onboardingB.worry.upsell": "Lavori non necessari",

  "onboardingB.analyzing.title": "Sto calcolando le scadenze.",
  "onboardingB.analyzing.odometer": "{vehicle} a {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} intervallo applicato",
    other: "{count} intervalli applicati",
  },
  "onboardingB.analyzing.rate": "{distance} all'anno",
  "onboardingB.analyzing.rateProjected":
    "{distance} all'anno, quindi {projected} entro l'anno prossimo",
  "onboardingB.analyzing.clear": "Oggi non serve fare nulla",
  "onboardingB.analyzing.due": {
    one: "{count} da fare, {soon} in arrivo",
    other: "{count} da fare, {soon} in arrivo",
  },
  "onboardingB.analyzing.done": "Fatto",
  "onboardingB.analyzing.progress": "Lettura {index} di {total}",

  "onboardingC.back": "Indietro",
  "onboardingC.question": "Domanda {step} / {total}",

  "onboardingC.results.overdue": {
    one: "Un tagliando è già scaduto.",
    other: "{count} tagliandi sono già scaduti.",
  },
  "onboardingC.results.noneLogged": "Niente di quello che hai registrato è scaduto.",
  "onboardingC.results.noneYet": "Ancora niente di scaduto.",
  "onboardingC.results.clear": "Niente è scaduto, e niente è vicino alla scadenza.",
  "onboardingC.results.subtitle": "La tua {vehicle}, {distance} all'anno.",
  "onboardingC.results.continue": "Continua",
  "onboardingC.results.dueNow": "Da fare ora",
  "onboardingC.results.soon": "A breve",
  "onboardingC.results.onFile": "In archivio",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Da fare",
  "onboardingC.results.status.soon": "A breve",
  "onboardingC.results.status.ok": "OK",

  "onboardingC.symptoms.next": "Continua",
  "onboardingC.symptoms.last": "E allora cosa faccio",

  "onboardingC.help.title": "Tutti e tre sono lo stesso problema.",
  "onboardingC.help.subtitle": "Niente è scritto dove possa avvisarti.",
  "onboardingC.help.continue": "Continua",

  "onboardingC.reviews.title": "Questa app esiste per colpa di queste.",
  "onboardingC.reviews.subtitle": {
    one: "{count} delle {total} recensioni su App Store delle app che già fanno questo ha da una a tre stelle.",
    other:
      "{count} delle {total} recensioni su App Store delle app che già fanno questo hanno da una a tre stelle.",
  },
  "onboardingC.reviews.continue": "Continua",
  "onboardingC.reviews.scroll": "Scorri per leggerle tutte e quattro",
  "onboardingC.reviews.mentioning": "Recensioni che parlano di",

  "pain.overdue.legend": "Scaduto",
  "pain.overdue.headline": {
    one: "Un tagliando è già scaduto",
    other: "{count} tagliandi sono già scaduti",
  },
  "pain.overdue.body": "Sulla tua {vehicle}, oggi. La spia si accende dopo il danno, non prima.",
  "pain.overdue.fix": "Contato per data e per distanza, segnalato prima che vada sotto zero.",

  "pain.blind.legend": "Nessuno storico",
  "pain.blind.headline": {
    one: "{count} tagliando su {total} non ha nulla in archivio",
    other: "{count} tagliandi su {total} non hanno nulla in archivio",
  },
  "pain.blind.body": "Finché qualcosa non dice il contrario, ognuno di questi risulta da fare.",
  "pain.blind.fix": "Registrane uno e parte tutto il suo calendario. Trenta secondi, una volta.",

  "pain.memory.legend": "A memoria",
  "pain.memory.headline": "L'unica copia è nella tua testa",
  "pain.memory.body": "La memoria regge finché al banco qualcuno chiede «quando esattamente?».",
  "pain.memory.fix": "Scritto su questo telefono e lì resta. Nessun account dietro cui perderlo.",

  "pain.nothing.legend": "Non monitorata",
  "pain.nothing.headline": "Di quest'auto non è scritto niente",
  "pain.nothing.body": "L'unico registro lo tiene l'auto, e il modo in cui te lo dice è rompendosi.",
  "pain.nothing.fix": "Un tocco registra un intervento. Da lì lo storico esiste fuori dall'auto.",

  "pain.receipts.legend": "Nel cruscotto",
  "pain.receipts.headline": "Il cassetto del cruscotto non è un archivio",
  "pain.receipts.body": "Le ricevute provano cosa è stato fatto. Non dicono mai cosa tocca dopo.",
  "pain.receipts.fix": "Le stesse ricevute come righe datate da ordinare, cercare ed esportare.",

  "pain.spreadsheet.legend": "In un foglio di calcolo",
  "pain.spreadsheet.headline": "Un foglio di calcolo non ti dà una pacca sulla spalla",
  "pain.spreadsheet.body": "Lo storico lo tiene bene. Solo che non si apre mai da solo per avvisarti.",
  "pain.spreadsheet.fix": "Le stesse righe, più una notifica il giorno in cui un intervento scade.",

  "pain.dealer.legend": "In officina",
  "pain.dealer.headline": "Lo storico dell'officina è dell'officina",
  "pain.dealer.body": "Completo finché non cambi officina, traslochi o vendi, e visibile a loro, non a te.",
  "pain.dealer.fix": "Una copia tua, sul tuo telefono, esportabile quando vuoi.",

  "pain.bills.legend": "Il conto",
  "pain.bills.headline": "La manutenzione rinviata non è denaro risparmiato",
  "pain.bills.body": "Sono gli stessi soldi più avanti, con un carro attrezzi davanti.",
  "pain.bills.fix": "Ogni intervallo contato, così il lavoro economico resta economico.",

  "pain.missed.legend": "La dimenticanza",
  "pain.missed.headline": "Niente te lo ricorda finché non è tardi",
  "pain.missed.body": "Nessuno salta un tagliando apposta. Lo si salta un martedì qualunque.",
  "pain.missed.fix": "Una notifica per intervento, il giorno in cui scade. Nient'altro.",

  "pain.records.legend": "La prova",
  "pain.records.headline": "Un tagliando non dimostrato è un tagliando non fatto",
  "pain.records.body": "Una garanzia, una vendita, una discussione in officina: ognuna chiede il documento.",
  "pain.records.fix": "Un registro datato, esportabile in CSV. Gratis per sempre, per tutti.",

  "pain.resale.legend": "Rivendita",
  "pain.resale.headline": "Uno storico completo vale più di uno storico pulito",
  "pain.resale.body": "Il compratore sconta quello che non puoi mostrargli. Anche il concessionario.",
  "pain.resale.fix": "Esporta tutto lo storico e consegnalo. Niente resta dietro Pro.",

  "pain.upsell.legend": "Il banco",
  "pain.upsell.headline": "Loro conoscono il tuo storico. Tu no.",
  "pain.upsell.body": "Non è una domanda su cui tirare a indovinare mentre ti fanno un preventivo.",
  "pain.upsell.fix": "Data e chilometraggio, tirati fuori al banco in due tocchi.",

  "pain.vehicleFallback": "auto",

  "plan.line.nothing": "Niente in archivio",
  "plan.line.about": "circa {date}",
  "plan.line.noInterval": "Nessun intervallo impostato",

  "service.Oil Change": "Cambio olio",
  "service.Tire Rotation": "Rotazione gomme",
  "service.Brake Inspection": "Controllo freni",
  "service.Air Filter": "Filtro aria",
  "service.Cabin Air Filter": "Filtro abitacolo",
  "service.Wiper Blades": "Spazzole tergicristallo",
  "service.Battery Check": "Controllo batteria",
  "service.Coolant Flush": "Cambio liquido refrigerante",
  "service.Transmission Fluid": "Olio del cambio",
  "service.Spark Plugs": "Candele",
  "service.Registration": "Bollo auto",
  "service.Inspection": "Revisione",
  "service.Other": "Altro",

  "settings.title": "Impostazioni",
  "settings.privacy":
    "I tuoi dati stanno solo su questo telefono. Nessun account, nessun server. Esporta quando vuoi, perché l'esportazione non è mai bloccata.",

  "settings.export": "Esporta tutti i dati (CSV)",
  "settings.export.error":
    "Non è stato possibile aprire la condivisione. I tuoi dati non sono cambiati.",

  "settings.intervals": "Intervalli dei tagliandi",


  "settings.language": "Lingua: {language}",
  "settings.units": "Unità: {unit}",
  "settings.units.title": "Passare a {unit}?",
  "settings.units.body":
    "Ogni lettura del contachilometri e ogni intervallo che hai salvato verrà convertito da {from} a {to}. Una lettura di 50.000 {from} diventa {example}.",
  "settings.units.cancel": "Annulla",
  "settings.units.confirm": "Converti",

  "settings.reminders.enable": "Attiva i promemoria",
  "settings.reminders.blocked": "Promemoria bloccati, apri Impostazioni iOS",
  "settings.reminders.none": "Promemoria attivi, niente in scadenza",
  "settings.reminders.on": {
    one: "Promemoria attivi, {count} programmato",
    other: "Promemoria attivi, {count} programmati",
  },
  "settings.reminders.onNext": {
    one: "Promemoria attivi, {count} programmato, il prossimo {date}",
    other: "Promemoria attivi, {count} programmati, il prossimo {date}",
  },
  "settings.reminders.scheduled": "Promemoria programmati.",
  "settings.reminders.denied":
    "Promemoria negati. Puoi attivarli nelle Impostazioni di iOS.",
  "settings.reminders.error": "Non è stato possibile chiedere il permesso per le notifiche.",
  "settings.reminders.openSettings":
    "Apri Impostazioni iOS › Wrenchy › Notifiche per riattivare i promemoria.",

  "settings.manage": "Gestisci abbonamento",
  "settings.manage.error":
    "Non è stato possibile aprire le impostazioni dell'abbonamento. Riprova con una connessione migliore.",
  "settings.upgrade": "Passa a Pro",
  "settings.restore": "Ripristina acquisti",
  "settings.restore.done": "Pro ripristinato.",
  "settings.restore.none": "Nessun acquisto trovato.",
  "settings.store.error": "Store non raggiungibile. Riprova con una connessione migliore.",
  "settings.pro.on": "Pro è attivo. Grazie.",
  "settings.offer.applied": "L'offerta è applicata. Non c'è altro da fare.",

  "settings.replay": "Rivedi l'introduzione",
  "settings.replay.title": "Rivedere l'introduzione?",
  "settings.replay.body":
    "I tuoi veicoli e i tuoi dati restano. Rifare la procedura aggiunge un altro veicolo, che poi puoi eliminare.",
  "settings.replay.cancel": "Annulla",
  "settings.replay.confirm": "Rivedi",

  "system.notify.title": "Il tuo {vehicle}: {service} da fare",
  "system.notify.body": "Ultima volta {date}.",

  "system.notify.when.today": "Oggi",
  "system.notify.when.tomorrow": "Domani",
  "system.notify.when.days": { one: "Tra {count} giorno", other: "Tra {count} giorni" },
  "system.notify.when.months": { one: "Tra {count} mese", other: "Tra {count} mesi" },

  "system.csv.header.vehicle": "Veicolo",
  "system.csv.header.service": "Manutenzione",
  "system.csv.header.date": "Data",
  "system.csv.header.odometer": "Contachilometri ({unit})",
  "system.csv.header.cost": "Costo",
  "system.csv.header.notes": "Note",
  "system.csv.header.deleted": "Eliminato",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Prova Pro gratis",
  "system.quickaction.trial.subtitle": {
    one: "{count} giorno, poi si rinnova se non disdici",
    other: "{count} giorni, poi si rinnova se non disdici",
  },
  "system.quickaction.feedback.title": "Invia un feedback",
  "system.quickaction.feedback.subtitle": "Dicci cosa non ha funzionato",

  "system.vehicle.fallback": "La mia auto",

  "unit.mi": "{value} mi",
  "unit.km": "{value} km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  "vehicle.title": "Veicolo",

  "vehicle.body.sedan": "Berlina",
  "vehicle.body.hatchback": "Utilitaria",
  "vehicle.body.coupe": "Coupé",
  "vehicle.body.wagon": "Station wagon",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pick-up",
  "vehicle.body.van": "Furgone",

  "vehicle.odometer": "Contachilometri",
  "vehicle.odometer.notSet": "Non impostato",
  "vehicle.odometer.estimated": "Contachilometri (stima)",
  "vehicle.lastService": "Ultimo tagliando",
  "vehicle.lastService.none": "Ancora nessuno",

  "vehicle.due": "Da fare ora",
  "vehicle.history": "Storico",
  "vehicle.history.empty":
    "Ancora nessuna manutenzione registrata. Registra l'ultima cosa che hai fatto fare.",

  "vehicle.over": "{distance} oltre",
  "vehicle.dueOn": "scade {date}",
  "vehicle.dueNow": "da fare ora",
  "vehicle.dueSoon": "da fare a breve",

  "vehicle.badge.overdue": "Scaduto",
  "vehicle.badge.soon": "A breve",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Elimina",
  "vehicle.serviceDeleted": "Manutenzione eliminata",
  "vehicle.undo": "Annulla",
  "vehicle.logService": "Registra un tagliando",

  "vehicle.deleteVehicle": "Elimina veicolo",
  "vehicle.delete.title": "Eliminare {name}?",
  "vehicle.delete.body":
    "Esce dal tuo garage insieme al suo storico di manutenzione. I dati già esportati restano in quel file.",
  "vehicle.delete.cancel": "Annulla",
  "vehicle.delete.confirm": "Elimina",

  "vehicleForms.new.title": "Aggiungi veicolo",
  "vehicleForms.new.save": "Salva",
  "vehicleForms.new.name": "Nome",
  "vehicleForms.new.namePlaceholder": "Civic 2019",
  "vehicleForms.new.odometer": "Contachilometri attuale ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Registra un tagliando",
  "vehicleForms.log.save": "Salva",
  "vehicleForms.log.error":
    "Non è stato possibile salvare. Quello che hai scritto è ancora qui. Riprova.",
  "vehicleForms.log.what": "Cosa",
  "vehicleForms.log.when": "Quando",
  "vehicleForms.log.today": "Oggi",
  "vehicleForms.log.yesterday": "Ieri",
  "vehicleForms.log.otherDate": "Altra data",
  "vehicleForms.log.odometer": "Contachilometri ({unit})",
  "vehicleForms.log.cost": "Costo (facoltativo)",
  "vehicleForms.log.notes": "Note (facoltativo)",
  "subscribed.title": "Pro è attivo.",
  "subscribed.body": "{vehicle} ora è nel programma. Ti avviseremo prima di ogni intervento, non dopo.",
  "subscribed.unlocked": "Sbloccato anche",
  "subscribed.cta": "Vedi il programma",
};

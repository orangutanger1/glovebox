import type { Fragment } from "./types";

/**
 * French (fr-FR). Register: vous, throughout — French utility apps address the
 * owner formally, and switching to tu mid-app reads as a different product.
 *
 * Terms chosen deliberately:
 * - `service.Inspection` is "Contrôle technique", the name of the legal test. The
 *   dictionary word "inspection" names nothing a French owner is summoned for.
 * - `service.Registration` is "Carte grise". France has had no annual vignette
 *   for private cars since 2001, so there is no recurring road tax to name; the
 *   carte grise (certificat d'immatriculation) is the paperwork an owner actually
 *   names, keeps in the glovebox, and has to redo on a move, a sale or a change
 *   of holder — an invented "taxe" would name a thing that does not exist.
 * - Garage vocabulary, not dictionary vocabulary: vidange, rotation des pneus,
 *   contrôle des freins, bougies d'allumage, filtre à habitacle, balais
 *   d'essuie-glace. "Carnet" (as in carnet d'entretien) carries the English
 *   "records" wherever it appears, because that is the word owners use for it.
 * - Typography: `\u00a0` is the espace insécable, before units, before `:` and
 *   inside « guillemets »; `\u202f` is the narrow one Intl uses to group French
 *   digits, so the example numbers match a formatted odometer.
 * - "with a light on at 70" became "à 130": the sentence means motorway speed,
 *   and 70 mph is not a speed anyone drives in France.
 * - `onboardingB.service.when` is phrased "{service} : c'était quand ?" so the
 *   interpolated service name never has to agree in gender with a verb or
 *   article the template would have to pick blind.
 */
export const fr: Fragment = {
  // evidence
  "evidence.records.label": "historiques perdus, synchros en échec, données impossibles à sortir",
  "evidence.records.answer": "SQLite sur votre téléphone, et tout le carnet ressort en CSV.",

  "evidence.price.label": "le prix, le paywall, ou ce que ça a fini par coûter",
  "evidence.price.answer":
    "Un abonnement, rien d'autre à acheter. Toutes les voitures, tous les relevés.",

  "evidence.account.label": "un compte et une connexion avant que quoi que ce soit fonctionne",
  "evidence.account.answer": "Aucun compte. Il n'y a rien où se connecter.",

  "evidence.crashes.label": "plantages, blocages, et fichiers qui refusent de s'ouvrir",
  "evidence.crashes.answer":
    "Vos relevés vivent dans une base de données sur le téléphone, pas dans un fichier qui refuse de s'ouvrir.",

  // features
  "features.history.title": "Chaque entretien, gardé pour toujours",
  "features.history.subtitle":
    "Date, compteur, coût et notes à chaque passage, conservés tant que vous avez la voiture.",

  "features.due.title": "Échéance par date et par distance",
  "features.due.subtitle":
    "La première des deux : les kilomètres parcourus ou les mois écoulés.",

  "features.reminders.title": "Un rappel par entretien",
  "features.reminders.subtitle": "Le jour de l'échéance, et rien d'autre, jamais.",

  "features.export.title": "Tout exporter en CSV",
  "features.export.subtitle": "Sortez tout votre carnet en tableur quand vous voulez.",

  "features.costs.title": "Voyez ce que ça vous coûte",
  "features.costs.subtitle":
    "Des totaux par véhicule, par entretien et par mois, calculés sur les coûts que vous saisissez.",

  "features.garage.title": "Véhicules illimités",
  "features.garage.subtitle": "Chaque voiture, camionnette et camion que vous avez, au même endroit.",

  "features.intervals.title": "Vos propres intervalles",
  "features.intervals.subtitle":
    "Modifiez n'importe lequel quand le manuel du constructeur ne dit pas la même chose que nos valeurs par défaut.",

  // garage
  "garage.title": "Garage",
  "garage.logService": "Noter un entretien",
  "garage.addVehicle": "Ajouter un véhicule",
  "garage.comingUp": "À venir",
  "garage.quickLog": "Enregistrer en un geste",
  "garage.empty":
    "Aucun véhicule pour l'instant. Ajoutez-en un et Wrenchy commence à tenir son carnet.",
  "garage.storeUnreachable":
    "Impossible de joindre l'App Store. Réessayez avec une meilleure connexion.",

  "garage.badge.overdue": "En retard",
  "garage.badge.dueSoon": "Bientôt",

  "garage.odometer": "Compteur",
  "garage.odometer.notSet": "Non renseigné",

  "garage.over": "{distance} de dépassement",
  "garage.dueNow": "à faire",
  "garage.dueSoon": "bientôt à faire",
  "garage.onSchedule": "à jour",

  "garage.noSchedule": "Pas encore d'échéance",
  "garage.noSchedule.detail": "noté, pas suivi",
  "garage.nothingLogged": "Rien de noté",
  "garage.nothingLogged.detail": "ajoutez un entretien",

  "garage.openHistory": "Ouvrir l'historique",
  "garage.openAndLog": "Ouvrir et noter un entretien",

  // insights
  "insights.title": "Coûts",
  "insights.subtitle": "Ce que le garage a coûté, directement depuis votre carnet.",
  "insights.total.label": "Enregistré à ce jour",
  "insights.total.priced": {
    one: "À partir de {count} entretien chiffré.",
    other: "À partir de {count} entretiens chiffrés.",
  },
  "insights.total.unpriced": {
    one: "{count} autre entretien n’a pas de coût enregistré.",
    other: "{count} autres entretiens n’ont pas de coût enregistré.",
  },
  "insights.byVehicle.title": "Par véhicule",
  "insights.byService.title": "Où ça part",
  "insights.byMonth.title": "12 derniers mois",
  "insights.empty.title": "Aucun coût saisi",
  "insights.empty.body": "Ajoutez un coût en enregistrant un entretien et il apparaîtra ici. Les entretiens passés se modifient aussi.",
  "insights.empty.cta": "Aller à mon garage",
  "insights.open": "Voir les coûts",

  // intervals
  "intervals.title": "Intervalles d'entretien",
  "intervals.intro":
    "À quelle fréquence chaque entretien arrive à échéance. Modifiez-les pour coller à votre voiture, au manuel, au climat où vous roulez, ou à la façon dont vous la sollicitez.",
  "intervals.custom": "PERSO",

  "intervals.untracked": "non suivi",
  "intervals.months": { one: "{count} mois", other: "{count} mois" },
  "intervals.monthsAndDistance": {
    one: "{count} mois · {distance}",
    other: "{count} mois · {distance}",
  },

  "intervals.help":
    "Échéance à la première des deux limites atteinte. Laissez une case vide pour l'ignorer\u00a0: la distance seule ou les mois seuls sont un suivi valable. Videz les deux pour revenir à la valeur par défaut ({default}).",
  "intervals.field.months": "Tous les (mois)",
  "intervals.field.distance": "Tous les ({unit})",
  "intervals.error.positive":
    "Utilisez des nombres entiers supérieurs à zéro, ou laissez une case vide pour l'ignorer.",
  "intervals.save": "Enregistrer",
  "intervals.cancel": "Annuler",

  // language
  "language.title": "Langue",
  "language.intro":
    "Wrenchy suit votre téléphone, sauf si vous choisissez une langue ici. Les noms d'entretien reprennent les mots employés par les garages dans cette langue.",
  "language.system": "Système",

  // layout
  "layout.garage": "Garage",
  "layout.settings": "Réglages",
  "layout.intervals": "Intervalles d'entretien",
  "layout.addVehicle": "Ajouter un véhicule",
  "layout.vehicle": "Véhicule",
  "layout.logService": "Noter un entretien",
  "layout.fatal.retry": "Réessayer",
  "layout.fatal.title": "Wrenchy n'a pas pu ouvrir votre carnet.",
  "layout.fatal.body":
    "Rien n'a été supprimé, et la base a été restaurée à son dernier état correct. Relancez l'app. Si cela se reproduit, contactez le support avant de réinstaller, car c'est la réinstallation qui ferait vraiment perdre le carnet.",

  // offer

  "offer.features.title": "Voilà ce que vous obtenez.",

  "offer.plan.title": "Voici le programme.",
  "offer.plan.subtitle": {
    one: "{count} entretien programmé pour votre {vehicle}.",
    other: "{count} entretiens programmés pour votre {vehicle}.",
  },
  "offer.plan.cta": "Activer les rappels",
  "offer.plan.decline": "Pas maintenant",
  "offer.notify.title": "Ne manquez plus un entretien.",
  "offer.notify.off": "Rappels d\u00e9sactiv\u00e9s",
  "offer.notify.body": "Dernière fois le {date}.",
  "offer.plan.status.due": "À faire",
  "offer.plan.status.soon": "Bientôt",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "Aucun suivi",

  "offer.paywall.title": "Ne ratez plus jamais un entretien.",
  "offer.paywall.title.named": "{name}, ne ratez plus jamais un entretien.",
  "offer.paywall.subtitle": "Chaque entretien et chaque relevé, consignés.",
  "offer.paywall.vehicle": "Consigné",
  "offer.paywall.scheduled": "Suivis",
  "offer.paywall.services": { one: "entretien", other: "entretiens" },
  "offer.paywall.dueNow": "En retard",
  "offer.paywall.nextUp": "Prochaine alerte",
  "offer.paywall.none": "Aucun",
  "offer.paywall.point.tracked.title": "{vehicle} est consignée",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} entretien suivi, par date et par distance",
    other: "{count} entretiens suivis, par date et par distance",
  },
  "offer.paywall.point.due.title": {
    one: "{count} entretien en retard aujourd’hui",
    other: "{count} entretiens en retard aujourd’hui",
  },
  "offer.paywall.point.due.subtitle": "Prochaine alerte {date}",
  "offer.paywall.point.due.noNext": "Aucune alerte nécessaire pour l’instant",
  "offer.paywall.point.history.title": "Un historique complet à la revente",
  "offer.paywall.point.history.subtitle": "Chaque entretien, coût et relevé, conservé pour toujours et exportable.",
  "offer.paywall.point.reminders.title": "Un rappel avant chacun",
  "offer.paywall.point.reminders.subtitle": "Le jour de l’échéance, jamais de relance.",

  "offer.deal.title": "Offre à durée limitée",
  "offer.deal.pct": "{pct}% de réduction",
  "offer.deal.perWeek": "Seulement {price} par semaine",
  "offer.trial.cta": "Profiter de l’offre",
  "offer.trial.decline": "Je préfère payer le plein tarif",
  "offer.trial.gets.reminders": "Rappels avant chaque entretien",
  "offer.trial.gets.due": "Échéance par date et distance",
  "offer.trial.gets.history": "Chaque entretien conservé",
  "offer.trial.gets.costs": "Voyez ce que coûte la voiture",
  "offer.trial.gets.garage": "Véhicules illimités",
  "offer.trial.gets.intervals": "Vos propres intervalles",
  "offer.trial.gets.export": "Tout exporter en CSV",

  "offer.winback.title": "Vous avez arrêté de noter.",
  "offer.winback.decline": "Emmenez-moi juste à mon garage",
  "offer.winback.body":
    "Votre carnet est exactement là où vous l'avez laissé. Rien n'a expiré, rien n'a été supprimé, et rien n'est à reconfigurer.",
  "offer.winback.feedback": "Dites-nous ce qui n'a pas marché",
  "offer.winback.feedbackNote": "Un formulaire court, s'ouvre dans Safari",
  "offer.winback.caption": "Ou retentez le coup : un an de Pro au prix de l’offre. Annulable à tout moment.",

  // onboardingA
  "onboardingA.continue": "Continuer",

  "onboardingA.welcome.headline": "Ne devinez plus la date de votre dernière vidange.",
  "onboardingA.welcome.start": "Commencer",
  "onboardingA.welcome.privacy": "Aucun compte. Rien ne quitte ce téléphone.",

  // The introduction, on the screen before the quiz. The name is read
  // back on both ask screens and in every reminder, and nowhere else.
  "onboardingA.name.title": "Comment doit-on vous appeler ?",
  "onboardingA.name.label": "Votre prénom",
  "onboardingA.name.continue": "Continuer",

  "onboardingA.vehicle.title": "Qu'est-ce que vous conduisez\u00a0?",
  "onboardingA.vehicle.year": "Année",
  "onboardingA.vehicle.make": "Marque",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.model": "Modèle",

  "onboardingA.odometer.title.mi": "Combien de miles au compteur\u00a0?",
  "onboardingA.odometer.title.km": "Combien de kilomètres au compteur\u00a0?",
  "onboardingA.odometer.field": "Compteur ({unit})",
  "onboardingA.odometer.placeholder.mi": "84\u202f210",
  "onboardingA.odometer.placeholder.km": "135\u202f600",
  "onboardingA.odometer.caption": "Un ordre de grandeur suffit.",
  "onboardingA.odometer.required": "Saisis le relevé pour continuer.",

  "onboardingA.drive.title": "Combien roulez-vous avec\u00a0?",
  "onboardingA.drive.legend": "Distance par an ({unit})",
  "onboardingA.drive.low.mi": "Moins de 5\u202f000",
  "onboardingA.drive.low.km": "Moins de 8\u202f000",
  "onboardingA.drive.average.mi": "5\u202f000 à 10\u202f000",
  "onboardingA.drive.average.km": "8\u202f000 à 16\u202f000",
  "onboardingA.drive.high.mi": "10\u202f000 à 15\u202f000",
  "onboardingA.drive.high.km": "16\u202f000 à 24\u202f000",
  "onboardingA.drive.very_high.mi": "Plus de 15\u202f000",
  "onboardingA.drive.very_high.km": "Plus de 24\u202f000",
  "onboardingA.drive.projection": "Environ {distance} à la même époque l'an prochain.",
  "onboardingA.drive.caption": "Une estimation suffit.",

  // onboardingB
  "onboardingB.continue": "Continuer",

  "onboardingB.service.title": "Qu'avez-vous fait faire en dernier\u00a0?",
  "onboardingB.service.subtitle": "À peu près suffit.",
  "onboardingB.service.legend": "Entretien",
  "onboardingB.service.when": "{service}\u00a0: c'était quand\u00a0?",
  "onboardingB.service.whenOther": "Cette intervention, c'était quand\u00a0?",
  "onboardingB.service.whenPending": "C'était quand\u00a0?",
  "onboardingB.service.somethingElse": "Autre chose",
  "onboardingB.service.ago.now": "À l'instant",
  "onboardingB.service.ago.lastMonth": "Le mois dernier",
  "onboardingB.service.ago.months3": "Il y a 3 mois",
  "onboardingB.service.ago.months6": "Il y a 6 mois",
  "onboardingB.service.ago.notSure": "Pas sûr",

  "onboardingB.tracking.title": "Comment suivez-vous ça aujourd'hui\u00a0?",
  "onboardingB.tracking.legend": "Aujourd'hui",
  "onboardingB.tracking.memory": "De mémoire",
  "onboardingB.tracking.receipts": "Les factures dans la voiture",
  "onboardingB.tracking.spreadsheet": "Un tableur",
  "onboardingB.tracking.dealer": "Mon garage s'en occupe",
  "onboardingB.tracking.nothing": "Rien du tout",

  "onboardingB.worry.title": "Qu'est-ce que vous voulez éviter\u00a0?",
  "onboardingB.worry.subtitle": "Cochez tout ce qui s'applique.",
  "onboardingB.worry.bills": "Les factures surprise",
  "onboardingB.worry.missed": "Rater un entretien",
  "onboardingB.worry.records": "Perdre le carnet",
  "onboardingB.worry.resale": "La valeur de revente",
  "onboardingB.worry.upsell": "Payer pour du superflu",

  "onboardingB.analyzing.title": "Calcul des échéances.",
  "onboardingB.analyzing.odometer": "{vehicle} à {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} intervalle d'entretien appliqué",
    other: "{count} intervalles d'entretien appliqués",
  },
  "onboardingB.analyzing.rate": "{distance} par an",
  "onboardingB.analyzing.rateProjected": "{distance} par an, donc {projected} l'an prochain",
  "onboardingB.analyzing.clear": "Rien à traiter aujourd'hui",
  "onboardingB.analyzing.due": {
    one: "{count} demande votre attention, {soon} à venir",
    other: "{count} demandent votre attention, {soon} à venir",
  },
  "onboardingB.analyzing.percent": "{percent}\u202f%",

  // onboardingC
  "onboardingC.back": "Retour",
  "onboardingC.question": "Question {step} / {total}",

  "onboardingC.schedule.title": {
    one: "Un entretien, suivi dès aujourd’hui.",
    other: "{count} entretiens, suivis dès aujourd’hui.",
  },
  "onboardingC.schedule.onWatch": "Suivis",
  "onboardingC.schedule.status.fresh": "Dès aujourd’hui",
  "onboardingC.schedule.line.fresh": "Suivi dès aujourd’hui",
  "onboardingC.results.overdue": {
    one: "Un entretien est déjà en retard.",
    other: "{count} entretiens sont déjà en retard.",
  },
  "onboardingC.results.subtitle": "Votre {vehicle}, {distance} par an.",
  "onboardingC.results.continue": "Continuer",
  "onboardingC.results.onFile": "Au carnet",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "À faire",
  "onboardingC.results.status.soon": "Bientôt",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "Aucun suivi",

  // The two odometer gauges on the payoff page: the reading typed, and where
  // it lands in a year at the stated rate.
  "onboardingC.outlook.odometer": "Aujourd’hui",
  "onboardingC.outlook.projected": "Dans un an",
  "onboardingC.cost.title": "{percent}% des voitures en circulation ont un entretien en retard.",
  "onboardingC.cost.percent": "{percent}%",
  "onboardingC.cost.tireRotations": "Permutation des pneus en retard",
  "onboardingC.cost.oilChanges": "Vidange en retard",
  "onboardingC.cost.tracked": "Wrenchy suit les entretiens dont votre voiture a besoin.",
  "onboardingC.cost.source": "{overdue}. Chiffres américains.",
  "onboardingC.cost.continue": "Continuer",

  "onboardingC.compare.title": "Seul, ou selon un calendrier.",
  "onboardingC.compare.subtitle": "Votre {vehicle}, entretenu des deux façons.",
  "onboardingC.compare.dated": "Entretiens avec une date",
  "onboardingC.compare.remembered": "Entretiens que vous devez retenir",
  "onboardingC.compare.alone": "Seul",
  "onboardingC.compare.withApp": "Avec Wrenchy",
  "onboardingC.compare.ofTotal": "{count} sur {total}",
  "onboardingC.compare.source": "Compté à partir de vos réponses. Aucune moyenne, aucune estimation.",
  "onboardingC.compare.continue": "Continuer",

  "onboardingC.symptoms.next": "Continuer",
  "onboardingC.symptoms.last": "Alors je fais quoi",

  "onboardingC.help.title": "Les trois, c'est le même problème.",
  "onboardingC.help.subtitle": "Rien n'est écrit sous une forme capable de vous prévenir.",
  "onboardingC.help.continue": "Continuer",

  "onboardingC.reviews.title": "Cette app existe à cause de ça.",
  "onboardingC.reviews.subtitle": {
    one: "{count} des {total} avis App Store sur les apps qui font déjà ça est noté une à trois étoiles.",
    other:
      "{count} des {total} avis App Store sur les apps qui font déjà ça sont notés une à trois étoiles.",
  },
  "onboardingC.reviews.continue": "Continuer",
  "onboardingC.reviews.mentioning": "Avis qui mentionnent",

  // pain
  "pain.overdue.legend": "En retard",
  "pain.overdue.headline": {
    one: "Un entretien est déjà en retard",
    other: "{count} entretiens sont déjà en retard",
  },
  "pain.overdue.body": "Sur votre {vehicle}, aujourd'hui. Le voyant s'allume après les dégâts, pas avant.",
  "pain.overdue.fix": "Décompté par date et par distance, signalé avant de passer dans le rouge.",

  "pain.blind.legend": "Aucune trace",
  "pain.blind.headline": {
    one: "{count} entretien sur {total} n'a rien au carnet",
    other: "{count} entretiens sur {total} n'ont rien au carnet",
  },
  "pain.blind.body": "Tant que rien ne dit le contraire, chacune d'elles est comptée comme due.",
  "pain.blind.fix": "Enregistrez-en une et tout son calendrier démarre. Trente secondes, une fois.",

  "pain.memory.legend": "De mémoire",
  "pain.memory.headline": "La seule copie est dans votre tête",
  "pain.memory.body": "La mémoire tient jusqu'à ce qu'on vous demande « c'était quand exactement ? » au comptoir.",
  "pain.memory.fix": "Écrit sur ce téléphone et gardé là. Aucun compte derrière lequel le perdre.",

  "pain.nothing.legend": "Non suivi",
  "pain.nothing.headline": "Rien n'est écrit sur cette voiture",
  "pain.nothing.body": "La voiture tient le seul relevé, et sa façon de vous le dire, c'est la panne.",
  "pain.nothing.fix": "Un geste enregistre un entretien. L'historique existe alors ailleurs que dans la voiture.",

  "pain.receipts.legend": "Dans la boîte à gants",
  "pain.receipts.headline": "Une boîte à gants n'est pas un index",
  "pain.receipts.body": "Les factures prouvent ce qui a été fait. Elles ne disent jamais ce qui vient ensuite.",
  "pain.receipts.fix": "Les mêmes factures en lignes datées, à trier, chercher et exporter.",

  "pain.spreadsheet.legend": "Dans un tableur",
  "pain.spreadsheet.headline": "Un tableur ne peut pas vous tapoter l'épaule",
  "pain.spreadsheet.body": "Il garde très bien l'historique. Il ne s'ouvre simplement jamais tout seul pour vous prévenir.",
  "pain.spreadsheet.fix": "Les mêmes lignes, plus une notification le jour où un entretien tombe.",

  "pain.dealer.legend": "Au garage",
  "pain.dealer.headline": "Le carnet du garage appartient au garage",
  "pain.dealer.body": "Complet jusqu'à ce que vous changiez de garage, déménagiez ou vendiez, et visible pour eux, pas pour vous.",
  "pain.dealer.fix": "Votre propre copie, sur votre propre téléphone, exportable quand vous voulez.",

  "pain.bills.legend": "La facture",
  "pain.bills.headline": "Un entretien reporté n'est pas de l'argent économisé",
  "pain.bills.body": "C'est le même argent plus tard, avec une dépanneuse devant.",
  "pain.bills.fix": "Chaque intervalle décompté, pour que le petit travail reste un petit travail.",

  "pain.missed.legend": "L'oubli",
  "pain.missed.headline": "Rien ne vous prévient avant qu'il soit tard",
  "pain.missed.body": "Personne ne saute un entretien exprès. On le saute un mardi ordinaire.",
  "pain.missed.fix": "Une notification par entretien, le jour où il tombe. Rien d'autre.",

  "pain.records.legend": "La preuve",
  "pain.records.headline": "Un entretien non prouvé est un entretien non fait",
  "pain.records.body": "Une garantie, une revente, un litige avec un garage : chacun réclame le relevé.",
  "pain.records.fix": "Un carnet daté, et un tableur dès que vous en avez besoin.",

  "pain.resale.legend": "Revente",
  "pain.resale.headline": "Un historique complet vaut mieux qu'un historique propre",
  "pain.resale.body": "L'acheteur décote ce que vous ne pouvez pas montrer. Le concessionnaire aussi.",
  "pain.resale.fix": "Exportez tout l'historique et remettez-le.",

  "pain.upsell.legend": "Le comptoir",
  "pain.upsell.headline": "Ils connaissent votre historique. Vous, non.",
  "pain.upsell.body": "Pas une question à deviner pendant qu'on vous fait un devis.",
  "pain.upsell.fix": "La date et le kilométrage, sortis au comptoir en deux gestes.",

  "pain.vehicleFallback": "voiture",

  // plan
  "plan.line.nothing": "Rien au carnet",
  "plan.line.about": "vers le {date}",
  "plan.line.noInterval": "Aucun intervalle défini",

  // service
  "service.Oil Change": "Vidange",
  "service.Tire Rotation": "Rotation des pneus",
  "service.Brake Inspection": "Contrôle des freins",
  "service.Air Filter": "Filtre à air",
  "service.Cabin Air Filter": "Filtre à habitacle",
  "service.Wiper Blades": "Balais d'essuie-glace",
  "service.Battery Check": "Contrôle de la batterie",
  "service.Coolant Flush": "Liquide de refroidissement",
  "service.Transmission Fluid": "Huile de boîte de vitesses",
  "service.Spark Plugs": "Bougies d'allumage",
  "service.Registration": "Carte grise",
  "service.Inspection": "Contrôle technique",
  "service.Other": "Autre",

  // settings
  "settings.title": "Réglages",
  "settings.privacy":
    "Votre carnet vit sur ce téléphone uniquement. Aucun compte, aucun serveur. Export à tout moment, parce que l'export n'est jamais bloqué.",
  "settings.section.data": "Données",
  "settings.section.reminders": "Rappels",
  "settings.section.membership": "Abonnement",
  "settings.section.preferences": "Préférences",

  "settings.export": "Exporter tout le carnet (CSV)",
  "settings.export.error": "Impossible d'ouvrir la feuille de partage. Votre carnet est inchangé.",

  "settings.intervals": "Intervalles d'entretien",


  // `{unit}`, `{from}` and `{to}` arrive as the literal abbreviations "mi"/"km",
  // so they are left alone; the 50 000 reading keeps its from-unit figure and
  // only its grouping becomes French.
  "settings.language": "Langue\u00a0: {language}",
  "settings.units": "Unités\u00a0: {unit}",
  "settings.units.title": "Passer en {unit}\u00a0?",
  "settings.units.body":
    "Chaque relevé de compteur et chaque intervalle enregistrés seront convertis de {from} en {to}. Un relevé de 50\u202f000\u00a0{from} devient {example}.",
  "settings.units.cancel": "Annuler",
  "settings.units.confirm": "Convertir",

  "settings.reminders.enable": "Activer les rappels",
  "settings.reminders.blocked": "Rappels bloqués, ouvrez les Réglages iOS",
  "settings.reminders.none": "Rappels activés, rien à faire pour l'instant",
  "settings.reminders.on": {
    one: "Rappels activés, {count} programmé",
    other: "Rappels activés, {count} programmés",
  },
  "settings.reminders.onNext": {
    one: "Rappels activés, {count} programmé, prochain le {date}",
    other: "Rappels activés, {count} programmés, prochain le {date}",
  },
  "settings.reminders.scheduled": "Rappels programmés.",
  "settings.reminders.denied": "Rappels refusés. Vous pouvez les activer dans les Réglages iOS.",
  "settings.reminders.error": "Impossible de demander l'autorisation de notification.",
  "settings.reminders.openSettings":
    "Ouvrez Réglages iOS › Wrenchy › Notifications pour réactiver les rappels.",

  "settings.manage": "Gérer l'abonnement",
  "settings.manage.error":
    "Impossible d'ouvrir les réglages d'abonnement. Réessayez avec une meilleure connexion.",
  "settings.upgrade": "Passer à Pro",
  "settings.restore": "Restaurer les achats",
  "settings.restore.done": "Pro restauré.",
  "settings.restore.none": "Aucun achat trouvé.",
  "settings.store.error":
    "Impossible de joindre l'App Store. Réessayez avec une meilleure connexion.",
  "settings.pro.on": "Pro est actif. Merci.",
  "settings.offer.applied": "Cette offre est appliquée. Rien d'autre à faire.",

  "settings.replay": "Revoir l'intro",
  "settings.replay.title": "Revoir l'intro\u00a0?",
  "settings.replay.body":
    "Vos véhicules et votre carnet sont conservés. Refaire le parcours ajoute un véhicule de plus, que vous pourrez supprimer ensuite.",
  "settings.replay.cancel": "Annuler",
  "settings.replay.confirm": "Revoir",

  // system
  "system.notify.title": "{service} à faire",
  "system.notify.title.named": "{name}, {service} à faire",
  "system.notify.body": "{vehicle} · Dernière fois le {date}.",
  // The two nudges an unfinished onboarding gets, two hours and a day
  // after the user walked away from it.
  "system.resume.first.title": "Votre programme est presque prêt",
  "system.resume.first.title.named": "{name}, presque prêt",
  "system.resume.first.body": "{vehicle} · Encore une minute et chaque date d’entretien est fixée.",
  "system.resume.second.title": "Reprenez où vous en étiez",
  "system.resume.second.title.named": "{name}, reprenez où vous en étiez",
  "system.resume.second.body": "{vehicle} · Tout ce que vous avez saisi est enregistré. Une minute et c’est fini.",
  "system.resume.third.title": "Votre programme vous attend",
  "system.resume.third.title.named": "{name}, votre programme vous attend",
  "system.resume.third.body": "{vehicle} · Terminez la configuration et voyez ce qui est dû, et quand.",
  "system.resume.fourth.title": "Deux minutes pour un programme",
  "system.resume.fourth.title.named": "{name}, deux minutes suffisent",
  "system.resume.fourth.body": "{vehicle} · Chaque intervalle daté et suivi. Terminez aujourd’hui.",
  "system.resume.fifth.title": "Toujours enregistré, toujours prêt",
  "system.resume.fifth.title.named": "{name}, toujours prêt",
  "system.resume.fifth.body": "{vehicle} · Votre configuration est là où vous l’avez laissée. Une minute et c’est fait.",
  "system.resume.sixth.title": "Votre voiture mérite un programme",
  "system.resume.sixth.title.named": "{name}, votre voiture mérite mieux",
  "system.resume.sixth.body": "{vehicle} · La plupart terminent en moins de deux minutes. Vous êtes à mi-chemin.",
  "system.resume.seventh.title": "Votre configuration est toujours là",
  "system.resume.seventh.title.named": "{name}, tout est toujours là",
  "system.resume.seventh.body": "{vehicle} · Quand vous voulez, une minute et c’est terminé.",
  "system.resume.ask.first.title": "Votre programme est prêt",
  "system.resume.ask.first.title.named": "{name}, votre programme est prêt",
  "system.resume.ask.first.body": {
    one: "{vehicle} · 1 entretien à surveiller. Pro s’en charge à partir d’ici.",
    other: "{vehicle} · {count} entretiens à surveiller. Pro s’occupe de chacun.",
  },
  "system.resume.ask.first.body.zero": "{vehicle} · Chaque entretien daté et suivi. Pro s’en charge à partir d’ici.",
  "system.resume.ask.second.title": "À un geste d’être couvert",
  "system.resume.ask.second.title.named": "{name}, à un geste d’être couvert",
  "system.resume.ask.second.body": "{vehicle} · Votre programme est prêt et enregistré. Un geste et Pro le pilote.",
  "system.resume.ask.third.title": "Votre programme vous attend",
  "system.resume.ask.third.title.named": "{name}, votre programme vous attend",
  "system.resume.ask.third.body": "{vehicle} · Rien à ressaisir. Un geste et chaque entretien est suivi.",
  "system.resume.ask.fourth.title": "Rien n’échappe à Pro",
  "system.resume.ask.fourth.title.named": "{name}, rien n’échappe à Pro",
  "system.resume.ask.fourth.body": "{vehicle} · Programme enregistré. La plupart repèrent un entretien oublié le premier mois.",
  "system.resume.ask.fifth.title": "Votre programme est toujours là",
  "system.resume.ask.fifth.title.named": "{name}, votre programme est là",
  "system.resume.ask.fifth.body": "{vehicle} · Un geste et Pro reprend chaque date d’entretien à partir d’ici.",
  "system.resume.ask.sixth.title": "Le compteur continue de tourner",
  "system.resume.ask.sixth.title.named": "{name}, le compteur tourne toujours",
  "system.resume.ask.sixth.body": "{vehicle} · Votre programme est prêt à suivre. Un geste et vous êtes couvert.",
  "system.resume.ask.seventh.title": "Un mois plus tard, toujours prêt",
  "system.resume.ask.seventh.title.named": "{name}, toujours prêt",
  "system.resume.ask.seventh.body": "{vehicle} · Votre programme est enregistré et vous attend. Un geste et Pro prend le relais.",

  "system.notify.when.today": "Aujourd\u2019hui",
  "system.notify.when.tomorrow": "Demain",
  "system.notify.when.days": { one: "Dans {count} jour", other: "Dans {count} jours" },
  "system.notify.when.months": { one: "Dans {count} mois", other: "Dans {count} mois" },

  "system.csv.header.vehicle": "Véhicule",
  "system.csv.header.service": "Entretien",
  "system.csv.header.date": "Date",
  "system.csv.header.odometer": "Compteur ({unit})",
  "system.csv.header.cost": "Coût",
  "system.csv.header.notes": "Notes",
  "system.csv.header.deleted": "Supprimé",
  // A CSV cell value, not copy: it stays the token a spreadsheet filters on.
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Essayer Pro",
  "system.quickaction.trial.subtitle": "Un an de Pro au prix de l’offre",
  "system.quickaction.feedback.title": "Envoyer un retour",
  "system.quickaction.feedback.subtitle": "Dites-nous ce qui n'a pas marché",

  "system.vehicle.fallback": "Ma voiture",

  // unit
  "unit.mi": "{value}\u00a0mi",
  "unit.km": "{value}\u00a0km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  // vehicle
  "vehicle.title": "Véhicule",

  "vehicle.body.sedan": "Berline",
  "vehicle.body.hatchback": "Berline compacte",
  "vehicle.body.coupe": "Coupé",
  "vehicle.body.wagon": "Break",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pick-up",
  "vehicle.body.van": "Monospace",

  "vehicle.odometer": "Compteur",
  "vehicle.odometer.notSet": "Non renseigné",
  "vehicle.lastService": "Dernier entretien",
  "vehicle.lastService.none": "Aucun pour l'instant",

  "vehicle.due": "À faire",
  "vehicle.history": "Historique",
  "vehicle.history.empty":
    "Aucun entretien noté. Notez la dernière chose que vous avez fait faire.",
  "vehicle.recalls.legend": "Rappels de sécurité",
  "vehicle.recalls.found": {"one": "{count} rappel concerne la {vehicle}", "other": "{count} rappels concernent la {vehicle}"},
  "vehicle.recalls.none": "Aucun rappel sur la liste de la NHTSA pour la {vehicle}.",
  "vehicle.recalls.parkIt": "Ne roulez pas avant la réparation",
  "vehicle.recalls.risk": "Le risque",
  "vehicle.recalls.remedy": "La réparation",
  "vehicle.recalls.details": "Détails",
  "vehicle.recalls.hide": "Masquer",
  "vehicle.recalls.check": "Vérifiez votre NIV sur nhtsa.gov",
  "vehicle.recalls.note": "Liste publique de rappels de la NHTSA, pour l’année-modèle — pas pour le NIV de votre voiture. Seuls la marque, le modèle et l’année quittent ce téléphone.",

  "vehicle.over": "{distance} de dépassement",
  "vehicle.dueOn": "à faire le {date}",
  "vehicle.dueNow": "à faire maintenant",
  "vehicle.dueSoon": "bientôt à faire",

  "vehicle.badge.overdue": "En retard",
  "vehicle.badge.soon": "Bientôt",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Supprimer",
  "vehicle.serviceDeleted": "Entretien supprimé",
  "vehicle.undo": "Annuler",
  "vehicle.logService": "Noter un entretien",

  "vehicle.edit.title": "Modifier le véhicule",
  "vehicle.edit.odometerHint": "Un relevé saisi ici remplace celui du véhicule, même s’il est plus bas. Laissez vide pour le conserver.",
  "vehicle.deleteVehicle": "Supprimer le véhicule",
  "vehicle.delete.title": "Supprimer {name}\u00a0?",
  "vehicle.delete.body":
    "Il quitte votre garage avec son historique d'entretien. Ce qui est déjà exporté reste dans ce fichier.",
  "vehicle.delete.cancel": "Annuler",
  "vehicle.delete.confirm": "Supprimer",

  // vehicleForms
  "vehicleForms.new.title": "Ajouter un véhicule",
  "vehicleForms.new.save": "Enregistrer",
  "vehicleForms.new.name": "Nom",
  "vehicleForms.new.namePlaceholder": "Civic 2019",
  "vehicleForms.new.odometer": "Compteur actuel ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Noter un entretien",
  "vehicleForms.log.save": "Enregistrer",
  "vehicleForms.log.error": "Impossible d'enregistrer. Votre saisie est toujours là. Réessayez.",
  "vehicleForms.number.invalid": "Ce nombre n’a pas pu être lu. Chiffres uniquement — 84 210 ou 45,5.",
  "vehicleForms.log.what": "Quoi",
  "vehicleForms.log.when": "Quand",
  "vehicleForms.log.today": "Aujourd'hui",
  "vehicleForms.log.yesterday": "Hier",
  "vehicleForms.log.otherDate": "Autre date",
  "vehicleForms.log.odometer": "Compteur ({unit})",
  "vehicleForms.log.cost": "Coût (facultatif)",
  "vehicleForms.log.notes": "Notes (facultatif)",
  "subscribed.title": "Pro est activé.",
  "subscribed.body": "{vehicle} est désormais au programme. Vous serez prévenu avant chaque entretien, pas après.",
  "subscribed.unlocked": "Maintenant actif",
  "subscribed.cta": "Voir le programme",
  "subscribed.catchup.title": "Complétez l’historique.",
  "subscribed.catchup.body": "À quand remonte chacun de ces entretiens ? Une estimation suffit : « Aucun suivi » devient une vraie échéance.",
  "subscribed.catchup.overYear": "Il y a plus d’un an",
  "subscribed.catchup.save": "Enregistrer l’historique",
  "subscribed.catchup.skip": "Plus tard",
  "fuel.title": "Carburant",
  "fuel.log": "Noter un plein",
  "fuel.seeAll": "Voir tous les pleins",
  "fuel.summary.last": "Dernier plein",
  "fuel.summary.average": "Moyenne",
  "fuel.summary.needFirst": "Note un plein et il apparaît ici.",
  "fuel.summary.needSecond": "Encore un plein complet et ton premier chiffre arrive.",
  "fuel.history.title": "Pleins",
  "fuel.history.empty": "Aucun plein noté pour l’instant.",
  "fuel.row.partial": "Plein partiel",
  "fuel.deleted": "Plein supprimé",
  "fuel.undo": "Annuler",
  "fuel.swipe.delete": "Supprimer",
  "fuel.form.title": "Noter un plein",
  "fuel.form.odometer": "Compteur ({unit})",
  "fuel.form.volume": "Carburant ({unit})",
  "fuel.form.cost": "Total payé (facultatif)",
  "fuel.form.full": "Réservoir rempli",
  "fuel.form.fullHint": "Laisse activé, sauf si tu n’as pas fait le plein complet.",
  "fuel.form.when": "Quand",
  "fuel.form.today": "Aujourd’hui",
  "fuel.form.yesterday": "Hier",
  "fuel.form.otherDate": "Un autre jour",
  "fuel.form.save": "Enregistrer le plein",
  "fuel.form.error": "Ce plein n’a pas pu être enregistré.",
  "fuel.form.needOdometer": "Indique le compteur et la quantité de carburant.",
  "fuel.form.sameOdometer": "C’est le relevé de ton dernier plein. Saisis ce que le compteur affiche maintenant.",
  "fuel.card.title": "Carburant",
  "fuel.card.spend": "Dépenses carburant",
  "fuel.card.perDistance": "Coût pour 100 {unit}",
  "fuel.card.efficiency": "Consommation",
  "fuel.card.months": "12 derniers mois",
  "fuel.card.fills": { one: "D’après {count} plein chiffré.", other: "D’après {count} pleins chiffrés." },
  "fuel.card.unpriced": { one: "{count} autre plein n’a pas de coût noté.", other: "{count} autres pleins n’ont pas de coût noté." },
  "fuel.card.locked.title": "Vois ce que le carburant te coûte",
  "fuel.card.locked.body": "Tes pleins sont déjà notés. Pro en tire la consommation, les dépenses et le coût par distance.",
  "fuel.card.locked.cta": "Débloquer l’analyse carburant",
  "fuel.card.empty": "Note deux pleins complets et ceci se remplit.",
  "unit.gal": "{value} gal",
  "unit.litre": "{value} L",
  "unit.gal.label": "gal",
  "unit.litre.label": "L",
  "unit.mpg": "{value} mpg",
  "unit.l100km": "{value} L/100km",
  "unit.mpg.label": "mpg",
  "unit.l100km.label": "L/100km",
  "system.csv.fuel.volume": "Carburant ({unit})",
  "system.csv.fuel.full": "Plein complet",
  "system.csv.cell.yes": "Oui",
  "system.csv.cell.no": "Non",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Fermer",
  "paywall.period.week": "Hebdomadaire",
  "paywall.period.month": "Mensuel",
  "paywall.period.year": "Annuel",
  "paywall.per.week": "par semaine",
  "paywall.per.month": "par mois",
  "paywall.per.year": "par an",
  "paywall.billed.month": "facturé {price} par mois",
  "paywall.billed.year": "facturé {price} par an",
  "paywall.save": "Économisez {pct}%",
  "paywall.intro.label": "Votre première semaine",
  "paywall.cta.week": "Continuer en hebdomadaire",
  "paywall.cta.month": "Continuer en mensuel",
  "paywall.cta.year": "Continuer en annuel",
  "paywall.legal.week": "Renouvelé à {price} par semaine. Annulable à tout moment.",
  "paywall.legal.month": "Renouvelé à {price} par mois. Annulable à tout moment.",
  "paywall.legal.year": "Renouvelé à {price} par an. Annulable à tout moment.",
  "paywall.terms": "Conditions",
  "paywall.privacy": "Confidentialité",
  "paywall.restore": "Restaurer",
  "paywall.included": "Inclus dans Pro",
  "paywall.loading": "Chargement des prix",
  "paywall.retry": "Réessayer",
  "paywall.review.quote": 
    "Compared to other apps I tried like MyAutoLog, Carfax, or what have you not, this app absolutely surpasses them all in terms of functionality, design, and ease of use.",
  "paywall.review.name": "Tracy D.",
  // survey
  "survey.source.title": "Comment nous as-tu connus ?",
  "survey.source.tiktok": "TikTok",
  "survey.source.instagram": "Instagram",
  "survey.source.youtube": "YouTube",
  "survey.source.app_store": "Recherche sur l'App Store",
  "survey.source.friend": "Un ami ou un proche",
  "survey.source.other": "Ailleurs",
  "survey.objection.title": "Qu'est-ce qui t'a retenu ?",
  "survey.objection.subtitle": "Un seul appui. Ça nous dit quoi améliorer.",
  "survey.objection.price": "C'est trop cher",
  "survey.objection.try_first": "Je veux d'abord essayer",
  "survey.objection.browsing": "Je regarde juste",
  "survey.objection.no_car": "Je n'ai pas de voiture",
  "survey.objection.other": "Autre chose",
  "survey.objection.skip": "Passer",
};

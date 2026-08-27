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
  "evidence.records.answer": "SQLite sur votre téléphone. Export CSV, gratuit pour toujours.",

  "evidence.price.label": "le prix, le paywall, ou ce que ça a fini par coûter",
  "evidence.price.answer": "La version gratuite est une vraie app. Une voiture, historique illimité.",

  "evidence.account.label": "un compte et une connexion avant que quoi que ce soit fonctionne",
  "evidence.account.answer": "Aucun compte. Il n'y a rien où se connecter.",

  "evidence.crashes.label": "plantages, blocages, et fichiers qui refusent de s'ouvrir",
  "evidence.crashes.answer": "Les lignes supprimées sont marquées, jamais effacées.",

  // features
  "features.history.title": "Chaque entretien, gardé pour toujours",
  "features.history.subtitle":
    "Date, compteur, coût et notes, les lignes supprimées étant marquées plutôt qu'effacées.",

  "features.due.title": "Échéance par date et par distance",
  "features.due.subtitle":
    "La première des deux, comptée à partir des intervalles de chaque entretien.",

  "features.reminders.title": "Un rappel par entretien",
  "features.reminders.subtitle": "Le jour de l'échéance, et rien d'autre, jamais.",

  "features.export.title": "Tout exporter en CSV",
  "features.export.subtitle":
    "Gratuit pour toujours et pour tout le monde, pour que votre carnet ne soit jamais l'otage d'un abonnement.",

  "features.garage.title": "Plus d'un véhicule",
  "features.garage.subtitle": "Tout le garage, chacun avec son propre suivi.",

  "features.intervals.title": "Vos propres intervalles",
  "features.intervals.subtitle":
    "Modifiez n'importe lequel quand le manuel du constructeur ne dit pas la même chose que nos valeurs par défaut.",

  // garage
  "garage.title": "Garage",
  "garage.logService": "Noter un entretien",
  "garage.addVehicle": "Ajouter un véhicule",
  "garage.empty":
    "Aucun véhicule pour l'instant. Ajoutez-en un et Wrenchy commence à tenir son carnet.",
  "garage.storeUnreachable":
    "Impossible de joindre l'App Store. Réessayez avec une meilleure connexion.",

  "garage.badge.overdue": "En retard",
  "garage.badge.dueSoon": "Bientôt",

  "garage.odometer": "Compteur",
  "garage.odometer.notSet": "Non renseigné",
  "garage.odometer.estimated": "Compteur (est.)",

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
  "layout.fatal.title": "Wrenchy n'a pas pu ouvrir votre carnet.",
  "layout.fatal.body":
    "Rien n'a été supprimé, et la base a été restaurée à son dernier état correct. Relancez l'app. Si cela se reproduit, contactez le support avant de réinstaller, car c'est la réinstallation qui ferait vraiment perdre le carnet.",

  // offer
  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratuit",

  "offer.features.title": "Voilà ce que vous obtenez.",
  "offer.features.subtitle":
    "Tout tient dans un seul fichier sur ce téléphone, sans compte et sans serveur.",

  "offer.plan.title": "Voici le programme.",
  "offer.plan.subtitle": {
    one: "{count} entretien programmé pour votre {vehicle}, compté par date et par distance.",
    other: "{count} entretiens programmés pour votre {vehicle}, comptés par date et par distance.",
  },
  "offer.plan.cta": "Activer les rappels",
  "offer.plan.decline": "Pas maintenant",
  "offer.plan.status.due": "À faire",
  "offer.plan.status.soon": "Bientôt",
  "offer.plan.status.ok": "OK",
  "offer.plan.note": "Une notification par entretien, le jour de l'échéance.",
  "offer.plan.noteMore": {
    one: "Plus {count} autre plus loin, et une notification par entretien le jour de l'échéance.",
    other:
      "Plus {count} autres plus loin, et une notification par entretien le jour de l'échéance.",
  },

  "offer.paywall.title": "Les voitures ne préviennent pas. Ceci, oui.",
  "offer.paywall.subtitle":
    "Chaque entretien et chaque relevé du compteur, consignés. Le garagiste voit un carnet, pas une supposition.",
  "offer.paywall.cta": "Consigner ma voiture",
  "offer.paywall.vehicle": "Consigné",
  "offer.paywall.scheduled": "Suivis",
  "offer.paywall.services": { one: "entretien", other: "entretiens" },
  "offer.paywall.dueNow": "En retard",
  "offer.paywall.nextUp": "Prochaine alerte",
  "offer.paywall.none": "Aucun",
  "offer.paywall.caption":
    "Tout ce que vous venez de configurer est déjà enregistré sur ce téléphone. Pas de compte, pas de serveur, rien n’est envoyé.",

  "offer.trial.title": { one: "Essayez {count} jour.", other: "Essayez {count} jours." },
  "offer.trial.subtitle": {
    one: "Prenez {count} jour de Pro pour rien et décidez quand votre voiture vous aura vraiment dit quelque chose.",
    other:
      "Prenez {count} jours de Pro pour rien et décidez quand votre voiture vous aura vraiment dit quelque chose.",
  },
  "offer.trial.cta": {
    one: "Profiter de {count} jour gratuit",
    other: "Profiter de {count} jours gratuits",
  },
  "offer.trial.decline": "Non merci, montrez-moi l'app gratuite",
  "offer.trial.caption": "Résiliez dans les Réglages avant la fin et vous ne payez rien.",

  "offer.winback.title": "Vous avez arrêté de noter.",
  "offer.winback.decline": "Emmenez-moi juste à mon garage",
  "offer.winback.body":
    "Votre carnet est exactement là où vous l'avez laissé. Rien n'a expiré, rien n'a été supprimé, et rien n'est à reconfigurer.",
  "offer.winback.feedback": "Dites-nous ce qui n'a pas marché",
  "offer.winback.feedbackNote": "Un formulaire court, s'ouvre dans Safari",
  "offer.winback.caption": {
    one: "Ou retentez le coup\u00a0: {count} jour de Pro, gratuit. Résiliez avant la fin et vous ne payez rien.",
    other:
      "Ou retentez le coup\u00a0: {count} jours de Pro, gratuits. Résiliez avant la fin et vous ne payez rien.",
  },

  // onboardingA
  "onboardingA.continue": "Continuer",

  "onboardingA.welcome.headline": "Ne devinez plus la date de votre dernière vidange.",
  "onboardingA.welcome.start": "Commencer",
  "onboardingA.welcome.privacy":
    "Tout reste sur ce téléphone, sans compte et sans rien à déconnecter.",

  "onboardingA.vehicle.title": "Qu'est-ce que vous conduisez\u00a0?",
  "onboardingA.vehicle.year": "Année",
  "onboardingA.vehicle.makeOptional": "Marque (facultatif)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",
  "onboardingA.vehicle.saved":
    "Enregistré sous «\u00a0{name}\u00a0», et vous pourrez le renommer plus tard.",
  "onboardingA.vehicle.modelOptional": "Modèle (facultatif)",
  "onboardingA.vehicle.hint":
    "L'année suffit pour commencer. La marque et le modèle servent seulement à ce que les rappels nomment la voiture.",

  "onboardingA.odometer.title.mi": "Combien de miles au compteur\u00a0?",
  "onboardingA.odometer.title.km": "Combien de kilomètres au compteur\u00a0?",
  "onboardingA.odometer.field": "Compteur ({unit})",
  "onboardingA.odometer.placeholder.mi": "84\u202f210",
  "onboardingA.odometer.placeholder.km": "135\u202f600",
  "onboardingA.odometer.caption":
    "Un ordre de grandeur suffit, et c'est ce qui date les entretiens dont l'échéance se compte en distance.",
  "onboardingA.odometer.later": "Je l'ajouterai plus tard",

  "onboardingA.drive.title": "Combien roulez-vous avec\u00a0?",
  "onboardingA.drive.subtitle":
    "À peu près, puisque c'est ce chiffre qui transforme un intervalle de distance en date.",
  "onboardingA.drive.legend": "Distance par an ({unit})",
  "onboardingA.drive.low.mi": "Moins de 5\u202f000",
  "onboardingA.drive.low.km": "Moins de 8\u202f000",
  "onboardingA.drive.average.mi": "5\u202f000 à 10\u202f000",
  "onboardingA.drive.average.km": "8\u202f000 à 16\u202f000",
  "onboardingA.drive.high.mi": "10\u202f000 à 15\u202f000",
  "onboardingA.drive.high.km": "16\u202f000 à 24\u202f000",
  "onboardingA.drive.very_high.mi": "Plus de 15\u202f000",
  "onboardingA.drive.very_high.km": "Plus de 24\u202f000",
  "onboardingA.drive.projection":
    "À ce rythme, cette voiture affichera environ {distance} à la même époque l'an prochain.",
  "onboardingA.drive.caption":
    "Sert à dater les entretiens dont l'échéance se compte en distance plutôt qu'au calendrier.",

  // onboardingB
  "onboardingB.continue": "Continuer",

  "onboardingB.service.title": "Qu'avez-vous fait faire en dernier\u00a0?",
  "onboardingB.service.subtitle": "À peu près suffit, vous pourrez corriger plus tard.",
  "onboardingB.service.legend": "Entretien",
  "onboardingB.service.caption": "Choisissez-en un, le reste se note quand vous voulez.",
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
  "onboardingB.tracking.subtitle": "Quoi que ce soit, c'est déjà plus que la plupart des gens.",
  "onboardingB.tracking.legend": "Aujourd'hui",
  "onboardingB.tracking.caption":
    "Quel que soit votre choix, Wrenchy exporte gratuitement en CSV tout ce que vous notez.",
  "onboardingB.tracking.memory": "De mémoire",
  "onboardingB.tracking.receipts": "Les factures dans la voiture",
  "onboardingB.tracking.spreadsheet": "Un tableur",
  "onboardingB.tracking.dealer": "Mon garage s'en occupe",
  "onboardingB.tracking.nothing": "Rien du tout",

  "onboardingB.worry.title": "Qu'est-ce que vous voulez éviter\u00a0?",
  "onboardingB.worry.subtitle":
    "Cochez tout ce qui s'applique, puisque cela décide de ce que l'app met devant vous.",
  "onboardingB.worry.caption":
    "Dernière question, et l'écran suivant parle de votre voiture plutôt que de l'app.",
  "onboardingB.worry.bills": "Les factures surprise",
  "onboardingB.worry.missed": "Rater un entretien",
  "onboardingB.worry.records": "Perdre le carnet",
  "onboardingB.worry.resale": "La valeur de revente",
  "onboardingB.worry.upsell": "Payer pour du superflu",
  "onboardingB.worry.optional":
    "Tout est facultatif. Passez, et l'écran suivant se construit sur votre voiture seule.",

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
  "onboardingB.analyzing.done": "Terminé",
  "onboardingB.analyzing.progress": "Relevé {index} sur {total}",

  // onboardingC
  "onboardingC.back": "Retour",
  "onboardingC.question": "Question {step} / {total}",

  "onboardingC.results.overdue": {
    one: "Un entretien est déjà en retard.",
    other: "{count} entretiens sont déjà en retard.",
  },
  "onboardingC.results.noneLogged": "Rien de ce que vous avez noté n'est en retard.",
  "onboardingC.results.noneYet": "Rien n'est en retard pour l'instant.",
  "onboardingC.results.clear": "Rien n'est en retard, et rien n'approche.",
  "onboardingC.results.subtitle":
    "Calculé pour votre {vehicle} d'après {distance} par an et ce que vous avez noté.",
  "onboardingC.results.continue": "Continuer",
  "onboardingC.results.dueNow": "À faire",
  "onboardingC.results.soon": "Bientôt",
  "onboardingC.results.onFile": "Au carnet",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "À faire",
  "onboardingC.results.status.soon": "Bientôt",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.next":
    "La prochaine tombe le {date}, à la première des deux limites atteinte, date ou distance.",
  "onboardingC.results.countdown":
    "Chaque entretien est décompté par date et par distance, la première des deux l'emporte.",

  "onboardingC.symptoms.next": "Continuer",
  "onboardingC.symptoms.last": "Alors je fais quoi",

  "onboardingC.help.title": "Les trois, c'est le même problème.",
  "onboardingC.help.subtitle":
    "Rien n'est écrit sous une forme capable de vous prévenir, et c'est tout ce que fait Wrenchy.",
  "onboardingC.help.continue": "Continuer",

  "onboardingC.reviews.title": "Cette app existe à cause de ça.",
  "onboardingC.reviews.subtitle": {
    one: "{count} des {total} avis App Store sur les {apps} apps qui font déjà ça est noté une à trois étoiles.",
    other:
      "{count} des {total} avis App Store sur les {apps} apps qui font déjà ça sont notés une à trois étoiles.",
  },
  "onboardingC.reviews.continue": "Continuer",
  "onboardingC.reviews.scroll": "Faites défiler pour lire les quatre",
  "onboardingC.reviews.mentioning": "Avis qui mentionnent",

  // pain
  "pain.overdue.legend": "En retard",
  "pain.overdue.headline": {
    one: "Un entretien est déjà en retard",
    other: "{count} entretiens sont déjà en retard",
  },
  "pain.overdue.body":
    "Sur votre {vehicle}, aujourd'hui. Rien au tableau de bord ne va vous le dire, parce que le voyant s'allume après les dégâts et non avant.",
  "pain.overdue.fix":
    "Chaque entretien décompté par date et par distance, et signalé avant que le chiffre passe en négatif.",

  "pain.blind.legend": "Aucune trace",
  "pain.blind.headline": {
    one: "{count} entretien sur {total} n'a rien au carnet",
    other: "{count} entretiens sur {total} n'ont rien au carnet",
  },
  "pain.blind.body":
    "Wrenchy ne peut pas prouver ce qu'il n'a jamais vu, et vous non plus. Tant que rien ne dit le contraire, chacun d'eux est traité comme à faire.",
  "pain.blind.fix": "Notez-en un et tout son suivi démarre. Trente secondes chacun, une seule fois.",

  "pain.memory.legend": "De mémoire",
  "pain.memory.headline": "La seule copie est dans votre tête",
  "pain.memory.body":
    "Vous avez dit que vous y allez de mémoire. La mémoire tient jusqu'à la question «\u00a0c'était quand exactement\u00a0?\u00a0», posée au comptoir, à la revente, ou avec un voyant allumé à 130.",
  "pain.memory.fix":
    "Chaque entretien que vous notez est écrit sur ce téléphone et y reste. Aucun compte derrière lequel le perdre.",

  "pain.nothing.legend": "Non suivi",
  "pain.nothing.headline": "Rien n'est écrit sur cette voiture",
  "pain.nothing.body":
    "Ni la dernière vidange, ni le compteur auquel elle a été faite. La voiture garde le seul carnet, et sa façon de vous le dire, c'est la panne.",
  "pain.nothing.fix":
    "Un appui note un entretien. À partir de là, l'historique existe ailleurs que dans la voiture.",

  "pain.receipts.legend": "Dans la boîte à gants",
  "pain.receipts.headline": "Une boîte à gants n'est pas un index",
  "pain.receipts.body":
    "Les factures prouvent qu'un entretien a eu lieu. Elles ne disent pas ce qui vient ensuite, elles ne sont dans aucun ordre, et le papier thermique s'efface jusqu'au blanc.",
  "pain.receipts.fix":
    "Les mêmes factures en lignes datées, que vous pouvez trier, chercher et exporter en CSV.",

  "pain.spreadsheet.legend": "Dans un tableur",
  "pain.spreadsheet.headline": "Un tableur ne peut pas vous tapoter l'épaule",
  "pain.spreadsheet.body":
    "Il tient très bien l'historique. Il ne s'ouvre juste jamais tout seul, et la seule chose que vous attendez de lui, c'est un avertissement que vous n'auriez pas pensé à aller chercher.",
  "pain.spreadsheet.fix":
    "Les mêmes lignes, plus une notification le jour où un entretien arrive à échéance.",

  "pain.dealer.legend": "Au garage",
  "pain.dealer.headline": "Le carnet du garage appartient au garage",
  "pain.dealer.body":
    "Complet jusqu'au jour où vous changez de garage, déménagez ou vendez la voiture, et visible par celui qui rédige votre devis plutôt que par vous.",
  "pain.dealer.fix": "Votre propre copie, sur votre propre téléphone, exportable quand vous voulez.",

  "pain.bills.legend": "La facture",
  "pain.bills.headline": "Un entretien reporté n'est pas de l'argent économisé",
  "pain.bills.body":
    "C'est le même argent plus tard, avec une dépanneuse devant. Les pannes qui coûtent cher viennent des entretiens pas chers que personne ne comptait.",
  "pain.bills.fix":
    "Chaque intervalle décompté, pour que l'entretien pas cher reste un entretien pas cher.",

  "pain.missed.legend": "L'oubli",
  "pain.missed.headline": "Rien ne vous prévient avant qu'il soit tard",
  "pain.missed.body":
    "Un entretien n'est jamais raté exprès. Il est raté un mardi ordinaire, puis encore la semaine suivante, et le compteur continue.",
  "pain.missed.fix": "Une notification par entretien, le jour de l'échéance. Rien d'autre, jamais.",

  "pain.records.legend": "La preuve",
  "pain.records.headline": "Un entretien non prouvé est un entretien non fait",
  "pain.records.body":
    "Une garantie, une revente, un désaccord avec un garage\u00a0: chacun réclame le carnet, pas votre souvenir.",
  "pain.records.fix":
    "Un journal daté, exportable en CSV. Gratuit pour toujours, pour tout le monde, abonné ou pas.",

  "pain.resale.legend": "Revente",
  "pain.resale.headline": "Un historique complet vaut mieux qu'un historique propre",
  "pain.resale.body":
    "L'acheteur décote ce que vous ne pouvez pas lui montrer, et le concessionnaire qui la reprend aussi. La voiture ne vaut que ce que vous pouvez prouver.",
  "pain.resale.fix":
    "Exportez tout l'historique en CSV et remettez-le. Rien n'est bloqué derrière l'abonnement.",

  "pain.upsell.legend": "Le comptoir",
  "pain.upsell.headline": "Ils connaissent votre historique. Vous, non.",
  "pain.upsell.body":
    "«\u00a0C'était quand, votre dernier entretien des freins\u00a0?\u00a0» n'est pas une question à deviner pendant qu'on vous en chiffre un.",
  "pain.upsell.fix": "La date et le relevé du compteur, sortis au comptoir en deux appuis.",

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
  "system.notify.title": "{vehicle}\u00a0: {service} à faire",
  "system.notify.body": "Dernière fois le {date}.",

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

  "system.quickaction.trial.title": "Essayer Pro gratuitement",
  "system.quickaction.trial.subtitle": {
    one: "{count} jour, puis renouvellement sauf résiliation",
    other: "{count} jours, puis renouvellement sauf résiliation",
  },
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

  "vehicle.odometer": "Compteur",
  "vehicle.odometer.notSet": "Non renseigné",
  "vehicle.odometer.estimated": "Compteur (est.)",
  "vehicle.lastService": "Dernier entretien",
  "vehicle.lastService.none": "Aucun pour l'instant",

  "vehicle.due": "À faire",
  "vehicle.history": "Historique",
  "vehicle.history.empty":
    "Aucun entretien noté. Notez la dernière chose que vous avez fait faire.",

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
  "vehicleForms.log.what": "Quoi",
  "vehicleForms.log.when": "Quand",
  "vehicleForms.log.today": "Aujourd'hui",
  "vehicleForms.log.yesterday": "Hier",
  "vehicleForms.log.otherDate": "Autre date",
  "vehicleForms.log.odometer": "Compteur ({unit})",
  "vehicleForms.log.cost": "Coût (facultatif)",
  "vehicleForms.log.notes": "Notes (facultatif)",
};

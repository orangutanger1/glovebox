import type { Fragment } from "./types";

/**
 * Quebec French (fr-CA), an overlay on `fr`: only the keys a Québécois owner
 * would not recognise as their own words. Register stays **vous**, as in `fr`.
 *
 * Three kinds of difference and nothing else.
 *
 * Vocabulary a garage here actually uses: "changement d’huile", never "vidange"
 * (which reads as draining a tank); "odomètre", not "compteur kilométrique";
 * "auto" for the neutral noun and "char" in the lines that are a complaint
 * rather than a label; "transmission", not "boîte de vitesses"; "antigel" for
 * coolant; "chiffrier" for a spreadsheet; "coffre à gants", not "boîte à gants";
 * "remorqueuse", not "dépanneuse"; "estimé", not "devis"; a car that breaks
 * down "brise" here. Snow tires are a schedule, not a season: `intervals.intro`
 * names the twice-a-year pneus d’hiver changeover as one of the intervals worth
 * editing, because that is the tire job every owner in Quebec tracks.
 *
 * Institutions: there is no contrôle technique in Quebec — no province-wide
 * periodic roadworthiness test exists for a private car — so
 * `service.Inspection` is the "inspection mécanique" a garage sells and the app
 * promises no law behind it. `service.Registration` is the yearly SAAQ
 * immatriculation renewal, which is the paperwork that actually recurs; the
 * SAAQ is named because "immatriculation" alone could be read as the one-time
 * plating of a new car.
 *
 * Typography: Canadian French sets no space before "?" (unlike France), so
 * every question the app asks is restated for that space alone. Speed in
 * `pain.memory.body` is 100, the autoroute limit here, not 130.
 */
export const frCA: Fragment = {
  "garage.odometer": "Odomètre",

  "vehicle.odometer": "Odomètre",
  "vehicle.delete.title": "Supprimer {name}?",

  "vehicleForms.new.odometer": "Odomètre actuel ({unit})",
  "vehicleForms.log.odometer": "Odomètre ({unit})",

  "intervals.intro":
    "À quelle fréquence chaque entretien devient dû. Ajustez-les selon votre auto, le manuel, nos hivers (le changement de pneus d’hiver revient deux fois par année) ou l’usage que vous en faites.",

  "settings.units.title": "Passer aux {unit}?",
  "settings.units.body":
    "Chaque lecture d’odomètre et chaque intervalle déjà enregistrés seront convertis de {from} à {to}. Une lecture de 50\u00a0000 {from} devient {example}.",
  "settings.replay.title": "Refaire la présentation?",

  "system.csv.header.odometer": "Odomètre ({unit})",
  "system.vehicle.fallback": "Mon auto",

  // Garage vocabulary, not dictionary vocabulary. "Vidange" is France's word for
  // an oil change and means draining here; brakes and inspections are
  // "inspection" or "vérification" in Canada, never "contrôle".
  "service.Oil Change": "Changement d’huile",
  "service.Tire Rotation": "Rotation des pneus",
  "service.Brake Inspection": "Inspection des freins",
  "service.Coolant Flush": "Changement d’antigel",
  "service.Transmission Fluid": "Liquide de transmission",
  "service.Registration": "Immatriculation SAAQ",
  "service.Inspection": "Inspection mécanique",

  "onboardingA.welcome.headline": "Ne devinez plus la date de votre dernier changement d’huile.",
  "onboardingA.vehicle.title": "Qu’est-ce que vous conduisez?",
  "onboardingA.odometer.title.mi": "Combien de milles à l’odomètre?",
  "onboardingA.odometer.title.km": "Combien de kilomètres à l’odomètre?",
  "onboardingA.odometer.field": "Odomètre ({unit})",
  "onboardingA.drive.title": "Combien roulez-vous?",
  "onboardingA.drive.projection":
    "À ce rythme, cette auto affichera environ {distance} à pareille date l’an prochain.",

  "onboardingB.service.title": "Quel a été votre dernier entretien?",
  // "votre" keeps the sentence out of the service name's gender, which the chip
  // labels do not agree with.
  "onboardingB.service.when": "Ça date de quand, votre {service}?",
  "onboardingB.service.whenOther": "Ça date de quand, cet entretien?",
  "onboardingB.tracking.title": "Comment faites-vous le suivi en ce moment?",
  "onboardingB.tracking.receipts": "Factures dans le char",
  "onboardingB.tracking.spreadsheet": "Un chiffrier",
  "onboardingB.worry.title": "Qu’est-ce que vous voulez éviter?",

  "pain.memory.body":
    "Vous avez dit y aller de mémoire. La mémoire tient jusqu’à ce qu’on demande «\u00a0c’était quand, exactement?\u00a0» au comptoir, à la revente, ou avec un témoin allumé à 100 sur l’autoroute.",

  "pain.nothing.headline": "Rien n’est écrit sur ce char",
  "pain.nothing.body":
    "Ni le dernier changement d’huile, ni l’odomètre qu’il affichait ce jour-là. C’est le char qui garde le seul dossier, et sa façon de vous le dire, c’est de briser.",

  "pain.receipts.legend": "Dans le coffre à gants",
  "pain.receipts.headline": "Un coffre à gants n’est pas un index",

  "pain.spreadsheet.legend": "Dans un chiffrier",
  "pain.spreadsheet.headline": "Un chiffrier ne vous tape pas sur l’épaule",

  "pain.dealer.body":
    "Complet jusqu’au jour où vous changez de garage, déménagez ou vendez l’auto, et visible pour la personne qui rédige votre estimé plutôt que pour vous.",

  "pain.bills.body":
    "C’est le même argent plus tard, avec une remorqueuse devant. Les entretiens qui coûtent cher quand ils lâchent, ce sont les petites jobs que personne ne comptait.",

  "pain.missed.body":
    "Un entretien n’est jamais oublié exprès. Il est oublié un mardi ordinaire, puis encore la semaine d’après, et l’odomètre continue de monter.",

  "pain.resale.body":
    "L’acheteur escompte ce que vous ne pouvez pas lui montrer, et le marchand qui prend l’auto en échange fait pareil. Elle ne vaut que ce que vous pouvez en prouver.",

  "pain.upsell.body":
    "«\u00a0C’était quand, votre dernier entretien de freins?\u00a0» Ce n’est pas une question à deviner pendant que quelqu’un vous en fait le prix.",
  "pain.upsell.fix": "La date et l’odomètre, sortis au comptoir en deux touches.",

  "pain.vehicleFallback": "auto",

  "evidence.price.answer":
    "La version gratuite est une app complète. Une auto, historique illimité.",

  "offer.trial.subtitle": {
    one: "Prenez {count} jour de Pro pour rien et décidez quand votre auto vous aura dit quelque chose.",
    other:
      "Prenez {count} jours de Pro pour rien et décidez quand votre auto vous aura dit quelque chose.",
  },
  "offer.paywall.caption":
    "Une auto, l’historique illimité et l’export CSV sont gratuits pour toujours, même après un abonnement annulé.",
  "offer.free.caption":
    "Une auto, pas de compte, pas de pub et aucun essai qui roule en arrière-plan. Pro ajoute le reste du garage et vos propres intervalles quand vous voulez, depuis les Réglages.",
};

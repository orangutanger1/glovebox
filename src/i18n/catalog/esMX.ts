import type { Fragment } from "./types";

/**
 * Mexican Spanish (es-MX): an overlay on top of `es`, carrying only the keys a
 * Mexican owner would say differently. Register stays tú, inherited from the base.
 *
 * The substitutions behind almost every key here: carro (not coche), llantas
 * (not neumáticos), odómetro (not cuentakilómetros), costo (not coste), celular
 * (not móvil), manejar (not conducir), foco/tablero (not testigo/salpicadero),
 * agencia for the dealership taking a trade-in, cotización for an estimate,
 * Apple's Latin American "Configuración" where Spain's iOS says "Ajustes",
 * Mexican digit grouping — 8,000 and 50,000, where Spain writes 8.000 and
 * 50.000 — and the preterite where Peninsular Spanish reaches for the present
 * perfect ("¿Qué fue lo último que le hicieron?", not "¿Qué te han hecho?").
 *
 * `service.Inspection` is "Verificación": the state-run emissions check, which is
 * what a Mexican owner has on a sticker and a calendar. It is named as nothing
 * more than that on purpose — Mexico has no nationwide roadworthiness test, so
 * this string must not imply the app is counting one down.
 * `service.Registration` is "Tenencia/refrendo", the yearly plate paperwork,
 * naming both halves because tenencia survives in some states and not others.
 *
 * The base's countable for a logged job, "mantenimiento", is inherited rather
 * than overlaid: "mantenimiento programado" is ordinary Mexican usage, and
 * forking the term would fork sixty keys for a preference.
 */
export const esMX: Fragment = {
  "evidence.records.answer": "SQLite en tu celular. Exporta a CSV, gratis para siempre.",
  "evidence.price.answer": "El plan gratis es una app completa. Un carro, historial sin límite.",

  "features.history.subtitle":
    "Fecha, odómetro, costo y notas, con los registros borrados marcados en lugar de eliminados.",

  "garage.odometer": "Odómetro",

  "intervals.intro":
    "Cada cuándo toca cada mantenimiento. Cambia el que quieras para que empate con tu carro, con el manual, con el clima en el que manejas o con lo duro que lo usas.",

  "language.intro":
    "Glovebox sigue tu celular a menos que elijas un idioma aquí. Los nombres de los mantenimientos usan las palabras que usa un taller en ese idioma.",

  "layout.settings": "Configuración",

  "offer.features.subtitle":
    "Todo vive en un solo archivo en este celular, sin cuenta y sin servidor.",
  "offer.paywall.caption":
    "Un carro, historial sin límite y exportación a CSV son gratis para siempre, incluso después de cancelar la suscripción.",
  "offer.trial.subtitle": {
    one: "Llévate {count} día de Pro sin pagar nada y decide cuando tu carro ya te haya dicho algo.",
    other:
      "Llévate {count} días de Pro sin pagar nada y decide cuando tu carro ya te haya dicho algo.",
  },
  "offer.trial.caption": "Cancela en Configuración antes de que termine y no pagas nada.",
  "offer.free.subtitle": {
    one: "Tu {vehicle} y su {count} mantenimiento programado ya están guardados en este celular. El modo gratis conserva todo.",
    other:
      "Tu {vehicle} y sus {count} mantenimientos programados ya están guardados en este celular. El modo gratis conserva todo.",
  },
  "offer.free.caption":
    "Un carro, sin cuenta, sin anuncios y sin ninguna prueba corriendo en segundo plano. Pro agrega el resto del garaje y tus propios intervalos cuando quieras, desde Configuración.",
  "offer.winback.title": "Dejaste de registrar.",

  "onboardingA.welcome.privacy":
    "Todo se queda en este celular, sin cuenta y sin ninguna sesión que cerrar.",
  "onboardingA.vehicle.title": "¿Qué carro manejas?",
  "onboardingA.vehicle.hint":
    "Año, marca y modelo, para que los recordatorios puedan nombrar el carro.",
  // "Traer" is how a Mexican owner asks what a car has on it; Spain asks what it
  // "tiene".
  "onboardingA.odometer.title.mi": "¿Cuántas millas trae?",
  "onboardingA.odometer.title.km": "¿Cuántos kilómetros trae?",
  "onboardingA.odometer.field": "Odómetro ({unit})",
  // Mexico groups thousands with a comma, like the US and unlike Spain.
  "onboardingA.odometer.placeholder.mi": "84,210",
  "onboardingA.odometer.placeholder.km": "135,600",
  "onboardingA.drive.title": "¿Cuánto lo manejas?",
  "onboardingA.drive.low.mi": "Menos de 5,000",
  "onboardingA.drive.low.km": "Menos de 8,000",
  "onboardingA.drive.average.mi": "5,000 a 10,000",
  "onboardingA.drive.average.km": "8,000 a 16,000",
  "onboardingA.drive.high.mi": "10,000 a 15,000",
  "onboardingA.drive.high.km": "16,000 a 24,000",
  "onboardingA.drive.very_high.mi": "Más de 15,000",
  "onboardingA.drive.very_high.km": "Más de 24,000",
  "onboardingA.drive.projection":
    "A ese ritmo, este carro va a marcar unos {distance} para esta fecha del año que entra.",

  "onboardingB.service.title": "¿Qué fue lo último que le hicieron?",
  "onboardingB.tracking.receipts": "Recibos en el carro",
  "onboardingB.worry.caption":
    "Es la última, y la siguiente pantalla es sobre tu carro, no sobre la app.",

  "onboardingC.results.noneLogged": "Nada de lo que registraste está atrasado.",
  "onboardingC.results.subtitle":
    "Calculado para tu {vehicle} con {distance} al año y con lo que registraste.",

  "pain.overdue.body":
    "En tu {vehicle}, hoy. Nada en el tablero te lo va a avisar, porque el foco se prende después del daño, no antes.",

  "pain.memory.body":
    "Dijiste que te guías por la memoria. La memoria aguanta hasta que alguien pregunta \u201c\u00bfcuándo exactamente?\u201d en el mostrador, en la venta o con un foco prendido a 110 por hora.",
  "pain.memory.fix":
    "Cada mantenimiento que registras se escribe en este celular y ahí se queda. No hay cuenta detrás de la cual perderlo.",

  "pain.nothing.headline": "Nada de este carro está anotado",
  "pain.nothing.body":
    "Ni el último cambio de aceite, ni el odómetro que traía cuando se hizo. El único registro lo tiene el carro, y su manera de avisarte es fallando.",
  "pain.nothing.fix":
    "Un toque registra un mantenimiento. De ahí en adelante el historial existe en otra parte, no nada más en el carro.",

  "pain.dealer.body":
    "Completo hasta que cambias de taller, te mudas o vendes el carro, y visible para quien te hace la cotización, no para ti.",
  "pain.dealer.fix": "Tu propia copia, en tu propio celular, exportable cuando la quieras.",

  "pain.missed.body":
    "Nadie se salta un mantenimiento a propósito. Se salta un martes cualquiera, y otra vez la semana siguiente, y el odómetro sigue subiendo.",

  "pain.resale.body":
    "El comprador descuenta lo que no le puedes mostrar, y la agencia que lo toma a cuenta también. El carro vale lo que puedas comprobar de él.",

  "pain.upsell.fix": "La fecha y el odómetro, a la mano en el mostrador con dos toques.",

  "pain.vehicleFallback": "carro",

  "service.Tire Rotation": "Rotación de llantas",
  "service.Cabin Air Filter": "Filtro de cabina",
  "service.Wiper Blades": "Plumas limpiaparabrisas",
  "service.Transmission Fluid": "Aceite de transmisión",
  "service.Registration": "Tenencia/refrendo",
  "service.Inspection": "Verificación",

  "settings.title": "Configuración",
  "settings.privacy":
    "Tus registros viven solo en este celular. Sin cuenta, sin servidor. Exporta cuando quieras, porque la exportación nunca está bloqueada.",
  "settings.units.body":
    "Cada lectura del odómetro y cada intervalo que tengas guardado se van a convertir de {from} a {to}. Una lectura de 50,000 {from} queda en {example}.",
  "settings.reminders.blocked": "Recordatorios bloqueados, abre Configuración de iOS",
  "settings.reminders.denied":
    "Rechazaste los recordatorios. Puedes activarlos en Configuración de iOS.",
  "settings.reminders.openSettings":
    "Abre Configuración de iOS › Glovebox › Notificaciones para volver a activar los recordatorios.",
  "settings.manage": "Administrar suscripción",
  "settings.manage.error":
    "No se pudo abrir la configuración de la suscripción. Vuelve a intentarlo con mejor conexión.",

  "system.csv.header.odometer": "Odómetro ({unit})",
  "system.csv.header.cost": "Costo",
  "system.vehicle.fallback": "Mi carro",

  "vehicle.odometer": "Odómetro",

  "vehicleForms.new.odometer": "Odómetro actual ({unit})",
  "vehicleForms.log.odometer": "Odómetro ({unit})",
  "vehicleForms.log.cost": "Costo (opcional)",
};

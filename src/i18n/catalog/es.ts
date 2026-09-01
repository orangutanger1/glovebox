import type { Fragment } from "./types";

/** Spanish (Spain, es-ES). Register: tú throughout, with Peninsular present
 *  perfect for recent past ("¿Qué te han hecho...?", "No se ha podido..."). The
 *  car is a "coche" and the phone a "móvil" (Latin American wording is left to
 *  the es-MX overlay). `service.Inspection` is ITV, the name of the legal
 *  roadworthiness test in Spain; `service.Registration` is the impuesto de
 *  circulación, the recurring vehicle tax owners actually pay. Generic "service"
 *  is "mantenimiento" (countable) so that "revisión" stays free for the real
 *  garage check-ups ("revisión de frenos", "revisión de batería"). "Odometer" is
 *  "cuentakilómetros". Two deliberate localisations of copy: the 70 mph in
 *  `pain.memory.body` becomes 120 (Spanish motorway speed), and
 *  `onboardingB.service.when` fronts the service name ("{service}: ¿cuándo
 *  fue?") because a Spanish article would otherwise have to agree in gender with
 *  an interpolated noun it cannot see. */
export const es: Fragment = {
  // evidence
  "evidence.records.label":
    "registros perdidos, sincronizaciones fallidas, ninguna forma de sacar los datos",
  "evidence.records.answer": "SQLite en tu móvil. Exporta a CSV, gratis para siempre.",

  "evidence.price.label": "el precio, el muro de pago o lo que acabó costando",
  "evidence.price.answer":
    "La versión gratuita es una app entera y usable. Un coche, historial ilimitado.",

  "evidence.account.label": "una cuenta y un inicio de sesión antes de que nada funcionara",
  "evidence.account.answer": "Sin cuenta. No hay dónde iniciar sesión.",

  "evidence.crashes.label": "cierres inesperados, bloqueos y archivos que no abrían",
  "evidence.crashes.answer": "Los registros borrados quedan marcados, nunca se descartan.",

  // features
  "features.history.title": "Cada mantenimiento, guardado para siempre",
  "features.history.subtitle":
    "Fecha, cuentakilómetros, coste y notas, y las filas borradas quedan marcadas en lugar de desaparecer.",

  "features.due.title": "Vence por fecha y por distancia",
  "features.due.subtitle":
    "Lo que llegue primero, contado desde los intervalos de cada mantenimiento.",

  "features.reminders.title": "Un recordatorio por mantenimiento",
  "features.reminders.subtitle": "El día en que vence, y nada más.",

  "features.export.title": "Exporta todo en CSV",
  "features.export.subtitle":
    "Gratis para siempre y para todos, así tus registros nunca quedan rehenes de una suscripción.",

  "features.garage.title": "Más de un vehículo",
  "features.garage.subtitle": "Todo el garaje, cada coche con su propio calendario.",

  "features.intervals.title": "Tus propios intervalos de mantenimiento",
  "features.intervals.subtitle":
    "Cambia el que quieras cuando el manual no coincida con los valores por defecto.",

  // garage
  "garage.title": "Garaje",
  "garage.logService": "Registrar mantenimiento",
  "garage.addVehicle": "Añadir vehículo",
  "garage.comingUp": "Próximamente",
  "garage.quickLog": "Registrar con un toque",
  "garage.empty": "Todavía no hay vehículos. Añade uno y Wrenchy empieza a guardar su historial.",
  "garage.storeUnreachable":
    "No se ha podido conectar con la App Store. Inténtalo con mejor conexión.",

  "garage.badge.overdue": "Vencido",
  "garage.badge.dueSoon": "Vence pronto",

  "garage.odometer": "Cuentakilómetros",
  "garage.odometer.notSet": "Sin definir",
  "garage.odometer.estimated": "Cuentakilómetros (est.)",

  "garage.over": "{distance} de retraso",
  "garage.dueNow": "vence ya",
  "garage.dueSoon": "vence pronto",
  "garage.onSchedule": "al día",

  "garage.noSchedule": "Aún sin calendario",
  "garage.noSchedule.detail": "registrado, sin seguimiento",
  "garage.nothingLogged": "Nada registrado",
  "garage.nothingLogged.detail": "añade un mantenimiento",

  "garage.openHistory": "Abrir historial",
  "garage.openAndLog": "Abrir y registrar un mantenimiento",

  // intervals
  "intervals.title": "Intervalos de mantenimiento",
  "intervals.intro":
    "Cada cuánto vence cada mantenimiento. Cambia los que quieras para ajustarlos a tu coche, al manual, al clima en el que conduces o a lo duro que lo usas.",
  "intervals.custom": "PROPIO",

  "intervals.untracked": "sin seguimiento",
  "intervals.months": { one: "{count} mes", other: "{count} meses" },
  "intervals.monthsAndDistance": {
    one: "{count} mes · {distance}",
    other: "{count} meses · {distance}",
  },

  "intervals.help":
    "Vence lo que llegue primero. Deja una casilla vacía para ignorarla: solo distancia o solo meses es un calendario válido. Vacía las dos para volver al valor por defecto ({default}).",
  "intervals.field.months": "Cada (meses)",
  "intervals.field.distance": "Cada ({unit})",
  "intervals.error.positive":
    "Usa números enteros mayores que cero, o deja la casilla vacía para ignorarla.",
  "intervals.save": "Guardar intervalo",
  "intervals.cancel": "Cancelar",

  // language
  "language.title": "Idioma",
  "language.intro":
    "Wrenchy sigue el idioma de tu móvil salvo que elijas uno aquí. Los nombres de los mantenimientos usan las palabras que se usan en los talleres de ese idioma.",
  "language.system": "Sistema",

  // layout
  "layout.garage": "Garaje",
  "layout.settings": "Ajustes",
  "layout.intervals": "Intervalos de mantenimiento",
  "layout.addVehicle": "Añadir vehículo",
  "layout.vehicle": "Vehículo",
  "layout.logService": "Registrar un mantenimiento",
  "layout.fatal.retry": "Reintentar",
  "layout.fatal.title": "Wrenchy no ha podido abrir tus registros.",
  "layout.fatal.body":
    "No se ha borrado nada y la base de datos se ha restaurado a su último estado correcto. Vuelve a abrir la app. Si sigue pasando, contacta con soporte antes de reinstalar, porque reinstalar es lo que sí perdería los registros.",

  // offer
  "offer.badge.pro": "Pro",
  "offer.badge.free": "Gratis",

  "offer.features.title": "Esto es lo que te llevas.",

  "offer.plan.title": "Este es el plan.",
  "offer.plan.subtitle": {
    one: "{count} mantenimiento programado para tu {vehicle}.",
    other: "{count} mantenimientos programados para tu {vehicle}.",
  },
  "offer.plan.cta": "Activar recordatorios",
  "offer.plan.decline": "Ahora no",
  "offer.notify.title": "No te pierdas ningún servicio.",
  "offer.notify.off": "Avisos desactivados",
  "offer.plan.status.due": "Vence",
  "offer.plan.status.soon": "Pronto",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "Sin registro",

  "offer.paywall.title": "Los coches no avisan. Esto sí.",
  "offer.paywall.subtitle": "Cada mantenimiento y cada lectura, registrados.",
  "offer.paywall.cta": "Dejar mi coche registrado",
  "offer.paywall.vehicle": "Registrado",
  "offer.paywall.scheduled": "Ya vigilados",
  "offer.paywall.services": { one: "mantenimiento", other: "mantenimientos" },
  "offer.paywall.dueNow": "Vencidos hoy",
  "offer.paywall.nextUp": "Próximo aviso",
  "offer.paywall.none": "Ninguno",

  "offer.paywall.impact.legend": "Lo que eso vale",
  "offer.paywall.impact.warned": "Avisado antes de que cueste, no después.",
  "offer.paywall.impact.upsell": "Entras sabiendo. Nada se te vende dos veces.",
  "offer.paywall.impact.resale": "Un historial completo en la venta, y se nota en el precio.",

  "offer.trial.title": { one: "Pruébalo {count} día.", other: "Pruébalo {count} días." },
  "offer.trial.cta": {
    one: "Empezar mi {count} día gratis",
    other: "Empezar mis {count} días gratis",
  },
  "offer.trial.decline": "No, gracias, quiero la app gratuita",
  "offer.trial.subtitle": "Pro completo, gratis. Hoy no se cobra nada.",
  "offer.trial.legend": "Cómo funciona la prueba",
  "offer.trial.now.title": "Hoy",
  "offer.trial.now.body": "Se desbloquea todo: tu plan, tus recordatorios, tu historial completo.",
  "offer.trial.runs.title": "Mientras dura",
  "offer.trial.runs.body": "Cada servicio que le toca a tu coche queda vigilado, no memorizado.",
  "offer.trial.ends.title": "Cuando termina",
  "offer.trial.ends.body": "Se renueva al precio de la siguiente pantalla. Tú decides antes.",

  "offer.winback.title": "Has dejado de registrar.",
  "offer.winback.decline": "Llévame a mi garaje",
  "offer.winback.body":
    "Tus registros están exactamente donde los dejaste. Nada ha caducado, nada se ha borrado y no hay que configurar nada otra vez.",
  "offer.winback.feedback": "Cuéntanos qué falló",
  "offer.winback.feedbackNote": "Un formulario corto, se abre en Safari",
  "offer.winback.caption": {
    one: "O dale otra oportunidad: {count} día de Pro, gratis. Cancela antes de que acabe y no pagas nada.",
    other:
      "O dale otra oportunidad: {count} días de Pro, gratis. Cancela antes de que acaben y no pagas nada.",
  },

  // onboardingA
  "onboardingA.continue": "Continuar",

  "onboardingA.welcome.headline": "No vuelvas a adivinar cuándo fue tu último cambio de aceite.",
  "onboardingA.welcome.start": "Empezar",
  "onboardingA.welcome.privacy": "Sin cuenta. Nada sale de este móvil.",

  "onboardingA.vehicle.title": "¿Qué coche conduces?",
  "onboardingA.vehicle.year": "Año",
  "onboardingA.vehicle.makeOptional": "Marca (opcional)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.vehicle.modelOptional": "Modelo (opcional)",

  "onboardingA.odometer.title.mi": "¿Cuántas millas tiene?",
  "onboardingA.odometer.title.km": "¿Cuántos kilómetros tiene?",
  "onboardingA.odometer.field": "Cuentakilómetros ({unit})",
  "onboardingA.odometer.placeholder.mi": "84.210",
  "onboardingA.odometer.placeholder.km": "135.600",
  "onboardingA.odometer.caption": "Un número aproximado sirve.",

  "onboardingA.drive.title": "¿Cuánto conduces al año?",
  "onboardingA.drive.legend": "Distancia al año ({unit})",
  "onboardingA.drive.low.mi": "Menos de 5.000",
  "onboardingA.drive.low.km": "Menos de 8.000",
  "onboardingA.drive.average.mi": "5.000 a 10.000",
  "onboardingA.drive.average.km": "8.000 a 16.000",
  "onboardingA.drive.high.mi": "10.000 a 15.000",
  "onboardingA.drive.high.km": "16.000 a 24.000",
  "onboardingA.drive.very_high.mi": "Más de 15.000",
  "onboardingA.drive.very_high.km": "Más de 24.000",
  "onboardingA.drive.projection":
    "Unos {distance} el año que viene por estas fechas.",
  "onboardingA.drive.caption": "Más o menos basta.",

  // onboardingB
  "onboardingB.continue": "Continuar",

  "onboardingB.service.title": "¿Qué te han hecho la última vez?",
  "onboardingB.service.subtitle": "Con que se acerque basta.",
  "onboardingB.service.legend": "Mantenimiento",
  "onboardingB.service.when": "{service}: ¿cuándo fue?",
  "onboardingB.service.whenOther": "¿Cuándo fue el mantenimiento?",
  "onboardingB.service.whenPending": "¿Cuándo fue?",
  "onboardingB.service.somethingElse": "Otra cosa",
  "onboardingB.service.ago.now": "Ahora mismo",
  "onboardingB.service.ago.lastMonth": "El mes pasado",
  "onboardingB.service.ago.months3": "Hace 3 meses",
  "onboardingB.service.ago.months6": "Hace 6 meses",
  "onboardingB.service.ago.notSure": "No lo sé",

  "onboardingB.tracking.title": "¿Cómo llevas el control ahora?",
  "onboardingB.tracking.legend": "Ahora",
  "onboardingB.tracking.memory": "De memoria",
  "onboardingB.tracking.receipts": "Facturas en el coche",
  "onboardingB.tracking.spreadsheet": "Una hoja de cálculo",
  "onboardingB.tracking.dealer": "Lo lleva mi taller",
  "onboardingB.tracking.nothing": "Nada de nada",

  "onboardingB.worry.title": "¿Qué quieres evitar?",
  "onboardingB.worry.subtitle": "Elige todas las que apliquen.",
  "onboardingB.worry.bills": "Facturas de taller inesperadas",
  "onboardingB.worry.missed": "Saltarme un mantenimiento",
  "onboardingB.worry.records": "Perder los registros",
  "onboardingB.worry.resale": "Valor de reventa",
  "onboardingB.worry.upsell": "Que me cuelen extras",

  "onboardingB.analyzing.title": "Calculando el calendario.",
  "onboardingB.analyzing.odometer": "{vehicle} con {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} intervalo de mantenimiento aplicado",
    other: "{count} intervalos de mantenimiento aplicados",
  },
  "onboardingB.analyzing.rate": "{distance} al año",
  "onboardingB.analyzing.rateProjected": "{distance} al año, así que {projected} el año que viene",
  "onboardingB.analyzing.clear": "Hoy no hay nada que atender",
  "onboardingB.analyzing.due": {
    one: "{count} necesita atención, {soon} en camino",
    other: "{count} necesitan atención, {soon} en camino",
  },
  "onboardingB.analyzing.done": "Listo",
  "onboardingB.analyzing.progress": "Leyendo {index} de {total}",

  // onboardingC
  "onboardingC.back": "Atrás",
  "onboardingC.question": "Pregunta {step} / {total}",

  "onboardingC.results.overdue": {
    one: "Un mantenimiento ya está vencido.",
    other: "{count} mantenimientos ya están vencidos.",
  },
  "onboardingC.results.noBaseline": {
    one: "{count} servicio aún no tiene registro.",
    other: "{count} servicios aún no tienen registro.",
  },
  "onboardingC.results.noneYet": "Todavía no hay nada vencido.",
  "onboardingC.results.clear": "No hay nada vencido ni nada cerca de estarlo.",
  "onboardingC.results.subtitle": "Tu {vehicle}, {distance} al año.",
  "onboardingC.results.continue": "Continuar",
  "onboardingC.results.dueNow": "Vence ya",
  "onboardingC.results.soon": "Pronto",
  "onboardingC.results.onFile": "Registrados",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Vence",
  "onboardingC.results.status.soon": "Pronto",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "Sin registro",

  "onboardingC.symptoms.next": "Continuar",
  "onboardingC.symptoms.last": "¿Y qué hago?",

  "onboardingC.help.title": "Los tres son el mismo problema.",
  "onboardingC.help.subtitle": "Nada está anotado donde pueda avisarte.",
  "onboardingC.help.continue": "Continuar",

  "onboardingC.reviews.title": "Esta app existe por esto.",
  "onboardingC.reviews.subtitle": {
    one: "{count} de las {total} valoraciones en la App Store de las apps que ya hacen esto es de una a tres estrellas.",
    other:
      "{count} de las {total} valoraciones en la App Store de las apps que ya hacen esto son de una a tres estrellas.",
  },
  "onboardingC.reviews.continue": "Continuar",
  "onboardingC.reviews.scroll": "Desliza para leer las cuatro",
  "onboardingC.reviews.mentioning": "Valoraciones que mencionan",

  // pain
  "pain.overdue.legend": "Vencido",
  "pain.overdue.headline": {
    one: "Un mantenimiento ya está vencido",
    other: "{count} mantenimientos ya están vencidos",
  },
  "pain.overdue.body": "En tu {vehicle}, hoy. El testigo se enciende después del daño, no antes.",
  "pain.overdue.fix": "Contado por fecha y por distancia, avisado antes de que llegue a cero.",

  "pain.blind.legend": "Sin registro",
  "pain.blind.headline": {
    one: "{count} de {total} mantenimientos no tiene nada registrado",
    other: "{count} de {total} mantenimientos no tienen nada registrado",
  },
  "pain.blind.body": "Mientras nada diga lo contrario, todos ellos se dan por vencidos.",
  "pain.blind.fix": "Registra uno y arranca todo su calendario. Treinta segundos, una vez.",

  "pain.memory.legend": "De memoria",
  "pain.memory.headline": "La única copia está en tu cabeza",
  "pain.memory.body": "La memoria aguanta hasta que alguien pregunta «¿cuándo exactamente?» en el mostrador.",
  "pain.memory.fix": "Escrito en este teléfono y ahí se queda. Sin cuenta que lo esconda.",

  "pain.nothing.legend": "Sin seguimiento",
  "pain.nothing.headline": "De este coche no hay nada anotado",
  "pain.nothing.body": "El coche lleva el único registro, y te avisa averiándose.",
  "pain.nothing.fix": "Un toque registra un servicio. A partir de ahí el historial existe fuera del coche.",

  "pain.receipts.legend": "En la guantera",
  "pain.receipts.headline": "Una guantera no es un índice",
  "pain.receipts.body": "Las facturas prueban lo que se hizo. Nunca dicen qué toca a continuación.",
  "pain.receipts.fix": "Las mismas facturas como filas con fecha que puedes ordenar, buscar y exportar.",

  "pain.spreadsheet.legend": "En una hoja de cálculo",
  "pain.spreadsheet.headline": "Una hoja de cálculo no te toca el hombro",
  "pain.spreadsheet.body": "Guarda bien el historial. Solo que nunca se abre sola para avisarte.",
  "pain.spreadsheet.fix": "Las mismas filas, más un aviso el día en que algo vence.",

  "pain.dealer.legend": "En el taller",
  "pain.dealer.headline": "Los registros del taller son del taller",
  "pain.dealer.body": "Completo hasta que cambias de taller, te mudas o vendes, y visible para ellos, no para ti.",
  "pain.dealer.fix": "Tu propia copia, en tu propio teléfono, exportable cuando quieras.",

  "pain.bills.legend": "La factura",
  "pain.bills.headline": "Aplazar el mantenimiento no es ahorrar",
  "pain.bills.body": "Es el mismo dinero más tarde, con una grúa por delante.",
  "pain.bills.fix": "Cada intervalo contado, para que el trabajo barato siga siendo barato.",

  "pain.missed.legend": "El despiste",
  "pain.missed.headline": "Nada te lo recuerda hasta que ya es tarde",
  "pain.missed.body": "Nadie se salta un servicio a propósito. Se salta un martes cualquiera.",
  "pain.missed.fix": "Un aviso por servicio, el día que vence. Nada más.",

  "pain.records.legend": "La prueba",
  "pain.records.headline": "Un mantenimiento sin pruebas es un mantenimiento sin hacer",
  "pain.records.body": "Una garantía, una venta, una discusión con el taller: todas piden el registro.",
  "pain.records.fix": "Un historial con fechas, exportable a CSV. Gratis para siempre, para todos.",

  "pain.resale.legend": "La reventa",
  "pain.resale.headline": "Un historial completo vale más que uno limpio",
  "pain.resale.body": "El comprador descuenta lo que no puedes enseñarle. El concesionario también.",
  "pain.resale.fix": "Exporta todo el historial y entrégalo.",

  "pain.upsell.legend": "El mostrador",
  "pain.upsell.headline": "Ellos conocen tu historial. Tú no.",
  "pain.upsell.body": "No es una pregunta para adivinar mientras te pasan el presupuesto.",
  "pain.upsell.fix": "La fecha y el kilometraje, en el mostrador en dos toques.",

  "pain.vehicleFallback": "coche",

  // plan
  "plan.line.nothing": "Nada registrado",
  "plan.line.about": "hacia {date}",
  "plan.line.noInterval": "Sin intervalo definido",

  // service
  "service.Oil Change": "Cambio de aceite",
  "service.Tire Rotation": "Rotación de neumáticos",
  "service.Brake Inspection": "Revisión de frenos",
  "service.Air Filter": "Filtro de aire",
  "service.Cabin Air Filter": "Filtro de habitáculo",
  "service.Wiper Blades": "Escobillas",
  "service.Battery Check": "Revisión de batería",
  "service.Coolant Flush": "Cambio de refrigerante",
  "service.Transmission Fluid": "Aceite de caja de cambios",
  "service.Spark Plugs": "Bujías",
  "service.Registration": "Impuesto de circulación",
  "service.Inspection": "ITV",
  "service.Other": "Otro",

  // settings
  "settings.title": "Ajustes",
  "settings.privacy":
    "Tus registros viven solo en este móvil. Sin cuenta, sin servidor. Exporta cuando quieras, porque la exportación nunca está bloqueada.",
  "settings.section.data": "Datos",
  "settings.section.reminders": "Avisos",
  "settings.section.membership": "Suscripción",
  "settings.section.preferences": "Preferencias",

  "settings.export": "Exportar todos los registros (CSV)",
  "settings.export.error":
    "No se ha podido abrir el menú de compartir. Tus registros no han cambiado.",

  "settings.intervals": "Intervalos de mantenimiento",


  "settings.language": "Idioma: {language}",
  "settings.units": "Unidades: {unit}",
  "settings.units.title": "¿Cambiar a {unit}?",
  "settings.units.body":
    "Todas las lecturas del cuentakilómetros y los intervalos que tengas guardados se convertirán de {from} a {to}. Una lectura de 50.000 {from} pasa a ser {example}.",
  "settings.units.cancel": "Cancelar",
  "settings.units.confirm": "Convertir",

  "settings.reminders.enable": "Activar recordatorios",
  "settings.reminders.blocked": "Recordatorios bloqueados, abre Ajustes de iOS",
  "settings.reminders.none": "Recordatorios activados, nada por vencer",
  "settings.reminders.on": {
    one: "Recordatorios activados, {count} programado",
    other: "Recordatorios activados, {count} programados",
  },
  "settings.reminders.onNext": {
    one: "Recordatorios activados, {count} programado, el siguiente {date}",
    other: "Recordatorios activados, {count} programados, el siguiente {date}",
  },
  "settings.reminders.scheduled": "Recordatorios programados.",
  "settings.reminders.denied": "Recordatorios denegados. Puedes activarlos en Ajustes de iOS.",
  "settings.reminders.error": "No se ha podido pedir permiso para las notificaciones.",
  "settings.reminders.openSettings":
    "Abre Ajustes de iOS › Wrenchy › Notificaciones para volver a activar los recordatorios.",

  "settings.manage": "Gestionar suscripción",
  "settings.manage.error":
    "No se han podido abrir los ajustes de suscripción. Inténtalo de nuevo con mejor conexión.",
  "settings.upgrade": "Pasar a Pro",
  "settings.restore": "Restaurar compras",
  "settings.restore.done": "Pro restaurado.",
  "settings.restore.none": "No se ha encontrado ninguna compra.",
  "settings.store.error":
    "No se ha podido conectar con la App Store. Inténtalo de nuevo con mejor conexión.",
  "settings.pro.on": "Pro está activo. Gracias.",
  "settings.offer.applied": "La oferta está aplicada. No hay nada más que hacer.",

  "settings.replay": "Repetir la introducción",
  "settings.replay.title": "¿Repetir la introducción?",
  "settings.replay.body":
    "Tus vehículos y registros se conservan. Pasar otra vez por el proceso añade otro vehículo, que puedes borrar después.",
  "settings.replay.cancel": "Cancelar",
  "settings.replay.confirm": "Repetir",

  // system
  "system.notify.title": "A tu {vehicle} le toca {service}",
  "system.notify.body": "Última vez: {date}.",

  "system.notify.when.today": "Hoy",
  "system.notify.when.tomorrow": "Ma\u00f1ana",
  "system.notify.when.days": { one: "En {count} d\u00eda", other: "En {count} d\u00edas" },
  "system.notify.when.months": { one: "En {count} mes", other: "En {count} meses" },

  "system.csv.header.vehicle": "Vehículo",
  "system.csv.header.service": "Mantenimiento",
  "system.csv.header.date": "Fecha",
  "system.csv.header.odometer": "Cuentakilómetros ({unit})",
  "system.csv.header.cost": "Coste",
  "system.csv.header.notes": "Notas",
  "system.csv.header.deleted": "Borrado",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Prueba Pro gratis",
  "system.quickaction.trial.subtitle": {
    one: "{count} día y luego se renueva si no cancelas",
    other: "{count} días y luego se renueva si no cancelas",
  },
  "system.quickaction.feedback.title": "Enviar comentarios",
  "system.quickaction.feedback.subtitle": "Cuéntanos qué falló",

  "system.vehicle.fallback": "Mi coche",

  // unit
  "unit.mi": "{value} mi",
  "unit.km": "{value} km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  // vehicle
  "vehicle.title": "Vehículo",

  "vehicle.body.sedan": "Sedán",
  "vehicle.body.hatchback": "Hatchback",
  "vehicle.body.coupe": "Cupé",
  "vehicle.body.wagon": "Familiar",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "Pickup",
  "vehicle.body.van": "Furgoneta",

  "vehicle.odometer": "Cuentakilómetros",
  "vehicle.odometer.notSet": "Sin definir",
  "vehicle.odometer.estimated": "Cuentakilómetros (est.)",
  "vehicle.lastService": "Último mantenimiento",
  "vehicle.lastService.none": "Ninguno aún",

  "vehicle.due": "Vence ya",
  "vehicle.history": "Historial",
  "vehicle.history.empty":
    "Aún no hay ningún mantenimiento registrado. Registra lo último que te hicieron.",

  "vehicle.over": "{distance} de retraso",
  "vehicle.dueOn": "vence {date}",
  "vehicle.dueNow": "vence ya",
  "vehicle.dueSoon": "vence pronto",

  "vehicle.badge.overdue": "Vencido",
  "vehicle.badge.soon": "Pronto",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Borrar",
  "vehicle.serviceDeleted": "Mantenimiento borrado",
  "vehicle.undo": "Deshacer",
  "vehicle.logService": "Registrar un mantenimiento",

  "vehicle.deleteVehicle": "Borrar vehículo",
  "vehicle.delete.title": "¿Borrar {name}?",
  "vehicle.delete.body":
    "Sale de tu garaje junto con su historial de mantenimiento. Los registros ya exportados se quedan en ese archivo.",
  "vehicle.delete.cancel": "Cancelar",
  "vehicle.delete.confirm": "Borrar",

  // vehicleForms
  "vehicleForms.new.title": "Añadir vehículo",
  "vehicleForms.new.save": "Guardar",
  "vehicleForms.new.name": "Nombre",
  "vehicleForms.new.namePlaceholder": "Civic 2019",
  "vehicleForms.new.odometer": "Cuentakilómetros actual ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Registrar un mantenimiento",
  "vehicleForms.log.save": "Guardar",
  "vehicleForms.log.error":
    "No se ha podido guardar. Lo que has escrito sigue aquí. Inténtalo otra vez.",
  "vehicleForms.log.what": "Qué",
  "vehicleForms.log.when": "Cuándo",
  "vehicleForms.log.today": "Hoy",
  "vehicleForms.log.yesterday": "Ayer",
  "vehicleForms.log.otherDate": "Otra fecha",
  "vehicleForms.log.odometer": "Cuentakilómetros ({unit})",
  "vehicleForms.log.cost": "Coste (opcional)",
  "vehicleForms.log.notes": "Notas (opcional)",
  "subscribed.title": "Pro está activo.",
  "subscribed.body": "{vehicle} ya está en el plan. Te avisaremos antes de cada mantenimiento, no después.",
  "subscribed.unlocked": "También desbloqueado",
  "subscribed.cta": "Ver el plan",
};

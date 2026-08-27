import type { Fragment } from "./types";

/**
 * Brazilian Portuguese (pt-BR). Register: você, throughout.
 *
 * Brazil has no national periodic roadworthiness test, so `service.Inspection`
 * is "Vistoria" — the word an owner actually says ("levar o carro na vistoria")
 * for the state/Detran check and for the pre-sale check a buyer asks for.
 * "Inspeção veicular" was São Paulo's emissions programme, dead since 2014, and
 * reads like a defunct city rule rather than something on this car's calendar.
 * `service.Registration` is "Licenciamento": the annual CRLV paperwork, whose
 * IPVA instalments ride on the same yearly deadline.
 *
 * Garage vocabulary over dictionary vocabulary: "óleo do câmbio" not "fluido de
 * transmissão", "rodízio de pneus", "palhetas", "filtro de cabine". "Revisão" is
 * kept for the periodic service (and so for the interval screens, which is what
 * a manual calls them) and "manutenção" for upkeep in general; a single logged
 * item is a "serviço". iOS in Brazil calls its own Settings app "Ajustes", so
 * this app's settings are Ajustes too, and 70 mph became "110 por hora".
 */
export const ptBR: Fragment = {
  "evidence.records.label": "registros perdidos, sincronização falhando, sem como tirar os dados",
  "evidence.records.answer": "SQLite no seu celular. Exportação em CSV, grátis para sempre.",

  "evidence.price.label": "o preço, o paywall, ou quanto acabou custando",
  "evidence.price.answer": "A versão grátis é um app inteiro e usável. Um carro, histórico ilimitado.",

  "evidence.account.label": "conta e login antes de qualquer coisa funcionar",
  "evidence.account.answer": "Sem conta. Não existe login nenhum aqui.",

  "evidence.crashes.label": "travamentos, congelamentos e arquivos que não abriam",
  "evidence.crashes.answer": "Registros apagados ficam marcados, nunca são descartados.",

  "features.history.title": "Todo serviço, guardado para sempre",
  "features.history.subtitle":
    "Data, odômetro, custo e observações, com as linhas apagadas marcadas em vez de descartadas.",

  "features.due.title": "Vence por data e por distância",
  "features.due.subtitle": "O que vier primeiro, contado a partir dos intervalos de cada serviço.",

  "features.reminders.title": "Um lembrete por serviço",
  "features.reminders.subtitle": "No dia em que ele vence, e nada além disso.",

  "features.export.title": "Exporte tudo em CSV",
  "features.export.subtitle":
    "Grátis para sempre, para todos, para os seus registros nunca ficarem presos a uma assinatura.",

  "features.garage.title": "Mais de um veículo",
  "features.garage.subtitle": "A garagem inteira, cada carro com a sua própria programação.",

  "features.intervals.title": "Os seus próprios intervalos",
  "features.intervals.subtitle": "Mude qualquer um deles quando o manual não bater com o padrão.",

  "garage.title": "Garagem",
  "garage.logService": "Registrar um serviço",
  "garage.addVehicle": "Adicionar veículo",
  "garage.empty": "Nenhum veículo ainda. Adicione um e o Wrenchy começa a guardar o histórico.",
  "garage.storeUnreachable": "Não foi possível acessar a App Store. Tente de novo com uma conexão melhor.",

  "garage.badge.overdue": "Atrasado",
  "garage.badge.dueSoon": "Vence logo",

  "garage.odometer": "Odômetro",
  "garage.odometer.notSet": "Não informado",
  "garage.odometer.estimated": "Odômetro (est.)",

  "garage.over": "{distance} de atraso",
  "garage.dueNow": "vence agora",
  "garage.dueSoon": "vence logo",
  "garage.onSchedule": "em dia",

  "garage.noSchedule": "Sem programação ainda",
  "garage.noSchedule.detail": "registrado, sem acompanhamento",
  "garage.nothingLogged": "Nada registrado",
  "garage.nothingLogged.detail": "registre um serviço",

  "garage.openHistory": "Abrir histórico",
  "garage.openAndLog": "Abrir e registrar um serviço",

  "intervals.title": "Intervalos de revisão",
  "intervals.intro":
    "Com que frequência cada serviço vence. Mude qualquer um deles para bater com o seu carro, o manual, o clima onde você roda ou o quanto você exige dele.",
  "intervals.custom": "AJUSTADO",

  "intervals.untracked": "sem acompanhamento",
  "intervals.months": { one: "{count} mês", other: "{count} meses" },
  "intervals.monthsAndDistance": {
    one: "{count} mês · {distance}",
    other: "{count} meses · {distance}",
  },

  "intervals.help":
    "Vence pelo que vier primeiro. Deixe um campo vazio para ignorá-lo, então só distância ou só meses já é uma programação válida. Apague os dois para voltar ao padrão ({default}).",
  "intervals.field.months": "A cada (meses)",
  "intervals.field.distance": "A cada ({unit})",
  "intervals.error.positive":
    "Use números inteiros maiores que zero, ou deixe o campo vazio para ignorá-lo.",
  "intervals.save": "Salvar intervalo",
  "intervals.cancel": "Cancelar",

  "language.title": "Idioma",
  "language.intro":
    "O Wrenchy segue o seu celular, a não ser que você escolha um idioma aqui. Os nomes dos serviços usam as palavras que as oficinas usam naquele idioma.",
  "language.system": "Sistema",

  "layout.garage": "Garagem",
  "layout.settings": "Ajustes",
  "layout.intervals": "Intervalos de revisão",
  "layout.addVehicle": "Adicionar veículo",
  "layout.vehicle": "Veículo",
  "layout.logService": "Registrar um serviço",
  "layout.fatal.title": "O Wrenchy não conseguiu abrir os seus registros.",
  "layout.fatal.body":
    "Nada foi apagado, e o banco de dados voltou ao último estado bom. Abra o app de novo. Se continuar acontecendo, fale com o suporte antes de reinstalar, porque é a reinstalação que perderia os registros de verdade.",

  "offer.badge.pro": "Pro",
  "offer.badge.free": "Grátis",

  "offer.features.title": "O que você leva.",

  "offer.plan.title": "Este é o plano.",
  "offer.plan.subtitle": {
    one: "{count} serviço programado para o seu {vehicle}.",
    other: "{count} serviços programados para o seu {vehicle}.",
  },
  "offer.plan.cta": "Ativar lembretes",
  "offer.plan.decline": "Agora não",
  "offer.notify.title": "Nunca perca uma revisão.",
  "offer.plan.status.due": "Vencido",
  "offer.plan.status.soon": "Logo",
  "offer.plan.status.ok": "OK",

  "offer.paywall.title": "Carros não avisam. Isto avisa.",
  "offer.paywall.subtitle": "Cada serviço e cada leitura, registrados.",
  "offer.paywall.cta": "Deixar meu carro registrado",
  "offer.paywall.vehicle": "Registrado",
  "offer.paywall.scheduled": "Agora vigiados",
  "offer.paywall.services": { one: "serviço", other: "serviços" },
  "offer.paywall.dueNow": "Atrasados hoje",
  "offer.paywall.nextUp": "Próximo aviso",
  "offer.paywall.none": "Nenhum",

  "offer.paywall.impact.legend": "O que isso vale",
  "offer.paywall.impact.warned": "Você fica sabendo de uma revisão antes do prazo, não depois do conserto.",
  "offer.paywall.impact.upsell": "Você chega na oficina sabendo o que foi feito e quando, então nada é vendido duas vezes.",
  "offer.paywall.impact.resale": "Você entrega ao próximo dono um histórico completo em vez de um ombro encolhido, e isso aparece no preço.",

  "offer.trial.title": { one: "Teste por {count} dia.", other: "Teste por {count} dias." },
  "offer.trial.cta": {
    one: "Começar meu {count} dia grátis",
    other: "Começar meus {count} dias grátis",
  },
  "offer.trial.decline": "Não, quero ver o app grátis",

  "offer.winback.title": "Você parou de registrar.",
  "offer.winback.decline": "Só me leve para a minha garagem",
  "offer.winback.body":
    "Os seus registros estão exatamente onde você deixou. Nada expirou, nada foi apagado e nada precisa ser configurado de novo.",
  "offer.winback.feedback": "Conte o que deu errado",
  "offer.winback.feedbackNote": "Um formulário curto, abre no Safari",
  "offer.winback.caption": {
    one: "Ou dê mais uma chance: {count} dia de Pro, de graça. Cancele antes de acabar e você não paga nada.",
    other:
      "Ou dê mais uma chance: {count} dias de Pro, de graça. Cancele antes de acabarem e você não paga nada.",
  },

  "onboardingA.continue": "Continuar",

  "onboardingA.welcome.headline": "Nunca mais adivinhe quando foi a última troca de óleo.",
  "onboardingA.welcome.start": "Começar",
  "onboardingA.welcome.privacy": "Sem conta. Nada sai do seu celular.",

  "onboardingA.vehicle.title": "O que você dirige?",
  "onboardingA.vehicle.year": "Ano",
  "onboardingA.vehicle.makeOptional": "Marca (opcional)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",
  "onboardingA.vehicle.modelOptional": "Modelo (opcional)",

  "onboardingA.odometer.title.mi": "Quantas milhas ele tem?",
  "onboardingA.odometer.title.km": "Quantos quilômetros ele tem?",
  "onboardingA.odometer.field": "Odômetro ({unit})",
  "onboardingA.odometer.placeholder.mi": "84.210",
  "onboardingA.odometer.placeholder.km": "135.600",
  "onboardingA.odometer.caption": "Um número aproximado já serve.",

  "onboardingA.drive.title": "Quanto você roda com ele?",
  "onboardingA.drive.legend": "Distância por ano ({unit})",
  "onboardingA.drive.low.mi": "Menos de 5.000",
  "onboardingA.drive.low.km": "Menos de 8.000",
  "onboardingA.drive.average.mi": "5.000 a 10.000",
  "onboardingA.drive.average.km": "8.000 a 16.000",
  "onboardingA.drive.high.mi": "10.000 a 15.000",
  "onboardingA.drive.high.km": "16.000 a 24.000",
  "onboardingA.drive.very_high.mi": "Mais de 15.000",
  "onboardingA.drive.very_high.km": "Mais de 24.000",
  "onboardingA.drive.projection": "Cerca de {distance} nesta época no ano que vem.",
  "onboardingA.drive.caption": "Mais ou menos já serve.",

  "onboardingB.continue": "Continuar",

  "onboardingB.service.title": "O que você fez por último?",
  "onboardingB.service.subtitle": "Mais ou menos já basta.",
  "onboardingB.service.legend": "Serviço",
  "onboardingB.service.when": "{service}: quando foi?",
  "onboardingB.service.whenOther": "Quando foi o serviço?",
  "onboardingB.service.whenPending": "Quando foi?",
  "onboardingB.service.somethingElse": "Outra coisa",
  "onboardingB.service.ago.now": "Agora mesmo",
  "onboardingB.service.ago.lastMonth": "No mês passado",
  "onboardingB.service.ago.months3": "Há 3 meses",
  "onboardingB.service.ago.months6": "Há 6 meses",
  "onboardingB.service.ago.notSure": "Não sei",

  "onboardingB.tracking.title": "Como você controla isso hoje?",
  "onboardingB.tracking.legend": "Hoje",
  "onboardingB.tracking.memory": "De cabeça",
  "onboardingB.tracking.receipts": "Notas no carro",
  "onboardingB.tracking.spreadsheet": "Uma planilha",
  "onboardingB.tracking.dealer": "A oficina guarda",
  "onboardingB.tracking.nothing": "Nada",

  "onboardingB.worry.title": "O que você quer evitar?",
  "onboardingB.worry.subtitle": "Marque quantas quiser.",
  "onboardingB.worry.bills": "Conta de oficina inesperada",
  "onboardingB.worry.missed": "Perder uma revisão",
  "onboardingB.worry.records": "Perder o histórico",
  "onboardingB.worry.resale": "Valor de revenda",
  "onboardingB.worry.upsell": "Empurrarem serviço",

  "onboardingB.analyzing.title": "Montando a programação.",
  "onboardingB.analyzing.odometer": "{vehicle} com {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} intervalo de revisão aplicado",
    other: "{count} intervalos de revisão aplicados",
  },
  "onboardingB.analyzing.rate": "{distance} por ano",
  "onboardingB.analyzing.rateProjected": "{distance} por ano, então {projected} no ano que vem",
  "onboardingB.analyzing.clear": "Nada precisa de atenção hoje",
  "onboardingB.analyzing.due": {
    one: "{count} precisa de atenção, {soon} chegando",
    other: "{count} precisam de atenção, {soon} chegando",
  },
  "onboardingB.analyzing.done": "Pronto",
  "onboardingB.analyzing.progress": "Leitura {index} de {total}",

  "onboardingC.back": "Voltar",
  "onboardingC.question": "Pergunta {step} / {total}",

  "onboardingC.results.overdue": {
    one: "Um serviço já está atrasado.",
    other: "{count} serviços já estão atrasados.",
  },
  "onboardingC.results.noneLogged": "Nada do que você registrou está atrasado.",
  "onboardingC.results.noneYet": "Nada está atrasado ainda.",
  "onboardingC.results.clear": "Nada está atrasado, e nada está perto de vencer.",
  "onboardingC.results.subtitle": "Seu {vehicle}, {distance} por ano.",
  "onboardingC.results.continue": "Continuar",
  "onboardingC.results.dueNow": "Vence agora",
  "onboardingC.results.soon": "Logo",
  "onboardingC.results.onFile": "Registrados",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Vencido",
  "onboardingC.results.status.soon": "Logo",
  "onboardingC.results.status.ok": "OK",

  "onboardingC.symptoms.next": "Continuar",
  "onboardingC.symptoms.last": "E o que eu faço",

  "onboardingC.help.title": "Os três são o mesmo problema.",
  "onboardingC.help.subtitle": "Nada está anotado de um jeito que possa te avisar.",
  "onboardingC.help.continue": "Continuar",

  "onboardingC.reviews.title": "Este app existe por causa destas avaliações.",
  "onboardingC.reviews.subtitle": {
    one: "{count} das {total} avaliações na App Store de apps que já fazem isso é de uma a três estrelas.",
    other: "{count} das {total} avaliações na App Store de apps que já fazem isso são de uma a três estrelas.",
  },
  "onboardingC.reviews.continue": "Continuar",
  "onboardingC.reviews.scroll": "Role para ler todas as quatro",
  "onboardingC.reviews.mentioning": "Avaliações citando",

  "pain.overdue.legend": "Atrasado",
  "pain.overdue.headline": {
    one: "Um serviço já está atrasado",
    other: "{count} serviços já estão atrasados",
  },
  "pain.overdue.body":
    "No seu {vehicle}, hoje. Nada no painel vai avisar, porque a luz acende depois do estrago, não antes.",
  "pain.overdue.fix":
    "Todo serviço contado por data e por distância, e avisado antes de o número ficar negativo.",

  "pain.blind.legend": "Sem registro",
  "pain.blind.headline": {
    one: "{count} de {total} serviços não tem nada registrado",
    other: "{count} de {total} serviços não têm nada registrado",
  },
  "pain.blind.body":
    "O Wrenchy não consegue provar o que nunca viu, e você também não. Até que algo diga o contrário, todos eles são tratados como vencidos.",
  "pain.blind.fix":
    "Registre um e toda a programação dele começa. Trinta segundos cada, uma vez só.",

  "pain.memory.legend": "De cabeça",
  "pain.memory.headline": "A única cópia está na sua cabeça",
  "pain.memory.body":
    "Você disse que vai de cabeça. A memória aguenta bem até a pergunta \u201cquando exatamente?\u201d chegar no balcão da oficina, na revenda, ou com uma luz acesa a 110 por hora.",
  "pain.memory.fix":
    "Todo serviço que você registra é gravado neste celular e fica lá. Sem conta para perder o acesso.",

  "pain.nothing.legend": "Sem controle",
  "pain.nothing.headline": "Nada sobre este carro está anotado",
  "pain.nothing.body":
    "Nem a última troca de óleo, nem a quilometragem em que ela foi feita. O único registro está com o carro, e o jeito que ele te conta é quebrando.",
  "pain.nothing.fix":
    "Um toque registra um serviço. Daí em diante o histórico existe fora do carro.",

  "pain.receipts.legend": "No porta-luvas",
  "pain.receipts.headline": "Porta-luvas não é índice",
  "pain.receipts.body":
    "A nota prova que o serviço foi feito. Ela não diz o que vence em seguida, não está em ordem nenhuma, e papel térmico apaga até ficar em branco.",
  "pain.receipts.fix":
    "As mesmas notas como linhas com data, que você ordena, busca e exporta em CSV.",

  "pain.spreadsheet.legend": "Em uma planilha",
  "pain.spreadsheet.headline": "Planilha não te dá um toque no ombro",
  "pain.spreadsheet.body":
    "Ela guarda o histórico direito. Só nunca se abre sozinha, e o que você precisa dela é justamente um aviso que você não pensaria em ir procurar.",
  "pain.spreadsheet.fix":
    "As mesmas linhas, mais uma notificação no dia em que um serviço vence.",

  "pain.dealer.legend": "Na oficina",
  "pain.dealer.headline": "O histórico da oficina é da oficina",
  "pain.dealer.body":
    "Completo até você trocar de oficina, mudar de cidade ou vender o carro, e visível para quem escreve o seu orçamento, não para você.",
  "pain.dealer.fix":
    "A sua própria cópia, no seu próprio celular, exportável quando você quiser.",

  "pain.bills.legend": "A conta",
  "pain.bills.headline": "Manutenção adiada não é dinheiro economizado",
  "pain.bills.body":
    "É o mesmo dinheiro mais tarde, com um reboque na frente. Os serviços que saem caro quando falham são os baratos que ninguém estava contando.",
  "pain.bills.fix": "Todo intervalo contado, para o serviço barato continuar barato.",

  "pain.missed.legend": "O esquecimento",
  "pain.missed.headline": "Nada te lembra até já estar tarde",
  "pain.missed.body":
    "Ninguém deixa de fazer um serviço de propósito. Passa batido numa terça comum, e de novo na semana seguinte, e o odômetro continua girando.",
  "pain.missed.fix":
    "Uma notificação por serviço, no dia em que ele vence. Nada além disso, nunca.",

  "pain.records.legend": "A prova",
  "pain.records.headline": "Serviço sem comprovação é serviço não feito",
  "pain.records.body":
    "Uma garantia, uma revenda, uma discussão com a oficina: todas pedem o registro, não a sua lembrança dele.",
  "pain.records.fix":
    "Um histórico com data que você exporta em CSV. Grátis para sempre, para todos, assinante ou não.",

  "pain.resale.legend": "Revenda",
  "pain.resale.headline": "Histórico completo vale mais que histórico limpo",
  "pain.resale.body":
    "O comprador desconta o que você não consegue mostrar, e a loja que pega o carro na troca faz o mesmo. O carro vale só o que você consegue provar sobre ele.",
  "pain.resale.fix":
    "Exporte o histórico inteiro em CSV e entregue. Nada disso fica preso na assinatura.",

  "pain.upsell.legend": "O balcão",
  "pain.upsell.headline": "Eles sabem o seu histórico. Você não.",
  "pain.upsell.body":
    "\u201cQuando foi a última revisão dos freios?\u201d não é pergunta para adivinhar enquanto alguém te passa um orçamento dela.",
  "pain.upsell.fix": "A data e a quilometragem, na tela do balcão em dois toques.",

  "pain.vehicleFallback": "carro",

  "plan.line.nothing": "Nada registrado",
  "plan.line.about": "por volta de {date}",
  "plan.line.noInterval": "Sem intervalo definido",

  "service.Oil Change": "Troca de óleo",
  "service.Tire Rotation": "Rodízio de pneus",
  "service.Brake Inspection": "Revisão dos freios",
  "service.Air Filter": "Filtro de ar",
  "service.Cabin Air Filter": "Filtro de cabine",
  "service.Wiper Blades": "Palhetas",
  "service.Battery Check": "Teste da bateria",
  "service.Coolant Flush": "Fluido de arrefecimento",
  "service.Transmission Fluid": "Óleo do câmbio",
  "service.Spark Plugs": "Velas de ignição",
  "service.Registration": "Licenciamento",
  "service.Inspection": "Vistoria",
  "service.Other": "Outro",

  "settings.title": "Ajustes",
  "settings.privacy":
    "Os seus registros ficam só neste celular. Sem conta, sem servidor. Exporte quando quiser, porque a exportação nunca é bloqueada.",

  "settings.export": "Exportar todos os registros (CSV)",
  "settings.export.error":
    "Não foi possível abrir o compartilhamento. Os seus registros não mudaram.",

  "settings.intervals": "Intervalos de revisão",

  "settings.language": "Idioma: {language}",
  "settings.units": "Unidade: {unit}",
  "settings.units.title": "Mudar para {unit}?",
  "settings.units.body":
    "Cada leitura de odômetro e cada intervalo que você salvou vai ser convertido de {from} para {to}. Uma leitura de 50.000 {from} passa a ser {example}.",
  "settings.units.cancel": "Cancelar",
  "settings.units.confirm": "Converter",

  "settings.reminders.enable": "Ativar lembretes",
  "settings.reminders.blocked": "Lembretes bloqueados, abra os Ajustes do iPhone",
  "settings.reminders.none": "Lembretes ativos, nada vencendo ainda",
  "settings.reminders.on": {
    one: "Lembretes ativos, {count} agendado",
    other: "Lembretes ativos, {count} agendados",
  },
  "settings.reminders.onNext": {
    one: "Lembretes ativos, {count} agendado, próximo {date}",
    other: "Lembretes ativos, {count} agendados, próximo {date}",
  },
  "settings.reminders.scheduled": "Lembretes agendados.",
  "settings.reminders.denied": "Lembretes negados. Você pode ativar nos Ajustes do iPhone.",
  "settings.reminders.error": "Não foi possível pedir permissão para notificações.",
  "settings.reminders.openSettings":
    "Abra Ajustes › Wrenchy › Notificações para reativar os lembretes.",

  "settings.manage": "Gerenciar assinatura",
  "settings.manage.error":
    "Não foi possível abrir os ajustes da assinatura. Tente de novo com uma conexão melhor.",
  "settings.upgrade": "Assinar o Pro",
  "settings.restore": "Restaurar compras",
  "settings.restore.done": "Pro restaurado.",
  "settings.restore.none": "Nenhuma compra encontrada.",
  "settings.store.error": "Não foi possível acessar a App Store. Tente de novo com uma conexão melhor.",
  "settings.pro.on": "O Pro está ativo. Obrigado.",
  "settings.offer.applied": "Essa oferta já está aplicada. Não há mais nada a fazer.",

  "settings.replay": "Refazer a introdução",
  "settings.replay.title": "Refazer a introdução?",
  "settings.replay.body":
    "Os seus veículos e registros são mantidos. Passar pelo fluxo de novo adiciona outro veículo, que você pode apagar depois.",
  "settings.replay.cancel": "Cancelar",
  "settings.replay.confirm": "Refazer",

  "system.notify.title": "Seu {vehicle}: {service} est\u00e1 na hora",
  "system.notify.body": "Última vez: {date}.",

  "system.notify.when.today": "Hoje",
  "system.notify.when.tomorrow": "Amanh\u00e3",
  "system.notify.when.days": { one: "Em {count} dia", other: "Em {count} dias" },
  "system.notify.when.months": { one: "Em {count} m\u00eas", other: "Em {count} meses" },

  "system.csv.header.vehicle": "Veículo",
  "system.csv.header.service": "Serviço",
  "system.csv.header.date": "Data",
  "system.csv.header.odometer": "Odômetro ({unit})",
  "system.csv.header.cost": "Custo",
  "system.csv.header.notes": "Observações",
  "system.csv.header.deleted": "Apagado",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Testar o Pro grátis",
  "system.quickaction.trial.subtitle": {
    one: "{count} dia, depois renova se você não cancelar",
    other: "{count} dias, depois renova se você não cancelar",
  },
  "system.quickaction.feedback.title": "Enviar feedback",
  "system.quickaction.feedback.subtitle": "Conte o que deu errado",

  "system.vehicle.fallback": "Meu carro",

  "unit.mi": "{value} mi",
  "unit.km": "{value} km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  "vehicle.title": "Veículo",

  "vehicle.odometer": "Odômetro",
  "vehicle.odometer.notSet": "Não informado",
  "vehicle.odometer.estimated": "Odômetro (est.)",
  "vehicle.lastService": "Último serviço",
  "vehicle.lastService.none": "Nenhum ainda",

  "vehicle.due": "Vence agora",
  "vehicle.history": "Histórico",
  "vehicle.history.empty":
    "Nenhum serviço registrado ainda. Registre a última coisa que você fez no carro.",

  "vehicle.over": "{distance} de atraso",
  "vehicle.dueOn": "vence {date}",
  "vehicle.dueNow": "vence agora",
  "vehicle.dueSoon": "vence logo",

  "vehicle.badge.overdue": "Atrasado",
  "vehicle.badge.soon": "Logo",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Apagar",
  "vehicle.serviceDeleted": "Serviço apagado",
  "vehicle.undo": "Desfazer",
  "vehicle.logService": "Registrar um serviço",

  "vehicle.deleteVehicle": "Apagar veículo",
  "vehicle.delete.title": "Apagar {name}?",
  "vehicle.delete.body":
    "Ele sai da sua garagem junto com o histórico de serviços. Registros já exportados continuam naquele arquivo.",
  "vehicle.delete.cancel": "Cancelar",
  "vehicle.delete.confirm": "Apagar",

  "vehicleForms.new.title": "Adicionar veículo",
  "vehicleForms.new.save": "Salvar",
  "vehicleForms.new.name": "Nome",
  "vehicleForms.new.namePlaceholder": "Civic 2019",
  "vehicleForms.new.odometer": "Odômetro atual ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Registrar um serviço",
  "vehicleForms.log.save": "Salvar",
  "vehicleForms.log.error": "Não foi possível salvar. O que você digitou está aqui. Tente de novo.",
  "vehicleForms.log.what": "O quê",
  "vehicleForms.log.when": "Quando",
  "vehicleForms.log.today": "Hoje",
  "vehicleForms.log.yesterday": "Ontem",
  "vehicleForms.log.otherDate": "Outra data",
  "vehicleForms.log.odometer": "Odômetro ({unit})",
  "vehicleForms.log.cost": "Custo (opcional)",
  "vehicleForms.log.notes": "Observações (opcional)",
};

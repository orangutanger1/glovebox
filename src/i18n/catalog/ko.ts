import type { Fragment } from "./types";

/**
 * Korean (ko-KR). Register: 해요체 throughout — the friendly-polite form Korean
 * consumer apps use. No 합니다체 (too much like a dealer letter) and no bare
 * 한다체, and 〜해 주세요 only where the app is genuinely asking for an action.
 *
 * Deliberate choices a reviewer would otherwise question:
 * - `service.Inspection` is **자동차 정기검사**, the statutory KOTSA/TS periodic
 *   inspection every owner is summoned to. The dictionary word 점검 is a
 *   voluntary check-up and would name the wrong event.
 * - `service.Registration` is **자동차세**, the recurring vehicle tax that is the
 *   Korean equivalent of the recurring paperwork this key stands for — not
 *   등록, which happens once.
 * - Garage vocabulary, not dictionary vocabulary: 엔진오일 교환, 타이어 위치 교환,
 *   브레이크 점검, 점화플러그, 에어컨 필터 (cabin) against 에어 필터 (engine),
 *   부동액 교환, 변속기 오일, 와이퍼 블레이드, 배터리 점검.
 * - **차계부** is the word Korean owners actually use for a car log book, so it
 *   carries `vehicle.history`; elsewhere the plain 기록 reads better.
 * - Korean has one CLDR plural category, so every plural entry is `other` alone.
 * - Korean particles have vowel/consonant allomorphs (은/는, 이/가, 와/과,
 *   로/으로) that cannot be chosen for a runtime value, so no sentence here
 *   attaches a particle directly behind `{name}`, `{value}`, `{distance}`,
 *   `{example}` or `{date}`. Those spots use a comma, 에, 쯤, 기준 or a colon
 *   instead — that is why a few clauses are shaped differently from English.
 * - `unit.mi` / `unit.km` drop the space before the abbreviation, which is how
 *   Korean odometers and Korean apps print it.
 * - Korea is metric: the mile variants keep their US-round numbers for the
 *   markets that get them, and the km variants keep the metric ones.
 */
export const ko: Fragment = {
  // evidence
  "evidence.records.label": "정비 기록 분실, 동기화 실패, 데이터를 빼낼 방법 없음",
  "evidence.records.answer": "휴대폰 안 SQLite에 저장해요. CSV 내보내기는 영구 무료예요.",

  "evidence.price.label": "가격, 결제 유도, 결국 들어간 비용",
  "evidence.price.answer": "무료로도 앱 하나가 온전히 돌아가요. 차 한 대, 기록은 무제한.",

  "evidence.account.label": "무엇을 하기도 전에 요구하는 계정과 로그인",
  "evidence.account.answer": "계정이 없어요. 로그인할 곳 자체가 없어요.",

  "evidence.crashes.label": "강제 종료, 멈춤, 열리지 않는 파일",
  "evidence.crashes.answer": "삭제한 기록은 삭제 표시만 남기고, 실제로 버리지 않아요.",

  // features
  "features.history.title": "모든 정비를 계속 보관",
  "features.history.subtitle":
    "날짜, 주행거리, 비용, 메모까지. 삭제한 행도 삭제 표시만 남고 버려지지 않아요.",

  "features.due.title": "날짜와 주행거리로 오는 기한",
  "features.due.subtitle": "정비별 주기에서 계산해서, 둘 중 먼저 오는 쪽이 기준이에요.",

  "features.reminders.title": "정비마다 알림 한 번",
  "features.reminders.subtitle": "기한이 되는 날 한 번, 그 외에는 아무것도 없어요.",

  "features.export.title": "전체 기록을 CSV로 내보내기",
  "features.export.subtitle":
    "누구에게나 영구 무료라서, 내 기록이 구독에 묶이는 일이 없어요.",

  "features.garage.title": "차량 여러 대",
  "features.garage.subtitle": "차고 전체를, 각자 자기 일정으로.",

  "features.intervals.title": "나만의 정비 주기",
  "features.intervals.subtitle": "정비 지침서가 기본값과 다르면 어느 것이든 바꿀 수 있어요.",

  // garage
  "garage.title": "차고",
  "garage.logService": "정비 기록하기",
  "garage.addVehicle": "차량 추가",
  "garage.empty": "아직 차량이 없어요. 한 대 추가하면 Wrenchy가 차계부를 쓰기 시작해요.",
  "garage.storeUnreachable": "스토어에 연결하지 못했어요. 통신이 잘 되는 곳에서 다시 시도해 주세요.",

  "garage.badge.overdue": "기한 초과",
  "garage.badge.dueSoon": "기한 임박",

  "garage.odometer": "주행거리",
  "garage.odometer.notSet": "미입력",
  "garage.odometer.estimated": "주행거리(추정)",

  "garage.over": "{distance} 초과",
  "garage.dueNow": "지금 기한",
  "garage.dueSoon": "기한 임박",
  "garage.onSchedule": "일정대로",

  "garage.noSchedule": "일정 없음",
  "garage.noSchedule.detail": "기록만, 추적 안 함",
  "garage.nothingLogged": "기록 없음",
  "garage.nothingLogged.detail": "정비 추가하기",

  "garage.openHistory": "차계부 열기",
  "garage.openAndLog": "열어서 정비 기록하기",

  // intervals
  "intervals.title": "정비 주기",
  "intervals.intro":
    "정비마다 기한이 얼마나 자주 오는지예요. 내 차, 정비 지침서, 주행하는 기후, 얼마나 험하게 타는지에 맞춰 어느 것이든 바꿀 수 있어요.",
  "intervals.custom": "직접 설정",

  "intervals.untracked": "추적 안 함",
  "intervals.months": { other: "{count}개월" },
  "intervals.monthsAndDistance": {
    other: "{count}개월 · {distance}",
  },

  "intervals.help":
    "둘 중 먼저 오는 쪽이 기한이에요. 칸을 비워 두면 그 조건은 무시하니까, 거리만 또는 개월만으로도 유효한 일정이에요. 둘 다 지우면 기본값({default})으로 돌아가요.",
  "intervals.field.months": "주기(개월)",
  "intervals.field.distance": "주기({unit})",
  "intervals.error.positive": "0보다 큰 정수를 넣거나, 무시하려면 칸을 비워 두세요.",
  "intervals.save": "주기 저장",
  "intervals.cancel": "취소",

  // language
  "language.title": "언어",
  "language.intro":
    "여기서 언어를 고르지 않으면 Wrenchy는 휴대폰 설정을 따라가요. 정비 이름은 그 언어의 정비소에서 쓰는 말로 나와요.",
  "language.system": "시스템",

  // layout
  "layout.garage": "차고",
  "layout.settings": "설정",
  "layout.intervals": "정비 주기",
  "layout.addVehicle": "차량 추가",
  "layout.vehicle": "차량",
  "layout.logService": "정비 기록하기",
  "layout.fatal.title": "Wrenchy가 기록을 열지 못했어요.",
  "layout.fatal.body":
    "삭제된 것은 없고, 데이터베이스는 마지막 정상 상태로 되돌렸어요. 앱을 다시 열어 주세요. 계속 이러면 재설치하기 전에 먼저 문의해 주세요. 기록이 실제로 사라지는 건 재설치 쪽이에요.",

  // offer
  "offer.badge.pro": "Pro",
  "offer.badge.free": "무료",

  "offer.features.title": "받게 되는 것들이에요.",
  "offer.features.subtitle":
    "전부 이 휴대폰 안 파일 하나에 들어가요. 계정도 서버도 없어요.",
  "offer.features.cta": "계속",

  "offer.plan.title": "계획은 이래요.",
  "offer.plan.subtitle": {
    other:
      "{vehicle} 기준으로 정비 {count}건을 일정에 올렸어요. 날짜와 주행거리로 함께 계산해요.",
  },
  "offer.plan.cta": "알림 켜기",
  "offer.plan.decline": "지금은 안 할게요",
  "offer.plan.status.due": "기한",
  "offer.plan.status.soon": "임박",
  "offer.plan.status.ok": "정상",
  "offer.plan.note": "정비마다 기한이 되는 날 알림 한 번이에요.",
  "offer.plan.noteMore": {
    other:
      "여기에 더 뒤로 {count}건이 있고, 정비마다 기한이 되는 날 알림 한 번이에요.",
  },

  "offer.paywall.title": "차는 미리 알려주지 않아요. 이 앱이 알려줘요.",
  "offer.paywall.subtitle":
    "정비와 주행거리 기록이 모두 남아요. 정비소는 추측이 아니라 기록을 봅니다.",
  "offer.paywall.cta": "내 차 기록으로 남기기",
  "offer.paywall.vehicle": "기록 완료",
  "offer.paywall.scheduled": "관리 시작",
  "offer.paywall.services": { other: "건" },
  "offer.paywall.dueNow": "기한 지남",
  "offer.paywall.nextUp": "다음 알림",
  "offer.paywall.none": "없음",
  "offer.paywall.caption":
    "지금 설정한 내용은 이미 이 휴대폰에 저장돼 있어요. 계정도, 서버도 없고 어디로도 전송되지 않아요.",

  "offer.trial.title": { other: "{count}일 동안 써 보세요." },
  "offer.trial.subtitle": {
    other:
      "Pro를 {count}일 동안 무료로 쓰고, 차가 실제로 뭔가 알려준 다음에 결정해요.",
  },
  "offer.trial.cta": { other: "무료 {count}일 시작하기" },
  "offer.trial.decline": "괜찮아요, 무료 앱으로 볼게요",
  "offer.trial.caption": "끝나기 전에 설정에서 해지하면 한 푼도 안 나가요.",

  "offer.winback.title": "기록이 멈춰 있어요.",
  "offer.winback.decline": "그냥 차고로 갈게요",
  "offer.winback.body":
    "기록은 두고 간 그대로예요. 만료된 것도, 삭제된 것도 없고, 다시 설정할 것도 없어요.",
  "offer.winback.feedback": "무엇이 문제였는지 알려주세요",
  "offer.winback.feedbackNote": "짧은 양식이고, Safari에서 열려요",
  "offer.winback.caption": {
    other:
      "아니면 한 번 더 해 볼까요. Pro {count}일, 무료예요. 끝나기 전에 해지하면 한 푼도 안 나가요.",
  },

  // onboardingA
  "onboardingA.continue": "계속",

  "onboardingA.welcome.headline": "마지막 엔진오일 교환이 언제였는지 더는 짐작하지 않아요.",
  "onboardingA.welcome.start": "시작하기",
  "onboardingA.welcome.privacy":
    "전부 이 휴대폰에만 남아요. 계정도 없고, 로그아웃할 것도 없어요.",

  "onboardingA.vehicle.title": "어떤 차를 타세요?",
  "onboardingA.vehicle.year": "연식",
  "onboardingA.vehicle.makeOptional": "제조사(선택)",
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",
  "onboardingA.vehicle.saved": '저장했어요: "{name}". 이름은 나중에 바꿀 수 있어요.',
  "onboardingA.vehicle.modelOptional": "모델(선택)",
  "onboardingA.vehicle.hint":
    "연식만 있어도 시작할 수 있어요. 제조사와 모델은 알림이 차 이름을 부를 때만 써요.",

  "onboardingA.odometer.title.mi": "주행거리가 몇 마일이에요?",
  "onboardingA.odometer.title.km": "주행거리가 몇 킬로미터예요?",
  "onboardingA.odometer.field": "주행거리({unit})",
  "onboardingA.odometer.placeholder.mi": "84,210",
  "onboardingA.odometer.placeholder.km": "135,600",
  "onboardingA.odometer.caption":
    "대략이어도 괜찮아요. 주행거리로 기한이 오는 정비는 이 숫자로 계산해요.",
  "onboardingA.odometer.later": "나중에 입력할게요",

  "onboardingA.drive.title": "한 해에 얼마나 타세요?",
  "onboardingA.drive.subtitle":
    "대략으로요. 거리 주기를 날짜로 바꿔 주는 숫자예요.",
  "onboardingA.drive.legend": "연간 주행거리({unit})",
  "onboardingA.drive.low.mi": "5,000 미만",
  "onboardingA.drive.low.km": "8,000 미만",
  "onboardingA.drive.average.mi": "5,000~10,000",
  "onboardingA.drive.average.km": "8,000~16,000",
  "onboardingA.drive.high.mi": "10,000~15,000",
  "onboardingA.drive.high.km": "16,000~24,000",
  "onboardingA.drive.very_high.mi": "15,000 초과",
  "onboardingA.drive.very_high.km": "24,000 초과",
  "onboardingA.drive.projection":
    "그 속도라면 내년 이맘때 이 차의 주행거리는 약 {distance} 정도예요.",
  "onboardingA.drive.caption":
    "달력이 아니라 주행거리로 기한이 오는 정비의 날짜를 계산할 때 써요.",

  // onboardingB
  "onboardingB.continue": "계속",

  "onboardingB.service.title": "마지막으로 받은 정비가 뭐예요?",
  "onboardingB.service.subtitle": "대충 맞으면 돼요. 나중에 고칠 수 있어요.",
  "onboardingB.service.legend": "정비",
  "onboardingB.service.caption": "하나만 고르면 돼요. 나머지는 언제든 기록할 수 있어요.",
  "onboardingB.service.when": "{service}, 언제였어요?",
  "onboardingB.service.whenOther": "그 정비는 언제였어요?",
  "onboardingB.service.whenPending": "언제였어요?",
  "onboardingB.service.somethingElse": "그 외",
  "onboardingB.service.ago.now": "방금",
  "onboardingB.service.ago.lastMonth": "지난달",
  "onboardingB.service.ago.months3": "3개월 전",
  "onboardingB.service.ago.months6": "6개월 전",
  "onboardingB.service.ago.notSure": "잘 모르겠어요",

  "onboardingB.tracking.title": "지금은 어떻게 관리하세요?",
  "onboardingB.tracking.subtitle": "무엇이든, 대부분의 사람보다는 하고 있는 거예요.",
  "onboardingB.tracking.legend": "현재",
  "onboardingB.tracking.caption":
    "무엇을 고르든, Wrenchy는 기록한 걸 전부 무료로 CSV로 내보내요.",
  "onboardingB.tracking.memory": "기억",
  "onboardingB.tracking.receipts": "차 안 영수증",
  "onboardingB.tracking.spreadsheet": "스프레드시트",
  "onboardingB.tracking.dealer": "정비소가 관리해요",
  "onboardingB.tracking.nothing": "아무것도 안 해요",

  "onboardingB.worry.title": "무엇을 피하고 싶으세요?",
  "onboardingB.worry.subtitle":
    "해당되는 건 다 고르세요. 앱이 무엇을 먼저 보여줄지 여기서 정해져요.",
  "onboardingB.worry.caption":
    "마지막이에요. 다음 화면은 앱이 아니라 내 차 이야기예요.",
  "onboardingB.worry.bills": "갑작스러운 수리비",
  "onboardingB.worry.missed": "정비 놓치기",
  "onboardingB.worry.records": "기록 분실",
  "onboardingB.worry.resale": "중고차 가치",
  "onboardingB.worry.upsell": "과잉 정비 권유",
  "onboardingB.worry.optional": "모두 선택이에요. 건너뛰어도 다음 화면은 당신의 차만으로 만들어져요.",

  "onboardingB.analyzing.title": "일정을 계산하고 있어요.",
  "onboardingB.analyzing.odometer": "{vehicle}, {distance}",
  "onboardingB.analyzing.intervals": {
    other: "정비 주기 {count}개 적용",
  },
  "onboardingB.analyzing.rate": "연간 {distance}",
  "onboardingB.analyzing.rateProjected": "연간 {distance}, 내년에는 {projected}",
  "onboardingB.analyzing.clear": "오늘 손볼 건 없어요",
  "onboardingB.analyzing.due": {
    other: "{count}건은 손봐야 하고, {soon}건이 곧 와요",
  },
  "onboardingB.analyzing.done": "완료",
  "onboardingB.analyzing.progress": "{total}개 중 {index}개 확인",

  // onboardingC
  "onboardingC.back": "뒤로",
  "onboardingC.question": "질문 {step} / {total}",

  "onboardingC.results.overdue": {
    other: "정비 {count}건이 이미 기한을 넘겼어요.",
  },
  "onboardingC.results.noneLogged": "기록한 것 중에 기한을 넘긴 건 없어요.",
  "onboardingC.results.noneYet": "아직 기한을 넘긴 건 없어요.",
  "onboardingC.results.clear": "기한을 넘긴 것도, 임박한 것도 없어요.",
  "onboardingC.results.subtitle":
    "{vehicle} 기준으로 연간 {distance}, 그리고 기록한 내용으로 계산했어요.",
  "onboardingC.results.continue": "계속",
  "onboardingC.results.dueNow": "지금 기한",
  "onboardingC.results.soon": "임박",
  "onboardingC.results.onFile": "기록 있음",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "기한",
  "onboardingC.results.status.soon": "임박",
  "onboardingC.results.status.ok": "정상",
  "onboardingC.results.next":
    "다음 정비는 {date}에 와요. 날짜와 주행거리 중 먼저 오는 쪽이 기준이에요.",
  "onboardingC.results.countdown":
    "모든 정비를 날짜와 주행거리로 함께 카운트해서, 먼저 오는 쪽을 기한으로 알려줘요.",

  "onboardingC.symptoms.next": "계속",
  "onboardingC.symptoms.last": "그럼 어떻게 하면 되나요",

  "onboardingC.help.title": "셋 다 같은 문제예요.",
  "onboardingC.help.subtitle":
    "경고해 줄 수 있는 형태로 아무것도 적혀 있지 않다는 것. Wrenchy가 하는 일이 딱 그거예요.",
  "onboardingC.help.continue": "계속",

  "onboardingC.reviews.title": "이 앱은 이것들 때문에 있어요.",
  "onboardingC.reviews.subtitle": {
    other:
      "이미 이 일을 하는 앱 {apps}개의 App Store 리뷰 {total}개 중 {count}개가 별 1~3개예요.",
  },
  "onboardingC.reviews.continue": "계속",
  "onboardingC.reviews.scroll": "네 개 모두 스크롤해서 보세요",
  "onboardingC.reviews.mentioning": "이런 내용을 언급한 리뷰",

  // pain
  "pain.overdue.legend": "기한 초과",
  "pain.overdue.headline": {
    other: "정비 {count}건이 이미 기한을 넘겼어요",
  },
  "pain.overdue.body":
    "{vehicle} 기준으로, 오늘이요. 계기판은 이걸 알려주지 않아요. 경고등은 손상이 생기기 전이 아니라 생긴 뒤에 켜지니까요.",
  "pain.overdue.fix":
    "모든 정비를 날짜와 주행거리로 카운트해서, 숫자가 마이너스로 넘어가기 전에 표시해요.",

  "pain.blind.legend": "기록 없음",
  "pain.blind.headline": {
    other: "정비 {total}건 중 {count}건은 기록이 없어요",
  },
  "pain.blind.body":
    "Wrenchy는 본 적 없는 걸 증명할 수 없고, 그건 나도 마찬가지예요. 아니라는 게 확인되기 전까지는 전부 기한이 된 것으로 봐요.",
  "pain.blind.fix": "하나만 기록하면 그 정비의 일정이 시작돼요. 한 건에 30초, 한 번만요.",

  "pain.memory.legend": "기억으로",
  "pain.memory.headline": "유일한 사본이 머릿속에 있어요",
  "pain.memory.body":
    "기억으로 관리한다고 하셨죠. 기억은 잘 버텨요. 정비소 카운터에서, 중고차 거래에서, 시속 100km로 달리다 경고등이 켜진 채로 \u201c정확히 언제였죠?\u201d라는 질문을 받기 전까지는요.",
  "pain.memory.fix":
    "기록한 정비는 모두 이 휴대폰에 저장되고 그대로 남아요. 기록을 가둬 둘 계정도 없어요.",

  "pain.nothing.legend": "관리 안 함",
  "pain.nothing.headline": "이 차에 대해 적혀 있는 게 없어요",
  "pain.nothing.body":
    "마지막 엔진오일 교환도, 그때 주행거리도요. 유일한 기록은 차가 가지고 있고, 차가 알려주는 방식은 고장이에요.",
  "pain.nothing.fix":
    "한 번 탭하면 정비가 기록돼요. 그때부터 이력은 차 말고 다른 곳에도 있어요.",

  "pain.receipts.legend": "글로브박스에",
  "pain.receipts.headline": "글로브박스는 색인이 아니에요",
  "pain.receipts.body":
    "영수증은 정비를 했다는 걸 증명해요. 다음에 뭐가 기한인지는 알려주지 않고, 순서도 없고, 감열지는 하얗게 지워져요.",
  "pain.receipts.fix": "같은 영수증을 날짜 붙은 행으로. 정렬하고, 검색하고, CSV로 내보낼 수 있어요.",

  "pain.spreadsheet.legend": "스프레드시트에",
  "pain.spreadsheet.headline": "스프레드시트는 어깨를 두드려 주지 않아요",
  "pain.spreadsheet.body":
    "이력을 담는 건 잘해요. 다만 스스로 열리지는 않고, 정작 필요한 건 찾아볼 생각조차 못 한 경고예요.",
  "pain.spreadsheet.fix": "같은 행에, 정비 기한이 되는 날 알림 하나가 더해져요.",

  "pain.dealer.legend": "정비소에",
  "pain.dealer.headline": "정비소 기록은 정비소 것이에요",
  "pain.dealer.body":
    "정비소를 바꾸거나, 이사하거나, 차를 팔기 전까지만 완전해요. 그리고 그 기록은 나보다 견적서를 쓰는 사람에게 보여요.",
  "pain.dealer.fix": "내 사본을, 내 휴대폰에. 원할 때 언제든 내보낼 수 있어요.",

  "pain.bills.legend": "청구서",
  "pain.bills.headline": "정비를 미루는 건 돈을 아끼는 게 아니에요",
  "pain.bills.body":
    "같은 돈을 나중에, 앞에 견인차까지 붙여서 내는 거예요. 비싸게 터지는 건 아무도 세지 않던 값싼 항목들이에요.",
  "pain.bills.fix": "모든 주기를 카운트해서, 값싼 정비가 값싼 정비로 남게 해요.",

  "pain.missed.legend": "놓친 정비",
  "pain.missed.headline": "늦기 전까지는 아무것도 알려주지 않아요",
  "pain.missed.body":
    "정비를 일부러 놓치는 사람은 없어요. 평범한 화요일에 놓치고, 그다음 주에 또 놓치고, 주행거리는 계속 올라가요.",
  "pain.missed.fix": "정비마다 알림 하나, 기한이 되는 날에. 그 외에는 아무것도 없어요.",

  "pain.records.legend": "증빙",
  "pain.records.headline": "증명하지 못한 정비는 하지 않은 정비예요",
  "pain.records.body":
    "보증 수리, 중고차 거래, 정비소와의 언쟁. 하나같이 기록을 요구해요. 내 기억이 아니라요.",
  "pain.records.fix":
    "날짜 붙은 기록을 CSV로 내보낼 수 있어요. 구독 여부와 상관없이, 누구에게나 영구 무료예요.",

  "pain.resale.legend": "중고차 거래",
  "pain.resale.headline": "이력이 꽉 찬 차가 깨끗한 차보다 값이 나가요",
  "pain.resale.body":
    "보여주지 못하는 건 구매자가 깎아요. 차를 매입하는 딜러도 똑같아요. 차는 증명할 수 있는 만큼만 값이 나가요.",
  "pain.resale.fix":
    "전체 이력을 CSV로 내보내서 넘겨주세요. 어느 것도 구독에 묶여 있지 않아요.",

  "pain.upsell.legend": "정비소 카운터",
  "pain.upsell.headline": "정비소는 내 이력을 알아요. 나는 몰라요.",
  "pain.upsell.body":
    "\u201c브레이크 정비 마지막으로 언제 하셨어요?\u201d는 상대가 그 견적을 내미는 자리에서 짐작으로 답할 질문이 아니에요.",
  "pain.upsell.fix": "날짜와 주행거리를, 카운터에서 두 번 탭해서 바로 꺼내요.",

  "pain.vehicleFallback": "차",

  // plan
  "plan.line.nothing": "기록 없음",
  "plan.line.about": "{date}쯤",
  "plan.line.noInterval": "주기 미설정",

  // service
  "service.Oil Change": "엔진오일 교환",
  "service.Tire Rotation": "타이어 위치 교환",
  "service.Brake Inspection": "브레이크 점검",
  "service.Air Filter": "에어 필터",
  "service.Cabin Air Filter": "에어컨 필터",
  "service.Wiper Blades": "와이퍼 블레이드",
  "service.Battery Check": "배터리 점검",
  "service.Coolant Flush": "부동액 교환",
  "service.Transmission Fluid": "변속기 오일",
  "service.Spark Plugs": "점화플러그",
  "service.Registration": "자동차세",
  "service.Inspection": "자동차 정기검사",
  "service.Other": "기타",

  // settings
  "settings.title": "설정",
  "settings.privacy":
    "기록은 이 휴대폰에만 있어요. 계정도 서버도 없어요. 내보내기는 언제든 되고, 절대 잠기지 않아요.",

  "settings.export": "전체 기록 내보내기(CSV)",
  "settings.export.error": "공유 시트를 열지 못했어요. 기록은 그대로예요.",

  "settings.intervals": "정비 주기",

  "settings.language": "언어: {language}",
  "settings.units": "단위: {unit}",
  "settings.units.title": "{unit} 단위로 바꿀까요?",
  "settings.units.body":
    "저장된 모든 주행거리와 주기를 {from}에서 {to}로 변환해요. {from} 기준 50,000은 {example}, 이렇게 바뀌어요.",
  "settings.units.cancel": "취소",
  "settings.units.confirm": "변환",

  "settings.reminders.enable": "알림 켜기",
  "settings.reminders.blocked": "알림이 차단됐어요. iOS 설정을 열어 주세요",
  "settings.reminders.none": "알림 켜짐, 아직 기한 없음",
  "settings.reminders.on": {
    other: "알림 켜짐, {count}건 예약",
  },
  "settings.reminders.onNext": {
    other: "알림 켜짐, {count}건 예약, 다음은 {date}",
  },
  "settings.reminders.scheduled": "알림을 예약했어요.",
  "settings.reminders.denied": "알림이 거부됐어요. iOS 설정에서 켤 수 있어요.",
  "settings.reminders.error": "알림 권한을 요청하지 못했어요.",
  "settings.reminders.openSettings":
    "iOS 설정 › Wrenchy › 알림에서 알림을 다시 켜 주세요.",

  "settings.manage": "구독 관리",
  "settings.manage.error": "구독 설정을 열지 못했어요. 통신이 잘 되는 곳에서 다시 시도해 주세요.",
  "settings.upgrade": "Pro로 업그레이드",
  "settings.restore": "구매 복원",
  "settings.restore.done": "Pro를 복원했어요.",
  "settings.restore.none": "구매 내역이 없어요.",
  "settings.store.error": "스토어에 연결하지 못했어요. 통신이 잘 되는 곳에서 다시 시도해 주세요.",
  "settings.pro.on": "Pro가 켜져 있어요. 감사해요.",
  "settings.offer.applied": "그 혜택은 적용됐어요. 더 할 건 없어요.",

  "settings.replay": "온보딩 다시 보기",
  "settings.replay.title": "온보딩을 다시 볼까요?",
  "settings.replay.body":
    "차량과 기록은 그대로 있어요. 다시 진행하면 차량이 하나 더 추가되고, 그건 나중에 지울 수 있어요.",
  "settings.replay.cancel": "취소",
  "settings.replay.confirm": "다시 보기",

  // system
  "system.notify.title": "{vehicle}: {service} 기한",
  "system.notify.body": "{date}에 마지막으로 했어요.",

  "system.csv.header.vehicle": "차량",
  "system.csv.header.service": "정비",
  "system.csv.header.date": "날짜",
  "system.csv.header.odometer": "주행거리({unit})",
  "system.csv.header.cost": "비용",
  "system.csv.header.notes": "메모",
  "system.csv.header.deleted": "삭제",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Pro 무료로 써 보기",
  "system.quickaction.trial.subtitle": {
    other: "{count}일, 이후 해지하지 않으면 갱신돼요",
  },
  "system.quickaction.feedback.title": "의견 보내기",
  "system.quickaction.feedback.subtitle": "무엇이 문제였는지 알려주세요",

  "system.vehicle.fallback": "내 차",

  // unit
  "unit.mi": "{value}mi",
  "unit.km": "{value}km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  // vehicle
  "vehicle.title": "차량",

  "vehicle.odometer": "주행거리",
  "vehicle.odometer.notSet": "미입력",
  "vehicle.odometer.estimated": "주행거리(추정)",
  "vehicle.lastService": "마지막 정비",
  "vehicle.lastService.none": "아직 없음",

  "vehicle.due": "지금 기한",
  "vehicle.history": "차계부",
  "vehicle.history.empty": "아직 기록한 정비가 없어요. 마지막으로 받은 정비를 기록해 보세요.",

  "vehicle.over": "{distance} 초과",
  "vehicle.dueOn": "{date} 기한",
  "vehicle.dueNow": "지금 기한",
  "vehicle.dueSoon": "기한 임박",

  "vehicle.badge.overdue": "기한 초과",
  "vehicle.badge.soon": "임박",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "삭제",
  "vehicle.serviceDeleted": "정비를 삭제했어요",
  "vehicle.undo": "되돌리기",
  "vehicle.logService": "정비 기록하기",

  "vehicle.deleteVehicle": "차량 삭제",
  "vehicle.delete.title": "{name}, 삭제할까요?",
  "vehicle.delete.body":
    "정비 이력과 함께 차고에서 사라져요. 이미 내보낸 기록은 그 파일에 그대로 남아요.",
  "vehicle.delete.cancel": "취소",
  "vehicle.delete.confirm": "삭제",

  // vehicleForms
  "vehicleForms.new.title": "차량 추가",
  "vehicleForms.new.save": "저장",
  "vehicleForms.new.name": "이름",
  "vehicleForms.new.namePlaceholder": "2019 Civic",
  "vehicleForms.new.odometer": "현재 주행거리({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "정비 기록하기",
  "vehicleForms.log.save": "저장",
  "vehicleForms.log.error": "저장하지 못했어요. 입력한 내용은 그대로 있어요. 다시 시도해 주세요.",
  "vehicleForms.log.what": "정비 항목",
  "vehicleForms.log.when": "날짜",
  "vehicleForms.log.today": "오늘",
  "vehicleForms.log.yesterday": "어제",
  "vehicleForms.log.otherDate": "다른 날짜",
  "vehicleForms.log.odometer": "주행거리({unit})",
  "vehicleForms.log.cost": "비용(선택)",
  "vehicleForms.log.notes": "메모(선택)",
};

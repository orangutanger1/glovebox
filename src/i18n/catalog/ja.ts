import type { Fragment } from "./types";

/**
 * Japanese (ja-JP). Register: plain polite です/ます throughout — no 敬語 stacking
 * and no reflexive 〜してください on every line, so the app reads like a competent
 * mechanic's note rather than a service counter script.
 *
 * Deliberate term choices a reviewer would otherwise question:
 * - `service.Inspection` is 車検, the statutory roadworthiness test. The dictionary
 *   word 点検 is a voluntary check-up and would name the wrong event entirely.
 * - `service.Registration` is 自動車税, the recurring annual vehicle tax that is the
 *   Japanese equivalent of the recurring paperwork this key stands for.
 * - Garage vocabulary, not dictionary vocabulary: オイル交換, タイヤローテーション,
 *   ブレーキ点検, エアクリーナー (the engine filter, as printed on a Japanese service
 *   sheet), エアコンフィルター, クーラント交換, スパークプラグ.
 * - "records" is 整備記録, the phrase Japanese owners actually use, never a katakana
 *   calque like レコード.
 * - Japanese has one CLDR plural category, so every plural entry is `other` alone.
 * - `unit.mi` / `unit.km` keep the "mi"/"km" abbreviations and drop the space, which
 *   is the Japanese convention for a number followed by a Latin unit.
 */
export const ja: Fragment = {
  // evidence
  "evidence.records.label": "整備記録の消失、同期の失敗、データを取り出せない",
  "evidence.records.answer": "端末内のSQLiteに保存します。CSV書き出しは永久に無料です。",

  "evidence.price.label": "価格、ペイウォール、結局いくらかかったか",
  "evidence.price.answer": "無料のままでもアプリとして完結します。1台、履歴は無制限。",

  "evidence.account.label": "使い始める前にアカウント登録とログインが必要",
  "evidence.account.answer": "アカウントはありません。ログインする先がそもそもありません。",

  "evidence.crashes.label": "クラッシュ、フリーズ、開けないファイル",
  "evidence.crashes.answer": "削除した記録は削除済みとして残り、実データは捨てません。",

  // features
  "features.history.title": "すべての整備を、ずっと保存",
  "features.history.subtitle":
    "日付、走行距離、費用、メモ。削除した行も削除済みとして残り、捨てられません。",

  "features.due.title": "日付と距離の両方で期限を管理",
  "features.due.subtitle": "整備ごとの間隔から数えて、先に来たほうが期限です。",

  "features.reminders.title": "整備ごとに通知は1回",
  "features.reminders.subtitle": "期限の当日に1回だけ。それ以外は届きません。",

  "features.export.title": "すべてCSVで書き出し",
  "features.export.subtitle":
    "誰でも永久に無料です。整備記録がサブスクの人質になることはありません。",

  "features.garage.title": "複数台の車を登録",
  "features.garage.subtitle": "ガレージ全体を、車ごとの予定表で管理します。",

  "features.intervals.title": "自分の整備間隔",
  "features.intervals.subtitle": "取扱説明書と初期値が食い違うときは、どれでも上書きできます。",

  // garage
  "garage.title": "ガレージ",
  "garage.logService": "整備を記録",
  "garage.addVehicle": "車を追加",
  "garage.empty": "まだ車がありません。追加すると、Wrenchyが整備記録を付け始めます。",
  "garage.storeUnreachable": "ストアに接続できませんでした。電波の良い場所でやり直してください。",

  "garage.badge.overdue": "期限切れ",
  "garage.badge.dueSoon": "まもなく",

  "garage.odometer": "走行距離",
  "garage.odometer.notSet": "未設定",
  "garage.odometer.estimated": "走行距離（推定）",

  "garage.over": "{distance}超過",
  "garage.dueNow": "期限到来",
  "garage.dueSoon": "まもなく期限",
  "garage.onSchedule": "予定どおり",

  "garage.noSchedule": "予定は未設定",
  "garage.noSchedule.detail": "記録のみ、管理対象外",
  "garage.nothingLogged": "記録がありません",
  "garage.nothingLogged.detail": "整備を追加",

  "garage.openHistory": "履歴を開く",
  "garage.openAndLog": "開いて整備を記録",

  // intervals
  "intervals.title": "整備間隔",
  "intervals.intro":
    "各整備の期限が来る間隔です。自分の車、取扱説明書、走る土地の気候、使い方の厳しさに合わせて、どれでも変更できます。",
  "intervals.custom": "カスタム",

  "intervals.untracked": "管理対象外",
  "intervals.months": { other: "{count}か月" },
  "intervals.monthsAndDistance": { other: "{count}か月 · {distance}" },

  "intervals.help":
    "先に来たほうが期限です。空欄にした項目は無視されるので、距離だけ、月数だけでも予定として成立します。両方を空にすると初期値（{default}）に戻ります。",
  "intervals.field.months": "間隔（月）",
  "intervals.field.distance": "間隔（{unit}）",
  "intervals.error.positive": "1以上の整数を入力するか、空欄のままにしてください。",
  "intervals.save": "間隔を保存",
  "intervals.cancel": "キャンセル",

  // language
  "language.title": "言語",
  "language.intro":
    "ここで選ばない限り、Wrenchyは端末の言語に従います。整備の名前には、その言語の整備工場が使う言葉を出します。",
  "language.system": "端末に合わせる",

  // layout
  "layout.garage": "ガレージ",
  "layout.settings": "設定",
  "layout.intervals": "整備間隔",
  "layout.addVehicle": "車を追加",
  "layout.vehicle": "車両",
  "layout.logService": "整備を記録",
  "layout.fatal.retry": "再試行",
  "layout.fatal.title": "Wrenchyが整備記録を開けませんでした。",
  "layout.fatal.body":
    "削除されたものはありません。データベースは最後に正常だった状態に戻しました。アプリを開き直してください。これが続く場合は、再インストールする前にサポートへご連絡ください。記録を実際に失う原因になるのは、その再インストールです。",

  // offer
  "offer.badge.pro": "Pro",
  "offer.badge.free": "無料",

  "offer.features.title": "使えるようになるもの。",

  "offer.plan.title": "これが予定表です。",
  "offer.plan.subtitle": { other: "{vehicle}の整備{count}件を予定に入れます。" },
  "offer.plan.cta": "通知をオンにする",
  "offer.plan.decline": "今はしない",
  "offer.notify.title": "整備を見逃さない。",
  "offer.plan.status.due": "期限",
  "offer.plan.status.soon": "まもなく",
  "offer.plan.status.ok": "問題なし",

  "offer.paywall.title": "車は警告してくれません。これがします。",
  "offer.paywall.subtitle": "整備も走行距離も、すべて記録に残ります。",
  "offer.paywall.cta": "愛車を記録に残す",
  "offer.paywall.vehicle": "記録済み",
  "offer.paywall.scheduled": "監視中",
  "offer.paywall.services": { other: "件" },
  "offer.paywall.dueNow": "期限切れ",
  "offer.paywall.nextUp": "次の警告",
  "offer.paywall.none": "なし",

  "offer.paywall.impact.legend": "これで得られること",
  "offer.paywall.impact.warned": "費用になる前に警告。後からではなく。",
  "offer.paywall.impact.upsell": "わかった状態で入れます。同じものを二度売られません。",
  "offer.paywall.impact.resale": "売るときに完全な記録を。価格に表れます。",

  "offer.trial.title": { other: "{count}日間試してみる。" },
  "offer.trial.cta": { other: "{count}日間の無料期間を始める" },
  "offer.trial.decline": "結構です。無料版を見せてください",

  "offer.winback.title": "記録が止まっています。",
  "offer.winback.decline": "ガレージへ進む",
  "offer.winback.body":
    "整備記録は置いたときのままです。期限切れも削除もなく、設定をやり直す必要もありません。",
  "offer.winback.feedback": "うまくいかなかった点を教えてください",
  "offer.winback.feedbackNote": "短いフォームです。Safariで開きます",
  "offer.winback.caption": {
    other:
      "もう一度試すこともできます。Proを{count}日間無料で。終了前に解約すれば料金はかかりません。",
  },

  // onboardingA
  "onboardingA.continue": "続ける",

  "onboardingA.welcome.headline": "前回のオイル交換がいつだったか、もう推測せずに済みます。",
  "onboardingA.welcome.start": "はじめる",
  "onboardingA.welcome.privacy": "アカウント不要。端末の外には出ません。",

  "onboardingA.vehicle.title": "どの車に乗っていますか？",
  "onboardingA.vehicle.year": "年式",
  "onboardingA.vehicle.makeOptional": "メーカー（任意）",
  "onboardingA.vehicle.makePlaceholder": "トヨタ",
  "onboardingA.vehicle.modelPlaceholder": "カローラ",

  "onboardingA.vehicle.modelOptional": "車種（任意）",

  "onboardingA.odometer.title.mi": "走行距離は何マイルですか？",
  "onboardingA.odometer.title.km": "走行距離は何キロですか？",
  "onboardingA.odometer.field": "走行距離（{unit}）",
  "onboardingA.odometer.placeholder.mi": "84,210",
  "onboardingA.odometer.placeholder.km": "135,600",
  "onboardingA.odometer.caption": "だいたいの数字で構いません。",

  "onboardingA.drive.title": "年間どのくらい走りますか？",
  "onboardingA.drive.legend": "年間走行距離（{unit}）",
  "onboardingA.drive.low.mi": "5,000未満",
  "onboardingA.drive.low.km": "8,000未満",
  "onboardingA.drive.average.mi": "5,000〜10,000",
  "onboardingA.drive.average.km": "8,000〜16,000",
  "onboardingA.drive.high.mi": "10,000〜15,000",
  "onboardingA.drive.high.km": "16,000〜24,000",
  "onboardingA.drive.very_high.mi": "15,000超",
  "onboardingA.drive.very_high.km": "24,000超",
  "onboardingA.drive.projection": "来年の今ごろは約{distance}です。",
  "onboardingA.drive.caption": "おおよそで構いません。",

  // onboardingB
  "onboardingB.continue": "続ける",

  "onboardingB.service.title": "最後にやった整備は何ですか？",
  "onboardingB.service.subtitle": "だいたいで構いません。",
  "onboardingB.service.legend": "整備",
  "onboardingB.service.when": "{service}はいつですか？",
  "onboardingB.service.whenOther": "その整備はいつですか？",
  "onboardingB.service.whenPending": "いつでしたか？",
  "onboardingB.service.somethingElse": "その他",
  "onboardingB.service.ago.now": "つい最近",
  "onboardingB.service.ago.lastMonth": "先月",
  "onboardingB.service.ago.months3": "3か月前",
  "onboardingB.service.ago.months6": "6か月前",
  "onboardingB.service.ago.notSure": "わからない",

  "onboardingB.tracking.title": "今はどう管理していますか？",
  "onboardingB.tracking.legend": "現状",
  "onboardingB.tracking.memory": "記憶",
  "onboardingB.tracking.receipts": "車内の伝票",
  "onboardingB.tracking.spreadsheet": "表計算ソフト",
  "onboardingB.tracking.dealer": "整備工場が管理",
  "onboardingB.tracking.nothing": "何もしていない",

  "onboardingB.worry.title": "避けたいことは何ですか？",
  "onboardingB.worry.subtitle": "当てはまるものをすべて選んでください。",
  "onboardingB.worry.bills": "突然の修理代",
  "onboardingB.worry.missed": "整備の見落とし",
  "onboardingB.worry.records": "整備記録の紛失",
  "onboardingB.worry.resale": "売却時の価値",
  "onboardingB.worry.upsell": "余計な追加整備",

  "onboardingB.analyzing.title": "予定表を組み立てています。",
  "onboardingB.analyzing.odometer": "{vehicle}、{distance}",
  "onboardingB.analyzing.intervals": { other: "整備間隔{count}件を適用" },
  "onboardingB.analyzing.rate": "年間{distance}",
  "onboardingB.analyzing.rateProjected": "年間{distance}、来年には{projected}",
  "onboardingB.analyzing.clear": "今日対応が必要なものはありません",
  "onboardingB.analyzing.due": { other: "{count}件が要対応、{soon}件が間近" },
  "onboardingB.analyzing.done": "完了",
  "onboardingB.analyzing.progress": "{total}件中{index}件目を読み込み中",

  // onboardingC
  "onboardingC.back": "戻る",
  "onboardingC.question": "質問 {step} / {total}",

  "onboardingC.results.overdue": { other: "{count}件の整備がすでに期限切れです。" },
  "onboardingC.results.noneLogged": "記録済みのものに期限切れはありません。",
  "onboardingC.results.noneYet": "まだ期限切れはありません。",
  "onboardingC.results.clear": "期限切れも、期限が近いものもありません。",
  "onboardingC.results.subtitle": "{vehicle}、年間{distance}。",
  "onboardingC.results.continue": "続ける",
  "onboardingC.results.dueNow": "期限到来",
  "onboardingC.results.soon": "まもなく",
  "onboardingC.results.onFile": "記録あり",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "期限",
  "onboardingC.results.status.soon": "まもなく",
  "onboardingC.results.status.ok": "問題なし",

  "onboardingC.symptoms.next": "続ける",
  "onboardingC.symptoms.last": "では、どうすればいいか",

  "onboardingC.help.title": "3つとも同じ問題です。",
  "onboardingC.help.subtitle": "警告できる形で、どこにも記録されていません。",
  "onboardingC.help.continue": "続ける",

  "onboardingC.reviews.title": "このアプリは、これらがあって生まれました。",
  "onboardingC.reviews.subtitle": {
    other:
      "同じことをするアプリのApp Storeレビュー{total}件のうち、{count}件が星1〜3です。",
  },
  "onboardingC.reviews.continue": "続ける",
  "onboardingC.reviews.scroll": "スクロールして4件すべて読む",
  "onboardingC.reviews.mentioning": "言及しているレビュー",

  // pain
  "pain.overdue.legend": "期限超過",
  "pain.overdue.headline": { other: "{count}件の整備がすでに期限切れです" },
  "pain.overdue.body": "{vehicle}で、今日の時点です。警告灯は傷んだ後に点くもので、その前には点きません。",
  "pain.overdue.fix": "日付と距離の両方で数え、マイナスになる前に知らせます。",

  "pain.blind.legend": "記録なし",
  "pain.blind.headline": { other: "{total}件中{count}件の整備に記録がありません" },
  "pain.blind.body": "記録が出てこないかぎり、そのすべてが「期限切れ」の扱いになります。",
  "pain.blind.fix": "ひとつ記録すれば、その予定がまるごと動き出します。三十秒、一度だけ。",

  "pain.memory.legend": "記憶頼り",
  "pain.memory.headline": "控えは頭の中にしかありません",
  "pain.memory.body": "記憶は、窓口で「正確にいつ？」と聞かれるまでは持ちます。",
  "pain.memory.fix": "この端末に書き込まれ、そこに残ります。失う先のアカウントはありません。",

  "pain.nothing.legend": "未管理",
  "pain.nothing.headline": "この車について何も書き留められていません",
  "pain.nothing.body": "唯一の記録を持っているのは車で、その伝え方は故障することです。",
  "pain.nothing.fix": "一度のタップで整備を記録。以後、履歴は車の外にも存在します。",

  "pain.receipts.legend": "グローブボックスの中",
  "pain.receipts.headline": "グローブボックスは索引になりません",
  "pain.receipts.body": "領収書は済んだことを証明します。次に何が来るかは決して教えません。",
  "pain.receipts.fix": "同じ領収書を日付つきの行に。並べ替え、検索、書き出しができます。",

  "pain.spreadsheet.legend": "表計算ソフトの中",
  "pain.spreadsheet.headline": "表計算ソフトは肩を叩いてくれません",
  "pain.spreadsheet.body": "履歴の保管は問題ありません。ただ、警告のために自分から開くことはありません。",
  "pain.spreadsheet.fix": "同じ行に加えて、整備が来る日に通知をひとつ。",

  "pain.dealer.legend": "整備工場任せ",
  "pain.dealer.headline": "工場の記録は工場のものです",
  "pain.dealer.body": "工場を変える、引っ越す、車を売る、そのときまでは完全です。しかも見えているのは相手であって、あなたではありません。",
  "pain.dealer.fix": "自分の控えを、自分の端末に。いつでも書き出せます。",

  "pain.bills.legend": "請求書",
  "pain.bills.headline": "整備の先送りは節約ではありません",
  "pain.bills.body": "同じ金額が後から来ます。しかもレッカーつきで。",
  "pain.bills.fix": "すべての間隔を数え続けるので、安い作業が安いままで済みます。",

  "pain.missed.legend": "見落とし",
  "pain.missed.headline": "遅れるまで何も教えてくれません",
  "pain.missed.body": "整備をわざと飛ばす人はいません。飛ぶのはいつも、なんでもない火曜日です。",
  "pain.missed.fix": "整備ごとに通知はひとつ、期限の当日に。ほかには何もありません。",

  "pain.records.legend": "証拠",
  "pain.records.headline": "証明できない整備は、やっていない整備です",
  "pain.records.body": "保証の請求、売却、工場との言い分の食い違い。どれも求めるのは記録です。",
  "pain.records.fix": "日付の入った記録をCSVで書き出せます。誰でも、ずっと無料で。",

  "pain.resale.legend": "売却",
  "pain.resale.headline": "きれいな履歴より、そろった履歴のほうが高く付きます",
  "pain.resale.body": "買い手は見せられない分を値引きします。買取店も同じです。",
  "pain.resale.fix": "履歴をまるごと書き出して渡せます。Proの向こう側にあるものはありません。",

  "pain.upsell.legend": "受付カウンター",
  "pain.upsell.headline": "履歴を知っているのは相手で、あなたではありません。",
  "pain.upsell.body": "見積もりを出されている最中に、当て推量で答える質問ではありません。",
  "pain.upsell.fix": "日付と走行距離を、窓口で二タップで表示。",

  "pain.vehicleFallback": "車",

  // plan
  "plan.line.nothing": "記録なし",
  "plan.line.about": "{date}ごろ",
  "plan.line.noInterval": "間隔が未設定",

  // service
  "service.Oil Change": "オイル交換",
  "service.Tire Rotation": "タイヤローテーション",
  "service.Brake Inspection": "ブレーキ点検",
  "service.Air Filter": "エアクリーナー",
  "service.Cabin Air Filter": "エアコンフィルター",
  "service.Wiper Blades": "ワイパーブレード",
  "service.Battery Check": "バッテリー点検",
  "service.Coolant Flush": "クーラント交換",
  "service.Transmission Fluid": "ミッションオイル",
  "service.Spark Plugs": "スパークプラグ",
  "service.Registration": "自動車税",
  "service.Inspection": "車検",
  "service.Other": "その他",

  // settings
  "settings.title": "設定",
  "settings.privacy":
    "整備記録はこの端末の中だけにあります。アカウントもサーバーもありません。書き出しはいつでもできます。書き出しに制限をかけることはありません。",

  "settings.export": "全記録を書き出す（CSV）",
  "settings.export.error": "共有シートを開けませんでした。記録はそのままです。",

  "settings.intervals": "整備間隔",


  "settings.language": "言語：{language}",
  "settings.units": "単位：{unit}",
  "settings.units.title": "{unit}に切り替えますか？",
  "settings.units.body":
    "保存済みの走行距離と間隔は、すべて{from}から{to}に換算されます。{from}で50,000の記録は{example}になります。",
  "settings.units.cancel": "キャンセル",
  "settings.units.confirm": "換算する",

  "settings.reminders.enable": "通知をオンにする",
  "settings.reminders.blocked": "通知がブロックされています。iOSの設定を開いてください",
  "settings.reminders.none": "通知オン、期限が来たものはまだありません",
  "settings.reminders.on": { other: "通知オン、{count}件を予約済み" },
  "settings.reminders.onNext": { other: "通知オン、{count}件を予約済み、次は{date}" },
  "settings.reminders.scheduled": "通知を予約しました。",
  "settings.reminders.denied": "通知が許可されませんでした。iOSの設定からオンにできます。",
  "settings.reminders.error": "通知の許可を求められませんでした。",
  "settings.reminders.openSettings":
    "iOSの設定 › Wrenchy › 通知 を開くと、通知をオンに戻せます。",

  "settings.manage": "サブスクリプションを管理",
  "settings.manage.error":
    "サブスクリプションの設定を開けませんでした。電波の良い場所でやり直してください。",
  "settings.upgrade": "Proにアップグレード",
  "settings.restore": "購入を復元",
  "settings.restore.done": "Proを復元しました。",
  "settings.restore.none": "購入が見つかりませんでした。",
  "settings.store.error": "ストアに接続できませんでした。電波の良い場所でやり直してください。",
  "settings.pro.on": "Proが有効です。ありがとうございます。",
  "settings.offer.applied": "そのオファーは適用済みです。ほかに操作は要りません。",

  "settings.replay": "初期設定をやり直す",
  "settings.replay.title": "初期設定をやり直しますか？",
  "settings.replay.body":
    "車と整備記録はそのまま残ります。もう一度進めると車が1台増えますが、後から削除できます。",
  "settings.replay.cancel": "キャンセル",
  "settings.replay.confirm": "やり直す",

  // system
  "system.notify.title": "\u304a\u4f7f\u3044\u306e{vehicle}\uff1a{service}\u306e\u6642\u671f\u3067\u3059",
  "system.notify.body": "前回は{date}です。",

  "system.notify.when.today": "\u4eca\u65e5",
  "system.notify.when.tomorrow": "\u660e\u65e5",
  "system.notify.when.days": { other: "{count}\u65e5\u5f8c" },
  "system.notify.when.months": { other: "{count}\u304b\u6708\u5f8c" },

  "system.csv.header.vehicle": "車両",
  "system.csv.header.service": "整備",
  "system.csv.header.date": "日付",
  "system.csv.header.odometer": "走行距離（{unit}）",
  "system.csv.header.cost": "費用",
  "system.csv.header.notes": "メモ",
  "system.csv.header.deleted": "削除",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Proを無料で試す",
  "system.quickaction.trial.subtitle": {
    other: "{count}日間、その後は解約しない限り更新されます",
  },
  "system.quickaction.feedback.title": "フィードバックを送る",
  "system.quickaction.feedback.subtitle": "うまくいかなかった点を教えてください",

  "system.vehicle.fallback": "マイカー",

  // unit
  "unit.mi": "{value}mi",
  "unit.km": "{value}km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",

  // vehicle
  "vehicle.title": "車両",

  "vehicle.body.sedan": "セダン",
  "vehicle.body.hatchback": "ハッチバック",
  "vehicle.body.coupe": "クーペ",
  "vehicle.body.wagon": "ワゴン",
  "vehicle.body.suv": "SUV",
  "vehicle.body.pickup": "ピックアップ",
  "vehicle.body.van": "バン",

  "vehicle.odometer": "走行距離",
  "vehicle.odometer.notSet": "未設定",
  "vehicle.odometer.estimated": "走行距離（推定）",
  "vehicle.lastService": "前回の整備",
  "vehicle.lastService.none": "まだありません",

  "vehicle.due": "期限到来",
  "vehicle.history": "履歴",
  "vehicle.history.empty": "整備の記録がまだありません。最後にやったものを記録してください。",

  "vehicle.over": "{distance}超過",
  "vehicle.dueOn": "{date}に期限",
  "vehicle.dueNow": "期限到来",
  "vehicle.dueSoon": "まもなく期限",

  "vehicle.badge.overdue": "期限切れ",
  "vehicle.badge.soon": "まもなく",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "削除",
  "vehicle.serviceDeleted": "整備記録を削除しました",
  "vehicle.undo": "元に戻す",
  "vehicle.logService": "整備を記録",

  "vehicle.deleteVehicle": "車を削除",
  "vehicle.delete.title": "{name}を削除しますか？",
  "vehicle.delete.body":
    "整備履歴ごとガレージから消えます。すでに書き出した記録は、そのファイルに残ります。",
  "vehicle.delete.cancel": "キャンセル",
  "vehicle.delete.confirm": "削除",

  // vehicleForms
  "vehicleForms.new.title": "車を追加",
  "vehicleForms.new.save": "保存",
  "vehicleForms.new.name": "名前",
  "vehicleForms.new.namePlaceholder": "2019 シビック",
  "vehicleForms.new.odometer": "現在の走行距離（{unit}）",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "整備を記録",
  "vehicleForms.log.save": "保存",
  "vehicleForms.log.error": "保存できませんでした。入力内容は残っています。もう一度お試しください。",
  "vehicleForms.log.what": "内容",
  "vehicleForms.log.when": "日付",
  "vehicleForms.log.today": "今日",
  "vehicleForms.log.yesterday": "昨日",
  "vehicleForms.log.otherDate": "別の日",
  "vehicleForms.log.odometer": "走行距離（{unit}）",
  "vehicleForms.log.cost": "費用（任意）",
  "vehicleForms.log.notes": "メモ（任意）",
  "subscribed.title": "Pro が有効になりました。",
  "subscribed.body": "{vehicle} を整備計画に登録しました。期限が過ぎてからではなく、その前にお知らせします。",
  "subscribed.unlocked": "同時に解放されたもの",
  "subscribed.cta": "整備計画を見る",
};

import { t } from "../i18n";
import type { Plan } from "./plan";
import type { Answers } from "./state";

/**
 * The three findings the flow puts in front of the user, and the answer to
 * each one.
 *
 * This is the "symptoms" beat of the structure, and it is the beat that is
 * easiest to fake: pick three dramatic statistics, print them on a red screen,
 * move on. Every card here is instead either a fact about the user's own car —
 * counted from the plan that was just computed — or a restatement of what they
 * themselves answered a minute ago. Nothing invented, nothing sourced to a
 * study that does not exist.
 *
 * Each card carries its own `fix`, so the screen after it answers the same
 * three cards in the same order rather than reciting a generic feature list.
 * Pain and answer cannot drift apart because they are the same object.
 *
 * Pure and deterministic: same answers in, same three cards out.
 */

export type PainId =
  | "overdue"
  | "blind"
  | "memory"
  | "nothing"
  | "receipts"
  | "spreadsheet"
  | "dealer"
  | "bills"
  | "missed"
  | "records"
  | "resale"
  | "upsell";

export type PainCard = {
  id: PainId;
  /** Uppercase legend, the same pairing every gauge in the app uses. */
  legend: string;
  headline: string;
  body: string;
  /** What Glovebox does about it. Read by the screen after the symptoms. */
  fix: string;
};

export const PAIN_CARD_COUNT = 3;

const TRACKING_CARD = {
  memory: "memory",
  nothing: "nothing",
  receipts: "receipts",
  spreadsheet: "spreadsheet",
  dealer: "dealer",
} as const;

const WORRY_CARD = {
  bills: "bills",
  missed: "missed",
  records: "records",
  resale: "resale",
  upsell: "upsell",
} as const;

/**
 * Three cards, worst-personal-fact first, then what the user said they use
 * today, then what they said they are trying to avoid. The tail is a fixed
 * fallback order so the screen is never short — a user who quit the quiz after
 * question two still gets three true cards.
 */
export function painCards(input: {
  plan: Plan;
  answers: Answers;
  vehicleName: string;
}): PainCard[] {
  const { plan, answers } = input;
  // Counted separately from `plan.dueNow`, which folds in every service that
  // has never been logged. "Nine services are overdue" on a car whose owner
  // has told us about one of them is technically our model and rhetorically a
  // lie; the two facts are worth one card each instead.
  const pastDue = plan.items.filter((i) => i.status === "due" && i.logged).length;
  const unlogged = plan.items.filter((i) => !i.logged).length;

  const order: PainId[] = [];
  if (pastDue > 0) order.push("overdue");
  if (answers.tracking) order.push(TRACKING_CARD[answers.tracking]);
  for (const worry of answers.worries ?? []) order.push(WORRY_CARD[worry]);
  if (unlogged > 0) order.push("blind");
  order.push("bills", "records", "missed");

  const cards: PainCard[] = [];
  for (const id of order) {
    if (cards.length === PAIN_CARD_COUNT) break;
    if (cards.some((c) => c.id === id)) continue;

    if (id === "overdue") {
      cards.push({
        id,
        legend: t("pain.overdue.legend"),
        headline: t("pain.overdue.headline", { count: pastDue }),
        body: t("pain.overdue.body", { vehicle: input.vehicleName }),
        fix: t("pain.overdue.fix"),
      });
      continue;
    }
    if (id === "blind") {
      cards.push({
        id,
        legend: t("pain.blind.legend"),
        headline: t("pain.blind.headline", { count: unlogged, total: plan.items.length }),
        body: t("pain.blind.body"),
        fix: t("pain.blind.fix"),
      });
      continue;
    }
    // The ten remaining cards say the same thing every time they are drawn, so
    // their words hang off the card id in the catalog. Read here rather than in
    // a table at import: a table would be written in whatever language had been
    // resolved before the first screen mounted.
    cards.push({
      id,
      legend: t(`pain.${id}.legend`),
      headline: t(`pain.${id}.headline`),
      body: t(`pain.${id}.body`),
      fix: t(`pain.${id}.fix`),
    });
  }
  return cards;
}

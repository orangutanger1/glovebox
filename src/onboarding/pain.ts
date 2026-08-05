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

const STATIC: Record<Exclude<PainId, "overdue" | "blind">, Omit<PainCard, "id">> = {
  memory: {
    legend: "From memory",
    headline: "The only copy is in your head",
    body:
      "You said you go by memory. Memory holds up right until the question " +
      "\u201cwhen exactly?\u201d is asked at the counter, at resale, or with a light on at 70.",
    fix: "Every service you log is written to this phone and stays there. No account to lose it behind.",
  },
  nothing: {
    legend: "Untracked",
    headline: "Nothing about this car is written down",
    body:
      "Not the last oil change, not the mileage it happened at. The car is keeping the only " +
      "record, and the way it tells you is by failing.",
    fix: "One tap logs a service. From then on the history exists somewhere other than the car.",
  },
  receipts: {
    legend: "In the glovebox",
    headline: "A glovebox is not an index",
    body:
      "Receipts prove a service happened. They do not tell you what is due next, they are not " +
      "in any order, and thermal paper fades to blank.",
    fix: "The same receipts as dated rows you can sort, search, and export as CSV.",
  },
  spreadsheet: {
    legend: "In a spreadsheet",
    headline: "A spreadsheet cannot tap you on the shoulder",
    body:
      "It holds the history fine. It just never opens itself, and the one thing you need from " +
      "it is a warning you did not think to go looking for.",
    fix: "The same rows, plus one notification on the day a service comes due.",
  },
  dealer: {
    legend: "At the shop",
    headline: "The shop\u2019s records are the shop\u2019s",
    body:
      "Complete right up until you change shops, move, or sell the car, and visible to the " +
      "person writing your estimate rather than to you.",
    fix: "Your own copy, on your own phone, exportable whenever you want it.",
  },
  bills: {
    legend: "The bill",
    headline: "Deferred maintenance is not saved money",
    body:
      "It is the same money later, with a tow in front of it. The jobs that fail expensively " +
      "are the cheap ones nobody was counting.",
    fix: "Every interval counted down, so the cheap job stays a cheap job.",
  },
  missed: {
    legend: "The miss",
    headline: "Nothing reminds you until it is late",
    body:
      "A service is never missed on purpose. It is missed on an ordinary Tuesday, and then " +
      "again the week after, and the odometer keeps going.",
    fix: "One notification per service, on the day it comes due. Nothing else, ever.",
  },
  records: {
    legend: "The proof",
    headline: "Unproven service is unperformed service",
    body:
      "A warranty claim, a resale, an argument with a shop: every one of them asks for the " +
      "record, not for your recollection of it.",
    fix: "A dated log you can export as CSV. Free forever, for everyone, subscriber or not.",
  },
  resale: {
    legend: "Resale",
    headline: "A full history is worth more than a clean one",
    body:
      "The buyer discounts what you cannot show them, and so does the dealer taking it in " +
      "trade. The car is only worth what you can prove about it.",
    fix: "Export the whole history to CSV and hand it over. None of it is locked behind the subscription.",
  },
  upsell: {
    legend: "The counter",
    headline: "They know your history. You do not.",
    body:
      "\u201cWhen was your last brake service?\u201d is not a question to be guessing at while " +
      "somebody quotes you for one.",
    fix: "The date and the mileage, pulled up at the counter in two taps.",
  },
};

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
        legend: "Past due",
        headline: pastDue === 1 ? "One service is already overdue" : `${pastDue} services are already overdue`,
        body:
          `On your ${input.vehicleName}, today. Nothing on the dashboard is going to mention it, ` +
          "because the light comes on after the damage rather than before it.",
        fix: "Every service counted down by date and by mileage, and flagged before the number goes negative.",
      });
      continue;
    }
    if (id === "blind") {
      cards.push({
        id,
        legend: "No record",
        headline: `${unlogged} of ${plan.items.length} services have nothing on file`,
        body:
          "Glovebox cannot prove what it has never seen, and neither can you. Until something " +
          "says otherwise, every one of them is treated as due.",
        fix: "Log one and its whole schedule starts. Thirty seconds each, once.",
      });
      continue;
    }
    cards.push({ id, ...STATIC[id] });
  }
  return cards;
}

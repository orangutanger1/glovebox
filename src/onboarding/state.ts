export const ONBOARDING_COMPLETE_KEY = "onboarding_complete";
export const ONBOARDING_STEP_KEY = "onboarding_step";

/**
 * The one vehicle this run of onboarding owns.
 *
 * Every step used to reach for `listVehicles()[0]`, which is the right car on a
 * first launch and the wrong one on a replay: Settings offers "Replay
 * onboarding" to a user who already has a garage, and the vehicle step then
 * rewrote their oldest car's year, make and model, while the service step soft
 * deleted that car's existing records for whatever service type was picked.
 * Naming the vehicle explicitly keeps a replay additive, which is what the
 * confirmation dialog promises.
 */
export const ONBOARDING_VEHICLE_KEY = "onboarding_vehicle_id";

/**
 * The quiz answers that are not rows in another table.
 *
 * Year, make, model, mileage and the last service all land in `vehicles` and
 * `service_records`, where the rest of the app can see them. These three
 * cannot: how far the user drives, how they track service today, and what they
 * are trying to avoid describe the owner, not the car. They are still real
 * inputs — annual mileage turns a mileage-only interval into a date, and the
 * other two pick which findings the flow puts in front of the user — so they
 * are persisted rather than held in navigation state, and a force-quit
 * mid-flow does not lose them.
 */
export const ONBOARDING_ANSWERS_KEY = "onboarding_answers";

export const DRIVE_ANSWERS = ["low", "average", "high", "very_high"] as const;
export const TRACKING_ANSWERS = ["memory", "receipts", "spreadsheet", "dealer", "nothing"] as const;
export const WORRY_ANSWERS = ["bills", "missed", "records", "resale", "upsell"] as const;

/**
 * The two halves of "what did you last get done?".
 *
 * That answer already lands in `service_records`, so persisting it here looks
 * like a duplicate. It is not: the record is a service on a date, and it
 * cannot say which chips produced it. "Not sure" writes no record at all, and
 * a record dated ninety days ago could equally have come from "3 months ago"
 * or from a later edit. Stepping back onto that screen has to show the user
 * their own two taps, so the taps are what is stored.
 */
export const SERVICE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Air Filter",
  "Inspection",
  "Something else",
] as const;
export const SERVICE_WHEN = [
  "Just now",
  "Last month",
  "3 months ago",
  "6 months ago",
  "Not sure",
] as const;

export type DriveAnswer = (typeof DRIVE_ANSWERS)[number];
export type TrackingAnswer = (typeof TRACKING_ANSWERS)[number];
export type WorryAnswer = (typeof WORRY_ANSWERS)[number];
export type ServiceTypeAnswer = (typeof SERVICE_TYPES)[number];
export type ServiceWhenAnswer = (typeof SERVICE_WHEN)[number];

export type Answers = {
  drive?: DriveAnswer;
  tracking?: TrackingAnswer;
  worries?: WorryAnswer[];
  service?: ServiceTypeAnswer;
  serviceWhen?: ServiceWhenAnswer;
};

/**
 * Tolerant by design. This blob is written by one version of the app and read
 * by the next: a value that has since been renamed, a key that no longer
 * exists, or a half-written row must degrade to "not answered" rather than
 * throw on the launch path. Every screen downstream already handles an absent
 * answer, because a user who resumed mid-quiz has never given one.
 */
export function parseAnswers(raw: string | null): Answers {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) return {};
  const record = parsed as Record<string, unknown>;
  const out: Answers = {};

  if (DRIVE_ANSWERS.includes(record.drive as DriveAnswer)) out.drive = record.drive as DriveAnswer;
  if (TRACKING_ANSWERS.includes(record.tracking as TrackingAnswer)) {
    out.tracking = record.tracking as TrackingAnswer;
  }
  if (Array.isArray(record.worries)) {
    // Deduplicated and put back into the order the question asks them in, so
    // two users who picked the same set get the same screens after it.
    const picked = WORRY_ANSWERS.filter((w) => (record.worries as unknown[]).includes(w));
    if (picked.length > 0) out.worries = picked;
  }
  if (SERVICE_TYPES.includes(record.service as ServiceTypeAnswer)) {
    out.service = record.service as ServiceTypeAnswer;
  }
  if (SERVICE_WHEN.includes(record.serviceWhen as ServiceWhenAnswer)) {
    out.serviceWhen = record.serviceWhen as ServiceWhenAnswer;
  }
  return out;
}

/**
 * Pure over an injected `get`, the same way applyMigrations is pure over `exec` —
 * testable in Node against a plain map, no device driver required.
 */
export function readOnboardingState(get: (key: string) => string | null): {
  isOnboarded: boolean;
  step: string | null;
} {
  return {
    isOnboarded: get(ONBOARDING_COMPLETE_KEY) === "true",
    step: get(ONBOARDING_STEP_KEY),
  };
}

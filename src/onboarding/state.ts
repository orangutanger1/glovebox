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
 * What the driver is called.
 *
 * Asked once, on the screen after the hook, and read back on the two screens
 * that ask for money and in every reminder the app sends. It is the only thing
 * the app knows about the person rather than the car, which is exactly why it
 * is worth one screen: "Your 2016 Outback's oil change is due" is a
 * notification from a database, and the same sentence with a name in front of
 * it is a message.
 *
 * Its own key rather than a field in the answers blob. The answers describe the
 * quiz and are cleared by a replay so the questions can be asked again; a name
 * is not a quiz answer and asking for it twice is the app forgetting who it is
 * talking to.
 *
 * Every reader has to survive its absence. It is required for anyone starting
 * the flow from here on, but every install that finished onboarding under an
 * earlier build has none, and those installs still get reminders.
 */
export const ONBOARDING_NAME_KEY = "onboarding_name";

/**
 * The longest name the app will store.
 *
 * Not a validation rule about people — names are longer than this and that is
 * fine — but a layout one: this string lands in a notification title beside a
 * vehicle name and a service name, and iOS gives that line about forty
 * characters before it truncates. A name that eats the whole title makes the
 * notification useless to the person it is greeting.
 */
export const NAME_MAX_LENGTH = 24;

/**
 * The stored form of a typed name, or null if there is nothing worth storing.
 *
 * Trimmed, collapsed and capped. A field that accepted "   " would put a
 * required screen behind a space bar, and one that accepted a pasted paragraph
 * would put it in a push notification.
 */
export function normalizeName(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim().slice(0, NAME_MAX_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * The bookkeeping behind the two resume nudges.
 *
 * The nudges themselves are two pending notifications and nothing else, which
 * was the whole bug: the scheduler cancels and re-arms from the current moment,
 * and it is called from `rescheduleAll` on every cold start, so an abandoned
 * flow was nudged, opened, re-armed, nudged again, for as long as the user kept
 * opening the app. Two pending at a time, unbounded deliveries.
 *
 * iOS will not tell us what it delivered, so this is the app's own record of
 * it: when the current pair was armed, the step it was armed for, and how many
 * nudges had already gone out before that arming. `before` is frozen at arm
 * time so that recounting the elapsed ones on each launch is idempotent —
 * counting from `armedAt` every time and adding gives the same answer twice.
 */
export const ONBOARDING_NUDGE_KEY = "onboarding_nudge";

export type NudgeState = {
  /** When the pair currently pending was scheduled. */
  armedAt: number;
  /** The step the user was on then. A different step means real progress since,
   *  which is the only thing that earns a re-arm. */
  step: string | null;
  /** Nudges delivered before `armedAt`, so the lifetime count survives one. */
  before: number;
};

/**
 * Tolerant for the same reason `parseAnswers` is: written by one build, read by
 * the next, and on the launch path. A row that cannot be read means "never
 * armed", which arms a fresh pair — the failure that sends one extra
 * notification, not the one that sends an unbounded number.
 */
export function parseNudgeState(raw: string | null): NudgeState | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (typeof record.armedAt !== "number" || !Number.isFinite(record.armedAt)) return null;
  const before = typeof record.before === "number" && record.before >= 0 ? record.before : 0;
  const step = typeof record.step === "string" ? record.step : null;
  return { armedAt: record.armedAt, step, before: Math.floor(before) };
}

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
 *
 * Both lists are persisted answer values, so they stay in English forever and
 * are never translated in place. The words a reader sees come from the screen
 * that renders the chips: a service type through `serviceName()`, and the
 * "when" chips from that screen's own catalog keys.
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

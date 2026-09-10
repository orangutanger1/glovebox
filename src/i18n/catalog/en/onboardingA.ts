import type { Fragment } from "../types";

/**
 * The first four screens of onboarding: the hook, the car, the odometer and the
 * "how far do you drive it?" question.
 *
 * Three things here are keyed per unit rather than interpolated. The odometer
 * title and the chip ranges are the cases where a metric reader is asked a
 * different question, not a converted one: "kilometres" is a whole word with its
 * own grammar, and the ranges a European driver recognises are round metric
 * numbers whose midpoints have to match `DISTANCE_PER_YEAR`. The text-input
 * placeholders are the third: a grouped six-digit reading is what a metric
 * cluster shows, and offering "84,210" to that driver reads as somebody else's
 * car.
 *
 * The chip labels carry numbers only. The legend above them states the unit
 * once, which is where a gauge puts it, and repeating the unit on four chips in
 * a wrapping row costs a line break on a small phone.
 */
export const onboardingA: Fragment = {
  "onboardingA.continue": "Continue",

  "onboardingA.welcome.headline": "Never guess when your last oil change was.",
  "onboardingA.welcome.start": "Get started",
  "onboardingA.welcome.privacy": "No account. Nothing leaves your phone.",

  // The introduction, on the screen before the quiz. The name is read
  // back on both ask screens and in every reminder, and nowhere else.
  //
  // No subtitle and no placeholder. The subtitle explained where the name
  // goes, which is a promise the reminders keep on their own, and the
  // placeholder put a stranger's name in the field the user is being asked
  // for their own — the one field in the app where an example is a person.
  "onboardingA.name.title": "What should we call you?",
  "onboardingA.name.label": "Your name",
  "onboardingA.name.continue": "Continue",

  "onboardingA.vehicle.title": "What are you driving?",
  "onboardingA.vehicle.year": "Year",
  "onboardingA.vehicle.make": "Make",
  // Corolla and its maker outsell every other car on the planet, so the example
  // is a car the reader has seen wherever they are reading this.
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  // Nothing but the name ever reads the model, so it is the safest part to
  // leave blank: "2019 Toyota" is a car in a garage list. Neither this label
  // nor the make one says "(optional)" any more — nothing on this screen is
  // required, the button never refuses, and a parenthesis on two of three
  // fields reads as a rule about the third.
  "onboardingA.vehicle.model": "Model",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",

  "onboardingA.odometer.title.mi": "How many miles on it?",
  "onboardingA.odometer.title.km": "How many kilometres on it?",
  "onboardingA.odometer.field": "Odometer ({unit})",
  "onboardingA.odometer.placeholder.mi": "84,210",
  "onboardingA.odometer.placeholder.km": "135,600",
  "onboardingA.odometer.caption": "A rough number is fine.",
  "onboardingA.odometer.required": "Enter the reading to continue.",

  "onboardingA.drive.title": "How far do you drive it?",
  "onboardingA.drive.legend": "Distance a year ({unit})",
  "onboardingA.drive.low.mi": "Under 5,000",
  "onboardingA.drive.low.km": "Under 8,000",
  "onboardingA.drive.average.mi": "5,000 to 10,000",
  "onboardingA.drive.average.km": "8,000 to 16,000",
  "onboardingA.drive.high.mi": "10,000 to 15,000",
  "onboardingA.drive.high.km": "16,000 to 24,000",
  "onboardingA.drive.very_high.mi": "Over 15,000",
  "onboardingA.drive.very_high.km": "Over 24,000",
  "onboardingA.drive.projection": "About {distance} by this time next year.",
  "onboardingA.drive.caption": "Roughly is fine.",
};

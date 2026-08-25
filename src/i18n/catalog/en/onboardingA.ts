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
  "onboardingA.welcome.privacy":
    "Everything stays on this phone, with no account and nothing to log out of.",

  "onboardingA.vehicle.title": "What are you driving?",
  "onboardingA.vehicle.year": "Year",
  "onboardingA.vehicle.yearPlaceholder": "2014",
  // The chip past the end of the row. Twenty-six model years cover most of the
  // cars on the road; this is the one that hands the rest a keyboard.
  "onboardingA.vehicle.yearOlder": "Older",
  "onboardingA.vehicle.make": "Make",
  // Corolla and its maker outsell every other car on the planet, so the example
  // is a car the reader has seen wherever they are reading this.
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  "onboardingA.vehicle.makeSearch": "Search makes",
  "onboardingA.vehicle.makeOther": "Other",
  "onboardingA.vehicle.makeNone": "No match. Tap Other to type it in.",
  "onboardingA.vehicle.model": "Model",
  // The one part of the car nothing but the name reads, so it says out loud
  // that it can be left alone. "2019 Toyota" is a car in a garage list.
  "onboardingA.vehicle.modelOptional": "Model (optional)",
  "onboardingA.vehicle.modelPlaceholder": "Corolla",
  "onboardingA.vehicle.yearMissing": "Enter the model year.",
  "onboardingA.vehicle.yearDigits": "Year must be four digits, like 2014.",
  "onboardingA.vehicle.yearMin": "Year must be {min} or later, not {value}.",
  "onboardingA.vehicle.yearMax": "Year can't be later than {max}.",
  "onboardingA.vehicle.required": "Required.",
  "onboardingA.vehicle.saved": 'Saved as "{name}", and you can rename it later.',
  "onboardingA.vehicle.hint": "Year and make, so reminders can name the car. The model is optional.",

  "onboardingA.odometer.title.mi": "How many miles on it?",
  "onboardingA.odometer.title.km": "How many kilometres on it?",
  "onboardingA.odometer.field": "Odometer ({unit})",
  "onboardingA.odometer.placeholder.mi": "84,210",
  "onboardingA.odometer.placeholder.km": "135,600",
  "onboardingA.odometer.caption":
    "A rough number is fine, and it is what dates the services that come due by distance.",
  "onboardingA.odometer.later": "I'll add it later",
  // Offered before it is accepted: a user handing the app permission to guess
  // is owed the guess. The word "estimate" is the point of the sentence.
  "onboardingA.odometer.laterCaption":
    "Not near the car? We can start from about {distance} for a car this old, marked as an estimate until you give us a reading.",

  "onboardingA.drive.title": "How far do you drive it?",
  "onboardingA.drive.subtitle":
    "Roughly, since this is the number that turns a distance interval into a date.",
  "onboardingA.drive.legend": "Distance a year ({unit})",
  "onboardingA.drive.low.mi": "Under 5,000",
  "onboardingA.drive.low.km": "Under 8,000",
  "onboardingA.drive.average.mi": "5,000 to 10,000",
  "onboardingA.drive.average.km": "8,000 to 16,000",
  "onboardingA.drive.high.mi": "10,000 to 15,000",
  "onboardingA.drive.high.km": "16,000 to 24,000",
  "onboardingA.drive.very_high.mi": "Over 15,000",
  "onboardingA.drive.very_high.km": "Over 24,000",
  "onboardingA.drive.projection":
    "At that rate this car reads about {distance} this time next year.",
  "onboardingA.drive.caption":
    "Used to date the services that come due by distance rather than by the calendar.",
};

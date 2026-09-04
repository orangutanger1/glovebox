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

  "onboardingA.vehicle.title": "What are you driving?",
  "onboardingA.vehicle.year": "Year",
  "onboardingA.vehicle.makeOptional": "Make (optional)",
  // Corolla and its maker outsell every other car on the planet, so the example
  // is a car the reader has seen wherever they are reading this.
  "onboardingA.vehicle.makePlaceholder": "Toyota",
  // The one part of the car nothing but the name reads, so it says out loud
  // that it can be left alone. "2019 Toyota" is a car in a garage list.
  "onboardingA.vehicle.modelOptional": "Model (optional)",
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

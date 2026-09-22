import type { Fragment } from "../types";

/**
 * The two one-tap questions in `src/survey`: where the install came from, and
 * what stopped a user who turned the exit offer down.
 *
 * Every answer is short enough to be the whole card. The objection answers
 * are written in the user's voice, because they are the user's reason and
 * not the app's guess at it.
 */
export const survey: Fragment = {
  "survey.source.title": "How did you hear about us?",
  "survey.source.tiktok": "TikTok",
  "survey.source.instagram": "Instagram",
  "survey.source.youtube": "YouTube",
  "survey.source.app_store": "Searching the App Store",
  "survey.source.friend": "A friend or family member",
  "survey.source.other": "Somewhere else",

  "survey.objection.title": "What stopped you?",
  "survey.objection.subtitle": "One tap. It tells us what to fix.",
  "survey.objection.price": "It costs too much",
  "survey.objection.try_first": "I want to try it first",
  "survey.objection.browsing": "Just looking around",
  "survey.objection.no_car": "I don't have a car",
  "survey.objection.other": "Something else",
  "survey.objection.skip": "Skip",
};

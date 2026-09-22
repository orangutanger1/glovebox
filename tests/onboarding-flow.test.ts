// The flow reads the stored variant for its default `hidden` list, and the
// store is the device database. These tests pass `hidden` explicitly, so the
// store is stubbed to "never assigned" rather than opened.
jest.mock("../src/experiments", () => ({ getVariant: () => null }));

import {
  FLOW,
  QUIZ,
  hiddenRoutes,
  nextRoute,
  previousRoute,
  quizStep,
  resumeRoute,
  isOnboardingRoute,
} from "../src/onboarding/flow";

test("the flow is a single chain with a start and an end", () => {
  expect(previousRoute("welcome")).toBeNull();
  expect(nextRoute("offer")).toBeNull();

  const walked = ["welcome"];
  let at = nextRoute("welcome");
  while (at) {
    walked.push(at);
    at = nextRoute(at);
  }
  expect(walked).toEqual([...FLOW]);
});

test("back steps over analyzing, which advances itself", () => {
  // Landing on it from the schedule would push the user straight forward again
  // and make the screen before it unreachable.
  expect(previousRoute("schedule")).toBe("source");
  expect(previousRoute("analyzing")).toBe("source");
});

test("the source question sits between the last quiz question and the loader", () => {
  expect(nextRoute("worry")).toBe("source");
  expect(nextRoute("source")).toBe("analyzing");
  expect(QUIZ).not.toContain("source");
});

test("every quiz screen is numbered and no other screen is", () => {
  expect(QUIZ.map((route) => quizStep(route)?.step)).toEqual([1, 2, 3, 4, 5, 6]);
  for (const route of FLOW) {
    if (QUIZ.includes(route)) expect(quizStep(route)?.total).toBe(QUIZ.length);
    else expect(quizStep(route)).toBeNull();
  }
});

test("the odometer follows the car directly", () => {
  // `body` sat here and asked for a body style nothing downstream read. It was
  // cut rather than repaired: a question the product does not consume cannot be
  // made to earn a screen by restyling it.
  expect(FLOW).not.toContain("body");
  expect(nextRoute("vehicle")).toBe("odometer");
  expect(previousRoute("odometer")).toBe("vehicle");
});

test("the quiz is six questions and the odometer is the second", () => {
  expect(QUIZ).toHaveLength(6);
  expect(quizStep("odometer")).toEqual({ step: 2, total: 6 });
});

test("the flow ends on the second ask, with no free door after it", () => {
  // The order is the conversion argument: a free start printed anywhere in the
  // flow is taken by everyone who would otherwise have paid, and it was last
  // printed on a whole screen of its own after both asks.
  expect(FLOW[FLOW.length - 1]).toBe("offer");
  expect(FLOW).not.toContain("free");
  expect(FLOW.indexOf("offer")).toBeGreaterThan(FLOW.indexOf("paywall"));
});

test("the notification ask comes before the screens a user drops out of", () => {
  // It used to sit immediately before the paywall, which covered exactly one
  // exit. Then it moved to just after the computed result, which still left
  // the whole quiz in front of it — and the quiz is where an abandoned flow is
  // abandoned. It now sits two questions in, which is the earliest point at
  // which the app knows the car it would be sending reminders about.
  expect(nextRoute("odometer")).toBe("notify");
  expect(nextRoute("notify")).toBe("drive");
  for (const later of [
    "drive",
    "service",
    "tracking",
    "worry",
    "schedule",
    "symptoms",
    "help",
    "reviews",
    "paywall",
    "offer",
  ] as const) {
    expect(FLOW.indexOf("notify")).toBeLessThan(FLOW.indexOf(later));
  }
  // Not before the car exists. "allow notifications?" with no vehicle behind it
  // is the context-free ask opt-in collapses on.
  expect(FLOW.indexOf("notify")).toBeGreaterThan(FLOW.indexOf("vehicle"));
  // It is not one of the six questions, however deep into them it sits.
  expect(QUIZ).not.toContain("notify");
  expect(quizStep("notify")).toBeNull();
  // The loader lands on the one payoff page.
  expect(nextRoute("analyzing")).toBe("schedule");
});

test("the two old payoff screens resume on the page that replaced them", () => {
  expect(resumeRoute("results")).toBe("schedule");
  expect(resumeRoute("outlook")).toBe("schedule");
});

test("a resume point from a version that shipped different screens still lands somewhere", () => {
  expect(resumeRoute("ready")).toBe("analyzing");
  expect(resumeRoute("reminders")).toBe("notify");
  // The plan screen was split: its notification ask is now "notify", its
  // schedule folded into the paywall. Both old resume points still land.
  expect(resumeRoute("plan")).toBe("notify");
  expect(resumeRoute("features")).toBe("paywall");
  // Parked on the free landing by an older build: the trial is the last thing
  // left worth asking, and declining it now ends the flow.
  expect(resumeRoute("free")).toBe("offer");
  expect(resumeRoute("intro")).toBe("vehicle");
  expect(resumeRoute("a-screen-that-never-existed")).toBe("welcome");
  expect(resumeRoute(null)).toBe("welcome");
  expect(resumeRoute("symptoms")).toBe("symptoms");
});

test("the flow introduces itself before it interrogates", () => {
  // The name is asked once, before the quiz, and it is not one of the six
  // questions — a counter over "what should we call you?" makes an
  // introduction feel like question zero.
  expect(nextRoute("welcome")).toBe("name");
  expect(nextRoute("name")).toBe("vehicle");
  expect(QUIZ).not.toContain("name");
  expect(quizStep("name")).toBeNull();
});

test("the two statistic screens are not back to back", () => {
  // "cost" follows the last-service question it is about and is not one of
  // the six questions; "compare" stays at the end of the story, between the
  // symptoms and the answer. Side by side they read as a slide deck.
  expect(nextRoute("service")).toBe("cost");
  expect(nextRoute("cost")).toBe("tracking");
  expect(quizStep("cost")).toBeNull();
  expect(nextRoute("symptoms")).toBe("compare");
  expect(nextRoute("compare")).toBe("help");
});

test("route names are checked, not assumed", () => {
  expect(isOnboardingRoute("paywall")).toBe(true);
  expect(isOnboardingRoute("garage")).toBe(false);
});

describe("the no_symptoms variant", () => {
  const hidden = hiddenRoutes("no_symptoms");

  test("hides the pain beat and nothing else", () => {
    expect(hidden).toEqual(["symptoms", "help"]);
    expect(hiddenRoutes("control")).toEqual([]);
    expect(hiddenRoutes(null)).toEqual([]);
    expect(hiddenRoutes("half_symptoms")).toEqual([]);
  });

  test("walks forward through the flow minus the hidden screens", () => {
    const walked: string[] = ["welcome"];
    let at = nextRoute("welcome", hidden);
    while (at) {
      walked.push(at);
      at = nextRoute(at, hidden);
    }
    expect(walked).toEqual(FLOW.filter((r) => !hidden.includes(r)));
    expect(nextRoute("schedule", hidden)).toBe("compare");
  });

  test("walks back the same path", () => {
    expect(previousRoute("compare", hidden)).toBe("schedule");
    const walked: string[] = ["offer"];
    let at = previousRoute("offer", hidden);
    while (at) {
      walked.push(at);
      at = previousRoute(at, hidden);
    }
    // Back also steps over "analyzing", as it always has.
    expect(walked).toEqual(
      FLOW.filter((r) => !hidden.includes(r) && r !== "analyzing").reverse()
    );
  });

  test("a persisted step on a hidden screen resumes on the next visible one", () => {
    expect(resumeRoute("symptoms", hidden)).toBe("compare");
    // "help" sits after "compare", so it resumes one further on.
    expect(resumeRoute("help", hidden)).toBe("reviews");
    expect(resumeRoute("schedule", hidden)).toBe("schedule");
  });

  test("with nothing hidden the graph is unchanged", () => {
    expect(nextRoute("schedule")).toBe("symptoms");
    expect(nextRoute("schedule", [])).toBe("symptoms");
    expect(previousRoute("compare")).toBe("symptoms");
    expect(previousRoute("reviews")).toBe("help");
    expect(resumeRoute("symptoms")).toBe("symptoms");
  });
});

describe("the onboarding_payoff experiment", () => {
  test("the none arm hides the schedule page and nothing else", () => {
    expect(hiddenRoutes({ payoff: "none" })).toEqual(["schedule"]);
    expect(hiddenRoutes({ payoff: "condensed" })).toEqual([]);
    expect(hiddenRoutes({ payoff: null })).toEqual([]);
    expect(hiddenRoutes({ payoff: "both" })).toEqual([]);
  });

  test("the loader lands on the pain beat, or past it, with the page hidden", () => {
    expect(nextRoute("analyzing", hiddenRoutes({ payoff: "none" }))).toBe("symptoms");
    // The two experiments stack: the install with neither screen goes from
    // the loader to the comparison.
    const both = hiddenRoutes({ symptoms: "no_symptoms", payoff: "none" });
    expect(both).toEqual(["symptoms", "help", "schedule"]);
    expect(nextRoute("analyzing", both)).toBe("compare");
    expect(previousRoute("compare", both)).toBe("source");
  });

  test("an install parked on the page, or on either screen it replaced, resumes past it", () => {
    const hidden = hiddenRoutes({ payoff: "none" });
    expect(resumeRoute("schedule", hidden)).toBe("symptoms");
    expect(resumeRoute("results", hidden)).toBe("symptoms");
  });
});

import {
  FLOW,
  QUIZ,
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
  // Landing on it from the results would push the user straight forward again
  // and make the last quiz question unreachable.
  expect(previousRoute("results")).toBe("worry");
  expect(previousRoute("analyzing")).toBe("worry");
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

test("route names are checked, not assumed", () => {
  expect(isOnboardingRoute("paywall")).toBe(true);
  expect(isOnboardingRoute("garage")).toBe(false);
});

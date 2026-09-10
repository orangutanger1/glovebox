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

test("the notification ask comes before the screens a user drops out of", () => {
  // It used to sit immediately before the paywall, which covered exactly one
  // exit. Everything a user quits during — symptoms, help, reviews — now
  // happens with permission already asked, so an abandoned flow can be told it
  // is abandoned. It still comes after the computed result, because the screen
  // is a picture of a real reminder built from this car's own records.
  // "outlook" was inserted between the results and the ask: the projection is
  // what the reminder is for, so it stands immediately in front of it.
  expect(nextRoute("results")).toBe("outlook");
  expect(nextRoute("outlook")).toBe("notify");
  expect(nextRoute("notify")).toBe("symptoms");
  for (const later of ["symptoms", "help", "reviews", "paywall", "offer"] as const) {
    expect(FLOW.indexOf("notify")).toBeLessThan(FLOW.indexOf(later));
  }
  expect(FLOW.indexOf("notify")).toBeGreaterThan(FLOW.indexOf("results"));
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

test("the cost of the problem is stated between the symptoms and the answer", () => {
  // "symptoms" names the problem, "cost" prices it, "help" answers it. Priced
  // after the answer it is an invoice; priced before the problem it is a
  // statistic with nothing to attach to.
  expect(nextRoute("symptoms")).toBe("cost");
  expect(nextRoute("cost")).toBe("help");
});

test("route names are checked, not assumed", () => {
  expect(isOnboardingRoute("paywall")).toBe(true);
  expect(isOnboardingRoute("garage")).toBe(false);
});

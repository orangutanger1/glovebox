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

test("a resume point from a version that shipped different screens still lands somewhere", () => {
  expect(resumeRoute("ready")).toBe("analyzing");
  expect(resumeRoute("reminders")).toBe("plan");
  expect(resumeRoute("a-screen-that-never-existed")).toBe("welcome");
  expect(resumeRoute(null)).toBe("welcome");
  expect(resumeRoute("symptoms")).toBe("symptoms");
});

test("route names are checked, not assumed", () => {
  expect(isOnboardingRoute("paywall")).toBe(true);
  expect(isOnboardingRoute("garage")).toBe(false);
});

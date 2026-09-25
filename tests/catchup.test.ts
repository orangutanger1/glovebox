import { catchupServices, CATCHUP_LIMIT } from "../src/onboarding/catchup";
import type { Plan, PlanItem } from "../src/onboarding/plan";

const item = (type: string, logged: boolean): PlanItem => ({ type, status: "due", logged, projected: false });
const plan = (items: PlanItem[]) => ({ items }) as unknown as Plan;

describe("catchupServices", () => {
  test("asks about the common services with nothing on file, most common first", () => {
    const services = catchupServices(
      plan([item("Brake Inspection", false), item("Oil Change", true), item("Tire Rotation", false), item("Spark Plugs", false)]),
    );
    expect(services).toEqual(["Tire Rotation", "Brake Inspection"]);
  });

  test("never asks more than the limit", () => {
    const all = ["Oil Change", "Tire Rotation", "Brake Inspection", "Air Filter", "Inspection"].map((t) => item(t, false));
    expect(catchupServices(plan(all))).toHaveLength(CATCHUP_LIMIT);
  });

  test("skips a service the market does not track", () => {
    // Inspection is left out of the plan where there is no periodic test.
    expect(catchupServices(plan([item("Oil Change", true)]))).toEqual([]);
  });
});

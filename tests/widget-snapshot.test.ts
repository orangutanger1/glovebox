import { buildWidgetProps } from "../src/widget/snapshot";
import type { DueState } from "../src/schedule/due";

const last = { performed_at: "2026-01-01" };
const base = {
  unit: "mi" as const,
  serviceName: (type: string) => type,
  formatDistance: (d: number) => `${d} mi`,
  formatDate: (iso: string) => iso.slice(0, 10),
  t: (key: string, params?: Record<string, string>) => (params ? `${key}:${Object.values(params).join(",")}` : key),
};

test("an empty garage says so and taps through to the garage", () => {
  expect(buildWidgetProps({ ...base, vehicle: null, states: [] })).toEqual({
    vehicle: "",
    rows: [],
    empty: "garage.widgetNoCar",
    url: "/",
  });
});

test("rows are worst first, then soonest, capped at three, in the garage card's words", () => {
  const states: DueState[] = [
    { type: "Wipers", status: "ok", dueAt: "2027-03-01", last },
    { type: "Tires", status: "soon", dueAt: "2026-11-01", last },
    { type: "Oil", status: "due", overBy: 400, last },
    { type: "Brakes", status: "ok", dueAt: "2026-12-01", last },
  ];
  const props = buildWidgetProps({ ...base, vehicle: { id: "v1", name: "2019 Civic" }, states });
  expect(props.vehicle).toBe("2019 Civic");
  expect(props.url).toBe("/vehicle/v1");
  expect(props.rows).toEqual([
    { label: "Oil", status: "due", detail: "garage.over:400 mi" },
    { label: "Tires", status: "soon", detail: "2026-11-01" },
    { label: "Brakes", status: "ok", detail: "2026-12-01" },
  ]);
});

test("a car with nothing tracked has no rows and an invitation", () => {
  const props = buildWidgetProps({ ...base, vehicle: { id: "v1", name: "Civic" }, states: [] });
  expect(props.rows).toEqual([]);
  expect(props.empty).toBe("garage.nothingLogged.detail");
});

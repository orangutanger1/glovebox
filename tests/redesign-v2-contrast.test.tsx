import { act } from "react";
import { Animated, Text } from "react-native";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let mockReduced = false;
jest.mock("../src/design/useReduceMotion", () => ({ useReduceMotion: () => mockReduced }));
jest.mock("../src/design/theme", () => ({ isRedesign: () => true, isDesignV2: () => true }));
jest.mock("../src/units", () => ({ ...jest.requireActual("../src/units"), getDistanceUnit: () => "mi" }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

import { HeroCard } from "../src/redesign/HeroCard";
import { LoggedMoment } from "../src/redesign/LoggedMoment";
import { Road } from "../src/redesign/Road";
import { setLanguage } from "../src/i18n";

beforeAll(() => setLanguage("en"));

function mount(el: React.ReactElement) {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(el);
  });
  return tree;
}

test("an on-schedule hero label is dark enough for small text", () => {
  const tree = mount(
    <HeroCard showCar={false} fig={{ kind: "date", vehicleId: "a", vehicleName: "A", type: "Oil Change", status: "ok", dueAt: "2027-03-01T00:00:00.000Z" }} />,
  );
  const label = tree.root.findAllByType(Text).find((n) => String(n.props.children).includes("Next up"))!;
  expect(label.props.style.color).toBe("#3A64E0");
});

test("the logged moment's next line is plain white", () => {
  const tree = mount(<LoggedMoment visible service="Oil Change" next={{ dueOdometer: 53000 }} onDone={() => {}} />);
  const line = tree.root.findAllByType(Text).find((n) => String(n.props.children).startsWith("Next at"))!;
  expect(line.props.style.color).toBe("#FFFFFF");
});

test("road signs settle at once when Reduce Motion turns on after mount", () => {
  mockReduced = false;
  const road = { vehicleId: "a", vehicleName: "A", odometer: 1000, behind: [], ahead: [{ type: "Oil Change", status: "ok" as const, dueAt: "2027-03-01T00:00:00.000Z", last: { performed_at: "2026-09-01T00:00:00.000Z" } }] };
  const tree = mount(<Road road={road} mood="happy" showName={false} />);
  // The rise runs on the native driver, so the renderer's props never see the
  // value change; watch the value instead.
  const set = jest.spyOn(Animated.Value.prototype, "setValue");
  const stop = jest.spyOn(Animated.Value.prototype, "stopAnimation");
  mockReduced = true;
  act(() => tree.update(<Road road={road} mood="happy" showName={false} />));
  expect(stop).toHaveBeenCalled();
  expect(set).toHaveBeenCalledWith(1);
  set.mockRestore();
  stop.mockRestore();
});

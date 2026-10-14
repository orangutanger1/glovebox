import { act } from "react";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let mockV2 = false;
jest.mock("../src/design/theme", () => ({ isRedesign: () => true, isDesignV2: () => mockV2 }));

import { ServiceSticker, stickerFor } from "../src/redesign/stickers";
import { TaskRow } from "../src/redesign/ui";
import { UpcomingRow } from "../src/redesign/icons";

test("every built-in service has its own sticker", () => {
  expect(stickerFor("Oil Change")).toBe("oil");
  expect(stickerFor("Tire Rotation")).toBe("tire");
  expect(stickerFor("Brake Inspection")).toBe("brake");
  expect(stickerFor("Air Filter")).toBe("filter");
  expect(stickerFor("Cabin Air Filter")).toBe("filter");
  expect(stickerFor("Wiper Blades")).toBe("wiper");
  expect(stickerFor("Battery Check")).toBe("battery");
  expect(stickerFor("Coolant Flush")).toBe("coolant");
  expect(stickerFor("Spark Plugs")).toBe("spark");
});

test("worn tread is a tyre; anything custom is the wrench", () => {
  expect(stickerFor("tread")).toBe("tire");
  expect(stickerFor("Timing belt (my own)")).toBe("wrench");
});

function stickers(el: React.ReactElement): number {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(el);
  });
  const n = tree.root.findAllByType(ServiceSticker).length;
  act(() => tree.unmount());
  return n;
}

const task = (
  <TaskRow type="Oil Change" title="Oil Change" subtitle="2,210 mi over" status="due" checkLabel="Log" onCheck={() => {}} />
);
const upcoming = <UpcomingRow type="Oil Change" title="Oil Change" when="in 3 days" />;

test("v2 rows carry the service's sticker", () => {
  mockV2 = true;
  expect(stickers(task)).toBe(1);
  expect(stickers(upcoming)).toBe(1);
});

test("rows outside v2 have no sticker", () => {
  mockV2 = false;
  expect(stickers(task)).toBe(0);
  expect(stickers(upcoming)).toBe(0);
});

import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";

// React only accepts `act` outside a DOM test environment when this is set.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Listener = (info: { entitlements: { active: Record<string, unknown> } }) => void;

const listeners: Listener[] = [];
let customerInfo: Promise<{ entitlements: { active: Record<string, unknown> } }>;

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    getCustomerInfo: () => customerInfo,
    addCustomerInfoUpdateListener: (l: Listener) => listeners.push(l),
    removeCustomerInfoUpdateListener: (l: Listener) => {
      const i = listeners.indexOf(l);
      if (i >= 0) listeners.splice(i, 1);
      return i >= 0;
    },
  },
}));

// The module under test imports ENTITLEMENT from ../purchases, which pulls in
// react-native-purchases-ui. Nothing here touches it.
jest.mock("react-native-purchases-ui", () => ({ __esModule: true, default: {}, PAYWALL_RESULT: {} }));

import { useIsPro } from "../src/purchases/useIsPro";

const PRO = { entitlements: { active: { pro: {} } } };
const FREE = { entitlements: { active: {} } };

/** Renders the hook and reports every value it has produced. */
async function renderHook() {
  const seen: (boolean | null)[] = [];
  function Probe() {
    seen.push(useIsPro());
    return null;
  }
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(createElement(Probe));
  });
  return { seen, unmount: () => act(() => tree.unmount()) };
}

beforeEach(() => {
  listeners.length = 0;
  customerInfo = Promise.resolve(FREE);
});

test("starts unknown before the entitlement resolves", async () => {
  // Never `false` first: rendering the free rows in that gap shows a paying
  // subscriber an advert for what they already bought.
  let resolve!: (v: typeof FREE) => void;
  customerInfo = new Promise((r) => (resolve = r));

  const seen: (boolean | null)[] = [];
  function Probe() {
    seen.push(useIsPro());
    return null;
  }
  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });
  expect(seen).toEqual([null]);

  await act(async () => {
    resolve(PRO);
  });
  expect(seen[seen.length - 1]).toBe(true);
});

test("resolves to true for an active entitlement", async () => {
  customerInfo = Promise.resolve(PRO);
  const { seen } = await renderHook();
  expect(seen[seen.length - 1]).toBe(true);
});

test("resolves to false without one", async () => {
  const { seen } = await renderHook();
  expect(seen[seen.length - 1]).toBe(false);
});

test("treats an unreachable store as not Pro rather than hanging on null", async () => {
  customerInfo = Promise.reject(new Error("offline"));
  const { seen } = await renderHook();
  expect(seen[seen.length - 1]).toBe(false);
});

test("follows a cancellation made inside the Customer Center sheet", async () => {
  customerInfo = Promise.resolve(PRO);
  const { seen } = await renderHook();
  expect(seen[seen.length - 1]).toBe(true);

  await act(async () => {
    listeners.forEach((l) => l(FREE));
  });
  expect(seen[seen.length - 1]).toBe(false);
});

test("removes its listener on unmount", async () => {
  const { unmount } = await renderHook();
  expect(listeners).toHaveLength(1);
  unmount();
  expect(listeners).toHaveLength(0);
});

import { getState, setState } from "../db/state";
import { deviceRegion } from "../i18n/device";
import { track } from "../analytics";
import { matchModel, nhtsaMake, toRecalls, type Recall } from "./match";

export type { Recall } from "./match";

/**
 * Safety recalls for a vehicle, from NHTSA's public recall API.
 *
 * The app has no server, and this does not add one: the phone asks NHTSA
 * directly, and what is sent is the make, the model and the year — nothing
 * about the owner, their records or the car's VIN. The answer is cached on the
 * phone for a week, so the vehicle screen asks at most once a week per car.
 *
 * US only. NHTSA's list is the US market's; a Ford Focus in Leeds is a
 * different car under the same name, and telling its owner about a US recall
 * is worse than telling them nothing.
 *
 * A model-level list, not a VIN check: it says which recalls cover this model
 * year, not whether this car has had the fix. The screen says so and links to
 * NHTSA's VIN lookup for that.
 */

export type RecallResult =
  | { status: "found"; model: string; recalls: Recall[] }
  | { status: "none"; model: string }
  /** Nothing to ask with, a market NHTSA does not cover, or a model NHTSA
   *  does not list. The screen draws nothing. */
  | { status: "unavailable" };

const API = "https://api.nhtsa.gov";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;
const REGIONS = new Set(["US", "PR"]);

export const NHTSA_VIN_URL = "https://www.nhtsa.gov/recalls";

type VehicleLike = { make?: string; model?: string; year?: number };

function cacheKey(v: Required<VehicleLike>): string {
  return `recalls:${v.make.trim().toLowerCase()}|${v.model.trim().toLowerCase()}|${v.year}`;
}

/** The cached answer for this vehicle, fresh or not, without asking anyone. */
export function cachedRecalls(v: VehicleLike, now = Date.now()): { result: RecallResult; fresh: boolean } | null {
  if (!v.make || !v.model || !v.year) return null;
  try {
    const raw = getState(cacheKey(v as Required<VehicleLike>));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; result: RecallResult };
    return { result: parsed.result, fresh: now - parsed.at < TTL_MS };
  } catch {
    return null;
  }
}

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`NHTSA ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The recalls for this vehicle: the week's cached answer when there is one,
 * otherwise NHTSA's. Throws only on a network failure with nothing cached —
 * the caller draws nothing then, and asks again next time.
 */
export async function lookupRecalls(v: VehicleLike, region = deviceRegion()): Promise<RecallResult> {
  if (!v.make || !v.model || !v.year) return { status: "unavailable" };
  if (!region || !REGIONS.has(region)) return { status: "unavailable" };

  const cached = cachedRecalls(v);
  if (cached?.fresh) return cached.result;

  const make = nhtsaMake(v.make);
  const year = String(v.year);
  let result: RecallResult;
  try {
    const models = await getJson<{ results?: { model?: string }[] }>(
      `/products/vehicle/models?modelYear=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&issueType=r`
    );
    const model = matchModel(
      v.model,
      (models.results ?? []).map((r) => r.model ?? "").filter(Boolean)
    );
    if (!model) {
      result = { status: "unavailable" };
    } else {
      const found = await getJson<{ results?: Parameters<typeof toRecalls>[0] }>(
        `/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`
      );
      const recalls = toRecalls(found.results ?? []);
      result = recalls.length > 0 ? { status: "found", model, recalls } : { status: "none", model };
    }
  } catch (error) {
    // A stale answer beats no answer; nothing cached, the caller draws nothing.
    if (cached) return cached.result;
    track("recall_check", { status: "error" });
    throw error;
  }

  try {
    setState(cacheKey(v as Required<VehicleLike>), JSON.stringify({ at: Date.now(), result }));
  } catch {
    // An uncached answer is still an answer.
  }
  track("recall_check", {
    status: result.status,
    count: result.status === "found" ? result.recalls.length : 0,
  });
  return result;
}

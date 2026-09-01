/**
 * What the garage has cost, derived from the log that already exists.
 *
 * Every number here is arithmetic over `service_records`; nothing new is
 * collected and nothing is estimated. That constraint is the point. A spend
 * screen is only worth putting on the glass if a user can point at any figure
 * and find the rows that made it, so an entry the user never priced has to stay
 * absent from the sum rather than be filled in as a zero — a zero would quietly
 * turn "I didn't record what this cost" into "this was free" and understate the
 * total by however many rows.
 *
 * Hence `pricedCount`/`unpricedCount` travelling beside every total: the screen
 * can say what the figure is drawn from, and a total built from three of eleven
 * services can be labelled as such instead of read as the whole truth.
 *
 * Pure functions over rows, with the query left to the caller, so the whole
 * module runs in plain Node under tests/insights.test.ts.
 */

export type CostedRecord = {
  vehicle_id: string;
  service_type: string;
  performed_at: string;
  cost?: number;
};

export type Spend = {
  total: number;
  pricedCount: number;
  unpricedCount: number;
};

export type SpendBucket = Spend & { key: string };

/** A cost that can be added up: present, finite, and not negative. A row whose
 *  cost never parsed is stored NULL, and SQLite hands back whatever was put in,
 *  so this is the one place that decides what counts. */
function priced(r: CostedRecord): number | null {
  const c = r.cost;
  if (c === undefined || c === null) return null;
  if (!Number.isFinite(c) || c < 0) return null;
  return c;
}

export function spendOf(records: readonly CostedRecord[]): Spend {
  let total = 0;
  let pricedCount = 0;
  let unpricedCount = 0;
  for (const r of records) {
    const c = priced(r);
    if (c === null) unpricedCount += 1;
    else {
      total += c;
      pricedCount += 1;
    }
  }
  return { total, pricedCount, unpricedCount };
}

/**
 * Spend grouped by a key, biggest first.
 *
 * Ties break on the key so the order is stable across renders — a list that
 * reshuffles two equal rows on every focus reads as a bug even though the
 * numbers are right.
 */
function groupBy(
  records: readonly CostedRecord[],
  key: (r: CostedRecord) => string
): SpendBucket[] {
  const buckets = new Map<string, CostedRecord[]>();
  for (const r of records) {
    const k = key(r);
    const existing = buckets.get(k);
    if (existing) existing.push(r);
    else buckets.set(k, [r]);
  }
  return [...buckets.entries()]
    .map(([k, rows]) => ({ key: k, ...spendOf(rows) }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

/** Spend per vehicle. Vehicles with no records at all are absent: the caller
 *  holds the vehicle list and can decide whether an empty garage row is worth
 *  drawing, which is a screen question, not an arithmetic one. */
export function spendByVehicle(records: readonly CostedRecord[]): SpendBucket[] {
  return groupBy(records, (r) => r.vehicle_id);
}

/** Spend per service type — the answer to "what is actually taking the money",
 *  which is the question tyres and timing belts exist to make uncomfortable. */
export function spendByService(records: readonly CostedRecord[]): SpendBucket[] {
  return groupBy(records, (r) => r.service_type);
}

/** The "YYYY-MM" a record falls in, read off the stored string rather than
 *  parsed into a Date. `performed_at` is written as noon local and serialised,
 *  and re-parsing it into the reader's zone can walk a record across a month
 *  boundary — the log already shows this row under the date in its own string,
 *  and a monthly chart that disagrees with the list beneath it is worse than a
 *  chart that is a few hours naive. */
export function monthOf(performedAt: string): string {
  return performedAt.slice(0, 7);
}

/** The `count` months ending with the one containing `now`, oldest first. */
export function recentMonths(count: number, now: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

/**
 * A dense monthly series: every month in the window, including the ones nothing
 * was spent in.
 *
 * Dense rather than sparse because the gaps carry the meaning. A bar chart of
 * only the months with services in them puts March next to September at equal
 * width and reads as steady spending, which is the opposite of what happened.
 */
export function spendByMonth(
  records: readonly CostedRecord[],
  months: number,
  now: Date = new Date()
): SpendBucket[] {
  const window = recentMonths(months, now);
  const inWindow = new Set(window);
  const grouped = new Map(
    groupBy(
      records.filter((r) => inWindow.has(monthOf(r.performed_at))),
      (r) => monthOf(r.performed_at)
    ).map((b) => [b.key, b])
  );
  return window.map(
    (m) => grouped.get(m) ?? { key: m, total: 0, pricedCount: 0, unpricedCount: 0 }
  );
}

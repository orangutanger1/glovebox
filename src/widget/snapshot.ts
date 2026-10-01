import type { DueState } from "../schedule/due";
import type { DistanceUnit } from "../units";

/**
 * What the home-screen widget draws, as plain data.
 *
 * The widget runs in its own process with no database, no i18n and no
 * imports, so everything it shows is decided here, translated here, and
 * handed over as strings. The extension only lays them out.
 */
export type WidgetRow = { label: string; detail: string; status: "due" | "soon" | "ok" };

export type WidgetProps = {
  /** The car the rows are about, or "" when the garage is empty. */
  vehicle: string;
  /** Worst first, then soonest. At most three; the small size draws one. */
  rows: WidgetRow[];
  /** What to say when there are no rows. */
  empty: string;
  /** Where a tap lands. */
  url: string;
};

const RANK = { due: 2, soon: 1, ok: 0 } as const;
export const WIDGET_ROWS = 3;

/**
 * Pure: the caller reads the car and its due states, and passes the strings
 * the garage card already uses, so the widget and the garage never disagree
 * about what is next.
 */
export function buildWidgetProps(input: {
  vehicle: { id: string; name: string } | null;
  states: DueState[];
  unit: DistanceUnit;
  serviceName: (type: string) => string;
  formatDistance: (d: number, unit: DistanceUnit) => string;
  formatDate: (iso: string) => string;
  t: (key: string, params?: Record<string, string>) => string;
}): WidgetProps {
  const { vehicle, t } = input;
  if (!vehicle) return { vehicle: "", rows: [], empty: t("garage.widgetNoCar"), url: "/" };

  const rows = [...input.states]
    .sort(
      (a, b) =>
        RANK[b.status] - RANK[a.status] ||
        (a.dueAt ?? "￿").localeCompare(b.dueAt ?? "￿")
    )
    .slice(0, WIDGET_ROWS)
    .map((s) => ({
      label: input.serviceName(s.type),
      status: s.status,
      detail:
        s.status === "due" && s.overBy !== undefined
          ? t("garage.over", { distance: input.formatDistance(s.overBy, input.unit) })
          : s.status === "due"
            ? t("garage.dueNow")
            : s.dueAt
              ? input.formatDate(s.dueAt)
              : s.status === "soon"
                ? t("garage.dueSoon")
                : t("garage.onSchedule"),
    }));

  return {
    vehicle: vehicle.name,
    rows,
    empty: t("garage.nothingLogged.detail"),
    url: `/vehicle/${vehicle.id}`,
  };
}

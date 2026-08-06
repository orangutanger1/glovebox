import { t } from "../i18n";
import { distanceUnitLabel } from "../units/format";

export type CsvRow = {
  vehicle_name: string;
  service_type: string;
  performed_at: string;
  odometer?: number | null;
  cost?: number | null;
  notes?: string | null;
  deleted_at?: string | null;
};

/**
 * Only the header row is translated. The cells below it are the contract: a
 * spreadsheet someone already built against an earlier export keys off English
 * service types, ISO dates and ungrouped numbers, and a "51 771" or a localised
 * "Ölwechsel" would break it. The row a person reads is the row that is theirs.
 */
function header(): string[] {
  return [
    t("system.csv.header.vehicle"),
    t("system.csv.header.service"),
    t("system.csv.header.date"),
    t("system.csv.header.odometer", { unit: distanceUnitLabel() }),
    t("system.csv.header.cost"),
    t("system.csv.header.notes"),
    t("system.csv.header.deleted"),
  ];
}

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: CsvRow[]): string {
  const lines = [header().join(",")];
  for (const r of rows) {
    lines.push(
      [
        cell(r.vehicle_name),
        cell(r.service_type),
        cell(r.performed_at.slice(0, 10)),
        cell(r.odometer),
        cell(r.cost),
        cell(r.notes),
        cell(r.deleted_at ? t("system.csv.cell.deleted") : ""),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

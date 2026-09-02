import { t } from "../i18n";
import { distanceUnitLabel } from "../units/format";
import { volumeUnitLabel } from "../fuel/format";

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

export type FuelCsvRow = {
  vehicle_name: string;
  filled_at: string;
  odometer: number;
  volume: number;
  cost?: number | null;
  full: number;
  deleted_at?: string | null;
};

/**
 * Fill-ups, as their own file.
 *
 * A second file rather than extra columns on the first: the service export's
 * column set is a contract, and widening it breaks exactly the spreadsheets the
 * comment above exists to protect. The same rules apply inside — English cells,
 * ISO dates, ungrouped numbers — because these cells become a contract too,
 * from this file's first release.
 *
 * `Full tank` is a column rather than something left implicit, so a spreadsheet
 * can reproduce the rule the app applies: only the interval between two full
 * fills is a measurement rather than a guess.
 */
function fuelHeader(): string[] {
  return [
    t("system.csv.header.vehicle"),
    t("system.csv.header.date"),
    t("system.csv.header.odometer", { unit: distanceUnitLabel() }),
    t("system.csv.fuel.volume", { unit: volumeUnitLabel() }),
    t("system.csv.header.cost"),
    t("system.csv.fuel.full"),
    t("system.csv.header.deleted"),
  ];
}

export function toFuelCsv(rows: FuelCsvRow[]): string {
  const lines = [fuelHeader().join(",")];
  for (const r of rows) {
    lines.push(
      [
        cell(r.vehicle_name),
        cell(r.filled_at.slice(0, 10)),
        cell(r.odometer),
        cell(r.volume),
        cell(r.cost),
        cell(r.full === 1 ? t("system.csv.cell.yes") : t("system.csv.cell.no")),
        cell(r.deleted_at ? t("system.csv.cell.deleted") : ""),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

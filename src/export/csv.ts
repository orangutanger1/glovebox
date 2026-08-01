export type CsvRow = {
  vehicle_name: string;
  service_type: string;
  performed_at: string;
  odometer?: number | null;
  cost?: number | null;
  notes?: string | null;
  deleted_at?: string | null;
};

const HEADER = ["Vehicle", "Service", "Date", "Odometer", "Cost", "Notes", "Deleted"];

function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: CsvRow[]): string {
  const lines = [HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      [
        cell(r.vehicle_name),
        cell(r.service_type),
        cell(r.performed_at.slice(0, 10)),
        cell(r.odometer),
        cell(r.cost),
        cell(r.notes),
        cell(r.deleted_at ? "deleted" : ""),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

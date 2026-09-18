import { getDb } from "./client";
import { row, rows } from "./row";
import { rewindOdometer, setOdometerIfHigher } from "./vehicles";
import type { FuelEntry } from "../fuel";

export type FuelRow = FuelEntry & { deleted_at?: string; created_at: string };

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Newest first, by odometer — the order the history is read in. Date order
 *  would put a fill logged late above the one that came after it on the road. */
export function listFuelEntries(vehicleId: string): FuelRow[] {
  return rows(
    getDb().getAllSync<FuelRow>(
      `SELECT * FROM fuel_entries
       WHERE vehicle_id = ? AND deleted_at IS NULL
       ORDER BY odometer DESC`,
      [vehicleId]
    )
  );
}

/** Oldest first, trimmed to the columns the math reads. */
export function fuelEntriesForVehicle(vehicleId: string): FuelEntry[] {
  return rows(
    getDb().getAllSync<FuelEntry>(
      `SELECT id, vehicle_id, filled_at, odometer, volume, cost, full
       FROM fuel_entries
       WHERE vehicle_id = ? AND deleted_at IS NULL
       ORDER BY odometer ASC`,
      [vehicleId]
    )
  );
}

/** Every live fill in the garage, in one query rather than one per vehicle —
 *  the insights screen sums across the whole garage on focus, and a round trip
 *  per vehicle turns a garage of eight into eight synchronous queries. */
export function allFuelEntries(): FuelEntry[] {
  // Live vehicles only, for the same reason `costedRecords` is.
  return rows(
    getDb().getAllSync<FuelEntry>(
      `SELECT f.id, f.vehicle_id, f.filled_at, f.odometer, f.volume, f.cost, f.full
       FROM fuel_entries f
       JOIN vehicles v ON v.id = f.vehicle_id AND v.deleted_at IS NULL
       WHERE f.deleted_at IS NULL
       ORDER BY f.vehicle_id ASC, f.odometer ASC`
    )
  );
}

export function addFuelEntry(e: {
  vehicle_id: string;
  filled_at: string;
  odometer: number;
  volume: number;
  cost?: number;
  full: boolean;
}): FuelRow {
  const row: FuelRow = {
    id: id(),
    vehicle_id: e.vehicle_id,
    filled_at: e.filled_at,
    odometer: e.odometer,
    volume: e.volume,
    cost: e.cost,
    full: e.full ? 1 : 0,
    created_at: new Date().toISOString(),
  };
  getDb().runSync(
    `INSERT INTO fuel_entries
       (id, vehicle_id, filled_at, odometer, volume, cost, full, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.vehicle_id, row.filled_at, row.odometer, row.volume,
     row.cost ?? null, row.full, row.created_at]
  );
  // The reason fuel earns its place in the rest of the app: services are logged
  // yearly and fills weekly, so this is what keeps every mileage-based due date
  // honest in between. Guarded the way addRecord guards it — a fill logged for
  // an older date must never walk the odometer backwards.
  getDb().runSync(
    `UPDATE vehicles SET odometer = ?
     WHERE id = ? AND (odometer IS NULL OR odometer < ?)`,
    [row.odometer, row.vehicle_id, row.odometer]
  );
  return row;
}

function odometerOf(entryId: string): { vehicle_id: string; odometer: number } | null {
  return row(
    getDb().getFirstSync<{ vehicle_id: string; odometer: number }>(
      "SELECT vehicle_id, odometer FROM fuel_entries WHERE id = ?",
      [entryId]
    )
  );
}

/** Never deletes. Sets a tombstone so the row stays recoverable and stays in
 *  the export. The vehicle's reading follows the row out if this is the row
 *  that set it — see `rewindOdometer`. */
export function softDeleteFuelEntry(entryId: string): void {
  const e = odometerOf(entryId);
  getDb().runSync("UPDATE fuel_entries SET deleted_at = ? WHERE id = ?", [
    new Date().toISOString(),
    entryId,
  ]);
  if (e) rewindOdometer(e.vehicle_id, e.odometer);
}

export function undoDeleteFuelEntry(entryId: string): void {
  getDb().runSync("UPDATE fuel_entries SET deleted_at = NULL WHERE id = ?", [entryId]);
  const e = odometerOf(entryId);
  if (e) setOdometerIfHigher(e.vehicle_id, e.odometer);
}

/** Includes soft-deleted rows: export must never lose anything. */
export function allFuelForExport(): (FuelRow & { vehicle_name: string })[] {
  return rows(
    getDb().getAllSync<FuelRow & { vehicle_name: string }>(
      `SELECT f.*, v.name AS vehicle_name
       FROM fuel_entries f
       JOIN vehicles v ON v.id = f.vehicle_id
       ORDER BY v.name ASC, f.odometer DESC`
    )
  );
}

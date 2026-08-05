import { getDb } from "./client";
import { row, rows } from "./row";

export type Vehicle = {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  odometer?: number;
  created_at: string;
  deleted_at?: string;
};

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listVehicles(): Vehicle[] {
  return rows(
    getDb().getAllSync<Vehicle>(
      "SELECT * FROM vehicles WHERE deleted_at IS NULL ORDER BY created_at ASC"
    )
  );
}

/** Tombstoned vehicles are invisible here, the same as in listVehicles — a
 *  stale route or deep link must not resurrect one. */
export function getVehicle(vehicleId: string): Vehicle | null {
  return row(
    getDb().getFirstSync<Vehicle>("SELECT * FROM vehicles WHERE id = ? AND deleted_at IS NULL", [
      vehicleId,
    ])
  );
}

export function createVehicle(v: {
  name: string;
  make?: string;
  model?: string;
  year?: number;
  odometer?: number;
}): Vehicle {
  const row: Vehicle = { id: id(), created_at: new Date().toISOString(), ...v };
  getDb().runSync(
    `INSERT INTO vehicles (id, name, make, model, year, odometer, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.make ?? null, row.model ?? null, row.year ?? null,
     row.odometer ?? null, row.created_at]
  );
  return row;
}

/**
 * Rewrites what a vehicle IS, leaving odometer, history and created_at alone.
 *
 * Onboarding needs this: stepping back to the vehicle screen and forward again
 * used to run createVehicle a second time, so a user who corrected a typo ended
 * up with two cars in their garage.
 */
export function updateVehicleIdentity(
  vehicleId: string,
  v: { name: string; make?: string; model?: string; year?: number }
): void {
  getDb().runSync("UPDATE vehicles SET name = ?, make = ?, model = ?, year = ? WHERE id = ?", [
    v.name,
    v.make ?? null,
    v.model ?? null,
    v.year ?? null,
    vehicleId,
  ]);
}

/**
 * Never deletes, same as softDeleteRecord: a tombstone hides the vehicle from
 * the garage and from getVehicle, while the rows stay on disk and keep showing
 * up in the CSV export. Losing a car's whole history to one mis-tap is the
 * worst outcome this app has, so the data survives the gesture.
 *
 * The service records are left untouched. They are already unreachable through
 * a hidden vehicle, and leaving them intact is what makes an undelete a single
 * UPDATE rather than a reconstruction.
 */
export function softDeleteVehicle(vehicleId: string): void {
  getDb().runSync("UPDATE vehicles SET deleted_at = ? WHERE id = ?", [
    new Date().toISOString(),
    vehicleId,
  ]);
}

export function undoDeleteVehicle(vehicleId: string): void {
  getDb().runSync("UPDATE vehicles SET deleted_at = NULL WHERE id = ?", [vehicleId]);
}

/** Same guarded high-water-mark update addRecord already relies on — never lowers a reading. */
export function setOdometerIfHigher(vehicleId: string, odometer: number): void {
  getDb().runSync(
    "UPDATE vehicles SET odometer = ? WHERE id = ? AND (odometer IS NULL OR odometer < ?)",
    [odometer, vehicleId, odometer]
  );
}

/**
 * Sets the reading to exactly what was given, up or down.
 *
 * Only onboarding uses this, and only for the question that asks for the
 * reading directly. Everywhere else a mileage arrives attached to a service
 * that happened, so the high-water rule is right: a job logged at 40,000 on a
 * car showing 84,000 must not wind the dash back. Here the number IS the dash,
 * and a user who stepped back to fix a fat-fingered 842,100 was being told the
 * field had accepted a correction that the guard then threw away.
 */
export function setOdometerReading(vehicleId: string, odometer: number): void {
  getDb().runSync("UPDATE vehicles SET odometer = ? WHERE id = ?", [odometer, vehicleId]);
}

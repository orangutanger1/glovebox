import { getDb } from "./client";
import type { BodyStyle } from "../vehicles/bodyStyles";
import { row, rows } from "./row";

export type Vehicle = {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  odometer?: number;
  /** 1 when `odometer` is the app's arithmetic rather than a reading the user
   *  gave us. Absent on every reading that came from a person, which is what
   *  every row written before the column existed is. */
  odometer_estimated?: number;
  /** Absent means unknown: nothing has ever answered for this vehicle. */
  body_style?: BodyStyle;
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
  body_style?: BodyStyle;
}): Vehicle {
  const row: Vehicle = { id: id(), created_at: new Date().toISOString(), ...v };
  getDb().runSync(
    `INSERT INTO vehicles (id, name, make, model, year, odometer, body_style, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.make ?? null, row.model ?? null, row.year ?? null,
     row.odometer ?? null, row.body_style ?? null, row.created_at]
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
  v: { name: string; make?: string; model?: string; year?: number; body_style?: BodyStyle }
): void {
  // body_style is the one field here another screen owns, so an absent key
  // leaves the column alone rather than clearing it. name/make/model/year are
  // this screen's own and a missing one really does mean "no longer set".
  const sets = ["name = ?", "make = ?", "model = ?", "year = ?"];
  const params: (string | number | null)[] = [
    v.name,
    v.make ?? null,
    v.model ?? null,
    v.year ?? null,
  ];
  if ("body_style" in v) {
    sets.push("body_style = ?");
    params.push(v.body_style ?? null);
  }
  params.push(vehicleId);
  getDb().runSync(`UPDATE vehicles SET ${sets.join(", ")} WHERE id = ?`, params);
}

/** Separate from updateVehicleIdentity because onboarding sets the body style
 *  without touching the name, make, model or year the previous step wrote. */
export function setBodyStyle(vehicleId: string, style: BodyStyle): void {
  getDb().runSync("UPDATE vehicles SET body_style = ? WHERE id = ?", [style, vehicleId]);
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

/** Same guarded high-water-mark update addRecord already relies on — never lowers a reading.
 *  A real reading retires the estimate it overtakes. */
export function setOdometerIfHigher(vehicleId: string, odometer: number): void {
  getDb().runSync(
    `UPDATE vehicles SET odometer = ?, odometer_estimated = NULL
     WHERE id = ? AND (odometer IS NULL OR odometer < ?)`,
    [odometer, vehicleId, odometer]
  );
}

/**
 * Stores a reading the app worked out from the model year rather than one the
 * user read off the dash, and says so in the row.
 *
 * Set outright rather than as a high-water mark, and for the same reason
 * `setOdometerReading` is: the annual-mileage answer on the next question
 * refines this number, and a refinement that can only ever go up is not a
 * refinement. The flag is what keeps every gauge in the app from presenting
 * arithmetic with the confidence of a reading.
 */
export function setOdometerEstimate(vehicleId: string, odometer: number): void {
  getDb().runSync("UPDATE vehicles SET odometer = ?, odometer_estimated = 1 WHERE id = ?", [
    odometer,
    vehicleId,
  ]);
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
  // Clears the estimate flag: a number the user typed into the odometer question
  // is the dash, whatever the app had guessed before they got round to reading it.
  getDb().runSync("UPDATE vehicles SET odometer = ?, odometer_estimated = NULL WHERE id = ?", [
    odometer,
    vehicleId,
  ]);
}

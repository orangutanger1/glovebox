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
  /** The reading the owner typed directly, as opposed to one a row raised.
   *  The floor `rewindOdometer` lands on; see `setOdometerReading`. */
  odometer_dash?: number;
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
      "SELECT * FROM vehicles WHERE deleted_at IS NULL ORDER BY created_at ASC, rowid ASC"
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
  const row: Vehicle = {
    id: id(),
    created_at: new Date().toISOString(),
    ...v,
    // A reading given at creation was read off the dash, same as one typed
    // on the edit screen: it is the floor a rewind may land on.
    ...(v.odometer === undefined ? {} : { odometer_dash: v.odometer }),
  };
  getDb().runSync(
    `INSERT INTO vehicles
       (id, name, make, model, year, odometer, odometer_dash, body_style, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.make ?? null, row.model ?? null, row.year ?? null,
     row.odometer ?? null, row.odometer_dash ?? null, row.body_style ?? null, row.created_at]
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

/**
 * The one field an owner is allowed to change on its own, from the vehicle
 * screen.
 *
 * Separate from `updateVehicleIdentity` because that function's contract is
 * "this is what the car IS" — an absent make or model there means the owner
 * cleared it, so renaming through it would wipe the year, make and model of
 * any car whose rename form did not also carry them. Until this existed the
 * only way to correct a name was to delete the vehicle and add it again, which
 * costs the entire service history.
 */
export function renameVehicle(vehicleId: string, name: string): void {
  getDb().runSync("UPDATE vehicles SET name = ? WHERE id = ?", [name, vehicleId]);
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

/** Same guarded high-water-mark update addRecord already relies on — never lowers a reading. */
export function setOdometerIfHigher(vehicleId: string, odometer: number): void {
  getDb().runSync(
    `UPDATE vehicles SET odometer = ?
     WHERE id = ? AND (odometer IS NULL OR odometer < ?)`,
    [odometer, vehicleId, odometer]
  );
}

/**
 * The other half of the high-water rule: a row that raised the reading and is
 * then deleted takes the reading back down with it.
 *
 * Until this existed the mark only ever went up. A fill fat-fingered at
 * 842,100 put 842,100 on the dash, every distance-based service went "due",
 * and deleting the fill changed nothing — the only way the number came off
 * was deleting the car and its whole history with it.
 *
 * Only a delete of a row at the mark moves it: a deleted row below the
 * reading was never what the reading was based on. It lands on the highest
 * surviving reading across the services, the fills and the reading the owner
 * typed themselves (`odometer_dash`), or on "not set" when none of those
 * exist — the app no longer knows a reading, and saying so is better than
 * keeping the number the user just said was wrong.
 *
 * The typed reading is in the set because a row can *equal* the mark without
 * having raised it: the log form prefills the dash reading, so the first
 * service logged after onboarding sits exactly on it. Without the floor,
 * deleting that row took the owner's own number off the dash.
 */
export function rewindOdometer(vehicleId: string, removed: number): void {
  getDb().runSync(
    `UPDATE vehicles SET odometer = (
       SELECT MAX(o) FROM (
         SELECT odometer AS o FROM service_records
          WHERE vehicle_id = ? AND deleted_at IS NULL AND odometer IS NOT NULL
         UNION ALL
         SELECT odometer AS o FROM fuel_entries
          WHERE vehicle_id = ? AND deleted_at IS NULL
         UNION ALL
         SELECT odometer_dash AS o FROM vehicles
          WHERE id = ? AND odometer_dash IS NOT NULL
       )
     )
     WHERE id = ? AND odometer IS NOT NULL AND odometer <= ?`,
    [vehicleId, vehicleId, vehicleId, vehicleId, removed]
  );
}

/**
 * Sets the reading to exactly what was given, up or down.
 *
 * Two screens use this: the onboarding question that asks for the reading
 * directly, and the edit screen. Everywhere else a mileage arrives attached to
 * a service that happened, so the high-water rule is right: a job logged at
 * 40,000 on a car showing 84,000 must not wind the dash back. Here the number
 * IS the dash, and a user who stepped back to fix a fat-fingered 842,100 was
 * being told the field had accepted a correction that the guard then threw
 * away.
 *
 * Written to both columns: this is the one number the owner read off the
 * dash, so it is also the floor a later `rewindOdometer` may land on.
 */
export function setOdometerReading(vehicleId: string, odometer: number): void {
  getDb().runSync("UPDATE vehicles SET odometer = ?, odometer_dash = ? WHERE id = ?", [
    odometer,
    odometer,
    vehicleId,
  ]);
}

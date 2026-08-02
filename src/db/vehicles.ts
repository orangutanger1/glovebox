import { getDb } from "./client";

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
  return getDb().getAllSync<Vehicle>(
    "SELECT * FROM vehicles WHERE deleted_at IS NULL ORDER BY created_at ASC"
  );
}

export function getVehicle(vehicleId: string): Vehicle | null {
  return (
    getDb().getFirstSync<Vehicle>("SELECT * FROM vehicles WHERE id = ?", [vehicleId]) ?? null
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

/** Same guarded high-water-mark update addRecord already relies on — never lowers a reading. */
export function setOdometerIfHigher(vehicleId: string, odometer: number): void {
  getDb().runSync(
    "UPDATE vehicles SET odometer = ? WHERE id = ? AND (odometer IS NULL OR odometer < ?)",
    [odometer, vehicleId, odometer]
  );
}

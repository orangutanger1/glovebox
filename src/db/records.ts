import { getDb } from "./client";
import { row, rows } from "./row";
import { rewindOdometer, setOdometerIfHigher } from "./vehicles";
import type { CostedRecord } from "../insights";

export type ServiceRecord = {
  id: string;
  vehicle_id: string;
  service_type: string;
  performed_at: string;
  odometer?: number;
  cost?: number;
  notes?: string;
  revision: number;
  supersedes?: string;
  deleted_at?: string;
  created_at: string;
};

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listRecords(vehicleId: string): ServiceRecord[] {
  return rows(
    getDb().getAllSync<ServiceRecord>(
      `SELECT * FROM service_records
       WHERE vehicle_id = ? AND deleted_at IS NULL
       ORDER BY performed_at DESC, rowid DESC`,
      [vehicleId]
    )
  );
}

export function addRecord(r: {
  vehicle_id: string;
  service_type: string;
  performed_at: string;
  odometer?: number;
  cost?: number;
  notes?: string;
}): ServiceRecord {
  const row: ServiceRecord = {
    id: id(),
    revision: 1,
    created_at: new Date().toISOString(),
    ...r,
  };
  getDb().runSync(
    `INSERT INTO service_records
       (id, vehicle_id, service_type, performed_at, odometer, cost, notes, revision, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.vehicle_id, row.service_type, row.performed_at, row.odometer ?? null,
     row.cost ?? null, row.notes ?? null, row.revision, row.created_at]
  );
  if (r.odometer !== undefined) {
    // Clears `odometer_estimated` alongside: a reading attached to a service
    // that actually happened retires whatever the app had estimated from the
    // model year, and a gauge must stop calling it an estimate the moment it
    // stops being one.
    getDb().runSync(
      `UPDATE vehicles SET odometer = ?, odometer_estimated = NULL
       WHERE id = ? AND (odometer IS NULL OR odometer < ?)`,
      [r.odometer, r.vehicle_id, r.odometer]
    );
  }
  return row;
}

function odometerOf(recordId: string): { vehicle_id: string; odometer?: number } | null {
  return row(
    getDb().getFirstSync<{ vehicle_id: string; odometer?: number }>(
      "SELECT vehicle_id, odometer FROM service_records WHERE id = ?",
      [recordId]
    )
  );
}

/** Never deletes. Sets a tombstone so the row stays recoverable. The vehicle's
 *  reading follows the row out if this is the row that set it. */
export function softDeleteRecord(recordId: string): void {
  const r = odometerOf(recordId);
  getDb().runSync("UPDATE service_records SET deleted_at = ? WHERE id = ?", [
    new Date().toISOString(),
    recordId,
  ]);
  if (r?.odometer !== undefined) rewindOdometer(r.vehicle_id, r.odometer);
}

export function undoDelete(recordId: string): void {
  getDb().runSync("UPDATE service_records SET deleted_at = NULL WHERE id = ?", [recordId]);
  const r = odometerOf(recordId);
  if (r?.odometer !== undefined) setOdometerIfHigher(r.vehicle_id, r.odometer);
}

/** Includes soft-deleted rows: export must never lose anything. */
export function allRecordsForExport(): (ServiceRecord & { vehicle_name: string })[] {
  return rows(
    getDb().getAllSync<ServiceRecord & { vehicle_name: string }>(
      `SELECT r.*, v.name AS vehicle_name
       FROM service_records r
       JOIN vehicles v ON v.id = r.vehicle_id
       ORDER BY v.name ASC, r.performed_at DESC`
    )
  );
}

/**
 * Every live record in the garage, trimmed to the columns spend arithmetic
 * reads.
 *
 * One query rather than `listRecords` per vehicle: the insights screen sums
 * across the whole garage, and a round trip per vehicle turns a garage of eight
 * into eight synchronous queries on a screen that renders on focus.
 *
 * Tombstoned rows are excluded, unlike `allRecordsForExport`. The two have
 * opposite obligations: an export must never lose a row the user once had, and
 * a total must never count a service the user deleted.
 */
export function costedRecords(): CostedRecord[] {
  // Joined on a live vehicle: a deleted car's history is unreachable from
  // the garage, and a total that still counted it disagreed with every row
  // the user could see.
  return rows(
    getDb().getAllSync<CostedRecord>(
      `SELECT r.vehicle_id, r.service_type, r.performed_at, r.cost
       FROM service_records r
       JOIN vehicles v ON v.id = r.vehicle_id AND v.deleted_at IS NULL
       WHERE r.deleted_at IS NULL
       ORDER BY r.performed_at DESC`
    )
  );
}

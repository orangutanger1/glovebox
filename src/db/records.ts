import { getDb } from "./client";
import { rows } from "./row";

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
       ORDER BY performed_at DESC`,
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
    getDb().runSync(
      "UPDATE vehicles SET odometer = ? WHERE id = ? AND (odometer IS NULL OR odometer < ?)",
      [r.odometer, r.vehicle_id, r.odometer]
    );
  }
  return row;
}

/** Never deletes. Sets a tombstone so the row stays recoverable. */
export function softDeleteRecord(recordId: string): void {
  getDb().runSync("UPDATE service_records SET deleted_at = ? WHERE id = ?", [
    new Date().toISOString(),
    recordId,
  ]);
}

export function undoDelete(recordId: string): void {
  getDb().runSync("UPDATE service_records SET deleted_at = NULL WHERE id = ?", [recordId]);
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

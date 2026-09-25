import { getDb } from "./client";
import { row, rows } from "./row";
import type { DocumentKind } from "../documents";

export type GloveboxDocument = {
  id: string;
  vehicle_id: string;
  kind: DocumentKind;
  issuer?: string;
  number?: string;
  expires_at?: string;
  notes?: string;
  deleted_at?: string;
  created_at: string;
};

export type DocumentInput = {
  kind: DocumentKind;
  issuer?: string;
  number?: string;
  expires_at?: string;
  notes?: string;
};

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Soonest to lapse first, then the ones that never do, in the order they were
 *  added. The paper about to run out is the one the owner opened the car for. */
export function listDocuments(vehicleId: string): GloveboxDocument[] {
  return rows(
    getDb().getAllSync<GloveboxDocument>(
      `SELECT * FROM documents
       WHERE vehicle_id = ? AND deleted_at IS NULL
       ORDER BY expires_at IS NULL, expires_at ASC, created_at ASC`,
      [vehicleId]
    )
  );
}

export function getDocument(documentId: string): GloveboxDocument | null {
  return row(
    getDb().getFirstSync<GloveboxDocument>(
      "SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL",
      [documentId]
    )
  );
}

/** Every live, dated document on a live car, with the car's name for the
 *  reminder text. One query for the scheduler rather than one per vehicle. */
export function datedDocuments(): (GloveboxDocument & { vehicle_name: string })[] {
  return rows(
    getDb().getAllSync<GloveboxDocument & { vehicle_name: string }>(
      `SELECT d.*, v.name AS vehicle_name
       FROM documents d
       JOIN vehicles v ON v.id = d.vehicle_id AND v.deleted_at IS NULL
       WHERE d.deleted_at IS NULL AND d.expires_at IS NOT NULL
       ORDER BY d.expires_at ASC`
    )
  );
}

export function addDocument(vehicleId: string, input: DocumentInput): GloveboxDocument {
  const doc: GloveboxDocument = {
    id: id(),
    vehicle_id: vehicleId,
    ...clean(input),
    created_at: new Date().toISOString(),
  };
  getDb().runSync(
    `INSERT INTO documents (id, vehicle_id, kind, issuer, number, expires_at, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      doc.id,
      doc.vehicle_id,
      doc.kind,
      doc.issuer ?? null,
      doc.number ?? null,
      doc.expires_at ?? null,
      doc.notes ?? null,
      doc.created_at,
    ]
  );
  return doc;
}

/** Every field is written, including the empty ones: clearing an expiry on
 *  the form has to clear it here too, or the reminder outlives the date. */
export function updateDocument(documentId: string, input: DocumentInput): void {
  const d = clean(input);
  getDb().runSync(
    `UPDATE documents SET kind = ?, issuer = ?, number = ?, expires_at = ?, notes = ?
     WHERE id = ?`,
    [d.kind, d.issuer ?? null, d.number ?? null, d.expires_at ?? null, d.notes ?? null, documentId]
  );
}

/** Tombstoned, never dropped, the same as every other row the owner typed. */
export function softDeleteDocument(documentId: string): void {
  getDb().runSync("UPDATE documents SET deleted_at = ? WHERE id = ?", [
    new Date().toISOString(),
    documentId,
  ]);
}

/** Includes soft-deleted rows: export must never lose anything. */
export function allDocumentsForExport(): (GloveboxDocument & { vehicle_name: string })[] {
  return rows(
    getDb().getAllSync<GloveboxDocument & { vehicle_name: string }>(
      `SELECT d.*, v.name AS vehicle_name
       FROM documents d
       JOIN vehicles v ON v.id = d.vehicle_id
       ORDER BY v.name ASC, d.expires_at IS NULL, d.expires_at ASC`
    )
  );
}

/** Blank text is no text: an issuer field tapped into and left empty must not
 *  store "" and then render an empty subtitle. */
function clean(input: DocumentInput): DocumentInput {
  const text = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);
  return {
    kind: input.kind,
    issuer: text(input.issuer),
    number: text(input.number),
    expires_at: input.expires_at || undefined,
    notes: text(input.notes),
  };
}

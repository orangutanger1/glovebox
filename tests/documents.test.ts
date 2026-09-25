import Database from "better-sqlite3";

jest.mock("../src/db/client", () => {
  const db = new Database(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, params: unknown[] = []) => db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) => db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

import { getDb } from "../src/db/client";
import { expiryAlerts, expiryStatus } from "../src/documents";
import { documentName } from "../src/documents/names";
import {
  addDocument,
  allDocumentsForExport,
  datedDocuments,
  getDocument,
  listDocuments,
  softDeleteDocument,
  updateDocument,
} from "../src/db/documents";
import { softDeleteVehicle } from "../src/db/vehicles";
import { toDocumentsCsv } from "../src/export/csv";
import { setLanguage } from "../src/i18n";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 8, 24, 15, 0).getTime();

beforeAll(() => setLanguage("en"));

describe("expiryStatus", () => {
  test("no date, no status", () => expect(expiryStatus(undefined, NOW)).toBeUndefined());
  test("past is expired", () =>
    expect(expiryStatus(new Date(NOW - 2 * DAY).toISOString(), NOW)).toBe("expired"));
  test("later today is not yet expired", () =>
    expect(expiryStatus(new Date(2026, 8, 24, 12).toISOString(), NOW)).toBe("soon"));
  test("within a month is soon", () =>
    expect(expiryStatus(new Date(NOW + 20 * DAY).toISOString(), NOW)).toBe("soon"));
  test("further out is fine", () =>
    expect(expiryStatus(new Date(NOW + 90 * DAY).toISOString(), NOW)).toBe("ok"));
});

describe("expiryAlerts", () => {
  test("30 and 7 days before, at 10am local", () => {
    const expires = new Date(2026, 11, 31, 12).toISOString();
    expect(expiryAlerts(expires, NOW)).toEqual([
      { at: new Date(2026, 11, 1, 10).toISOString(), daysLeft: 30 },
      { at: new Date(2026, 11, 24, 10).toISOString(), daysLeft: 7 },
    ]);
  });

  test("an alert already past is dropped", () => {
    const expires = new Date(NOW + 10 * DAY).toISOString();
    expect(expiryAlerts(expires, NOW).map((a) => a.daysLeft)).toEqual([7]);
  });

  test("nothing for a document that does not expire", () => {
    expect(expiryAlerts(undefined, NOW)).toEqual([]);
  });
});

test("an 'other' document is named by what the owner typed", () => {
  expect(documentName({ kind: "other", issuer: "Parking permit" })).toBe("Parking permit");
  expect(documentName({ kind: "other" })).toBe("Other");
  expect(documentName({ kind: "insurance", issuer: "Geico" })).toBe("Insurance");
});

describe("the documents table", () => {
  beforeEach(() => {
    getDb().runSync("DELETE FROM documents", []);
    getDb().runSync("DELETE FROM vehicles", []);
    getDb().runSync("INSERT INTO vehicles (id, name, created_at) VALUES (?, ?, ?)", [
      "v1",
      "Civic",
      "2026-01-01T00:00:00.000Z",
    ]);
  });

  test("soonest to lapse first, undated last, blanks stored as nothing", () => {
    addDocument("v1", { kind: "warranty", issuer: "  " });
    addDocument("v1", { kind: "registration", expires_at: "2027-03-01T12:00:00.000Z" });
    addDocument("v1", { kind: "insurance", issuer: "Geico", expires_at: "2026-11-01T12:00:00.000Z" });
    const docs = listDocuments("v1");
    expect(docs.map((d) => d.kind)).toEqual(["insurance", "registration", "warranty"]);
    expect(docs[2].issuer).toBeUndefined();
  });

  test("clearing the expiry on edit clears it in the row", () => {
    const d = addDocument("v1", { kind: "insurance", expires_at: "2026-11-01T12:00:00.000Z" });
    updateDocument(d.id, { kind: "insurance", number: "ABC-1" });
    expect(getDocument(d.id)).toMatchObject({ number: "ABC-1" });
    expect(getDocument(d.id)!.expires_at).toBeUndefined();
    expect(datedDocuments()).toHaveLength(0);
  });

  test("a deleted document stops reminding and stays in the export", () => {
    const d = addDocument("v1", { kind: "insurance", expires_at: "2026-11-01T12:00:00.000Z" });
    softDeleteDocument(d.id);
    expect(listDocuments("v1")).toHaveLength(0);
    expect(datedDocuments()).toHaveLength(0);
    expect(allDocumentsForExport()).toHaveLength(1);
  });

  test("a deleted car's papers stop reminding", () => {
    addDocument("v1", { kind: "insurance", expires_at: "2026-11-01T12:00:00.000Z" });
    softDeleteVehicle("v1");
    expect(datedDocuments()).toHaveLength(0);
  });

  test("the export keeps the stored kind and an ISO day", () => {
    addDocument("v1", { kind: "insurance", issuer: "=Geico", number: "P-9", expires_at: new Date(2026, 10, 1, 12).toISOString() });
    const csv = toDocumentsCsv(allDocumentsForExport());
    expect(csv.split("\n")[0]).toBe("Vehicle,Document,Issued by,Number,Expires,Notes,Deleted");
    expect(csv.split("\n")[1]).toBe("Civic,insurance,'=Geico,P-9,2026-11-01,,");
  });
});

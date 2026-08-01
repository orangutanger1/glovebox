import { toCsv } from "../src/export/csv";

test("writes a header row even when there are no records", () => {
  expect(toCsv([])).toBe(
    "Vehicle,Service,Date,Odometer,Cost,Notes,Deleted\n"
  );
});

test("writes one line per record", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Oil Change",
      performed_at: "2026-01-15T00:00:00.000Z",
      odometer: 50000,
      cost: 49.99,
      notes: "Mobil 1",
    },
  ]);
  expect(out).toBe(
    "Vehicle,Service,Date,Odometer,Cost,Notes,Deleted\n" +
      "Civic,Oil Change,2026-01-15,50000,49.99,Mobil 1,\n"
  );
});

test("quotes and escapes fields containing commas or quotes", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Other",
      performed_at: "2026-01-15T00:00:00.000Z",
      notes: 'Replaced belt, hose, and "the thing"',
    },
  ]);
  expect(out).toContain('"Replaced belt, hose, and ""the thing"""');
});

test("marks soft-deleted rows instead of omitting them", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Oil Change",
      performed_at: "2026-01-15T00:00:00.000Z",
      deleted_at: "2026-02-01T00:00:00.000Z",
    },
  ]);
  expect(out.trim().endsWith(",deleted")).toBe(true);
});

import { MAKES, suggestMakes } from "../src/vehicle/makes";

/**
 * The make field stays free text; these are the two-tap path through it, so
 * what matters is that a short prefix reaches the car the user owns.
 */
test("a prefix offers the makes that start with it, not everything containing it", () => {
  expect(suggestMakes("toy")).toEqual(["Toyota"]);
  // "M" is Mazda and Mercedes-Benz, and it is not BMW: a driver typing the
  // first letter of their car's name is not asking for a substring search.
  const m = suggestMakes("m");
  expect(m).not.toContain("BMW");
  expect(m).toContain("Mazda");
});

test("accents are folded, so the keyboard does not have to produce them", () => {
  expect(suggestMakes("skoda")).toEqual(["Škoda"]);
  expect(suggestMakes("citroen")).toEqual(["Citroën"]);
});

test("nothing is offered for an empty field or for an answer already given", () => {
  expect(suggestMakes("")).toEqual([]);
  expect(suggestMakes("  ")).toEqual([]);
  // The chip would repeat what is already in the field.
  expect(suggestMakes("Tesla")).toEqual([]);
  expect(suggestMakes("Holden")).toEqual([]);
});

test("the list is capped, so a broad prefix cannot fill the screen", () => {
  expect(suggestMakes("a").length).toBeLessThanOrEqual(4);
  expect(new Set(MAKES).size).toBe(MAKES.length);
});

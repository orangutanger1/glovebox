/**
 * The makes a US owner is most likely to be holding, as taps instead of typing.
 *
 * "Make" was a free-text field at tap two of onboarding, before the app had
 * delivered anything at all, and a keyboard is the most expensive control on
 * the glass. Forty-two names cover the overwhelming majority of the vehicles on
 * an American road, so almost every user answers this question with one tap and
 * nobody has to spell "Mercedes-Benz" on a phone.
 *
 * Deliberately a plain array and deliberately not translated. A make is a proper
 * noun printed on the tailgate: "Volkswagen" is Volkswagen in every catalog this
 * app ships, and a localised list would be a list of typos waiting to happen.
 *
 * Dead brands are in here on purpose. Mercury, Pontiac, Saturn and Scion stopped
 * being sold years ago and are exactly the cars whose owners need a maintenance
 * log — a list built from this year's sales charts would send all of them to the
 * "Other" field.
 *
 * Alphabetical, because a list of forty names ordered by sales volume is a list
 * the user has to read rather than scan. Anything not here is reachable through
 * the "Other" chip, which reveals the free-text field this list replaced.
 */
export const CAR_MAKES: readonly string[] = [
  "Acura",
  "Alfa Romeo",
  "Audi",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Lucid",
  "Maserati",
  "Mazda",
  "Mercedes-Benz",
  "Mercury",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Polestar",
  "Pontiac",
  "Porsche",
  "Ram",
  "Rivian",
  "Saturn",
  "Scion",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

/**
 * The makes worth showing for what the user has typed into the filter.
 *
 * Substring rather than prefix: somebody who types "benz" means Mercedes-Benz,
 * and somebody who types "rover" means Land Rover. Case- and space-insensitive
 * for the same reason the year is chips — every character typed here is a chance
 * to mistype the answer and be told it is wrong.
 */
export function matchingMakes(query: string): readonly string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return CAR_MAKES;
  return CAR_MAKES.filter((make) => make.toLowerCase().includes(needle));
}

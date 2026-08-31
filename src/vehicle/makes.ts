/**
 * The makes sold in the markets this app ships to, for prefix suggestion.
 *
 * Suggestion only. The make field stays free text, because any list of makes
 * short enough to ship is also wrong for somebody — a Holden, a Dacia, a
 * kei-truck import — and the field is optional anyway. What the list buys is
 * the two-tap path for the common case: "toy" offers Toyota, and nobody has to
 * finish typing their own car's brand.
 *
 * Capitalised the way the manufacturer writes it, because whatever is tapped
 * here becomes the vehicle's name.
 */
export const MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Cupra", "Dacia", "Dodge",
  "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti",
  "Isuzu", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus",
  "Lincoln", "Maserati", "Mazda", "Mercedes-Benz", "MG", "Mini", "Mitsubishi",
  "Nissan", "Opel", "Peugeot", "Polestar", "Porsche", "RAM", "Renault",
  "Rivian", "Saab", "SEAT", "Škoda", "Subaru", "Suzuki", "Tesla", "Toyota",
  "Vauxhall", "Volkswagen", "Volvo",
];

/** Diacritics folded so "skoda" finds Škoda and "citroen" finds Citroën. */
function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Makes that start with what has been typed, best first, capped.
 *
 * Prefix rather than substring: a driver typing "M" wants Mazda before
 * Mercedes-Benz, not BMW. A query that already names one make exactly returns
 * nothing — the answer is in the field, and a chip repeating it is a control
 * that does nothing.
 */
export function suggestMakes(query: string, limit: number = 4): string[] {
  const typed = query.trim();
  const q = fold(typed);
  if (q.length === 0) return [];
  const hits = MAKES.filter((m) => fold(m).startsWith(q));
  // Compared unfolded: "skoda" has not been answered until it is "Škoda", and
  // the chip is what puts the accent in.
  if (hits.length === 1 && hits[0].toLowerCase() === typed.toLowerCase()) return [];
  return hits.slice(0, limit);
}

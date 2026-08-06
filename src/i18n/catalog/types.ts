/**
 * A catalog value is either a finished sentence or one sentence per plural
 * category.
 *
 * The categories are CLDR's, not English's, which is the whole reason plurals
 * are data and not an `n === 1` ternary in a screen: Polish needs three forms
 * for "3 services" / "5 services", Arabic six, Japanese one. `other` is required
 * because every language has it, and it is what a missing category falls back to.
 */
export type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export type Entry = string | Plural;

/**
 * One screen's or one module's slice of the catalog.
 *
 * Fragments exist so that adding copy to a screen touches the screen's own file
 * instead of a 300-key monolith every change collides in. Keys are dot-namespaced
 * by fragment (`garage.*`, `settings.*`), which is also how the parity test spots
 * a key that has drifted into two fragments at once.
 */
export type Fragment = Record<string, Entry>;

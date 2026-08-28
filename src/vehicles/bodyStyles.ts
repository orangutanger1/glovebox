/** The seven bodies, ordered roughly by prevalence so the common answer is the
 *  first thumb reach. */
export const BODY_STYLES = [
  "sedan",
  "hatchback",
  "coupe",
  "wagon",
  "suv",
  "pickup",
  "van",
] as const;

export type BodyStyle = (typeof BODY_STYLES)[number];

export function isBodyStyle(value: string): value is BodyStyle {
  return (BODY_STYLES as readonly string[]).includes(value);
}

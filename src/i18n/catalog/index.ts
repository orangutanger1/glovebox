import type { Entry } from "./types";
import { de } from "./de";
import { enAU } from "./enAU";
import { enCA } from "./enCA";
import { enGB } from "./enGB";
import { es } from "./es";
import { esMX } from "./esMX";
import { fr } from "./fr";
import { frCA } from "./frCA";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { nl } from "./nl";
import { pl } from "./pl";
import { ptBR } from "./ptBR";
import { sv } from "./sv";

/**
 * Every non-English catalog, keyed by the language tag `resolveLanguage` returns.
 *
 * Bundled rather than fetched: the whole set is a few hundred kilobytes of text,
 * and an app whose entire pitch is "your records live on your phone, no server"
 * cannot go to a server for the words it says.
 *
 * The regional entries are overlays — only the keys whose wording differs from
 * their base language. `enGB` is eighteen keys, not three hundred, because a
 * British owner needs "MOT", "Tyre Rotation", "road tax" and "my cars" rather
 * than a second translation of everything else.
 */
export const CATALOGS: Record<string, Record<string, Entry>> = {
  de,
  fr,
  "fr-CA": frCA,
  it,
  es,
  "es-MX": esMX,
  "pt-BR": ptBR,
  nl,
  sv,
  pl,
  ja,
  ko,
  "en-GB": enGB,
  "en-AU": enAU,
  "en-CA": enCA,
};

import { t } from "../i18n";
import type { DocumentKind } from "./index";

/** A document as a row title: the kind, except for "other", which is named by
 *  whatever the owner typed as its issuer — "Other" on three rows says nothing. */
export function documentName(doc: { kind: DocumentKind; issuer?: string }): string {
  if (doc.kind === "other" && doc.issuer) return doc.issuer;
  return t(`documents.kind.${doc.kind}`);
}

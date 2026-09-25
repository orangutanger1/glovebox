import { Text, View } from "react-native";
import { ListRow } from "../design/ListRow";
import { Badge } from "../design/Badge";
import { tokens } from "../design/tokens";
import { formatDate, t } from "../i18n";
import { expiryStatus } from "./index";
import { documentName } from "./names";
import type { GloveboxDocument } from "../db/documents";

/**
 * The car screen's glovebox: each paper as a row, the one about to lapse
 * first, and a row to add another. Presentational — the screen owns the read,
 * so the list refreshes on the same focus as the rest of the page.
 *
 * Expired carries the red, because a lapsed policy is the kind of overdue that
 * is a legal problem; "soon" is the neutral badge the due list uses.
 */
export function GloveboxSection({
  documents,
  now = Date.now(),
  onOpen,
  onAdd,
}: {
  documents: GloveboxDocument[];
  now?: number;
  onOpen: (doc: GloveboxDocument) => void;
  onAdd: () => void;
}) {
  return (
    <View style={{ gap: tokens.space.xs }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
        {t("documents.legend")}
      </Text>
      {documents.map((d) => {
        const status = expiryStatus(d.expires_at, now);
        const date = d.expires_at ? formatDate(d.expires_at) : undefined;
        const when =
          status === "expired"
            ? t("documents.row.expired", { date: date! })
            : date
              ? t("documents.row.expires", { date })
              : t("documents.row.noExpiry");
        // The issuer is the second thing anyone looks for; for "other" it is
        // already the title, so it is not said twice.
        const detail = d.kind !== "other" && d.issuer ? d.issuer : d.number;
        return (
          <ListRow
            key={d.id}
            title={documentName(d)}
            subtitle={detail ? t("documents.row.detail", { detail, when }) : when}
            status={status === "expired" ? "overdue" : status === "soon" ? "soon" : undefined}
            onPress={() => onOpen(d)}
            right={
              status === "expired" ? (
                <Badge label={t("documents.badge.expired")} tone="due" />
              ) : status === "soon" ? (
                <Badge label={t("documents.badge.soon")} tone="soon" />
              ) : (
                <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>›</Text>
              )
            }
          />
        );
      })}
      <ListRow
        title={t("documents.add")}
        subtitle={documents.length === 0 ? t("documents.empty") : undefined}
        onPress={onAdd}
        right={<Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>+</Text>}
      />
    </View>
  );
}

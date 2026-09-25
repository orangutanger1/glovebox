import { useMemo, useState } from "react";
import { Alert, View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../src/design/Screen";
import { Card } from "../../../src/design/Card";
import { Chip } from "../../../src/design/Chip";
import { Field } from "../../../src/design/Field";
import { Button } from "../../../src/design/Button";
import { DateWheel } from "../../../src/design/DateWheel";
import { tokens } from "../../../src/design/tokens";
import {
  addDocument,
  getDocument,
  softDeleteDocument,
  updateDocument,
} from "../../../src/db/documents";
import { DOCUMENT_KINDS, type DocumentKind } from "../../../src/documents";
import { rescheduleAll } from "../../../src/notify";
import { track } from "../../../src/analytics";
import { dateFromParts, partsFromDate } from "../../../src/format";
import { t } from "../../../src/i18n";

/**
 * Adding or editing one glovebox document.
 *
 * What the owner reaches for at the roadside or the counter is the number on
 * the card and who issued it, and what the app can do that a card cannot is
 * say when it runs out. So: a kind, the two facts, and an expiry that is on by
 * default — a policy with no date is the one that lapses unnoticed — with a
 * chip to say this one does not expire.
 *
 * Every field but the kind is optional. A row with only "Insurance" and a date
 * on it is still a reminder worth having, and a form that refuses to save it
 * until a policy number is found is a form closed and never reopened.
 */
export default function DocumentForm() {
  const router = useRouter();
  const { id, doc: docId } = useLocalSearchParams<{ id: string; doc?: string }>();
  const existing = useMemo(() => (docId ? getDocument(docId) : null), [docId]);

  const [kind, setKind] = useState<DocumentKind>(existing?.kind ?? "insurance");
  const [issuer, setIssuer] = useState(existing?.issuer ?? "");
  const [number, setNumber] = useState(existing?.number ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [expires, setExpires] = useState(existing ? existing.expires_at !== undefined : true);
  // A year from today when there is nothing to start from: the term most
  // policies and registrations run for, so the common case is already right.
  const [expiry, setExpiry] = useState(() => {
    if (existing?.expires_at) return partsFromDate(new Date(existing.expires_at));
    const inAYear = new Date();
    inAYear.setFullYear(inAYear.getFullYear() + 1);
    return partsFromDate(inAYear);
  });
  const [error, setError] = useState("");

  function onSave() {
    if (!id) return;
    const input = {
      kind,
      issuer,
      number,
      notes,
      expires_at: expires ? dateFromParts(expiry).toISOString() : undefined,
    };
    try {
      if (existing) updateDocument(existing.id, input);
      else addDocument(id, input);
    } catch {
      // Never clear the form on failure; the typing is what is being protected.
      setError(t("documents.form.error"));
      return;
    }
    // Which kinds people keep and whether they date them — never the values.
    track("document_saved", {
      kind,
      is_new: !existing,
      has_expiry: expires,
      has_issuer: issuer.trim() !== "",
      has_number: number.trim() !== "",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    rescheduleAll().catch(() => {});
    router.back();
  }

  function onDelete() {
    if (!existing) return;
    Alert.alert(t("documents.delete.title"), t("documents.delete.body"), [
      { text: t("documents.delete.cancel"), style: "cancel" },
      {
        text: t("documents.delete.confirm"),
        style: "destructive",
        onPress: () => {
          softDeleteDocument(existing.id);
          track("document_deleted", { kind: existing.kind });
          rescheduleAll().catch(() => {});
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen
      title={existing ? t("documents.form.editTitle") : t("documents.form.title")}
      footer={
        <>
          {error ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.red }}>{error}</Text>
          ) : null}
          <Button label={t("documents.form.save")} onPress={onSave} />
        </>
      }
    >
      <Card>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
          {t("documents.form.kind")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {DOCUMENT_KINDS.map((k) => (
            <Chip
              key={k}
              label={t(`documents.kind.${k}`)}
              selected={k === kind}
              onPress={() => setKind(k)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Field
          label={kind === "other" ? t("documents.form.name") : t("documents.form.issuer")}
          value={issuer}
          onChangeText={setIssuer}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <Field
          label={t("documents.form.number")}
          value={number}
          onChangeText={setNumber}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </Card>

      <Card>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
          {t("documents.form.expiry")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          <Chip
            label={t("documents.form.expires")}
            selected={expires}
            onPress={() => setExpires(true)}
          />
          <Chip
            label={t("documents.form.noExpiry")}
            selected={!expires}
            onPress={() => setExpires(false)}
          />
        </View>
        {expires ? (
          <>
            <DateWheel value={expiry} onChange={setExpiry} yearsBack={1} yearsAhead={10} />
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
              {t("documents.form.remind")}
            </Text>
          </>
        ) : null}
      </Card>

      <Card>
        <Field label={t("documents.form.notes")} value={notes} onChangeText={setNotes} />
      </Card>

      {existing ? (
        <View style={{ paddingTop: tokens.space.md }}>
          <Button label={t("documents.delete.button")} variant="danger" onPress={onDelete} />
        </View>
      ) : null}

      <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
        {t("documents.form.private")}
      </Text>
    </Screen>
  );
}

import { useState } from "react";
import { Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Button } from "../src/design/Button";
import { tokens } from "../src/design/tokens";
import { t } from "../src/i18n";
import { DISCOUNT_OFFERING, hasOffering, presentOffering, restore } from "../src/purchases";
import { recordReviewEvent } from "../src/review";

/**
 * The wall.
 *
 * Where a user with no entitlement ends up: the one who declined both asks at
 * the end of onboarding, and the subscriber whose subscription later lapsed.
 * It is the whole app for them, so it has to carry everything Apple requires
 * of a screen that is the only thing standing between a user and what they
 * bought — a way to buy, and a way to say they already did.
 *
 * Restore is not a courtesy row. A user who reinstalls, or switches device, or
 * whose receipt has not synced yet, arrives here holding a live subscription
 * and no entitlement to show for it; without this link their only route back
 * into an app they are paying for is the App Store. Guideline 3.1.1 requires
 * it, and review will look for it on exactly this screen.
 *
 * It borrows Settings' restore vocabulary rather than growing its own. Two
 * screens that describe the same outcome in two different sentences is one
 * translation away from describing it in two different ways.
 *
 * The offer is the introductory one where the dashboard has it, because this
 * user has already declined the standard price at least once — and the plain
 * current offering otherwise, since a wall whose only button does nothing is
 * worse than a wall that asks full price.
 *
 * There is no dismiss, no back and no gesture out. That is the point of it,
 * and it is why the route is registered with `gestureEnabled: false`.
 */
export default function Locked() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubscribe() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const offering = (await hasOffering(DISCOUNT_OFFERING)) ? DISCOUNT_OFFERING : undefined;
      if ((await presentOffering(offering)) === "purchased") {
        recordReviewEvent("purchase");
        router.replace("/");
        return;
      }
      // Dismissed, or the sheet could not be presented. Either way this user
      // stays here — there is nowhere else for them to be — but a paywall that
      // failed to load must say something, or the button reads as broken.
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    if (busy) return;
    setBusy(true);
    try {
      if (await restore()) {
        router.replace("/");
        return;
      }
      setMsg(t("settings.restore.none"));
    } catch {
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      // Registered with `headerShown: false`, so the screen owns the full
      // height and claims the top inset itself.
      edges={["top", "bottom"]}
      title={t("locked.title")}
      footer={
        <>
          <Button label={t("locked.cta")} onPress={onSubscribe} disabled={busy} />
          <Pressable
            onPress={() => void onRestore()}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("settings.restore")}
            </Text>
          </Pressable>
        </>
      }
    >
      <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
        {t("locked.body")}
      </Text>
      {msg !== null && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{msg}</Text>
      )}
    </Screen>
  );
}

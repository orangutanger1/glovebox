import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Button } from "../src/design/Button";
import { ListRow } from "../src/design/ListRow";
import { Panel } from "../src/design/Surface";
import { tokens } from "../src/design/tokens";
import { t } from "../src/i18n";
import { DISCOUNT_OFFERING, TRIAL_DAYS, presentOffering } from "../src/purchases";
import { openFeedback } from "../src/feedback";
import { recordReviewEvent } from "../src/review";
import { markWinbackShown } from "../src/winback";

/**
 * The screen for somebody who had stopped using the app and came back.
 *
 * It is the closest thing to "they are about to delete it" that iOS will ever
 * give an app. The home-screen long press and its Delete button belong to
 * SpringBoard; the app is not running, is told nothing, and gets no chance to
 * say anything before or after. The one moment it does get with a churned user
 * is the launch after the absence, and this is that launch.
 *
 * Two things are on offer: the feedback form and the trial. The form is a
 * tappable row rather than a step, because a survey standing between a user
 * and a free trial is a survey that costs money — and because opening it
 * leaves for Safari, which is a fine place to end a session but a terrible
 * place to be sent mid-flow.
 *
 * The route is only ever reached from the launch guard, which has already
 * confirmed the user is not a subscriber and that the trial offering exists.
 */
export default function Winback() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Stamped on arrival rather than on the way out. Being asked is what the
  // cooldown counts, and a user who force-quits this screen has been asked.
  useEffect(() => {
    markWinbackShown();
  }, []);

  async function onStartTrial() {
    if (busy) return;
    setBusy(true);
    if ((await presentOffering(DISCOUNT_OFFERING)) === "purchased") {
      recordReviewEvent("purchase");
    }
    router.replace("/");
  }

  return (
    <Screen
      // Registered with `headerShown: false`, so this screen owns the full
      // height and has to claim the top inset itself — the same bug the
      // subscribed screen had, where the title drew under the status bar.
      edges={["top", "bottom"]}
      title={t("offer.winback.title")}
      footer={
        <>
          <Button
            label={t("offer.trial.cta", { count: TRIAL_DAYS })}
            onPress={onStartTrial}
            disabled={busy}
          />
          <Pressable
            onPress={() => router.replace("/")}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("offer.winback.decline")}
            </Text>
          </Pressable>
        </>
      }
    >
      <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
        {t("offer.winback.body")}
      </Text>

      <Panel>
        <View style={{ padding: tokens.space.md }}>
          <ListRow
            title={t("offer.winback.feedback")}
            subtitle={t("offer.winback.feedbackNote")}
            onPress={() => void openFeedback()}
            right={<Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>›</Text>}
          />
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {t("offer.winback.caption", { count: TRIAL_DAYS })}
      </Text>
    </Screen>
  );
}

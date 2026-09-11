import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { ListRow } from "../../src/design/ListRow";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import {
  DISCOUNT_OFFERING,
  INTRO_DAYS,
  hasOffering,
  presentOffering,
  restore,
} from "../../src/purchases";
import { recordReviewEvent } from "../../src/review";
import { isGrandfathered } from "../../src/paywall";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { tNamed } from "../../src/onboarding";
import { useFinish } from "../../src/onboarding/nav";

/** The three moments a trial has, in the order the user meets them: what opens
 *  now, the way out, and what happens if they do nothing. Named rather than
 *  numbered — the day count lives in the title, and a row that said "Day 3"
 *  would go stale the moment the offering's introductory period is edited. */
const STEPS = ["now", "runs", "ends"] as const;

/** Everything the trial opens, which is everything. The paywall before this
 *  one prints three of them and stops, because it is asking for money and a
 *  priced list has to be short. Nothing is being asked for here, so the list
 *  can be the whole product — a reader who has already declined once is
 *  reading to find the thing the three lines left out. */
const FEATURES = ["reminders", "due", "history", "costs", "garage", "intervals"] as const;

/**
 * The one retry, the last screen in the flow, and — once it has been declined
 * — the wall.
 *
 * The first paywall asks for money. This one asks for nothing, because it
 * sells the product that carries the App Store introductory offer — a free
 * trial, then it renews. That split is the whole reason there are two
 * paywalls: a trial shown first is given away to everyone who would have paid,
 * and a trial shown only to the people walking out is the cheapest conversion
 * in the funnel.
 *
 * There used to be a separate wall behind this one, a screen headed "Wrenchy
 * is a subscription." that a decliner was pushed to and could not leave. It
 * was a second screen making the first screen's argument, one tap later and
 * with the offer taken off it. Declining now stays here: the same screen, the
 * same three rows, the same button — only the way out is gone. A user who has
 * said no is not shown a new page about saying no, they are shown that the
 * page they were already reading is the app.
 *
 * That makes this the screen with no exit, so it carries what a screen with no
 * exit has to. Restore is not a courtesy row: a user who reinstalls, switches
 * device, or whose receipt has not synced arrives holding a live subscription
 * and no entitlement to show for it, and without this link their only route
 * back into an app they pay for is the App Store. Guideline 3.1.1 requires it,
 * and review looks for it on exactly this kind of screen. It takes the place
 * of "No thanks", because both are the same slot and only one of them is ever
 * the right offer.
 *
 * The offering is the introductory one wherever the dashboard has it, and the
 * plain current offering otherwise. A wall whose only button does nothing is
 * worse than a wall that asks full price.
 */
export default function OnboardingOffer() {
  const router = useRouter();
  const finish = useFinish();
  // A launch that found no entitlement lands here already walled: the user has
  // subscribed before, so there is no "no thanks" left to offer them.
  const { walled } = useLocalSearchParams<{ walled?: string }>();
  const relaunched = walled === "1";
  const [declined, setDeclined] = useState(relaunched);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  /**
   * Where a successful purchase goes.
   *
   * `useFinish` is the end of onboarding: it records the exit, marks the flow
   * complete and cancels the setup nudges. None of that is true of a lapsed
   * subscriber who was sent here at launch — they finished onboarding months
   * ago, and counting them as a completion would put a resubscribe in the
   * middle of the funnel's denominator. They go straight to the garage.
   */
  function paid(exit: "trial" | "paid") {
    if (relaunched) {
      router.replace("/");
      return;
    }
    finish(exit);
  }

  async function onSeeOffer() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const offering = (await hasOffering(DISCOUNT_OFFERING)) ? DISCOUNT_OFFERING : undefined;
      if ((await presentOffering(offering)) === "purchased") {
        recordReviewEvent("purchase");
        paid("trial");
        return;
      }
      // Dismissed, or the sheet could not be presented. Either way the trial
      // was not started and there is nothing further to ask, so this is the
      // same decline as the link below and it leaves the user in the same
      // place: here, with the offer still on the glass.
      onDecline();
    } finally {
      setBusy(false);
    }
  }

  function onDecline() {
    // The one promise that outlives the build that made it. An install that
    // finished onboarding when there was a free tier keeps its garage; nobody
    // else has one to be let into.
    if (isGrandfathered()) {
      finish("free");
      return;
    }
    setDeclined(true);
  }

  async function onRestore() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      if (await restore()) {
        recordReviewEvent("purchase");
        paid("paid");
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
    <OnboardingScreen
      route="offer"
      // The second ask, and the last screen that can use the name — same
      // fallback as the first.
      title={tNamed("offer.trial.title", { count: INTRO_DAYS })}
      // Once declined there is nowhere behind this screen to go back to: the
      // paywall it came from is an ask this user has already refused.
      hideBack={declined}
      footer={
        <>
          <Button
            label={t("offer.trial.cta", { count: INTRO_DAYS })}
            onPress={onSeeOffer}
            disabled={busy}
          />
          <Pressable
            onPress={() => (declined ? void onRestore() : onDecline())}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {declined ? t("settings.restore") : t("offer.trial.decline")}
            </Text>
          </Pressable>
        </>
      }
    >
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
        {t("offer.trial.legend")}
      </Text>
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
          {STEPS.map((step) => (
            <ListRow
              key={step}
              title={t(`offer.trial.${step}.title`)}
              subtitle={t(`offer.trial.${step}.body`)}
            />
          ))}
        </View>
      </Panel>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
        {t("offer.features.title")}
      </Text>
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
          {FEATURES.map((id) => (
            <ListRow
              key={id}
              title={t(`features.${id}.title`)}
              subtitle={t(`features.${id}.subtitle`)}
            />
          ))}
        </View>
      </Panel>
      {msg !== null && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{msg}</Text>
      )}
    </OnboardingScreen>
  );
}

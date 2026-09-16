import { View, Text, Pressable } from "react-native";
import * as Linking from "expo-linking";
import { Button } from "../design/Button";
import { tokens } from "../design/tokens";
import { t } from "../i18n";
import type { Plan } from "../purchases/plans";
import { PRIVACY_URL, TERMS_URL } from "./legal";

/**
 * The button and everything App Review wants under it.
 *
 * The button names the plan it will buy, because "Continue" alone above three
 * prices is a button the reader has to look back up from. The renewal line
 * is the price and period again, in a sentence, with "cancel anytime": the
 * one disclosure Guideline 3.1.2 requires before a purchase, and the one
 * a reader who skipped the cards still needs. Terms, Privacy and Restore
 * are the three links review looks for; Restore is also how a subscriber
 * with an unsynced receipt gets back in without going to the App Store.
 *
 * `children` is the slot for a screen's own soft decline ("Not now",
 * "I'd rather pay full price"), printed between the button and the legal
 * line so it reads as a choice and not as fine print.
 */
export function BuyFooter({
  plan,
  busy,
  onBuy,
  onRestore,
  children,
}: {
  plan: Plan | null;
  busy: boolean;
  onBuy: () => void;
  onRestore: () => void;
  children?: React.ReactNode;
}) {
  const label = plan ? t(`paywall.cta.${plan.period}`) : t("paywall.loading");
  const legal = plan
    ? plan.intro
      ? t("paywall.legal.intro", { intro: plan.intro.priceString, price: plan.priceString })
      : t(`paywall.legal.${plan.period}`, { price: plan.priceString })
    : "";

  return (
    <View style={{ gap: tokens.space.sm }}>
      <Button label={label} onPress={onBuy} disabled={busy || plan === null} />
      {children}
      {legal !== "" && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>
          {legal}
        </Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: tokens.space.md }}>
        <Link label={t("paywall.terms")} onPress={() => void Linking.openURL(TERMS_URL)} />
        <Dot />
        <Link label={t("paywall.privacy")} onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <Dot />
        <Link label={t("paywall.restore")} onPress={onRestore} disabled={busy} />
      </View>
    </View>
  );
}

function Link({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="link">
      <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>{label}</Text>
    </Pressable>
  );
}

function Dot() {
  return <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>·</Text>;
}

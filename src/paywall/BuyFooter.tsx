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
  label: labelOverride,
  variant = "primary",
  lead,
  children,
}: {
  plan: Plan | null;
  busy: boolean;
  onBuy: () => void;
  onRestore: () => void;
  /** Replaces the per-period CTA once a plan is in hand. The trial screen
   *  sells an introductory week, and "Continue with weekly" on it names the
   *  renewal rather than the offer. */
  label?: string;
  /** The button's face. The exit offer lights its claim green. */
  variant?: "primary" | "accent";
  /** Printed directly above the button: the offer screen's price line. */
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const label = plan ? (labelOverride ?? t(`paywall.cta.${plan.period}`)) : t("paywall.loading");
  // The renewal, whether or not an introductory price comes first. The intro
  // price is the card's headline directly above; this line used to repeat it,
  // and with the subtitle doing the same the offer screen said "$0.99, then
  // $3.99" three times over. What review needs here is the price the plan
  // renews at, once, with "cancel anytime".
  const legal = plan ? t(`paywall.legal.${plan.period}`, { price: plan.priceString }) : "";

  return (
    <View style={{ gap: tokens.space.sm }}>
      {lead}
      <Button label={label} onPress={onBuy} disabled={busy || plan === null} variant={variant} weight="heavy" />
      {children}
      {legal !== "" && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>
          {legal}
        </Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: tokens.space.md }}>
        <Link label={t("paywall.terms")} onPress={() => void Linking.openURL(TERMS_URL).catch(() => {})} />
        <Dot />
        <Link label={t("paywall.privacy")} onPress={() => void Linking.openURL(PRIVACY_URL).catch(() => {})} />
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

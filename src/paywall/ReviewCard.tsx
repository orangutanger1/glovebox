import { View, Text } from "react-native";
import { Panel } from "../design/Surface";
import { tokens } from "../design/tokens";
import { t } from "../i18n";

/**
 * The one review, quoted.
 *
 * The reviews screen earlier in the flow deliberately quotes nobody: its
 * evidence is 1,715 reviews of other apps, and printing their words would be
 * borrowing the reviewer. This is different. It is a review of this app, on
 * this app's store page, by a customer who paid, and it is the only one.
 * One card: the stars, her name across from them, her words. It stays in
 * English in every language because it is a quotation.
 *
 * The card used to say "App Store review" where the name is now and print
 * the name under the quote. The label said what the stars already said, and
 * a byline in the corner is where a reader expects one.
 */
export function ReviewCard() {
  return (
    <Panel>
      <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ ...tokens.text.caption, color: tokens.color.green, letterSpacing: 2 }}>★★★★★</Text>
          <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{t("paywall.review.name")}</Text>
        </View>
        <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
          {"“"}
          {t("paywall.review.quote")}
          {"”"}
        </Text>
      </View>
    </Panel>
  );
}

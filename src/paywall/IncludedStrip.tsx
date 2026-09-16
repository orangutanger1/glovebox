import { View, Text } from "react-native";
import { tokens } from "../design/tokens";
import { t } from "../i18n";

/** Everything the subscription opens, as a row of quiet chips. The trial
 *  screen's list with the sentences taken off: seven things in two lines,
 *  read in one look, under a legend that says what the list is. */
const GETS = ["reminders", "due", "history", "costs", "garage", "intervals", "export"] as const;

export function IncludedStrip() {
  return (
    <View style={{ gap: tokens.space.sm }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{t("paywall.included")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.xs + 2 }}>
        {GETS.map((id) => (
          <View
            key={id}
            style={{
              backgroundColor: tokens.color.surface,
              borderColor: tokens.color.hairline,
              borderWidth: 1,
              borderRadius: tokens.radius.pill,
              paddingHorizontal: tokens.space.sm + 2,
              paddingVertical: 4,
            }}
          >
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
              {t(`offer.trial.gets.${id}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

import { Modal, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tokens } from "../design/tokens";
import { OptionCards } from "../design/OptionCards";
import { t } from "../i18n";
import { OBJECTIONS, type Objection } from "./index";

/**
 * "What stopped you?" as a bottom sheet over the exit offer.
 *
 * One tap answers and closes it: there is no Continue, because a second tap
 * between a user and the screen they were leaving for is the tap they skip.
 * Skip is always there and is itself an answer. The sheet never stands between
 * the user and anything they chose — the caller carries on with whatever the
 * decline or the cancelled sheet would have done once this closes.
 */
export function ObjectionSheet({
  visible,
  onDone,
}: {
  visible: boolean;
  /** The answer, or null for Skip (and for the hardware dismiss). */
  onDone: (reason: Objection | null) => void;
}) {
  const options = OBJECTIONS.map((value) => ({ value, label: t(`survey.objection.${value}`) }));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onDone(null)}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <View
          style={{
            backgroundColor: tokens.color.surface,
            borderTopLeftRadius: tokens.radius.lg,
            borderTopRightRadius: tokens.radius.lg,
            borderWidth: 1,
            borderColor: tokens.color.hairline,
          }}
        >
          <SafeAreaView edges={["bottom"]}>
            <View
              style={{
                ...tokens.layout.column,
                padding: tokens.space.lg,
                gap: tokens.space.md,
              }}
            >
              <View style={{ gap: tokens.space.xs }}>
                <Text style={{ ...tokens.text.title, color: tokens.color.text }}>
                  {t("survey.objection.title")}
                </Text>
                <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
                  {t("survey.objection.subtitle")}
                </Text>
              </View>
              <OptionCards options={options} selected={[]} onPress={(value) => onDone(value)} />
              <Pressable
                onPress={() => onDone(null)}
                accessibilityRole="button"
                style={{ alignItems: "center", padding: tokens.space.sm }}
              >
                <Text style={{ ...tokens.text.body, color: tokens.color.textFaint }}>
                  {t("survey.objection.skip")}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

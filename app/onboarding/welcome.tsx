import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { tokens } from "../../src/design/tokens";
import { setOnboardingStep } from "../../src/onboarding";

export default function Welcome() {
  const router = useRouter();

  function onNext() {
    setOnboardingStep("vehicle");
    router.push("/onboarding/vehicle");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.housing }}>
      <View style={{ flex: 1, padding: tokens.space.xl, justifyContent: "center" }}>
        {/* The first thing the user sees is the cluster, so the rest of the app
            reads as the same object rather than as a form with a logo on it. */}
        <Panel>
          <View style={{ padding: tokens.space.lg, gap: tokens.space.md, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}>
              <Lamp lit />
              <Text style={{ ...tokens.text.legend, fontSize: 13, color: tokens.color.textMuted }}>
                Service due
              </Text>
            </View>
            <Text style={{ ...tokens.text.hero, color: tokens.color.text, textAlign: "center" }}>
              Glovebox
            </Text>
            <Text
              style={{ ...tokens.text.body, color: tokens.color.textMuted, textAlign: "center" }}
            >
              Your service records, kept forever. On this phone — no account, no server, nothing to
              log out of.
            </Text>
          </View>
        </Panel>
      </View>
      <View style={{ padding: tokens.space.xl, paddingTop: 0 }}>
        <Button label="Set up my car" onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { setOnboardingStep } from "../../src/onboarding";

export default function Welcome() {
  const router = useRouter();

  function onNext() {
    setOnboardingStep("vehicle");
    router.push("/onboarding/vehicle");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
      <View style={{ flex: 1, padding: tokens.space.xl, justifyContent: "center" }}>
        <View style={{ gap: tokens.space.md }}>
          <Text style={{ ...tokens.text.hero, color: tokens.color.text, textAlign: "center" }}>
            Glovebox
          </Text>
          <Text style={{ ...tokens.text.title, color: tokens.color.text, textAlign: "center" }}>
            Your service records, kept forever.
          </Text>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted, textAlign: "center" }}>
            On this phone. No account, no server, nothing to log out of.
          </Text>
        </View>
      </View>
      <View style={{ padding: tokens.space.xl }}>
        <Button label="Set up my car" onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}

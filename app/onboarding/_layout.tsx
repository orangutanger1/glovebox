import { Stack } from "expo-router";

// No back-to-app escape until onboarding completes: gestures disabled,
// headers hidden so each screen owns its own layout.
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />;
}

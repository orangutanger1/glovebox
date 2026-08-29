import { View } from "react-native";
import { Lamp } from "./Lamp";
import { tokens } from "./tokens";

/**
 * Onboarding progress, drawn as the row of telltales along the bottom of a
 * cluster rather than as dots.
 *
 * Dots would have been the first thing to make this flow look like every other
 * onboarding flow. The app already owns exactly one glowing element, so the
 * progress indicator is built from it: lamps behind you are lit, lamps ahead
 * are dark bulbs — which is also how a real panel reads, since an unlit
 * telltale is still visibly a telltale.
 */
export function StepLamps({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.xs }}>
      {Array.from({ length: total }, (_, i) => (
        <Lamp key={i} lit={i < step} size={i === step - 1 ? 9 : 7} />
      ))}
    </View>
  );
}

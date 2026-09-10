import { View } from "react-native";
import { tokens } from "./tokens";

/**
 * Onboarding progress.
 *
 * It used to be a row of warning lamps — the app's one glowing element, reused
 * so the flow would not look like every other onboarding flow. Two things were
 * wrong with that. Red is the app's alarm colour and reserved for a car that
 * needs something, so lighting one per answered question told the user their
 * answers were the problem; and a row of glowing bulbs is the sort of ornament
 * that dates an interface fastest.
 *
 * What is here instead is the quietest thing that still answers "how much is
 * left": a segmented rule, filled behind you and faint ahead, at the weight of
 * a hairline. The step you are on is the full-strength segment.
 */
export function StepLamps({ step, total }: { step: number; total: number }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      {Array.from({ length: total }, (_, i) => {
        const done = i < step;
        const current = i === step - 1;
        return (
          <View
            key={i}
            style={{
              width: current ? 14 : 8,
              height: 3,
              borderRadius: 2,
              backgroundColor: done
                ? current
                  ? tokens.color.text
                  : tokens.color.metalHi
                : tokens.color.metalLo,
            }}
          />
        );
      })}
    </View>
  );
}

import { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { tokens } from "../../src/design/tokens";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/** Long enough to read one line before the next arrives, short enough that the
 *  screen is gone in under two seconds. */
const LINE_MS = 420;
const HANDOFF_MS = 600;

/**
 * The pause between the last question and the answer.
 *
 * The version of this screen that the structure calls for is a fake progress
 * ring counting to 100% over eight seconds while nothing happens. This app
 * cannot ship that: the entire pitch is that nothing here is a trick, and a
 * user who works out that the loader was theatre has been given a reason to
 * distrust the numbers on the very next screen.
 *
 * So the work is real and the screen shows it happening. Each line is a value
 * that was actually computed from what the user typed — the car, the intervals
 * applied to it, the projection from the mileage rate they picked, the count
 * that comes out. The delay is the reading time for four lines, not a stall.
 *
 * It replaces itself rather than pushing, so Back from the results lands on
 * the last question instead of bouncing off a screen that immediately moves
 * forward again.
 */
export default function OnboardingAnalyzing() {
  const advance = useAdvance("analyzing", "replace");
  const { vehicleName, plan } = useOnboardingFindings();

  const lines = useMemo(() => {
    const out = [
      plan.odometer === undefined
        ? vehicleName
        : `${vehicleName} at ${plan.odometer.toLocaleString()} mi`,
      `${plan.items.length} service intervals applied`,
    ];
    out.push(
      plan.projectedOdometer === undefined
        ? `${plan.milesPerYear.toLocaleString()} mi a year`
        : `${plan.milesPerYear.toLocaleString()} mi a year, so ${plan.projectedOdometer.toLocaleString()} mi by next year`
    );
    out.push(
      plan.dueNow === 0
        ? "Nothing needs attention today"
        : `${plan.dueNow} need attention, ${plan.soon} coming up`
    );
    return out;
  }, [plan, vehicleName]);

  const [shown, setShown] = useState(0);

  useEffect(() => {
    const done = shown >= lines.length;
    const timer = setTimeout(
      () => (done ? advance() : setShown((n) => n + 1)),
      done ? HANDOFF_MS : LINE_MS
    );
    return () => clearTimeout(timer);
  }, [shown, lines.length, advance]);

  return (
    <OnboardingScreen route="analyzing" center title="Working out the schedule.">
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          {lines.map((line, i) => {
            const last = i === lines.length - 1;
            return (
              <View
                key={line}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: tokens.space.sm,
                  // Rendered from the first frame at zero opacity rather than
                  // mounted late: a row appearing changes the height of the
                  // panel, and a panel that grows four times reads as a layout
                  // fault rather than as a machine working.
                  opacity: i < shown ? 1 : 0,
                }}
              >
                {/* The lamp is the app's alarm and lights for one reason. It
                    belongs on the count of what needs attention and nowhere
                    else on this screen; the other three lines are readings. */}
                {last ? (
                  <Lamp lit={plan.dueNow > 0} size={8} />
                ) : (
                  <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint, width: 21 }}>
                    {`0${i + 1}`}
                  </Text>
                )}
                <Text
                  style={{
                    ...tokens.text.body,
                    ...tokens.text.numeric,
                    fontWeight: last ? "600" : "400",
                    color: last ? tokens.color.text : tokens.color.textMuted,
                    flex: 1,
                  }}
                >
                  {line}
                </Text>
              </View>
            );
          })}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text } from "react-native";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { ProgressBar } from "../../src/design/ProgressBar";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { formatDistance } from "../../src/units/format";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * Long enough to read a line, not long enough to wait for one. The first pass
 * was 420ms and the whole screen was gone inside two seconds, which is a
 * flicker; the second was 950ms a line plus a 1,400ms handoff, which is 5.2
 * seconds of a user holding a phone waiting for arithmetic that finished
 * before the screen mounted. 650 and 700 put the whole readout a little over
 * three seconds, and a tap anywhere ends it immediately.
 */
const LINE_MS = 650;
/** The beat after the last line, which is the one that carries the finding. */
const HANDOFF_MS = 700;

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
 * that was actually computed from what the user typed: the car, the intervals
 * applied to it, the projection from the mileage rate they picked, the count
 * that comes out. The bar under them is honest about what it measures. It runs
 * for exactly as long as the readout takes to finish, which is the wait it is
 * describing, and it moves at a constant rate because nothing about the wait
 * accelerates.
 *
 * It replaces itself rather than pushing, so Back from the results lands on
 * the last question instead of bouncing off a screen that immediately moves
 * forward again.
 *
 * A tap anywhere ends it. Everything on this screen was computed before it
 * mounted, so every millisecond of it is presentation: a user who has read the
 * four lines is owed the next screen rather than the rest of an animation, and
 * the one screen in the flow with no control on it was the one screen the user
 * could not hurry. The bar is still honest, because the timings it draws are
 * still the timings it would have taken.
 */
export default function OnboardingAnalyzing() {
  const advance = useAdvance("analyzing", "replace");
  const { vehicleName, plan } = useOnboardingFindings();

  const lines = useMemo(() => {
    const out = [
      plan.odometer === undefined
        ? vehicleName
        : t("onboardingB.analyzing.odometer", {
            vehicle: vehicleName,
            distance: formatDistance(plan.odometer, plan.unit),
          }),
      t("onboardingB.analyzing.intervals", { count: plan.items.length }),
    ];
    const rate = formatDistance(plan.distancePerYear, plan.unit);
    out.push(
      plan.projectedOdometer === undefined
        ? t("onboardingB.analyzing.rate", { distance: rate })
        : t("onboardingB.analyzing.rateProjected", {
            distance: rate,
            projected: formatDistance(plan.projectedOdometer, plan.unit),
          })
    );
    out.push(
      plan.dueNow === 0
        ? t("onboardingB.analyzing.clear")
        : t("onboardingB.analyzing.due", { count: plan.dueNow, soon: plan.soon })
    );
    return out;
  }, [plan, vehicleName]);

  const [shown, setShown] = useState(0);

  // The timer and the tap must not both land. `advance` here is a `replace`,
  // and replacing twice puts the results screen on the stack over itself.
  const left = useRef(false);
  const leave = useCallback(() => {
    if (left.current) return;
    left.current = true;
    advance();
  }, [advance]);

  useEffect(() => {
    const done = shown >= lines.length;
    const timer = setTimeout(
      () => (done ? leave() : setShown((n) => n + 1)),
      done ? HANDOFF_MS : LINE_MS
    );
    return () => clearTimeout(timer);
  }, [shown, lines.length, leave]);

  return (
    <OnboardingScreen
      route="analyzing"
      center
      title={t("onboardingB.analyzing.title")}
      onTap={leave}
    >
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

          <View style={{ gap: tokens.space.sm }}>
            <ProgressBar duration={lines.length * LINE_MS + HANDOFF_MS} />
            <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
              {shown >= lines.length
                ? t("onboardingB.analyzing.done")
                : t("onboardingB.analyzing.progress", { index: shown + 1, total: lines.length })}
            </Text>
          </View>
        </View>
      </Panel>

      {/* Said out loud, because a tap target with nothing on it is not a
          control. Below the panel rather than inside it: the readout is the
          screen, and this is an instruction about the screen. */}
      <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
        {t("onboardingB.analyzing.skip")}
      </Text>
    </OnboardingScreen>
  );
}

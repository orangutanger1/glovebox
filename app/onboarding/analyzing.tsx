import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { Check } from "../../src/design/Check";
import { ProgressBar } from "../../src/design/ProgressBar";
import { tokens } from "../../src/design/tokens";
import { formatNumber, t } from "../../src/i18n";
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
 * three seconds.
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
 * that comes out. Each one is ticked as it lands, so the panel reads as a
 * checklist being worked rather than a paragraph being typed.
 *
 * The bar above them is honest about what it measures: it runs for exactly as
 * long as the readout takes to finish, which is the wait it is describing.
 *
 * The percentage is that same bar's own value rather than a second counter, so
 * there is no arrangement in which the two disagree — and it is printed above
 * the headline rather than beside the bar. It used to be a legend-sized number
 * at the end of a row inside the panel, which is the smallest type on the
 * screen given to the one thing the user is actually watching. On a screen
 * whose whole job is a wait, the number counting it out is the headline and
 * "Working out the schedule." is the caption under it.
 *
 * It replaces itself rather than pushing, so Back from the results lands on
 * the last question instead of bouncing off a screen that immediately moves
 * forward again.
 *
 * There is no way to hurry it, and no "tap anywhere to skip" underneath. The
 * four lines are the argument the next six screens are built on, and a screen
 * that invites the user past its own readout is telling them the readout does
 * not matter. Three and a bit seconds is a pause, not a wait.
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
  // The bar's own fill, printed. `useCallback` because `ProgressBar` subscribes
  // on identity: a fresh function every render would tear the listener down and
  // rebuild it a hundred times over the run.
  const [percent, setPercent] = useState(0);
  const onProgress = useCallback((next: number) => setPercent(next), []);

  useEffect(() => {
    const done = shown >= lines.length;
    const timer = setTimeout(
      () => (done ? advance() : setShown((n) => n + 1)),
      done ? HANDOFF_MS : LINE_MS
    );
    return () => clearTimeout(timer);
  }, [shown, lines.length, advance]);

  return (
    <OnboardingScreen
      route="analyzing"
      center
      title={t("onboardingB.analyzing.title")}
      // The count, at the size of the thing being counted. Tabular figures, so
      // three digits arriving under two do not shift the headline beneath it.
      overline={
        <Text
          style={{
            ...tokens.text.numeric,
            fontSize: 56,
            lineHeight: 60,
            fontWeight: "700",
            color: tokens.color.text,
          }}
        >
          {t("onboardingB.analyzing.percent", { percent: formatNumber(percent) })}
        </Text>
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          {/* The bar leads the panel rather than closing it. It is the one
              thing in here that answers "how much longer", and a readout the
              user has to scan past four lines to find is a readout they read
              after they needed it. Its own fill is what the headline above
              prints, so the two cannot disagree. */}
          <ProgressBar duration={lines.length * LINE_MS + HANDOFF_MS} onProgress={onProgress} />

          {lines.map((line, i) => {
            const last = i === lines.length - 1;
            return (
              <Line
                key={line}
                text={line}
                done={i < shown}
                last={last}
                /* A checkpoint that has been reached is ticked. The one
                   exception is the last line when something is actually past
                   due: the lamp is the app's alarm, it belongs on the count of
                   what needs attention, and a green tick beside "3 services
                   overdue" would be the app congratulating itself. */
                mark={last && plan.pastDue > 0 ? <Lamp lit size={8} /> : <Check size={14} />}
              />
            );
          })}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}

/** How long a checkpoint takes to land. Short, and decelerating: the value was
 *  computed before the screen mounted and this is the machine reporting it,
 *  not the machine thinking about it. */
const LAND_MS = 200;

/**
 * One checkpoint in the readout.
 *
 * Every row is rendered from the first frame and only its opacity changes: a
 * row mounting late changes the height of the panel, and a panel that grows
 * four times reads as a layout fault rather than as a machine working. What is
 * animated on top of that is 4px of travel, so a line does not simply exist
 * where a moment ago there was nothing — it arrives, which is the difference
 * between a checklist being worked and text being switched on.
 */
function Line({
  text,
  done,
  last,
  mark,
}: {
  text: string;
  done: boolean;
  last: boolean;
  mark: ReactNode;
}) {
  const land = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    if (!done) return;
    const run = Animated.timing(land, {
      toValue: 1,
      duration: LAND_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [land, done]);

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.space.sm,
        opacity: land,
        transform: [
          { translateY: land.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) },
        ],
      }}
    >
      <View style={{ width: 22, alignItems: "center" }}>{mark}</View>
      <Text
        style={{
          ...tokens.text.body,
          ...tokens.text.numeric,
          fontWeight: last ? "600" : "400",
          color: last ? tokens.color.text : tokens.color.textMuted,
          flex: 1,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

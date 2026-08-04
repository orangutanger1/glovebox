import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { requestPermission, rescheduleAll } from "../../src/notify";
import { planItemLine } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

const ROW_STATUS = { due: "overdue", soon: "soon", ok: "ok" } as const;

/** The whole schedule is real, but a screen with twelve rows on it is a
 *  document, not a plan. The rest is one line of arithmetic underneath. */
const SHOWN = 6;

/**
 * The plan, and the notification soft-ask.
 *
 * These are one screen because the permission only makes sense next to the
 * thing it delivers: iOS gives an app exactly one system prompt, opt-in
 * collapses when it fires without context, and "allow notifications?" on its
 * own screen is context-free by construction. Here the user is looking at six
 * dated services when they are asked whether they want to be told about them.
 *
 * "Not now" is a real answer and does not re-ask. Reminders are half the
 * product, and nagging for them is the other half of the reviews this app was
 * written against.
 */
export default function OnboardingPlan() {
  const advance = useAdvance("plan");
  const { vehicleName, plan } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);

  async function onRemindMe() {
    if (busy) return;
    setBusy(true);
    try {
      // Reminders are scheduled at launch, but at launch permission had not
      // been granted yet and rescheduleAll bailed out. Without this call the
      // service just logged during onboarding gets no notification until some
      // later cold start.
      if (await requestPermission()) await rescheduleAll();
    } catch {
      // Denied or unavailable. The app works without notifications.
    }
    advance();
  }

  const remaining = plan.items.length - SHOWN;

  return (
    <OnboardingScreen
      route="plan"
      title="Here is the plan."
      subtitle={`${plan.items.length} services on a schedule for your ${vehicleName}, counted by date and by mileage.`}
      footer={
        <>
          <Button label="Turn on reminders" onPress={onRemindMe} disabled={busy} />
          <Pressable
            onPress={advance}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>Not now</Text>
          </Pressable>
        </>
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
          {plan.items.slice(0, SHOWN).map((item) => (
            <ListRow
              key={item.type}
              title={item.type}
              subtitle={planItemLine(item)}
              status={ROW_STATUS[item.status]}
              right={<Badge label={item.status} tone={item.status} />}
            />
          ))}
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {remaining > 0 ? `Plus ${remaining} more, further out. ` : ""}
        One notification per service, on the day it comes due. Nothing else, ever.
      </Text>
    </OnboardingScreen>
  );
}

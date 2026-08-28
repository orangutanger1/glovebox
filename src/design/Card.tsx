import { View } from "react-native";
import { Panel } from "./Surface";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * A card. `status="overdue"` adds the red stripe down the left edge — the
 * card-level equivalent of a lit lamp, readable at arm's length — plus a wash
 * over the fill, because a 3px stripe alone is invisible on warm paper in
 * daylight.
 */
export function Card({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: "overdue";
}) {
  const c = useTheme();
  return (
    <Panel style={status === "overdue" ? { backgroundColor: c.overdueWash } : undefined}>
      <View style={{ flexDirection: "row" }}>
        {status === "overdue" ? <View style={{ width: 4, backgroundColor: c.overdue }} /> : null}
        <View style={{ flex: 1, padding: tokens.space.card, gap: tokens.space.sm }}>
          {children}
        </View>
      </View>
    </Panel>
  );
}

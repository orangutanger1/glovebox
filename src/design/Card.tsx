import { View } from "react-native";
import { Panel } from "./Surface";
import { tokens } from "./tokens";

/**
 * A content surface. `status="overdue"` adds the red rule down the left edge —
 * the card-level equivalent of a lit lamp, readable at arm's length, and the
 * only place a card is allowed any colour at all.
 */
export function Card({
  children,
  status,
}: {
  children: React.ReactNode;
  status?: "overdue";
}) {
  return (
    <Panel>
      <View style={{ flexDirection: "row" }}>
        {status === "overdue" ? (
          <View style={{ width: 2, backgroundColor: tokens.color.red }} />
        ) : null}
        <View style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.sm + 2 }}>{children}</View>
      </View>
    </Panel>
  );
}

import { View } from "react-native";
import { Panel } from "./Surface";
import { tokens } from "./tokens";

/**
 * A metal faceplate. `status="overdue"` adds the red stripe down the left edge
 * — the card-level equivalent of a lit lamp, readable at arm's length.
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
          <View style={{ width: 3, backgroundColor: tokens.color.red }} />
        ) : null}
        <View style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.sm }}>{children}</View>
      </View>
    </Panel>
  );
}

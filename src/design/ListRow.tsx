import { Pressable, View, Text } from "react-native";
import { tokens } from "./tokens";

/**
 * A row in a list. Flat, and one value up from the panel it sits in, so a list
 * reads as one object with rows in it rather than as a stack of floating
 * tiles. A press darkens the row; nothing moves.
 *
 * `status="overdue"` lights the row: red stripe on the left, title at full
 * weight. Healthy rows recede into muted text — health is expressed by weight
 * and light, not by a green.
 */
export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  status,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  status?: "overdue" | "soon" | "ok";
}) {
  const dim = status === "ok";

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: tokens.radius.sm,
            // One value above whatever it sits on, and no border: a bordered
            // row inside a bordered panel is a box in a box, and the row has
            // to read the same standing alone on the background as it does
            // inside a list.
            backgroundColor: pressed ? "#23272C" : tokens.color.surfaceHi,
            overflow: "hidden",
          }}
        >
          {status === "overdue" ? (
            <View style={{ width: 2, alignSelf: "stretch", backgroundColor: tokens.color.red }} />
          ) : null}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: tokens.space.sm,
              paddingHorizontal: tokens.space.md,
              paddingVertical: tokens.space.sm + 4,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  ...tokens.text.body,
                  fontWeight: dim ? "400" : "600",
                  color: dim ? tokens.color.textMuted : tokens.color.text,
                }}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={{
                    ...tokens.text.caption,
                    ...tokens.text.numeric,
                    color: tokens.color.textMuted,
                  }}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {right}
          </View>
        </View>
      )}
    </Pressable>
  );
}

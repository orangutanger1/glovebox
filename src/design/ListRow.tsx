import { Pressable, View, Text } from "react-native";
import { useTheme } from "./theme";
import { tokens } from "./tokens";

/**
 * A slot milled into the faceplate. Rows are inset wells rather than raised
 * cards so a list reads as one panel with grooves in it, not a stack of
 * floating tiles.
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
  const c = useTheme();

  const dim = status === "ok";

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: tokens.radius.sm,
            // The groove fills level with the panel under a finger; the
            // palette has two surface fills and this is the visible one.
            backgroundColor: pressed ? c.card : c.cardSunken,
            borderWidth: 1,
            borderColor: c.hairline,
            overflow: "hidden",
          }}
        >
          {status === "overdue" ? (
            <View style={{ width: 3, alignSelf: "stretch", backgroundColor: c.overdue }} />
          ) : null}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: tokens.space.sm,
              paddingHorizontal: tokens.space.md,
              paddingVertical: tokens.space.sm + 2,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  ...tokens.text.body,
                  fontWeight: dim ? "400" : "600",
                  color: dim ? c.inkMuted : c.ink,
                }}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={{
                    ...tokens.text.caption,
                    ...tokens.text.numeric,
                    color: c.inkMuted,
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

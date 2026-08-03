import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { tokens } from "./tokens";

/**
 * A machined toggle. The previous version filled unselected chips with
 * `transparent` over a near-black background, which left the user looking at
 * bare text where a control was — the chip had to be a visible object first
 * and a selection second. It is metal when off and white when on.
 */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  function handlePress() {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  }

  return (
    <Pressable onPress={handlePress}>
      {({ pressed }) => (
        <View
          style={{
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.color.edgeSolid,
            paddingBottom: pressed ? tokens.material.edgePressed : 2,
            marginTop: pressed ? tokens.material.pressTravel : 0,
          }}
        >
          <LinearGradient
            colors={selected ? ["#FFFFFF", "#DDDFE3"] : [...tokens.material.metalFace]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: tokens.space.md,
              borderRadius: tokens.radius.pill,
              borderWidth: 1,
              borderTopColor: selected ? "rgba(255,255,255,0.9)" : tokens.color.hairline,
              borderLeftColor: tokens.color.hairline,
              borderRightColor: tokens.color.hairline,
              borderBottomColor: tokens.color.edge,
            }}
          >
            <Text
              style={{
                ...tokens.text.body,
                fontWeight: selected ? "600" : "400",
                color: selected ? tokens.color.housing : tokens.color.text,
              }}
            >
              {label}
            </Text>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}

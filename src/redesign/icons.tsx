import { Image, Pressable, Text, View } from "react-native";
import { tokens } from "../design/tokens";

/**
 * Line icons for the redesign, drawn in one grammar (24-unit grid, 1.8 stroke,
 * round caps) and shipped as white PNGs that are tinted here. PNGs rather than
 * a symbol library so arm A stays an OTA update; sources and the renderer are
 * in design-source/icons/.
 */
const ICONS = {
  today: require("../../assets/icons/today.png"),
  garage: require("../../assets/icons/garage.png"),
  settings: require("../../assets/icons/settings.png"),
  chevron: require("../../assets/icons/chevron.png"),
  oil: require("../../assets/icons/oil.png"),
  tire: require("../../assets/icons/tire.png"),
  brake: require("../../assets/icons/brake.png"),
  filter: require("../../assets/icons/filter.png"),
  wiper: require("../../assets/icons/wiper.png"),
  battery: require("../../assets/icons/battery.png"),
  coolant: require("../../assets/icons/coolant.png"),
  spark: require("../../assets/icons/spark.png"),
  wrench: require("../../assets/icons/wrench.png"),
  back: require("../../assets/icons/back.png"),
  check: require("../../assets/icons/check.png"),
  plus: require("../../assets/icons/plus.png"),
  close: require("../../assets/icons/close.png"),
  bell: require("../../assets/icons/bell.png"),
  star: require("../../assets/icons/star.png"),
  calendar: require("../../assets/icons/calendar.png"),
  lock: require("../../assets/icons/lock.png"),
  shield: require("../../assets/icons/shield.png"),
  gauge: require("../../assets/icons/gauge.png"),
  receipt: require("../../assets/icons/receipt.png"),
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 22,
  color = tokens.color.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Image
      source={ICONS[name]}
      style={{ width: size, height: size, tintColor: color }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const SERVICE_ICON: Record<string, IconName> = {
  "Oil Change": "oil",
  "Tire Rotation": "tire",
  "Brake Inspection": "brake",
  "Air Filter": "filter",
  "Cabin Air Filter": "filter",
  "Wiper Blades": "wiper",
  "Battery Check": "battery",
  "Coolant Flush": "coolant",
  "Spark Plugs": "spark",
};

export function serviceIcon(type: string): IconName {
  return SERVICE_ICON[type] ?? "wrench";
}

/** Planta's upcoming row: the service's icon in a disc, what and when, a chevron. */
export function UpcomingRow({
  type,
  title,
  caption,
  when,
  onPress,
}: {
  type: string;
  title: string;
  caption?: string;
  when: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: tokens.space.md,
            paddingVertical: tokens.space.sm,
            opacity: pressed ? 0.6 : 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: tokens.color.accentWash,
            }}
          >
            <Icon
              name={serviceIcon(type)}
              size={20}
              color={tokens.color.accent}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                ...tokens.text.body,
                fontWeight: "600",
                color: tokens.color.text,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                ...tokens.text.caption,
                ...tokens.text.numeric,
                color: tokens.color.textMuted,
              }}
            >
              {caption ? `${caption} · ${when}` : when}
            </Text>
          </View>
          {onPress ? (
            <Icon name="chevron" size={16} color={tokens.color.textFaint} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

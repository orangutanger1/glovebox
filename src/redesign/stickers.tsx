import { Image } from "react-native";

/**
 * A v2's service stickers: the intro's flat blue stickers, one per service, in
 * every row that names a service. Chrome (tabs, back, settings) keeps the line
 * icons in icons.tsx. Oil, tyre, battery, spark plug and wrench are the
 * intro's own cutouts; brake, filter, wiper and coolant were drawn to match
 * (design-source/stickers/).
 */
const STICKERS = {
  oil: require("../../assets/stickers/oil.png"),
  tire: require("../../assets/stickers/tire.png"),
  brake: require("../../assets/stickers/brake.png"),
  filter: require("../../assets/stickers/filter.png"),
  wiper: require("../../assets/stickers/wiper.png"),
  battery: require("../../assets/stickers/battery.png"),
  coolant: require("../../assets/stickers/coolant.png"),
  spark: require("../../assets/stickers/spark.png"),
  wrench: require("../../assets/stickers/wrench.png"),
} as const;

export type StickerName = keyof typeof STICKERS;

const BY_SERVICE: Record<string, StickerName> = {
  "Oil Change": "oil",
  "Tire Rotation": "tire",
  tread: "tire",
  "Brake Inspection": "brake",
  "Air Filter": "filter",
  "Cabin Air Filter": "filter",
  "Wiper Blades": "wiper",
  "Battery Check": "battery",
  "Coolant Flush": "coolant",
  "Spark Plugs": "spark",
};

export function stickerFor(serviceType: string): StickerName {
  return BY_SERVICE[serviceType] ?? "wrench";
}

export function ServiceSticker({ type, size = 36 }: { type: string; size?: number }) {
  return (
    <Image
      source={STICKERS[stickerFor(type)]}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

import { HStack, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  widgetURL,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { WidgetProps } from "./snapshot";

/**
 * "What's next for my car", on the home screen and the lock screen.
 *
 * Buyers do not come back to the app (4 of 12 opened it on a later day), and
 * a reminder months away is the only other thing that reminds them it exists.
 * The widget is the app's face on the screen they look at all day.
 *
 * Runs in the widget runtime: nothing outside this function is visible to it,
 * so the palette is repeated here as literals (tokens.ts: housing, red, green,
 * text, textMuted). Content arrives as finished strings from `syncWidget`.
 */
const NextService = (props: WidgetProps, environment: WidgetEnvironment) => {
  "widget";
  const RED = "#E5484D";
  const GREEN = "#3DD68C";
  const TEXT = "#EDEEF0";
  const MUTED = "rgba(237,238,240,0.62)";
  const BG = "#0A0B0D";
  const family = environment.widgetFamily;
  const rows = props.rows ?? [];
  const first = rows[0];
  const tone = (s: string) => (s === "due" ? RED : s === "ok" ? GREEN : TEXT);
  const url = "carmaintenancelog://" + (props.url ?? "/").replace(/^\//, "");

  if (family === "accessoryInline") {
    return <Text>{first ? first.label + " · " + first.detail : props.empty}</Text>;
  }

  if (family === "accessoryRectangular") {
    return (
      <VStack alignment="leading" modifiers={[widgetURL(url), containerBackground("clear", "widget")]}>
        <Text modifiers={[font({ size: 12, weight: "semibold" }), lineLimit(1)]}>{props.vehicle}</Text>
        <Text modifiers={[font({ size: 15, weight: "bold" }), lineLimit(1)]}>
          {first ? first.label : props.empty}
        </Text>
        {first ? <Text modifiers={[font({ size: 13 }), lineLimit(1)]}>{first.detail}</Text> : null}
      </VStack>
    );
  }

  const shown = family === "systemSmall" ? rows.slice(0, 1) : rows;

  return (
    <VStack
      alignment="leading"
      spacing={6}
      modifiers={[
        frame({ maxWidth: 10000, maxHeight: 10000, alignment: "topLeading" }),
        widgetURL(url),
        containerBackground(BG, "widget"),
      ]}
    >
      <Text modifiers={[font({ size: 12, weight: "semibold" }), foregroundStyle(MUTED), lineLimit(1)]}>
        {props.vehicle || "Wrenchy"}
      </Text>
      {shown.length === 0 ? (
        <Text modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle(TEXT)]}>{props.empty}</Text>
      ) : family === "systemSmall" ? (
        <VStack alignment="leading" spacing={4}>
          <Spacer />
          <Text modifiers={[font({ size: 17, weight: "bold" }), foregroundStyle(TEXT), lineLimit(2)]}>
            {shown[0].label}
          </Text>
          <Text modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle(tone(shown[0].status)), lineLimit(1)]}>
            {shown[0].detail}
          </Text>
        </VStack>
      ) : (
        shown.map((r, i) => (
          <HStack key={String(i)} modifiers={[padding({ top: 2 })]}>
            <Text modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle(TEXT), lineLimit(1)]}>
              {r.label}
            </Text>
            <Spacer />
            <Text modifiers={[font({ size: 14, weight: "semibold" }), foregroundStyle(tone(r.status)), lineLimit(1)]}>
              {r.detail}
            </Text>
          </HStack>
        ))
      )}
    </VStack>
  );
};

export default createWidget("NextService", NextService);

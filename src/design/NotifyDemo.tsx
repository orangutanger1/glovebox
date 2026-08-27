import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { NotifyBanner } from "./NotifyBanner";
import { tokens } from "./tokens";

/**
 * The notification arriving, rather than a picture of one.
 *
 * The soft-ask screen used to draw a single static card. It was honest — the
 * scheduler's own strings against the user's own car — and it read as a feature
 * card, which is the one thing a preview of a notification must not do. A
 * notification is an event: it drops in from above the top of the screen while
 * the user is doing something else. Drawn still, that is exactly the half the
 * user is being asked to consent to and the half that was missing.
 *
 * So it drops, holds long enough to be read, lifts away, and the next one
 * arrives. With one reminder in hand it re-drops the same one, which is the
 * truthful animation for a garage with one dated service in it: this is what
 * will happen, once.
 *
 * Every message is real — a service this car has actually had, on the date the
 * app would actually notify. Nothing here is a specimen.
 */

/** Drop, read, lift. The hold is the only number a user consciously notices:
 *  short enough that the second message is worth waiting for, long enough that
 *  a two-line notification can be read once without hurrying. */
const ENTER_MS = 460;
const HOLD_MS = 2200;
const EXIT_MS = 260;
const GAP_MS = 220;

export type NotifyMessage = { title: string; body: string; when: string };

export function NotifyDemo({ messages }: { messages: NotifyMessage[] }) {
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  // Read in the effect but deliberately not a dependency: re-running the
  // sequence on every render of a new array identity would restart the drop
  // mid-flight and the banner would stutter in place.
  const count = messages.length;

  useEffect(() => {
    if (count === 0) return;
    progress.setValue(0);

    const run = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(HOLD_MS),
      Animated.timing(progress, {
        toValue: 2,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(GAP_MS),
    ]);

    // `finished` is false when the screen unmounted mid-sequence, and advancing
    // then would set state on a dead component.
    run.start(({ finished }) => {
      if (finished) setIndex((i) => (i + 1) % count);
    });
    return () => run.stop();
  }, [index, count, progress]);

  const message = messages[index % Math.max(count, 1)];
  if (!message) return null;

  return (
    // Fixed height: the banner is one of two or three messages of different
    // lengths, and a container that resized between them would shove the plan
    // below it up and down every two seconds. The banner truncates itself, so
    // 124 is the tallest a message can be.
    <View
      style={{ height: 124, justifyContent: "flex-start", overflow: "hidden" }}
    >
      <Animated.View
        style={{
          opacity: progress.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [0, 1, 0],
          }),
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [-tokens.space.xl, 0, -tokens.space.md],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [0.94, 1, 0.97],
              }),
            },
          ],
        }}
      >
        <NotifyBanner
          title={message.title}
          body={message.body}
          when={message.when}
        />
      </Animated.View>
    </View>
  );
}

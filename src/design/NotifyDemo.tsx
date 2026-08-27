import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { NotifyBanner } from "./NotifyBanner";

/**
 * The notification arriving, rather than a picture of one.
 *
 * A notification is an event: it drops in from above the top edge of the screen
 * while the user is doing something else, holds long enough to be read, and
 * lifts away on its own. Drawn still, it reads as a feature card — the one thing
 * a preview of a notification must not do — so this one is animated exactly as
 * iOS delivers a banner, and it is placed by its caller at the very top of the
 * screen, over the content, the way a real banner sits over whatever app is
 * open. It reserves no layout space and shifts nothing beneath it.
 *
 * It is not interactive. A real banner can be swiped away, but a swipe here
 * fought the screen's own scroll, and the preview's job is only to show what
 * arrives — so it shows, waits, and clears, then the next real reminder drops
 * in. With one reminder in hand it re-drops the same one, which is the truthful
 * animation for a garage with one dated service in it: this is what will happen.
 *
 * Every message is real — a service this car has actually had, on the date the
 * app would actually notify. Nothing here is a specimen.
 */

/** Drop, read, lift. The hold is the only number a user consciously notices:
 *  long enough to read a two-line banner once, short enough that the next
 *  message is worth waiting for. */
const ENTER_MS = 480;
const HOLD_MS = 3200;
const EXIT_MS = 300;
const GAP_MS = 520;

/** How far above rest the banner starts and returns to — clear of the top edge
 *  so it is fully gone between messages. */
const RISE = 140;

export type NotifyMessage = { title: string; body: string; when: string };

export function NotifyDemo({ messages }: { messages: NotifyMessage[] }) {
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  // Read in the effect but deliberately not a dependency: re-running the
  // sequence on every new array identity would restart the drop mid-flight and
  // the banner would stutter in place.
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
        easing: Easing.in(Easing.cubic),
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
              outputRange: [-RISE, 0, -RISE * 0.6],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0.95, 1, 0.98],
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
  );
}

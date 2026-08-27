import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, PanResponder, View } from "react-native";
import { NotifyBanner } from "./NotifyBanner";

/**
 * The notification arriving, rather than a picture of one — and behaving like
 * one under the thumb.
 *
 * The soft-ask screen used to draw a single static card. It was honest — the
 * scheduler's own strings against the user's own car — and it read as a feature
 * card, which is the one thing a preview of a notification must not do. A
 * notification is an event: it drops in from above the top of the screen while
 * the user is doing something else, sits under the finger, and is flicked away.
 *
 * So this one drops, holds long enough to be read, and lifts away on its own —
 * but it is also a live banner, not a slideshow frame. Drag it upward and it
 * follows the finger; flick it up or drag it past the edge and it dismisses the
 * way an iOS banner does; let go short and it springs back and resumes its
 * hold. Either way the next real reminder drops in behind it, so the preview
 * "stays there": dismissing one never empties the screen, it advances the queue.
 *
 * Every message is real — a service this car has actually had, on the date the
 * app would actually notify. Nothing here is a specimen.
 */

/** Drop, read, lift. The hold is the only number a user consciously notices:
 *  long enough to read a two-line banner once and reach up to swipe it, short
 *  enough that a user who does nothing still sees the next message arrive. */
const ENTER_MS = 460;
const HOLD_MS = 2800;
const EXIT_MS = 240;
const GAP_MS = 260;

/** How far above rest fully hides the banner. Larger than the tallest banner so
 *  the exit clears the clipped container completely before the next drop. */
const HIDDEN = 180;

/** A flick this fast upward dismisses regardless of distance; a drag this far
 *  up dismisses regardless of speed. Below both, the banner springs back — the
 *  same two-part test iOS applies to a banner under the thumb. */
const FLICK_VY = -0.5;
const DISMISS_DY = 44;

export type NotifyMessage = { title: string; body: string; when: string };

export function NotifyDemo({ messages }: { messages: NotifyMessage[] }) {
  const [index, setIndex] = useState(0);
  // One value drives everything: the drop, the swipe, and the lift are all the
  // banner's vertical offset from rest (0 = fully shown, -HIDDEN = gone above).
  // Opacity and scale are read off it so a finger dragging it up fades it too.
  const translateY = useRef(new Animated.Value(-HIDDEN)).current;
  // The animation currently driving translateY, kept so a touch can stop it
  // mid-flight — Animated.delay inside a sequence is not interrupted by
  // stopAnimation on the value, so the composite has to be stopped by hand.
  const cycle = useRef<Animated.CompositeAnimation | null>(null);
  // False once unmounted: a sequence that finishes after teardown must not
  // advance the index on a dead component.
  const alive = useRef(true);
  // Read in the effect but deliberately not a dependency: re-running on every
  // new array identity would restart the drop mid-flight.
  const count = messages.length;

  const advance = useCallback(() => {
    if (alive.current && count > 0) setIndex((i) => (i + 1) % count);
  }, [count]);

  // Wait out the hold, lift away, and hand off to the next message. Split from
  // the entrance so a spring-back after a short drag can resume here instead of
  // replaying the drop the user already watched.
  const scheduleExit = useCallback(() => {
    const run = Animated.sequence([
      Animated.delay(HOLD_MS),
      Animated.timing(translateY, {
        toValue: -HIDDEN,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(GAP_MS),
    ]);
    cycle.current = run;
    run.start(({ finished }) => finished && advance());
  }, [advance, translateY]);

  // Drop in from above the top edge, then start the hold.
  const enter = useCallback(() => {
    translateY.setValue(-HIDDEN);
    const run = Animated.timing(translateY, {
      toValue: 0,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    cycle.current = run;
    run.start(({ finished }) => finished && scheduleExit());
  }, [scheduleExit, translateY]);

  // Finger let go past the threshold: complete the dismissal from wherever it
  // is now, then bring the next reminder in.
  const dismiss = useCallback(() => {
    const run = Animated.sequence([
      Animated.timing(translateY, {
        toValue: -HIDDEN,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(GAP_MS),
    ]);
    cycle.current = run;
    run.start(({ finished }) => finished && advance());
  }, [advance, translateY]);

  // Finger let go short: settle back to rest and resume the hold, so a curious
  // tug does not cost the user the message.
  const settle = useCallback(() => {
    const run = Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 18,
    });
    cycle.current = run;
    run.start(({ finished }) => finished && scheduleExit());
  }, [scheduleExit, translateY]);

  // The gesture reads and writes translateY directly. Latest handlers live in a
  // ref so the responder — created once, to survive a gesture in progress —
  // never calls a stale closure after `count` changes.
  const gesture = useRef({ dismiss, settle });
  gesture.current = { dismiss, settle };
  const grabbedAt = useRef(0);
  const pan = useRef(
    PanResponder.create({
      // Claim only an upward drag, and only once it out-runs any horizontal
      // scroll — the banner should never fight a sideways swipe.
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy < -3 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        cycle.current?.stop();
        translateY.stopAnimation((v) => {
          grabbedAt.current = v;
        });
      },
      // Follow the finger upward; resist downward past rest so the banner can be
      // pulled off but not dragged down into the plan.
      onPanResponderMove: (_, g) => {
        translateY.setValue(Math.min(0, grabbedAt.current + g.dy));
      },
      onPanResponderRelease: (_, g) => {
        const pulled = grabbedAt.current + g.dy;
        if (pulled < -DISMISS_DY || g.vy < FLICK_VY) gesture.current.dismiss();
        else gesture.current.settle();
      },
      onPanResponderTerminate: () => gesture.current.settle(),
    }),
  ).current;

  useEffect(() => {
    if (count === 0) return;
    alive.current = true;
    enter();
    return () => {
      alive.current = false;
      cycle.current?.stop();
    };
  }, [index, count, enter]);

  const message = messages[index % Math.max(count, 1)];
  if (!message) return null;

  return (
    // Fixed height: the banner is one of two or three messages of different
    // lengths, and a container that resized between them would shove the plan
    // below it up and down. The banner truncates itself, so 124 is the tallest a
    // message can be; overflow-hidden clips the drop and the swipe at the top
    // edge the way a real banner is clipped by the top of the screen.
    <View
      style={{ height: 124, justifyContent: "flex-start", overflow: "hidden" }}
    >
      <Animated.View
        {...pan.panHandlers}
        style={{
          opacity: translateY.interpolate({
            inputRange: [-HIDDEN, -HIDDEN * 0.45, 0],
            outputRange: [0, 1, 1],
            extrapolate: "clamp",
          }),
          transform: [
            { translateY },
            {
              scale: translateY.interpolate({
                inputRange: [-HIDDEN, 0],
                outputRange: [0.94, 1],
                extrapolate: "clamp",
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

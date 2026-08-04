import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { tokens } from "../src/design/tokens";
import { DISCOUNT_OFFERING, presentOffering } from "../src/purchases";
import { recordReviewEvent } from "../src/review";

/**
 * Where "Try Pro free" in the home-screen menu lands.
 *
 * Deliberately not a screen. The user has already read the offer — it was the
 * row they tapped, subtitle and all — so putting a page in front of the
 * paywall would be asking them to agree to the same thing twice. This mounts,
 * presents the trial offering, and leaves.
 *
 * The housing-coloured view behind it is what shows for the frame before the
 * native sheet covers it, and again while it dismisses.
 */
export default function Trial() {
  const router = useRouter();
  // Effects can run twice; presenting the paywall twice stacks two native
  // sheets and leaves one of them unreachable behind the other.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      if ((await presentOffering(DISCOUNT_OFFERING)) === "purchased") {
        recordReviewEvent("purchase");
      }
      router.replace("/");
    })();
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: tokens.color.housing }} />;
}

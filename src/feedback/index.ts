import { Linking } from "react-native";

/**
 * The one place feedback goes.
 *
 * The app has no server and no support address, so an in-app form would write
 * the answer to a phone nobody but its owner can read. A hosted form is the
 * whole backend: it collects, it stores, and it costs nothing to run.
 *
 * The `usp=dialog` query the share sheet appends is dropped — it only tells
 * Google how the link was copied.
 */
export const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdexUO3CC7gRVfWoTn4ENPryIUFjvagXetQ0hlAK4lc61qOEA/viewform";

/**
 * Opens it in Safari. Never throws: the screens that call this are already
 * making the user an offer, and a dead link must not take the offer down with
 * it. There is no in-app browser here on purpose — `expo-web-browser` would be
 * a native dependency and a new build for one link.
 */
export async function openFeedback(url: string = FEEDBACK_URL): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    // No handler for the scheme, or the URL is malformed.
  }
}

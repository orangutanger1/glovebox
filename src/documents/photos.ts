import { Directory, File, Paths } from "expo-file-system";

/**
 * Photos of glovebox documents, kept in the app's own documents directory and
 * nowhere else: no server, no photo library copy. A row stores file names
 * only, resolved here against the current container.
 *
 * The picker is required lazily: a binary built before the image picker
 * shipped has no native module for it, and an OTA must not crash that build
 * on opening a document. `canTakePhotos` lets the form hide the control.
 */
export const MAX_PHOTOS = 2;

function dir(): Directory {
  const d = new Directory(Paths.document, "glovebox");
  if (!d.exists) d.create({ idempotent: true });
  return d;
}

export function photoUri(name: string): string {
  return new File(Paths.document, "glovebox", name).uri;
}

type Picker = typeof import("expo-image-picker");
function picker(): Picker | null {
  try {
    return require("expo-image-picker") as Picker;
  } catch {
    return null;
  }
}

export function canTakePhotos(): boolean {
  return picker() !== null;
}

/**
 * Asks for one photo, from the camera or the library, and copies it into the
 * glovebox directory. Resolves to the stored file name, or null when the user
 * cancelled or refused access.
 */
export async function addPhoto(source: "camera" | "library"): Promise<string | null> {
  const p = picker();
  if (!p) return null;
  const permission =
    source === "camera"
      ? await p.requestCameraPermissionsAsync()
      : await p.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const options = { mediaTypes: ["images" as const], quality: 0.7 };
  const result =
    source === "camera" ? await p.launchCameraAsync(options) : await p.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  new File(result.assets[0].uri).copy(new File(dir(), name));
  return name;
}

/** Best effort: a file that is already gone is the outcome wanted. */
export function deletePhoto(name: string): void {
  try {
    const f = new File(Paths.document, "glovebox", name);
    if (f.exists) f.delete();
  } catch {
    // Nothing to do.
  }
}

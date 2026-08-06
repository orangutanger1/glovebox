import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toCsv } from "./csv";
import { allRecordsForExport } from "../db/records";

export async function exportAndShare(): Promise<void> {
  const csv = toCsv(allRecordsForExport());
  // Filename and stamp stay ASCII and ISO in every language: it travels into
  // Files, Mail attachments and other people's spreadsheets, where a localised
  // name sorts wrongly and non-ASCII characters are still a coin toss.
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `car-maintenance-${stamp}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
  });
}

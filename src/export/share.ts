import { Paths, File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toCsv, toFuelCsv } from "./csv";
import { allRecordsForExport } from "../db/records";
import { allFuelForExport } from "../db/fuel";

/** Filename and stamp stay ASCII and ISO in every language: these travel into
 *  Files, Mail attachments and other people's spreadsheets, where a localised
 *  name sorts wrongly and non-ASCII characters are still a coin toss. */
function write(name: string, contents: string): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  return file;
}

async function share(file: File): Promise<void> {
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    UTI: "public.comma-separated-values-text",
  });
}

/**
 * Two sheets, shared one after the other.
 *
 * `Sharing.shareAsync` takes one URI, and zipping the pair would hand a
 * spreadsheet user an archive to unpack instead of a file to open. The services
 * file goes first: it is the one someone exporting "my car's history" is
 * asking for, and the fuel log follows it.
 */
export async function exportAndShare(): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  const services = write(`car-maintenance-${stamp}.csv`, toCsv(allRecordsForExport()));
  const fuel = write(`car-fuel-${stamp}.csv`, toFuelCsv(allFuelForExport()));
  await share(services);
  await share(fuel);
}

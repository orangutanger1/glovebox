import type { Fragment } from "../types";

/**
 * The glovebox: the papers a car carries, and the reminders before they lapse.
 */
export const documents: Fragment = {
  "documents.legend": "Glovebox",
  "documents.add": "Add a document",
  "documents.empty": "Insurance, registration and more, with a reminder before they expire.",

  "documents.kind.insurance": "Insurance",
  "documents.kind.registration": "Registration",
  "documents.kind.inspection": "Inspection",
  "documents.kind.license": "Driver's license",
  "documents.kind.warranty": "Warranty",
  "documents.kind.roadside": "Roadside assistance",
  "documents.kind.other": "Other",

  "documents.row.expires": "Expires {date}",
  "documents.row.expired": "Expired {date}",
  "documents.row.noExpiry": "No expiry",
  "documents.row.detail": "{detail} · {when}",
  "documents.badge.expired": "Expired",
  "documents.badge.soon": "Expires soon",

  "documents.form.title": "Add document",
  "documents.form.editTitle": "Edit document",
  "documents.form.kind": "What is it?",
  "documents.form.issuer": "Issued by",
  "documents.form.name": "Name",
  "documents.form.number": "Policy or ID number",
  "documents.form.expiry": "Expiry",
  "documents.form.expires": "Expires",
  "documents.form.noExpiry": "Doesn't expire",
  "documents.form.remind": "You'll get a reminder 30 days and 7 days before.",
  "documents.form.notes": "Notes",
  "documents.form.save": "Save",
  "documents.form.error": "Couldn't save that. Try again.",
  "documents.form.private": "Saved only on this phone.",

  "documents.delete.button": "Delete document",
  "documents.delete.title": "Delete this document?",
  "documents.delete.body": "It will be removed from the glovebox and stop sending reminders.",
  "documents.delete.cancel": "Cancel",
  "documents.delete.confirm": "Delete",

  "documents.notify.title": "{document} expires {date}",
  "documents.notify.body": "{vehicle} · Renew it before it lapses.",
};

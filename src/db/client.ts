import * as SQLite from "expo-sqlite";
import { Paths, File } from "expo-file-system";
import { MIGRATIONS, applyMigrations } from "./schema";

const DB_NAME = "carlog.db";
let handle: SQLite.SQLiteDatabase | null = null;

function backupPath() {
  return new File(Paths.document, "SQLite", `${DB_NAME}.premigration`);
}

function livePath() {
  return new File(Paths.document, "SQLite", DB_NAME);
}

export function getDb(): SQLite.SQLiteDatabase {
  if (handle) return handle;

  const db = SQLite.openDatabaseSync(DB_NAME);
  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;

  if (current < MIGRATIONS.length) {
    const live = livePath();
    const backup = backupPath();
    if (live.exists) {
      if (backup.exists) backup.delete();
      live.copy(backup);
    }
    try {
      db.withTransactionSync(() => {
        const next = applyMigrations((sql) => db.execSync(sql), current);
        db.execSync(`PRAGMA user_version = ${next}`);
      });
    } catch (e) {
      db.closeSync();
      if (backup.exists) {
        livePath().delete();
        backup.copy(livePath());
      }
      throw new Error(`Migration failed and was rolled back: ${String(e)}`);
    }
  }

  handle = db;
  return db;
}

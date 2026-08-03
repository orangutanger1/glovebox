import * as SQLite from "expo-sqlite";
import { Paths, File } from "expo-file-system";
import { MIGRATIONS, applyMigrations } from "./schema";

const DB_NAME = "carlog.db";
let handle: SQLite.SQLiteDatabase | null = null;

function dbFile(suffix = "") {
  return new File(Paths.document, "SQLite", `${DB_NAME}${suffix}`);
}

function backupPath() {
  return new File(Paths.document, "SQLite", `${DB_NAME}.premigration`);
}

/**
 * expo-sqlite runs in WAL mode, which means committed pages can live in the
 * `-wal` sidecar rather than in the main file. Copying only `carlog.db` would
 * back up a database missing every recent write, and restoring that copy while
 * a stale `-wal` still sat beside it would let SQLite replay the sidecar over
 * the restored file. Checkpointing folds the sidecar in first; the restore path
 * then clears both sidecars so nothing gets replayed on top.
 */
function checkpoint(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // Not in WAL mode, or nothing to fold in. The plain copy is then complete.
  }
}

function clearSidecars(): void {
  for (const suffix of ["-wal", "-shm"]) {
    const f = dbFile(suffix);
    if (f.exists) f.delete();
  }
}

export function getDb(): SQLite.SQLiteDatabase {
  if (handle) return handle;

  const db = SQLite.openDatabaseSync(DB_NAME);
  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;

  if (current < MIGRATIONS.length) {
    const live = dbFile();
    const backup = backupPath();
    let backedUp = false;

    if (live.exists) {
      checkpoint(db);
      if (backup.exists) backup.delete();
      live.copy(backup);
      backedUp = true;
    }

    try {
      db.withTransactionSync(() => {
        const next = applyMigrations((sql) => db.execSync(sql), current);
        db.execSync(`PRAGMA user_version = ${next}`);
      });
    } catch (e) {
      db.closeSync();
      if (backedUp && backup.exists) {
        const target = dbFile();
        if (target.exists) target.delete();
        clearSidecars();
        backup.copy(target);
      }
      throw new Error(`Migration failed and was rolled back: ${String(e)}`);
    }
  }

  handle = db;
  return db;
}

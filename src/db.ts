import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "jobs.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS seen_jobs (
    id TEXT PRIMARY KEY,
    title TEXT,
    seen_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertStmt = db.prepare(
  "INSERT OR IGNORE INTO seen_jobs (id, title) VALUES (?, ?)"
);
const existsStmt = db.prepare("SELECT 1 FROM seen_jobs WHERE id = ?");

export function hasSeen(id: string): boolean {
  return !!existsStmt.get(id);
}

export function markSeen(id: string, title: string): boolean {
  const res = insertStmt.run(id, title);
  return res.changes > 0;
}

export function resetSeen(): number {
  const res = db.prepare("DELETE FROM seen_jobs").run();
  return res.changes;
}

import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "data", "curriculum-requests.db");

  // Ensure data directory exists
  const fs = require("fs");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS implementation_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      course_topic TEXT NOT NULL,
      course_info TEXT NOT NULL,
      files TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      course TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'pending'
    )
  `);

  // Add columns if missing (for existing DBs)
  const columns = db.pragma("table_info(implementation_requests)") as { name: string }[];
  const colNames = new Set(columns.map((c) => c.name));
  if (!colNames.has("name")) {
    db.exec("ALTER TABLE implementation_requests ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has("department")) {
    db.exec("ALTER TABLE implementation_requests ADD COLUMN department TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has("course")) {
    db.exec("ALTER TABLE implementation_requests ADD COLUMN course TEXT NOT NULL DEFAULT ''");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT DEFAULT '',
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      mode TEXT NOT NULL,
      phase TEXT NOT NULL,
      page_path TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  return db;
}

export function insertFeedback(
  email: string,
  category: string,
  message: string,
  mode: string,
  phase: string,
  pagePath: string
): number {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO feedback (email, category, message, mode, phase, page_path) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(email, category, message, mode, phase, pagePath);
  return Number(result.lastInsertRowid);
}

export function listFeedback() {
  const db = getDb();
  return db.prepare("SELECT * FROM feedback ORDER BY created_at DESC").all();
}

export function insertRequest(
  email: string,
  courseTopic: string,
  courseInfo: string,
  files: string,
  name: string = "",
  department: string = "",
  course: string = ""
): number {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO implementation_requests (email, course_topic, course_info, files, name, department, course) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(email, courseTopic, courseInfo, files, name, department, course);
  return Number(result.lastInsertRowid);
}

export function listRequests() {
  const db = getDb();
  return db
    .prepare("SELECT * FROM implementation_requests ORDER BY created_at DESC")
    .all();
}

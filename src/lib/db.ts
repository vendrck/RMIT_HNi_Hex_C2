import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

// Server-only storage. Rows hold ciphertext and signed policies, never plaintext.
// The file lives in data/ (gitignored: data/exams.db*).

export interface ExamRow {
  id: string;
  title: string;
  ciphertext: string;
  write_policy: string;
  read_policy: string;
  created_by: string;
  created_at: string;
}

/** List view: no ciphertext. */
export type ExamSummary = Omit<ExamRow, "ciphertext">;

export type NewExam = Omit<ExamRow, "created_at">;

// Reuse one connection across Next.js dev hot reloads.
const globalForDb = globalThis as unknown as { examDb?: Database.Database };

function db(): Database.Database {
  if (!globalForDb.examDb) {
    const dir = join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    const conn = new Database(process.env.EXAMS_DB_PATH ?? join(dir, "exams.db"));
    conn.pragma("journal_mode = WAL");
    conn.exec(`CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      write_policy TEXT NOT NULL,
      read_policy TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`);
    globalForDb.examDb = conn;
  }
  return globalForDb.examDb;
}

export function insertExam(exam: NewExam): ExamRow {
  const row: ExamRow = { ...exam, created_at: new Date().toISOString() };
  db()
    .prepare(
      `INSERT INTO exams (id, title, ciphertext, write_policy, read_policy, created_by, created_at)
       VALUES (@id, @title, @ciphertext, @write_policy, @read_policy, @created_by, @created_at)`
    )
    .run(row);
  return row;
}

export function listExams(): ExamSummary[] {
  return db()
    .prepare(
      `SELECT id, title, write_policy, read_policy, created_by, created_at
       FROM exams ORDER BY created_at DESC`
    )
    .all() as ExamSummary[];
}

/** Full rows, ciphertext included. Only for /server-view ("what the operator sees"). */
export function listExamRows(): ExamRow[] {
  return db().prepare(`SELECT * FROM exams ORDER BY created_at DESC`).all() as ExamRow[];
}

export function getExam(id: string): ExamRow | undefined {
  return db().prepare(`SELECT * FROM exams WHERE id = ?`).get(id) as ExamRow | undefined;
}

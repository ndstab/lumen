import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

// Next.js recreates modules on hot reload. Keep one connection on globalThis so
// we do not leak file handles during development.
const globalForDb = globalThis as unknown as { __lumenDb?: Database.Database };

function open(): Database.Database {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `No database found at ${DB_PATH}. Run "npm run seed" before starting the app.`
    );
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__lumenDb) globalForDb.__lumenDb = open();
  return globalForDb.__lumenDb;
}

export type Role = "learner" | "educator";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  grade: number | null;
  created_at: string;
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  subject: string;
  grade_band: string;
  description: string;
  position: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  slug: string;
  title: string;
  summary: string;
  position: number;
  reading_minutes: number;
  video_src: string | null;
  video_title: string | null;
  video_duration_s: number | null;
}

export interface LessonBlock {
  id: number;
  lesson_id: number;
  position: number;
  kind: "heading" | "paragraph" | "list" | "callout" | "figure";
  content: string;
  caption: string | null;
}

export interface Question {
  id: number;
  lesson_id: number;
  position: number;
  kind: "mcq" | "multi" | "numeric";
  prompt: string;
  explanation: string;
  numeric_answer: number | null;
  numeric_tolerance: number | null;
  unit: string | null;
}

export interface Option {
  id: number;
  question_id: number;
  position: number;
  body: string;
  is_correct: number;
}

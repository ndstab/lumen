/**
 * Creates data/app.db, applies the schema, and loads the course content.
 *
 * Safe to re-run: it drops and rebuilds content plus demo accounts, but keeps
 * any clickstream you have already generated unless you pass --fresh.
 *
 *   node scripts/seed.mjs           rebuild content, keep events
 *   node scripts/seed.mjs --fresh   delete the database and start over
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { light } from "./content/light.mjs";
import { cell } from "./content/cell.mjs";
import { force } from "./content/force.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const dataDir = path.join(root, "data");
const dbPath = path.join(dataDir, "app.db");
const schemaPath = path.join(root, "src", "lib", "schema.sql");

const fresh = process.argv.includes("--fresh");

if (fresh && fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log("Removed existing database.");
}
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(schemaPath, "utf8"));

/* ------------------------------------------------------------- accounts -- */

const DEMO_PASSWORD = "lumen1234";
const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);

const accounts = [
  ["Aarav Sharma", "aarav@lumen.school", "learner", 9],
  ["Diya Nair", "diya@lumen.school", "learner", 8],
  ["Kabir Rao", "kabir@lumen.school", "learner", 9],
  ["Meera Iyer", "meera@lumen.school", "learner", 8],
  ["Ms Fernandes", "teacher@lumen.school", "educator", null],
];

const upsertUser = db.prepare(
  `INSERT INTO users (name, email, password_hash, role, grade)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(email) DO UPDATE SET
     name = excluded.name, role = excluded.role, grade = excluded.grade`
);
for (const [name, email, role, grade] of accounts) {
  upsertUser.run(name, email, hash, role, grade);
}

/* -------------------------------------------------------------- content -- */

// Content is regenerated wholesale. Cascades clear the dependent rows, and
// events keep their course/lesson ids as historical values.
db.exec(`
  PRAGMA foreign_keys = OFF;
  DELETE FROM options;
  DELETE FROM questions;
  DELETE FROM lesson_blocks;
  DELETE FROM lessons;
  DELETE FROM courses;
  PRAGMA foreign_keys = ON;
`);

const insCourse = db.prepare(
  `INSERT INTO courses (slug, title, subtitle, subject, grade_band, description, position)
   VALUES (@slug, @title, @subtitle, @subject, @gradeBand, @description, @position)`
);
const insLesson = db.prepare(
  `INSERT INTO lessons
     (course_id, slug, title, summary, position, reading_minutes,
      video_src, video_title, video_duration_s)
   VALUES (@courseId, @slug, @title, @summary, @position, @readingMinutes,
           @videoSrc, @videoTitle, @videoDurationS)`
);
const insBlock = db.prepare(
  `INSERT INTO lesson_blocks (lesson_id, position, kind, content, caption)
   VALUES (?, ?, ?, ?, ?)`
);
const insQuestion = db.prepare(
  `INSERT INTO questions
     (lesson_id, position, kind, prompt, explanation,
      numeric_answer, numeric_tolerance, unit)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const insOption = db.prepare(
  `INSERT INTO options (question_id, position, body, is_correct) VALUES (?, ?, ?, ?)`
);

let lessonCount = 0;
let questionCount = 0;

const loadAll = db.transaction((courses) => {
  courses.forEach((course, ci) => {
    const { lastInsertRowid: courseId } = insCourse.run({
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      subject: course.subject,
      gradeBand: course.gradeBand,
      description: course.description,
      position: ci,
    });

    course.lessons.forEach((lesson, li) => {
      const { lastInsertRowid: lessonId } = insLesson.run({
        courseId,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        position: li,
        readingMinutes: lesson.readingMinutes ?? 5,
        videoSrc: `/media/${course.slug}-${li + 1}.mp4`,
        videoTitle: lesson.video.title,
        videoDurationS: lesson.video.durationS,
      });
      lessonCount++;

      lesson.blocks.forEach((b, bi) => {
        const content = b.kind === "list" ? JSON.stringify(b.content) : b.content;
        insBlock.run(lessonId, bi, b.kind, content, b.caption ?? null);
      });

      lesson.questions.forEach((q, qi) => {
        const { lastInsertRowid: questionId } = insQuestion.run(
          lessonId,
          qi,
          q.kind,
          q.prompt,
          q.explanation,
          q.answer ?? null,
          q.tolerance ?? (q.kind === "numeric" ? 0.01 : null),
          q.unit ?? null
        );
        questionCount++;
        (q.options ?? []).forEach(([body, correct], oi) => {
          insOption.run(questionId, oi, body, correct ? 1 : 0);
        });
      });
    });
  });
});

loadAll([light, cell, force]);

/* --------------------------------------------------------------- report -- */

const eventCount = db.prepare(`SELECT COUNT(*) AS n FROM events`).get().n;

console.log(`Database ready at ${path.relative(root, dbPath)}`);
console.log(`  courses    ${3}`);
console.log(`  lessons    ${lessonCount}`);
console.log(`  questions  ${questionCount}`);
console.log(`  accounts   ${accounts.length} (password for all: ${DEMO_PASSWORD})`);
console.log(`  events     ${eventCount} retained`);
db.close();

import "server-only";
import {
  getDb,
  type Course,
  type Lesson,
  type LessonBlock,
  type Question,
  type Option,
} from "./db";

export interface CourseWithCounts extends Course {
  lesson_count: number;
}

export interface CourseProgress {
  course_id: number;
  lessons_total: number;
  lessons_started: number;
  lessons_completed: number;
}

export interface LessonProgress {
  lesson_id: number;
  video_watched_pct: number;
  quiz_best_score: number | null;
  completed_at: string | null;
  last_viewed_at: string | null;
}

export interface QuestionWithOptions extends Question {
  options: Option[];
}

/* --------------------------------------------------------------- courses -- */

export function listCourses(): CourseWithCounts[] {
  return getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count
         FROM courses c
        ORDER BY c.position`
    )
    .all() as CourseWithCounts[];
}

export function getCourseBySlug(slug: string): Course | null {
  return (
    (getDb().prepare(`SELECT * FROM courses WHERE slug = ?`).get(slug) as Course | undefined) ??
    null
  );
}

export function listLessons(courseId: number): Lesson[] {
  return getDb()
    .prepare(`SELECT * FROM lessons WHERE course_id = ? ORDER BY position`)
    .all(courseId) as Lesson[];
}

export function getLesson(courseId: number, slug: string): Lesson | null {
  return (
    (getDb()
      .prepare(`SELECT * FROM lessons WHERE course_id = ? AND slug = ?`)
      .get(courseId, slug) as Lesson | undefined) ?? null
  );
}

/** Previous and next lesson in the same course, for the footer navigation. */
export function lessonNeighbours(
  courseId: number,
  position: number
): { prev: Lesson | null; next: Lesson | null } {
  const db = getDb();
  return {
    prev:
      (db
        .prepare(
          `SELECT * FROM lessons WHERE course_id = ? AND position < ?
            ORDER BY position DESC LIMIT 1`
        )
        .get(courseId, position) as Lesson | undefined) ?? null,
    next:
      (db
        .prepare(
          `SELECT * FROM lessons WHERE course_id = ? AND position > ?
            ORDER BY position ASC LIMIT 1`
        )
        .get(courseId, position) as Lesson | undefined) ?? null,
  };
}

/* ---------------------------------------------------------------- lesson -- */

export function getBlocks(lessonId: number): LessonBlock[] {
  return getDb()
    .prepare(`SELECT * FROM lesson_blocks WHERE lesson_id = ? ORDER BY position`)
    .all(lessonId) as LessonBlock[];
}

export function getQuestions(lessonId: number): QuestionWithOptions[] {
  const db = getDb();
  const questions = db
    .prepare(`SELECT * FROM questions WHERE lesson_id = ? ORDER BY position`)
    .all(lessonId) as Question[];

  const stmt = db.prepare(`SELECT * FROM options WHERE question_id = ? ORDER BY position`);
  return questions.map((q) => ({ ...q, options: stmt.all(q.id) as Option[] }));
}

/* -------------------------------------------------------------- progress -- */

export function courseProgress(userId: number): Map<number, CourseProgress> {
  const rows = getDb()
    .prepare(
      `SELECT c.id AS course_id,
              COUNT(l.id) AS lessons_total,
              SUM(CASE WHEN p.lesson_id IS NOT NULL THEN 1 ELSE 0 END) AS lessons_started,
              SUM(CASE WHEN p.completed_at IS NOT NULL THEN 1 ELSE 0 END) AS lessons_completed
         FROM courses c
         JOIN lessons l ON l.course_id = c.id
         LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
        GROUP BY c.id`
    )
    .all(userId) as CourseProgress[];

  return new Map(rows.map((r) => [r.course_id, r]));
}

export function lessonProgress(userId: number, courseId: number): Map<number, LessonProgress> {
  const rows = getDb()
    .prepare(
      `SELECT p.lesson_id, p.video_watched_pct, p.quiz_best_score,
              p.completed_at, p.last_viewed_at
         FROM lesson_progress p
         JOIN lessons l ON l.id = p.lesson_id
        WHERE p.user_id = ? AND l.course_id = ?`
    )
    .all(userId, courseId) as LessonProgress[];

  return new Map(rows.map((r) => [r.lesson_id, r]));
}

export function getLessonProgress(userId: number, lessonId: number): LessonProgress | null {
  return (
    (getDb()
      .prepare(
        `SELECT lesson_id, video_watched_pct, quiz_best_score, completed_at, last_viewed_at
           FROM lesson_progress WHERE user_id = ? AND lesson_id = ?`
      )
      .get(userId, lessonId) as LessonProgress | undefined) ?? null
  );
}

/** Called when a lesson page is opened. Creates the row on first visit. */
export function touchLesson(userId: number, lessonId: number): void {
  getDb()
    .prepare(
      `INSERT INTO lesson_progress (user_id, lesson_id)
       VALUES (?, ?)
       ON CONFLICT(user_id, lesson_id)
       DO UPDATE SET last_viewed_at = datetime('now')`
    )
    .run(userId, lessonId);
}

/**
 * A lesson counts as complete once the learner has watched most of the video
 * and passed the quiz. Both thresholds are deliberately reachable.
 */
export const VIDEO_COMPLETE_PCT = 80;
export const QUIZ_PASS_FRACTION = 0.6;

export function recomputeCompletion(userId: number, lessonId: number): void {
  getDb()
    .prepare(
      `UPDATE lesson_progress
          SET completed_at = CASE
                WHEN completed_at IS NOT NULL THEN completed_at
                WHEN video_watched_pct >= ? AND quiz_best_score >= ?
                  THEN datetime('now')
                ELSE NULL
              END
        WHERE user_id = ? AND lesson_id = ?`
    )
    .run(VIDEO_COMPLETE_PCT, QUIZ_PASS_FRACTION * 100, userId, lessonId);
}

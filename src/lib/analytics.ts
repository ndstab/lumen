import "server-only";
import { getDb } from "./db";
import type { EventRow } from "./moodle";

/**
 * Queries behind the educator views.
 *
 * Everything here reads from the `events` table written by the clickstream, or
 * from the quiz tables. Nothing is precomputed, so the numbers always reflect
 * what has actually happened.
 */

export interface EventFilters {
  userId?: number | null;
  courseId?: number | null;
  eventName?: string | null;
  component?: string | null;
  from?: string | null;
  to?: string | null;
  search?: string | null;
}

interface Clause {
  sql: string;
  params: unknown[];
}

function buildWhere(f: EventFilters): Clause {
  const parts: string[] = [];
  const params: unknown[] = [];

  if (f.userId) {
    parts.push("e.user_id = ?");
    params.push(f.userId);
  }
  if (f.courseId) {
    parts.push("e.course_id = ?");
    params.push(f.courseId);
  }
  if (f.eventName) {
    parts.push("e.event_name = ?");
    params.push(f.eventName);
  }
  if (f.component) {
    parts.push("e.component = ?");
    params.push(f.component);
  }
  if (f.from) {
    parts.push("e.occurred_at >= ?");
    params.push(f.from);
  }
  if (f.to) {
    parts.push("e.occurred_at <= ?");
    params.push(f.to);
  }
  if (f.search) {
    parts.push("(e.description LIKE ? OR e.context LIKE ?)");
    params.push(`%${f.search}%`, `%${f.search}%`);
  }

  return { sql: parts.length ? `WHERE ${parts.join(" AND ")}` : "", params };
}

export interface StreamRow extends EventRow {
  user_name: string | null;
  role: string | null;
  path: string | null;
  meta: string | null;
}

export function listEvents(
  f: EventFilters,
  limit = 100,
  offset = 0
): { rows: StreamRow[]; total: number } {
  const db = getDb();
  const where = buildWhere(f);

  const rows = db
    .prepare(
      `SELECT e.id, e.occurred_at, e.context, e.component, e.event_name,
              e.description, e.origin, e.ip, e.path, e.meta, e.role,
              u.name AS user_name
         FROM events e
         LEFT JOIN users u ON u.id = e.user_id
         ${where.sql}
        ORDER BY e.occurred_at DESC, e.id DESC
        LIMIT ? OFFSET ?`
    )
    .all(...where.params, limit, offset) as StreamRow[];

  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM events e ${where.sql}`)
    .get(...where.params) as { total: number };

  return { rows, total };
}

/** Every event row matching the filters, for CSV export. */
export function allEvents(f: EventFilters, cap = 50000): EventRow[] {
  const where = buildWhere(f);
  return getDb()
    .prepare(
      `SELECT e.id, e.occurred_at, e.context, e.component, e.event_name,
              e.description, e.origin, e.ip
         FROM events e
         ${where.sql}
        ORDER BY e.occurred_at DESC, e.id DESC
        LIMIT ?`
    )
    .all(...where.params, cap) as EventRow[];
}

/* --------------------------------------------------------- filter options -- */

export function distinctEventNames(): { event_name: string; n: number }[] {
  return getDb()
    .prepare(
      `SELECT event_name, COUNT(*) AS n FROM events
        GROUP BY event_name ORDER BY n DESC`
    )
    .all() as { event_name: string; n: number }[];
}

export function distinctComponents(): { component: string; n: number }[] {
  return getDb()
    .prepare(
      `SELECT component, COUNT(*) AS n FROM events GROUP BY component ORDER BY n DESC`
    )
    .all() as { component: string; n: number }[];
}

export function learners(): { id: number; name: string; role: string }[] {
  return getDb()
    .prepare(`SELECT id, name, role FROM users ORDER BY role DESC, name`)
    .all() as { id: number; name: string; role: string }[];
}

/* ------------------------------------------------------------- headlines -- */

export interface Headline {
  events: number;
  learnersActive: number;
  lessonsOpened: number;
  quizAttempts: number;
  videoMinutes: number;
}

export function headlines(): Headline {
  const db = getDb();
  const one = <T>(sql: string): T => db.prepare(sql).get() as T;

  const { n: events } = one<{ n: number }>(`SELECT COUNT(*) AS n FROM events`);
  const { n: learnersActive } = one<{ n: number }>(
    `SELECT COUNT(DISTINCT user_id) AS n FROM events WHERE user_id IS NOT NULL`
  );
  const { n: lessonsOpened } = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM events WHERE event_name = 'Lesson viewed'`
  );
  const { n: quizAttempts } = one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM quiz_attempts WHERE submitted_at IS NOT NULL`
  );
  // Watch time is the furthest each learner got in each video, taken from the
  // milestone and ended events. Summing every event would count a rewatched
  // section many times, and counting only completions would ignore everyone who
  // stopped partway, which is most people.
  const { s } = one<{ s: number | null }>(
    `SELECT SUM(best) AS s FROM (
       SELECT MAX(CAST(json_extract(meta, '$.watchedSeconds') AS REAL)) AS best
         FROM events
        WHERE event_name IN ('Video milestone reached', 'Video ended', 'Video watch heartbeat')
          AND user_id IS NOT NULL AND lesson_id IS NOT NULL
        GROUP BY user_id, lesson_id
     )`
  );

  return {
    events,
    learnersActive,
    lessonsOpened,
    quizAttempts,
    videoMinutes: Math.round((s ?? 0) / 60),
  };
}

/* ------------------------------------------------------ chart 1: drop-off -- */

export interface DropOffPoint {
  milestone: number;
  reached: number;
  percent: number;
}

/**
 * How many learner-and-lesson pairs that started a video went on to reach each
 * quarter of it. The denominator is the number that pressed play at all, so the
 * curve always begins at 100 percent.
 */
export function videoDropOff(): { started: number; points: DropOffPoint[] } {
  const db = getDb();

  const { started } = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id || ':' || lesson_id) AS started
         FROM events
        WHERE event_name = 'Video started' AND user_id IS NOT NULL AND lesson_id IS NOT NULL`
    )
    .get() as { started: number };

  const rows = db
    .prepare(
      `SELECT CAST(json_extract(meta, '$.milestone') AS INTEGER) AS milestone,
              COUNT(DISTINCT user_id || ':' || lesson_id) AS reached
         FROM events
        WHERE event_name = 'Video milestone reached' AND user_id IS NOT NULL
        GROUP BY milestone`
    )
    .all() as { milestone: number; reached: number }[];

  const byMilestone = new Map(rows.map((r) => [r.milestone, r.reached]));
  const points: DropOffPoint[] = [0, 25, 50, 75, 100].map((m) => {
    const reached = m === 0 ? started : (byMilestone.get(m) ?? 0);
    return {
      milestone: m,
      reached,
      percent: started > 0 ? Math.round((reached / started) * 100) : 0,
    };
  });

  return { started, points };
}

/* ---------------------------------------------------- chart 2: difficulty -- */

export interface ItemDifficulty {
  question_id: number;
  position: number;
  prompt: string;
  lesson_title: string;
  course_title: string;
  kind: string;
  answers: number;
  correct: number;
  percent: number;
}

/** Percentage correct per question, hardest first. */
export function itemDifficulty(limit = 12): ItemDifficulty[] {
  return getDb()
    .prepare(
      `SELECT q.id AS question_id, q.position, q.prompt, q.kind,
              l.title AS lesson_title, c.title AS course_title,
              COUNT(r.id) AS answers,
              SUM(r.is_correct) AS correct,
              CAST(ROUND(100.0 * SUM(r.is_correct) / COUNT(r.id)) AS INTEGER) AS percent
         FROM quiz_responses r
         JOIN questions q ON q.id = r.question_id
         JOIN lessons l ON l.id = q.lesson_id
         JOIN courses c ON c.id = l.course_id
        GROUP BY q.id
       HAVING COUNT(r.id) > 0
        ORDER BY percent ASC, answers DESC
        LIMIT ?`
    )
    .all(limit) as ItemDifficulty[];
}

/* ------------------------------------------------------ chart 3: activity -- */

export interface ActivityBucket {
  bucket: string;
  n: number;
}

/** Events per hour across the last 24 hours of recorded activity. */
export function activityByHour(hours = 24): ActivityBucket[] {
  const rows = getDb()
    .prepare(
      `SELECT strftime('%Y-%m-%dT%H', occurred_at) AS bucket, COUNT(*) AS n
         FROM events
        GROUP BY bucket
        ORDER BY bucket DESC
        LIMIT ?`
    )
    .all(hours) as ActivityBucket[];

  return rows.reverse();
}

/** Distribution of events by component, for the stream sidebar. */
export function componentMix(): { component: string; n: number }[] {
  return getDb()
    .prepare(
      `SELECT component, COUNT(*) AS n FROM events
        GROUP BY component ORDER BY n DESC LIMIT 8`
    )
    .all() as { component: string; n: number }[];
}

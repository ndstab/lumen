import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getActor } from "@/lib/session";
import { recordEvent } from "@/lib/events";
import { recomputeCompletion } from "@/lib/content";

/** Finalises an attempt, scores it, and updates the learner's best score. */
export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { attemptId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const attemptId = Number(body.attemptId);
  if (!Number.isInteger(attemptId)) {
    return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
  }

  const db = getDb();
  const attempt = db
    .prepare(
      `SELECT id, lesson_id, attempt_no, max_score, submitted_at
         FROM quiz_attempts WHERE id = ? AND user_id = ?`
    )
    .get(attemptId, actor.user.id) as
    | {
        id: number;
        lesson_id: number;
        attempt_no: number;
        max_score: number;
        submitted_at: string | null;
      }
    | undefined;
  if (!attempt) return NextResponse.json({ error: "No such attempt" }, { status: 404 });

  const { score } = db
    .prepare(
      `SELECT COALESCE(SUM(is_correct), 0) AS score FROM quiz_responses WHERE attempt_id = ?`
    )
    .get(attemptId) as { score: number };

  const max = attempt.max_score || 1;
  const percent = Math.round((score / max) * 100);

  if (!attempt.submitted_at) {
    db.prepare(
      `UPDATE quiz_attempts SET submitted_at = datetime('now'), score = ? WHERE id = ?`
    ).run(score, attemptId);
  }

  db.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, quiz_best_score)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET
       quiz_best_score = MAX(COALESCE(lesson_progress.quiz_best_score, 0), excluded.quiz_best_score),
       last_viewed_at = datetime('now')`
  ).run(actor.user.id, attempt.lesson_id, percent);

  recomputeCompletion(actor.user.id, attempt.lesson_id);

  const lesson = db
    .prepare(`SELECT title, course_id FROM lessons WHERE id = ?`)
    .get(attempt.lesson_id) as { title: string; course_id: number };

  await recordEvent({
    component: "Quiz",
    eventName: "Quiz attempt submitted",
    action: "submitted a quiz attempt in",
    target: "lesson",
    context: `Quiz: ${lesson.title}`,
    courseId: lesson.course_id,
    lessonId: attempt.lesson_id,
    description: `The user with id '${actor.user.id}' submitted attempt ${attempt.attempt_no} of the quiz in the lesson with id '${attempt.lesson_id}' and scored ${score} out of ${max}.`,
    meta: { attemptId, attemptNo: attempt.attempt_no, score, max, percent },
  });

  return NextResponse.json({ score, max, percent });
}

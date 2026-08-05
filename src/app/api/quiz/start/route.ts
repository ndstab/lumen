import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getActor } from "@/lib/session";
import { recordEvent } from "@/lib/events";

/** Opens a new quiz attempt. Retakes are unlimited, so this can be called again. */
export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { lessonId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const lessonId = Number(body.lessonId);
  if (!Number.isInteger(lessonId)) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  const db = getDb();
  const lesson = db
    .prepare(`SELECT id, title, course_id FROM lessons WHERE id = ?`)
    .get(lessonId) as { id: number; title: string; course_id: number } | undefined;
  if (!lesson) return NextResponse.json({ error: "No such lesson" }, { status: 404 });

  const { n } = db
    .prepare(`SELECT COUNT(*) AS n FROM quiz_attempts WHERE user_id = ? AND lesson_id = ?`)
    .get(actor.user.id, lessonId) as { n: number };

  const attemptNo = n + 1;
  const max = (
    db.prepare(`SELECT COUNT(*) AS n FROM questions WHERE lesson_id = ?`).get(lessonId) as {
      n: number;
    }
  ).n;

  const info = db
    .prepare(
      `INSERT INTO quiz_attempts (user_id, lesson_id, attempt_no, max_score)
       VALUES (?, ?, ?, ?)`
    )
    .run(actor.user.id, lessonId, attemptNo, max);

  const attemptId = Number(info.lastInsertRowid);

  await recordEvent({
    component: "Quiz",
    eventName: "Quiz attempt started",
    action: "started a quiz attempt in",
    target: "lesson",
    context: `Quiz: ${lesson.title}`,
    courseId: lesson.course_id,
    lessonId,
    description: `The user with id '${actor.user.id}' started attempt ${attemptNo} of the quiz in the lesson with id '${lessonId}'.`,
    meta: { attemptId, attemptNo, questionCount: max },
  });

  return NextResponse.json({ attemptId, attemptNo, questionCount: max });
}

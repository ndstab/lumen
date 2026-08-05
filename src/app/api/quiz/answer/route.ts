import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getActor } from "@/lib/session";
import { recordEvent } from "@/lib/events";

/**
 * Grades one answer and records it against the attempt.
 *
 * Grading is server side and correctness is never sent to the browser ahead of
 * time, so the answers cannot be read out of the page source.
 */

interface QuestionRow {
  id: number;
  lesson_id: number;
  kind: "mcq" | "multi" | "numeric";
  prompt: string;
  explanation: string;
  numeric_answer: number | null;
  numeric_tolerance: number | null;
  position: number;
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { attemptId?: unknown; questionId?: unknown; response?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const attemptId = Number(body.attemptId);
  const questionId = Number(body.questionId);
  const response = String(body.response ?? "").slice(0, 200);

  if (!Number.isInteger(attemptId) || !Number.isInteger(questionId)) {
    return NextResponse.json({ error: "attemptId and questionId are required" }, { status: 400 });
  }

  const db = getDb();

  // The attempt must belong to the signed in learner.
  const attempt = db
    .prepare(`SELECT id, lesson_id, attempt_no FROM quiz_attempts WHERE id = ? AND user_id = ?`)
    .get(attemptId, actor.user.id) as
    | { id: number; lesson_id: number; attempt_no: number }
    | undefined;
  if (!attempt) return NextResponse.json({ error: "No such attempt" }, { status: 404 });

  const question = db
    .prepare(`SELECT * FROM questions WHERE id = ? AND lesson_id = ?`)
    .get(questionId, attempt.lesson_id) as QuestionRow | undefined;
  if (!question) return NextResponse.json({ error: "No such question" }, { status: 404 });

  const correctIds = (
    db
      .prepare(`SELECT id FROM options WHERE question_id = ? AND is_correct = 1 ORDER BY id`)
      .all(questionId) as { id: number }[]
  ).map((r) => r.id);

  let correct = false;

  if (question.kind === "numeric") {
    const given = Number(response);
    const target = question.numeric_answer ?? 0;
    const tol = question.numeric_tolerance ?? 0.01;
    correct = Number.isFinite(given) && Math.abs(given - target) <= tol;
  } else {
    const given = response
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Number.isInteger)
      .sort((a, b) => a - b);
    correct =
      given.length === correctIds.length && given.every((id, i) => id === correctIds[i]);
  }

  // One stored response per question per attempt: re-answering replaces it.
  db.prepare(`DELETE FROM quiz_responses WHERE attempt_id = ? AND question_id = ?`).run(
    attemptId,
    questionId
  );
  db.prepare(
    `INSERT INTO quiz_responses (attempt_id, question_id, response, is_correct)
     VALUES (?, ?, ?, ?)`
  ).run(attemptId, questionId, response, correct ? 1 : 0);

  const lesson = db
    .prepare(`SELECT title, course_id FROM lessons WHERE id = ?`)
    .get(attempt.lesson_id) as { title: string; course_id: number };

  await recordEvent({
    component: "Quiz",
    eventName: "Quiz question answered",
    action: "answered a question in",
    target: "lesson",
    context: `Quiz: ${lesson.title}`,
    courseId: lesson.course_id,
    lessonId: attempt.lesson_id,
    description: `The user with id '${actor.user.id}' answered question ${
      question.position + 1
    } in the lesson with id '${attempt.lesson_id}' ${correct ? "correctly" : "incorrectly"}.`,
    meta: {
      attemptId,
      attemptNo: attempt.attempt_no,
      questionId,
      questionNumber: question.position + 1,
      kind: question.kind,
      response,
      correct,
    },
  });

  return NextResponse.json({
    correct,
    explanation: question.explanation,
    correctOptionIds: question.kind === "numeric" ? [] : correctIds,
    correctValue: question.kind === "numeric" ? question.numeric_answer : null,
  });
}

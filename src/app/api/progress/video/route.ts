import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getActor } from "@/lib/session";
import { recomputeCompletion } from "@/lib/content";

/**
 * Records how far through a lesson video the learner has reached.
 * The value only ever moves forward, so rewatching cannot reduce it.
 */
export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { lessonId?: unknown; percent?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const lessonId = Number(body.lessonId);
  const percent = Number(body.percent);
  if (!Number.isInteger(lessonId) || !Number.isFinite(percent)) {
    return NextResponse.json({ error: "lessonId and percent are required" }, { status: 400 });
  }

  const clamped = Math.min(100, Math.max(0, percent));

  getDb()
    .prepare(
      `INSERT INTO lesson_progress (user_id, lesson_id, video_watched_pct)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         video_watched_pct = MAX(lesson_progress.video_watched_pct, excluded.video_watched_pct),
         last_viewed_at = datetime('now')`
    )
    .run(actor.user.id, lessonId, clamped);

  recomputeCompletion(actor.user.id, lessonId);

  return NextResponse.json({ ok: true, percent: clamped });
}

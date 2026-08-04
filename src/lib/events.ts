import "server-only";
import { getDb } from "./db";
import { getActor, clientIp, userAgent } from "./session";

/**
 * The clickstream writer.
 *
 * Every observed action becomes one row in `events`. Rows are shaped so the
 * seven columns of a Moodle log report can be projected straight out of them
 * (see lib/moodle.ts), which is the reference format for this project.
 *
 * Identity is always resolved on the server. The browser never tells us who it
 * is, only what happened, so a tampered payload cannot forge another learner's
 * activity.
 */

export interface EventInput {
  component: string;
  eventName: string;
  action: string;
  target?: string | null;
  context?: string | null;
  description?: string | null;
  courseId?: number | null;
  lessonId?: number | null;
  path?: string | null;
  clientTs?: string | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Events the browser is allowed to report. Server-side events bypass this list.
 * Keeping it closed stops a curious student from filling the log with noise,
 * and keeps the event vocabulary small enough to analyse.
 */
export const CLIENT_EVENTS: ReadonlySet<string> = new Set([
  "Element clicked",
  "Link followed",
  "Page viewed",
  "Page hidden",
  "Page shown",
  "Page scrolled",
  "Lesson section read",
  "Video started",
  "Video paused",
  "Video resumed",
  "Video seeked",
  "Video playback rate changed",
  "Video volume changed",
  "Video entered fullscreen",
  "Video exited fullscreen",
  "Video buffering started",
  "Video buffering ended",
  "Video milestone reached",
  "Video watch heartbeat",
  "Video ended",
  "Quiz option selected",
  "Quiz answer cleared",
]);

const MAX_META_BYTES = 4000;

function safeMeta(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta) return null;
  try {
    const s = JSON.stringify(meta);
    return s.length > MAX_META_BYTES ? s.slice(0, MAX_META_BYTES) : s;
  } catch {
    return null;
  }
}

/**
 * Moodle writes descriptions as a sentence naming the actor and the object.
 * We follow the same shape so exported rows read like the reference report.
 */
function describe(input: EventInput, userId: number | null): string {
  if (input.description) return input.description;

  const who = userId === null ? "An anonymous visitor" : `The user with id '${userId}'`;
  const bits: string[] = [`${who} ${input.action}`];

  if (input.target) bits.push(`the ${input.target}`);
  if (input.lessonId != null) bits.push(`with id '${input.lessonId}'`);
  if (input.courseId != null) bits.push(`in the course with id '${input.courseId}'`);

  return `${bits.join(" ")}.`;
}

interface Enrichment {
  userId: number | null;
  role: string | null;
  sessionId: string | null;
  ip: string;
  ua: string;
}

function insert(input: EventInput, e: Enrichment): void {
  getDb()
    .prepare(
      `INSERT INTO events (
         occurred_at, client_ts, user_id, session_id, role,
         component, event_name, action, target, context, description,
         origin, ip, user_agent, path, course_id, lesson_id, meta
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      new Date().toISOString(),
      input.clientTs ?? null,
      e.userId,
      e.sessionId,
      e.role,
      input.component,
      input.eventName,
      input.action,
      input.target ?? null,
      input.context ?? "System",
      describe(input, e.userId),
      "web",
      e.ip,
      e.ua,
      input.path ?? null,
      input.courseId ?? null,
      input.lessonId ?? null,
      safeMeta(input.meta)
    );
}

async function enrich(): Promise<Enrichment> {
  const actor = await getActor();
  return {
    userId: actor?.user.id ?? null,
    role: actor?.user.role ?? null,
    sessionId: actor?.sessionId ?? null,
    ip: await clientIp(),
    ua: await userAgent(),
  };
}

/** Record a single server-side event. Never throws into the caller's path. */
export async function recordEvent(input: EventInput): Promise<void> {
  try {
    insert(input, await enrich());
  } catch (err) {
    console.error("[events] failed to record", input.eventName, err);
  }
}

/**
 * Record an event for a user we already know about, used during login and
 * signup where the cookie is not readable yet on the same request.
 */
export async function recordEventAs(
  input: EventInput,
  userId: number | null,
  role: string | null,
  sessionId: string | null
): Promise<void> {
  try {
    insert(input, {
      userId,
      role,
      sessionId,
      ip: await clientIp(),
      ua: await userAgent(),
    });
  } catch (err) {
    console.error("[events] failed to record", input.eventName, err);
  }
}

/** Record a batch reported by the browser. Unknown event names are dropped. */
export async function recordClientBatch(inputs: EventInput[]): Promise<number> {
  const e = await enrich();
  const db = getDb();
  let written = 0;

  const tx = db.transaction((rows: EventInput[]) => {
    for (const row of rows) {
      if (!CLIENT_EVENTS.has(row.eventName)) continue;
      insert(row, e);
      written++;
    }
  });

  try {
    tx(inputs.slice(0, 200));
  } catch (err) {
    console.error("[events] batch failed", err);
  }
  return written;
}

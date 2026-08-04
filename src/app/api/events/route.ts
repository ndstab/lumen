import { NextResponse } from "next/server";
import { recordClientBatch, type EventInput } from "@/lib/events";

/**
 * Ingest point for browser reported events.
 *
 * The body is treated as untrusted. Identity, IP, user agent and timestamp are
 * all attached server side; the client only supplies what happened. Unknown
 * event names are dropped by recordClientBatch.
 */

interface IncomingEvent {
  component?: unknown;
  eventName?: unknown;
  action?: unknown;
  target?: unknown;
  context?: unknown;
  path?: unknown;
  clientTs?: unknown;
  courseId?: unknown;
  lessonId?: unknown;
  meta?: unknown;
}

function str(value: unknown, max = 300): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}

function int(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function clean(raw: IncomingEvent): EventInput | null {
  const component = str(raw.component, 60);
  const eventName = str(raw.eventName, 80);
  const action = str(raw.action, 60);
  if (!component || !eventName || !action) return null;

  return {
    component,
    eventName,
    action,
    target: str(raw.target, 120),
    context: str(raw.context, 200),
    path: str(raw.path, 300),
    clientTs: str(raw.clientTs, 40),
    courseId: int(raw.courseId),
    lessonId: int(raw.lessonId),
    meta:
      raw.meta && typeof raw.meta === "object" && !Array.isArray(raw.meta)
        ? (raw.meta as Record<string, unknown>)
        : null,
  };
}

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const list = (parsed as { events?: unknown })?.events;
  if (!Array.isArray(list)) {
    return NextResponse.json({ error: "Expected an events array" }, { status: 400 });
  }

  const inputs = list
    .slice(0, 200)
    .map((raw) => clean(raw as IncomingEvent))
    .filter((e): e is EventInput => e !== null);

  const written = await recordClientBatch(inputs);

  return NextResponse.json({ received: list.length, written });
}

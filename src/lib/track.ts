/**
 * Browser side of the clickstream.
 *
 * Events are queued, batched and posted to /api/events. The server attaches
 * identity, IP and user agent, so nothing here is trusted beyond "what
 * happened". On page hide the queue is flushed with sendBeacon, which survives
 * navigation where fetch would be cancelled.
 */

export interface TrackPayload {
  component: string;
  eventName: string;
  action: string;
  target?: string | null;
  context?: string | null;
  meta?: Record<string, unknown> | null;
}

interface QueuedEvent extends TrackPayload {
  path: string;
  clientTs: string;
  courseId: number | null;
  lessonId: number | null;
}

interface PageContext {
  courseId: number | null;
  lessonId: number | null;
  label: string;
}

const ENDPOINT = "/api/events";
const FLUSH_AFTER_MS = 4000;
const FLUSH_AT_SIZE = 12;
const MAX_QUEUE = 200;

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

let context: PageContext = { courseId: null, lessonId: null, label: "Site" };

/** Lesson and course pages call this so every event carries its context. */
export function setPageContext(next: Partial<PageContext>): void {
  context = { ...context, ...next };
}

export function getPageContext(): PageContext {
  return context;
}

export function resetPageContext(): void {
  context = { courseId: null, lessonId: null, label: "Site" };
}

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, FLUSH_AFTER_MS);
}

export function track(payload: TrackPayload): void {
  if (typeof window === "undefined") return;

  queue.push({
    ...payload,
    context: payload.context ?? context.label,
    courseId: context.courseId,
    lessonId: context.lessonId,
    path: window.location.pathname,
    clientTs: new Date().toISOString(),
  });

  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  if (queue.length >= FLUSH_AT_SIZE) void flush();
  else scheduleFlush();
}

export async function flush(): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Put them back so the next flush can try again. Failing to log must never
    // break the lesson the student is in the middle of.
    queue = batch.concat(queue).slice(-MAX_QUEUE);
  }
}

/** Fire and forget flush for pagehide, where a promise will not be awaited. */
export function flushBeacon(): void {
  if (queue.length === 0) return;
  const body = JSON.stringify({ events: queue });
  queue = [];
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

/* ------------------------------------------------- describing an element -- */

const INTERACTIVE = "a,button,input,select,textarea,summary,[role=button],[data-track]";

function trim(s: string, n = 60): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? `${clean.slice(0, n)}...` : clean;
}

/**
 * Turns a clicked node into a stable, human readable identifier. Prefers an
 * explicit data-track name, then falls back to structure plus visible text so
 * that untagged elements are still identifiable in the log.
 */
export function describeElement(node: EventTarget | null): {
  target: string;
  label: string;
  href: string | null;
} {
  if (!(node instanceof Element)) {
    return { target: "document", label: "page background", href: null };
  }

  const el = node.closest(INTERACTIVE) ?? node;
  const named = el.getAttribute("data-track");
  const tag = el.tagName.toLowerCase();
  const text = trim(("innerText" in el ? (el as HTMLElement).innerText : el.textContent) ?? "");
  const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;

  const parts: string[] = [tag];
  if (named) parts.push(`#${named}`);
  else if (el.id) parts.push(`#${el.id}`);

  const target = parts.join("");
  const label = named ?? text ?? tag;

  return { target, label: label || tag, href };
}

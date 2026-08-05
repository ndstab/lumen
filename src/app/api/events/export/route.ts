import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { allEvents, type EventFilters } from "@/lib/analytics";
import { recordEvent } from "@/lib/events";
import { toCsv } from "@/lib/moodle";

/**
 * Exports the clickstream as CSV in the seven column Moodle log format.
 * Educator only. The export itself is recorded as an event.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "educator") {
    return NextResponse.json({ error: "Educators only" }, { status: 403 });
  }

  const q = new URL(request.url).searchParams;
  const num = (key: string) => {
    const v = Number(q.get(key));
    return Number.isInteger(v) && v > 0 ? v : null;
  };

  const filters: EventFilters = {
    userId: num("userId"),
    courseId: num("courseId"),
    eventName: q.get("eventName"),
    component: q.get("component"),
    from: q.get("from"),
    to: q.get("to"),
    search: q.get("search"),
  };

  const rows = allEvents(filters);

  await recordEvent({
    component: "Report",
    eventName: "Clickstream exported",
    action: "exported the clickstream log",
    target: null,
    context: "Report: event stream",
    description: `The user with id '${user.id}' exported ${rows.length} clickstream rows as CSV.`,
    meta: { rows: rows.length, filters },
  });

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lumen-clickstream-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listCourses } from "@/lib/content";
import {
  listEvents,
  distinctEventNames,
  distinctComponents,
  learners,
  headlines,
  componentMix,
  type EventFilters,
} from "@/lib/analytics";
import { recordEventThrottled } from "@/lib/events";
import { moodleTime, MOODLE_COLUMNS } from "@/lib/moodle";
import LiveRefresh from "@/components/LiveRefresh";

export const metadata = { title: "Event stream" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

type Search = Record<string, string | undefined>;

function buildQuery(search: Search, overrides: Search = {}): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...search, ...overrides })) {
    if (v) params.set(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function EducatorPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "educator") redirect("/courses");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const filters: EventFilters = {
    userId: Number(sp.userId) || null,
    courseId: Number(sp.courseId) || null,
    eventName: sp.eventName || null,
    component: sp.component || null,
    from: sp.from ? `${sp.from}T00:00:00.000Z` : null,
    to: sp.to ? `${sp.to}T23:59:59.999Z` : null,
    search: sp.search || null,
  };

  const { rows, total } = listEvents(filters, PAGE_SIZE, (page - 1) * PAGE_SIZE);
  const stats = headlines();
  const mix = componentMix();
  const courses = listCourses();
  const people = learners();
  const names = distinctEventNames();
  const components = distinctComponents();

  // This page refreshes itself so it can be watched live. Throttling stops each
  // tick from logging a page view and filling the log with the report watching
  // itself. A real navigation or reload outside the window still records.
  await recordEventThrottled(
    {
      component: "Report",
      eventName: "Event stream viewed",
      action: "viewed the event stream report",
      target: null,
      context: "Report: event stream",
      description: `The user with id '${user.id}' viewed the event stream report.`,
      meta: { page, matched: total },
    },
    120
  );

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered =
    Object.entries(sp).filter(([k, v]) => v && k !== "page").length > 0;

  return (
    <div className="shell">
      <LiveRefresh />

      <div className="row-between" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)" }}>Event stream</h1>
          <p className="lede" style={{ marginTop: "var(--space-3)" }}>
            Every recorded action, newest first. This page refreshes itself, so you can leave
            it open beside the learner app.
          </p>
        </div>
        <div className="row">
          <Link className="btn" href="/educator/analytics" data-track="to-analytics">
            Analytics
          </Link>
          <a
            className="btn btn-accent"
            href={`/api/events/export${buildQuery(sp, { page: undefined })}`}
            data-track="export-csv"
          >
            Export CSV
          </a>
        </div>
      </div>

      <dl className="headline-grid">
        <div><dt>Events recorded</dt><dd>{stats.events.toLocaleString()}</dd></div>
        <div><dt>Learners seen</dt><dd>{stats.learnersActive}</dd></div>
        <div><dt>Lessons opened</dt><dd>{stats.lessonsOpened}</dd></div>
        <div><dt>Quizzes submitted</dt><dd>{stats.quizAttempts}</dd></div>
        <div><dt>Video watched</dt><dd>{stats.videoMinutes} min</dd></div>
      </dl>

      <form className="filters panel" method="get">
        <div className="field">
          <label htmlFor="userId">Learner</label>
          <select className="input" id="userId" name="userId" defaultValue={sp.userId ?? ""}>
            <option value="">Everyone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.role === "educator" ? " (educator)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="courseId">Course</label>
          <select className="input" id="courseId" name="courseId" defaultValue={sp.courseId ?? ""}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="component">Component</label>
          <select className="input" id="component" name="component" defaultValue={sp.component ?? ""}>
            <option value="">All components</option>
            {components.map((c) => (
              <option key={c.component} value={c.component}>
                {c.component} ({c.n})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="eventName">Event name</label>
          <select className="input" id="eventName" name="eventName" defaultValue={sp.eventName ?? ""}>
            <option value="">All events</option>
            {names.map((n) => (
              <option key={n.event_name} value={n.event_name}>
                {n.event_name} ({n.n})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="from">From</label>
          <input className="input" id="from" name="from" type="date" defaultValue={sp.from ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="to">To</label>
          <input className="input" id="to" name="to" type="date" defaultValue={sp.to ?? ""} />
        </div>

        <div className="field filters-search">
          <label htmlFor="search">Search descriptions</label>
          <input
            className="input"
            id="search"
            name="search"
            type="search"
            placeholder="for example: seeked, quiz, lesson with id"
            defaultValue={sp.search ?? ""}
          />
        </div>

        <div className="filters-actions">
          <button className="btn btn-primary" type="submit" data-track="apply-filters">
            Apply
          </button>
          {filtered && (
            <Link className="btn btn-quiet" href="/educator" data-track="clear-filters">
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="row-between" style={{ marginTop: "var(--space-6)" }}>
        <p className="meta">
          {total.toLocaleString()} matching {total === 1 ? "event" : "events"}
          {filtered ? " after filters" : ""}. Showing page {page} of {pages}.
        </p>
        <div className="row">
          {mix.slice(0, 5).map((c) => (
            <span className="tag" key={c.component}>
              {c.component} {c.n}
            </span>
          ))}
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: "var(--space-3)" }}>
        <table className="data">
          <thead>
            <tr>
              {MOODLE_COLUMNS.map((c) => (
                <th key={c} className={c === "Description" ? undefined : "nowrap"}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7}>No events match those filters yet.</td>
              </tr>
            )}
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="nowrap mono">{moodleTime(e.occurred_at)}</td>
                <td>{e.context}</td>
                <td className="nowrap">
                  <span className="tag">{e.component}</span>
                </td>
                <td className="nowrap">{e.event_name}</td>
                <td>{e.description}</td>
                <td className="nowrap">{e.origin}</td>
                <td className="nowrap mono">{e.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="row-between" style={{ marginTop: "var(--space-5)" }} aria-label="Pagination">
        {page > 1 ? (
          <Link className="btn" href={`/educator${buildQuery(sp, { page: String(page - 1) })}`}>
            Newer
          </Link>
        ) : (
          <span />
        )}
        {page < pages ? (
          <Link className="btn" href={`/educator${buildQuery(sp, { page: String(page + 1) })}`}>
            Older
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

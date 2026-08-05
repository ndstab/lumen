import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listCourses, courseProgress } from "@/lib/content";
import { recordEvent } from "@/lib/events";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const courses = listCourses();
  const progress = courseProgress(user.id);

  await recordEvent({
    component: "Course",
    eventName: "Course catalogue viewed",
    action: "viewed",
    target: "course catalogue",
    context: "Courses",
    description: `The user with id '${user.id}' viewed the course catalogue.`,
  });

  const totalDone = [...progress.values()].reduce((n, p) => n + p.lessons_completed, 0);
  const totalLessons = [...progress.values()].reduce((n, p) => n + p.lessons_total, 0);

  return (
    <div className="shell">
      <div className="row-between" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)" }}>Hello, {user.name.split(" ")[0]}</h1>
          <p className="lede" style={{ marginTop: "var(--space-3)" }}>
            {totalDone === 0
              ? "Pick a course and start with the first lesson."
              : `You have finished ${totalDone} of ${totalLessons} lessons so far.`}
          </p>
        </div>
      </div>

      <hr className="rule" style={{ margin: "var(--space-6) 0" }} />

      <div className="grid-cards">
        {courses.map((course) => {
          const p = progress.get(course.id);
          const done = p?.lessons_completed ?? 0;
          const total = p?.lessons_total ?? course.lesson_count;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <Link
              className="card"
              key={course.id}
              href={`/courses/${course.slug}`}
              data-track={`course-card-${course.slug}`}
            >
              <div className="row">
                <span className="tag tag-blue">{course.subject}</span>
                <span className="tag">{course.grade_band}</span>
              </div>
              <h3>{course.title}</h3>
              <p className="meta" style={{ flex: 1 }}>{course.subtitle}</p>

              <div style={{ marginTop: "var(--space-2)" }}>
                <div
                  className="meta"
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                >
                  <span>
                    {total} {total === 1 ? "lesson" : "lessons"}
                  </span>
                  <span>{done > 0 ? `${pct}% complete` : "Not started"}</span>
                </div>
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCourseBySlug, listLessons, lessonProgress } from "@/lib/content";
import { recordEvent } from "@/lib/events";
import TrackContext from "@/components/TrackContext";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  return { title: course?.title ?? "Course" };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  if (!course) notFound();

  const lessons = listLessons(course.id);
  const progress = lessonProgress(user.id, course.id);

  await recordEvent({
    component: "Course",
    eventName: "Course viewed",
    action: "viewed",
    target: "course",
    context: `Course: ${course.title}`,
    courseId: course.id,
    description: `The user with id '${user.id}' viewed the course with id '${course.id}'.`,
  });

  const done = lessons.filter((l) => progress.get(l.id)?.completed_at).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((l) => !progress.get(l.id)?.completed_at) ?? lessons[0];

  return (
    <div className="shell">
      <TrackContext courseId={course.id} label={`Course: ${course.title}`} />

      <nav className="trail" aria-label="Breadcrumb">
        <Link href="/courses" data-track="crumb-courses">
          Courses
        </Link>
        <span className="sep" aria-hidden="true">
          &middot;
        </span>
        <span className="here">{course.title}</span>
      </nav>

      <div className="course-head">
        <div>
          <div className="row" style={{ marginBottom: "var(--space-4)" }}>
            <span className="tag tag-blue">{course.subject}</span>
            <span className="tag">{course.grade_band}</span>
          </div>
          <h1 style={{ fontSize: "var(--text-3xl)" }}>{course.title}</h1>
          <p className="lede" style={{ marginTop: "var(--space-3)" }}>{course.subtitle}</p>
          <p style={{ marginTop: "var(--space-5)" }}>{course.description}</p>
        </div>

        <aside className="panel panel-raised">
          <h4>Your progress</h4>
          <p className="meta" style={{ marginTop: "var(--space-2)" }}>
            {done} of {lessons.length} lessons complete
          </p>
          <div className="bar bar-blue" style={{ marginTop: "var(--space-3)" }}>
            <i style={{ width: `${pct}%` }} />
          </div>
          {nextLesson && (
            <Link
              className="btn btn-primary"
              style={{ marginTop: "var(--space-5)", width: "100%" }}
              href={`/courses/${course.slug}/${nextLesson.slug}`}
              data-track="course-continue"
            >
              {done === 0 ? "Start lesson 1" : "Continue"}
            </Link>
          )}
        </aside>
      </div>

      <hr className="rule" style={{ margin: "var(--space-7) 0 var(--space-5)" }} />

      <h2>Lessons</h2>
      <ol className="lesson-list">
        {lessons.map((lesson, i) => {
          const p = progress.get(lesson.id);
          const complete = Boolean(p?.completed_at);
          return (
            <li key={lesson.id}>
              <Link
                className="lesson-row"
                href={`/courses/${course.slug}/${lesson.slug}`}
                data-track={`lesson-row-${lesson.slug}`}
              >
                <span className="lesson-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="lesson-body">
                  <span className="lesson-title">{lesson.title}</span>
                  <span className="meta">{lesson.summary}</span>
                </span>
                <span className="lesson-state">
                  {complete ? (
                    <span className="tag tag-ok">Complete</span>
                  ) : p ? (
                    <span className="tag tag-orange">In progress</span>
                  ) : (
                    <span className="tag">Not started</span>
                  )}
                  <span className="meta nowrap">{lesson.reading_minutes} min read</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

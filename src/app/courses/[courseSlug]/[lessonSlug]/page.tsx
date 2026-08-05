import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getCourseBySlug,
  getLesson,
  getBlocks,
  getQuestions,
  listLessons,
  lessonNeighbours,
  getLessonProgress,
  touchLesson,
  VIDEO_COMPLETE_PCT,
} from "@/lib/content";
import { recordEvent } from "@/lib/events";
import TrackContext from "@/components/TrackContext";
import Figure from "@/components/Figures";
import VideoPlayer from "@/components/VideoPlayer";
import Quiz, { type QuizQuestion } from "@/components/Quiz";
import type { LessonBlock } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  const lesson = course ? getLesson(course.id, lessonSlug) : null;
  return { title: lesson?.title ?? "Lesson" };
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.kind) {
    case "heading":
      return <h3>{block.content}</h3>;
    case "paragraph":
      return <p>{block.content}</p>;
    case "callout":
      return <div className="callout">{block.content}</div>;
    case "list": {
      let items: string[] = [];
      try {
        items = JSON.parse(block.content) as string[];
      } catch {
        items = [block.content];
      }
      return (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    case "figure":
      return <Figure name={block.content} caption={block.caption} />;
    default:
      return null;
  }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { courseSlug, lessonSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  if (!course) notFound();

  const lesson = getLesson(course.id, lessonSlug);
  if (!lesson) notFound();

  touchLesson(user.id, lesson.id);

  const blocks = getBlocks(lesson.id);
  const questions = getQuestions(lesson.id);
  const all = listLessons(course.id);
  const { prev, next } = lessonNeighbours(course.id, lesson.position);
  const progress = getLessonProgress(user.id, lesson.id);
  const contextLabel = `Lesson: ${lesson.title}`;

  await recordEvent({
    component: "Lesson",
    eventName: "Lesson viewed",
    action: "viewed",
    target: "lesson",
    context: contextLabel,
    courseId: course.id,
    lessonId: lesson.id,
    description: `The user with id '${user.id}' viewed the lesson with id '${lesson.id}' in the course with id '${course.id}'.`,
    meta: { position: lesson.position + 1, of: all.length },
  });

  // Correctness never reaches the browser: options are stripped to id and text.
  const clientQuestions: QuizQuestion[] = questions.map((q) => ({
    id: q.id,
    kind: q.kind,
    prompt: q.prompt,
    unit: q.unit,
    options: q.options.map((o) => ({ id: o.id, body: o.body })),
  }));

  const watched = Math.round(progress?.video_watched_pct ?? 0);

  return (
    <div className="shell">
      <TrackContext courseId={course.id} lessonId={lesson.id} label={contextLabel} />

      <nav className="trail" aria-label="Breadcrumb">
        <Link href="/courses" data-track="crumb-courses">
          Courses
        </Link>
        <span className="sep" aria-hidden="true">&middot;</span>
        <Link href={`/courses/${course.slug}`} data-track="crumb-course">
          {course.title}
        </Link>
        <span className="sep" aria-hidden="true">&middot;</span>
        <span className="here">Lesson {lesson.position + 1}</span>
      </nav>

      <div className="lesson-layout">
        <article>
          <h1 style={{ fontSize: "var(--text-3xl)" }}>{lesson.title}</h1>
          <hr className="rule" style={{ margin: "var(--space-4) 0 var(--space-5)" }} />
          <p className="lede">{lesson.summary}</p>

          {lesson.video_src && (
            <VideoPlayer
              src={lesson.video_src}
              title={lesson.video_title ?? lesson.title}
              lessonId={lesson.id}
              contextLabel={contextLabel}
            />
          )}

          <div className="prose">
            {blocks.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </div>
        </article>

        <aside className="lesson-aside">
          <div className="panel">
            <h4>This lesson</h4>
            <dl className="stat-list">
              <div>
                <dt>Reading</dt>
                <dd>{lesson.reading_minutes} min</dd>
              </div>
              <div>
                <dt>Video watched</dt>
                <dd>{watched}%</dd>
              </div>
              <div>
                <dt>Best score</dt>
                <dd>
                  {progress?.quiz_best_score !== null && progress?.quiz_best_score !== undefined
                    ? `${Math.round(progress.quiz_best_score)}%`
                    : "Not attempted"}
                </dd>
              </div>
            </dl>
            <div className="bar" style={{ marginTop: "var(--space-4)" }}>
              <i style={{ width: `${watched}%` }} />
            </div>
            <p className="meta" style={{ marginTop: "var(--space-3)" }}>
              {progress?.completed_at
                ? "Lesson complete."
                : `Watch ${VIDEO_COMPLETE_PCT}% of the video and pass the quiz to complete this lesson.`}
            </p>
          </div>

          <nav className="panel" aria-label="Lessons in this course">
            <h4>In this course</h4>
            <ol className="mini-list">
              {all.map((l, i) => (
                <li key={l.id} aria-current={l.id === lesson.id ? "true" : undefined}>
                  <Link href={`/courses/${course.slug}/${l.slug}`} data-track={`aside-lesson-${l.slug}`}>
                    <span className="mono">{i + 1}</span>
                    {l.title}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>

      {clientQuestions.length > 0 && (
        <Quiz
          lessonId={lesson.id}
          questions={clientQuestions}
          contextLabel={`Quiz: ${lesson.title}`}
          bestScore={
            progress?.quiz_best_score !== null && progress?.quiz_best_score !== undefined
              ? Math.round(progress.quiz_best_score)
              : null
          }
        />
      )}

      <nav className="lesson-nav" aria-label="Lesson navigation">
        {prev ? (
          <Link className="btn" href={`/courses/${course.slug}/${prev.slug}`} data-track="lesson-prev">
            Previous lesson
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            className="btn btn-primary"
            href={`/courses/${course.slug}/${next.slug}`}
            data-track="lesson-next"
          >
            Next lesson
          </Link>
        ) : (
          <Link className="btn btn-primary" href={`/courses/${course.slug}`} data-track="lesson-finish">
            Back to the course
          </Link>
        )}
      </nav>
    </div>
  );
}

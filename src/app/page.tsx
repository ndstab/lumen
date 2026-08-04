import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb, type Course } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { recordEvent } from "@/lib/events";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "educator" ? "/educator" : "/courses");

  const courses = getDb()
    .prepare(`SELECT * FROM courses ORDER BY position`)
    .all() as Course[];

  await recordEvent({
    component: "System",
    eventName: "Landing page viewed",
    action: "viewed",
    target: "landing page",
    context: "Site",
  });

  return (
    <div className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">Science for Classes 8 and 9</p>
          <h1>
            Read it. Watch it.
            <br />
            Then prove you have it.
          </h1>
          <p className="lede" style={{ marginTop: "var(--space-5)" }}>
            Three courses in physics and biology, each built from short readings,
            hand drawn figures, a short film and a quiz that tells you why you were
            wrong rather than just that you were.
          </p>
          <div className="row" style={{ marginTop: "var(--space-6)" }}>
            <Link className="btn btn-primary" href="/signup" data-track="hero-signup">
              Create a free account
            </Link>
            <Link className="btn" href="/login" data-track="hero-login">
              I already have one
            </Link>
          </div>
        </div>

        <figure className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 420 300" className="dgm" role="presentation">
            {/* A prism splitting a beam. Drawn, not decorated. */}
            <path className="solid fill-wash" d="M210 58 L318 236 L102 236 Z" />
            <path className="solid" d="M8 150 L156 150" strokeWidth="3" />
            <g strokeWidth="2.5" fill="none">
              <path d="M156 150 L412 118" stroke="var(--accent-2)" />
              <path d="M156 150 L412 140" stroke="var(--accent-2-ink)" />
              <path d="M156 150 L412 162" stroke="var(--ok)" />
              <path d="M156 150 L412 184" stroke="var(--accent)" />
              <path d="M156 150 L412 206" stroke="var(--accent-ink)" />
            </g>
            <circle className="fill-orange" cx="156" cy="150" r="5" />
          </svg>
        </figure>
      </section>

      <hr className="rule" style={{ margin: "var(--space-8) 0 var(--space-6)" }} />

      <section>
        <h2>What you can study</h2>
        <p className="meta" style={{ marginTop: "var(--space-2)" }}>
          Every course follows the NCERT syllabus for Classes 8 and 9.
        </p>
        <div className="grid-cards" style={{ marginTop: "var(--space-5)" }}>
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <div className="row">
                <span className="tag tag-blue">{course.subject}</span>
                <span className="tag">{course.grade_band}</span>
              </div>
              <h3>{course.title}</h3>
              <p className="meta">{course.subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "var(--space-8)" }}>
        <div className="panel panel-raised-blue">
          <h3>About the activity data</h3>
          <p style={{ marginTop: "var(--space-3)" }}>
            Lumen records what learners do while they study: pages opened, links
            and buttons clicked, how far each page was scrolled, every play, pause
            and seek inside a video, and every quiz answer with the attempt it
            belonged to. Educators can watch that stream live and export it in the
            standard seven column log format.
          </p>
          <p className="meta" style={{ marginTop: "var(--space-3)" }}>
            This is a student project built for a learning analytics assignment.
            Nothing here is a production service, and the accounts are seeded
            demonstration accounts.
          </p>
        </div>
      </section>
    </div>
  );
}

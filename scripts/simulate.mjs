/**
 * Generates a body of demonstration activity.
 *
 * This drives the real HTTP endpoints, so every event it produces goes through
 * the same tracker, grading and logging code a real learner would. Nothing is
 * inserted behind the application's back except the final timestamp pass, which
 * spreads the activity across the past few days so the "when the work happens"
 * chart has a shape instead of one tall bar.
 *
 * Every row it creates is tagged meta.simulated = true, so simulated activity
 * can always be told apart from your own clicking about.
 *
 *   node scripts/simulate.mjs [baseUrl]
 *
 * The dev server must be running.
 */

import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const here = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(here, "..", "data", "app.db");

const PASSWORD = "lumen1234";

/** Each learner gets a persona, which is what makes the analytics interesting. */
const LEARNERS = [
  { email: "aarav@lumen.school", diligence: 0.92, ability: 0.85, courses: ["light", "force"] },
  { email: "diya@lumen.school", diligence: 0.74, ability: 0.7, courses: ["light", "cell"] },
  { email: "kabir@lumen.school", diligence: 0.45, ability: 0.55, courses: ["light", "cell", "force"] },
  { email: "meera@lumen.school", diligence: 0.63, ability: 0.78, courses: ["cell", "force"] },
  { email: "rohan@lumen.school", diligence: 0.81, ability: 0.62, courses: ["light", "cell"] },
  { email: "ananya@lumen.school", diligence: 0.95, ability: 0.9, courses: ["cell", "force", "light"] },
  { email: "vihaan@lumen.school", diligence: 0.38, ability: 0.48, courses: ["force", "light"] },
  { email: "ishita@lumen.school", diligence: 0.7, ability: 0.82, courses: ["light", "cell", "force"] },
  { email: "arjun@lumen.school", diligence: 0.55, ability: 0.66, courses: ["force", "cell"] },
  { email: "sara@lumen.school", diligence: 0.87, ability: 0.74, courses: ["light", "force"] },
];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password: PASSWORD }),
    redirect: "manual",
  });
  const cookie = res.headers.getSetCookie?.().find((c) => c.startsWith("lumen_session="));
  if (!cookie) throw new Error(`login failed for ${email} (status ${res.status})`);
  return cookie.split(";")[0];
}

const get = (cookie, url) => fetch(`${BASE}${url}`, { headers: { cookie } });

const post = (cookie, url, body) =>
  fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(body),
  });

function ev(component, eventName, action, extra = {}) {
  return {
    component,
    eventName,
    action,
    target: extra.target ?? null,
    context: extra.context ?? "Site",
    courseId: extra.courseId ?? null,
    lessonId: extra.lessonId ?? null,
    path: extra.path ?? "/",
    clientTs: new Date().toISOString(),
    meta: { ...(extra.meta ?? {}), simulated: true },
  };
}

/** Watch a video, dropping out partway according to how diligent the learner is. */
function videoEvents(lesson, ctx, diligence) {
  const events = [];
  const duration = lesson.video_duration_s;
  const reach = Math.min(100, Math.round(rand(0.35, 1.15) * diligence * 100 + rand(0, 18)));

  events.push(ev("Video", "Video started", "started playing", { ...ctx, target: "video",
    meta: { position: 0, title: lesson.video_title } }));

  for (const mark of [25, 50, 75, 100]) {
    if (reach < mark) break;
    // A pause or a seek here and there, the way people actually watch.
    if (Math.random() < 0.3) {
      const at = Number(((mark / 100) * duration).toFixed(1));
      events.push(ev("Video", "Video paused", "paused", { ...ctx, target: "video",
        meta: { position: at, percent: mark } }));
      events.push(ev("Video", "Video resumed", "resumed", { ...ctx, target: "video",
        meta: { position: at } }));
    }
    if (Math.random() < 0.22) {
      const from = Number(((mark / 100) * duration).toFixed(1));
      const back = Math.random() < 0.7;
      const to = Number(Math.max(0, Math.min(duration, from + (back ? -rand(8, 25) : rand(10, 30)))).toFixed(1));
      events.push(ev("Video", "Video seeked", "seeked within", { ...ctx, target: "video",
        meta: { from, to, direction: to > from ? "forward" : "backward",
                jumpSeconds: Number(Math.abs(to - from).toFixed(1)) } }));
    }
    if (Math.random() < 0.12) {
      events.push(ev("Video", "Video playback rate changed", "changed the playback rate of",
        { ...ctx, target: "video", meta: { rate: pick([1.25, 1.5, 0.75]) } }));
    }

    events.push(ev("Video", "Video milestone reached", "reached a milestone in", { ...ctx, target: "video",
      meta: { milestone: mark, position: Number(((mark / 100) * duration).toFixed(1)),
              watchedSeconds: Math.round((mark / 100) * duration) } }));
  }

  if (reach >= 100) {
    events.push(ev("Video", "Video ended", "finished watching", { ...ctx, target: "video",
      meta: { watchedSeconds: duration, title: lesson.video_title } }));
  }

  return { events, reach };
}

async function run() {
  const db = new Database(DB_PATH, { readonly: true });

  // Everything written after this point is the simulation's doing, including
  // the events the server generates itself for page views and quiz grading.
  const watermark =
    (db.prepare(`SELECT COALESCE(MAX(id), 0) AS id FROM events`).get()).id;

  const courses = db.prepare(`SELECT id, slug, title FROM courses`).all();
  const lessonsByCourse = new Map(
    courses.map((c) => [
      c.slug,
      db.prepare(`SELECT * FROM lessons WHERE course_id = ? ORDER BY position`).all(c.id),
    ])
  );
  const questionsFor = (lessonId) =>
    db.prepare(`SELECT id, kind, position FROM questions WHERE lesson_id = ? ORDER BY position`).all(lessonId);
  const optionsFor = (questionId) =>
    db.prepare(`SELECT id, is_correct FROM options WHERE question_id = ? ORDER BY position`).all(questionId);
  const numericFor = (questionId) =>
    db.prepare(`SELECT numeric_answer FROM questions WHERE id = ?`).get(questionId);

  let lessonsDone = 0;
  let attempts = 0;

  for (const learner of LEARNERS) {
    const cookie = await login(learner.email);
    await get(cookie, "/courses");

    for (const courseSlug of learner.courses) {
      const course = courses.find((c) => c.slug === courseSlug);
      const lessons = lessonsByCourse.get(courseSlug) ?? [];
      await get(cookie, `/courses/${courseSlug}`);

      // Diligent learners get through more of the course.
      const take = Math.max(1, Math.round(lessons.length * rand(0.5, 1) * (0.5 + learner.diligence / 2)));

      for (const lesson of lessons.slice(0, take)) {
        const ctx = {
          courseId: course.id,
          lessonId: lesson.id,
          context: `Lesson: ${lesson.title}`,
          path: `/courses/${courseSlug}/${lesson.slug}`,
        };

        await get(cookie, `/courses/${courseSlug}/${lesson.slug}`);
        lessonsDone++;

        const batch = [
          ev("Navigation", "Page viewed", "viewed", { ...ctx, target: "page",
            meta: { title: lesson.title } }),
        ];

        for (const depth of [25, 50, 75, 100]) {
          if (Math.random() < learner.diligence) {
            batch.push(ev("Navigation", "Page scrolled", "scrolled", { ...ctx, target: "page",
              meta: { depthPercent: depth } }));
          }
        }
        for (let i = 0; i < Math.round(rand(2, 7)); i++) {
          batch.push(ev("Navigation", "Element clicked", "clicked", { ...ctx, target: "element",
            meta: { element: pick(["a#aside-lesson", "button#video-play-toggle",
                                   "button#quiz-check", "a#crumb-course"]),
                    label: "simulated click" } }));
        }

        const { events: vEvents, reach } = videoEvents(lesson, ctx, learner.diligence);
        batch.push(...vEvents);

        await post(cookie, "/api/events", { events: batch });
        await post(cookie, "/api/progress/video", { lessonId: lesson.id, percent: reach });

        // Quizzes: weaker learners retake more often.
        const rounds = Math.random() < 0.35 ? 2 : 1;
        for (let r = 0; r < rounds; r++) {
          const startRes = await post(cookie, "/api/quiz/start", { lessonId: lesson.id });
          if (!startRes.ok) continue;
          const { attemptId } = await startRes.json();
          attempts++;

          for (const q of questionsFor(lesson.id)) {
            // Later questions are a little harder, and a retake goes better.
            const chance = Math.min(0.96, learner.ability + r * 0.18 - q.position * 0.035);
            const correct = Math.random() < chance;

            let response;
            if (q.kind === "numeric") {
              const target = numericFor(q.id).numeric_answer ?? 0;
              response = String(correct ? target : Number((target + rand(1, 9)).toFixed(2)));
            } else {
              const opts = optionsFor(q.id);
              const right = opts.filter((o) => o.is_correct).map((o) => o.id);
              const wrong = opts.filter((o) => !o.is_correct).map((o) => o.id);
              if (correct) response = right.sort((a, b) => a - b).join(",");
              else if (q.kind === "multi")
                response = [...right.slice(0, Math.max(1, right.length - 1)), pick(wrong)]
                  .filter(Boolean).sort((a, b) => a - b).join(",");
              else response = String(pick(wrong.length ? wrong : right));
            }

            await post(cookie, "/api/quiz/answer", { attemptId, questionId: q.id, response });
          }

          await post(cookie, "/api/quiz/submit", { attemptId });
        }
      }
    }
    process.stdout.write(`  ${learner.email} done\n`);
  }

  db.close();
  spreadOverTime(watermark);
  console.log(`Simulated ${LEARNERS.length} learners, ${lessonsDone} lesson visits, ${attempts} quiz attempts.`);
}

/**
 * Spreads the simulated rows across the past three days, biased towards
 * after-school hours, so the activity chart shows a realistic rhythm.
 * Only rows tagged meta.simulated are touched.
 */
function spreadOverTime(watermark) {
  const db = new Database(DB_PATH);
  const ids = db
    .prepare(`SELECT id FROM events WHERE id > ? ORDER BY id`)
    .all(watermark)
    .map((r) => r.id);

  if (ids.length === 0) {
    db.close();
    return;
  }

  const update = db.prepare(`UPDATE events SET occurred_at = ? WHERE id = ?`);

  const tx = db.transaction(() => {
    // Walk backwards from a few minutes ago, in bursts separated by gaps, and
    // skip the small hours so the daily rhythm looks like schoolwork.
    let t = Date.now() - 3 * 60 * 1000;
    let burst = Math.round(rand(6, 18));

    for (let i = ids.length - 1; i >= 0; i--) {
      update.run(new Date(t).toISOString(), ids[i]);

      t -= rand(3_000, 25_000);
      if (--burst <= 0) {
        t -= rand(20, 90) * 60 * 1000;
        burst = Math.round(rand(6, 18));
      }
      const hour = new Date(t).getHours();
      if (hour >= 1 && hour < 8) t -= 7 * 60 * 60 * 1000;
    }
  });
  tx();

  const span = db
    .prepare(`SELECT MIN(occurred_at) AS a, MAX(occurred_at) AS b FROM events WHERE id > ?`)
    .get(watermark);
  db.close();
  console.log(`Spread ${ids.length} events from ${span.a} to ${span.b}.`);
}

run().catch((err) => {
  console.error("Simulation failed:", err.message);
  console.error("Is the dev server running at " + BASE + " ?");
  process.exit(1);
});

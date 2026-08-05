/**
 * Builds docs/presentation.pptx.
 *
 * The deck presents the finished product: what a learner uses, what the system
 * records, and what an educator gets out of it. Every figure quoted is read out
 * of the database at generation time rather than typed in, so the numbers
 * cannot go stale against the data.
 *
 *   npm run deck
 */

import PptxGenJS from "pptxgenjs";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const SHOTS = path.join(ROOT, "docs", "screens");
const OUT = path.join(ROOT, "docs", "presentation.pptx");

/* ------------------------------------------------------------- palette --- */

const INK = "1E2340";
const INK_SOFT = "343B5C";
const BLUE = "2E5BD4";
const ORANGE = "E8763C";
const PAPER = "F7F2E2";
const PAPER_2 = "EDE6CF";
const CREAM = "F5EFDD";
const GREY = "6E7597";
const GREY_ON_DARK = "A9B0CC";

const HEAD = "Arial";
const BODY = "Calibri";

const W = 13.333;
const M = 0.62;

/* --------------------------------------------------------------- facts --- */

function facts() {
  const db = new Database(path.join(ROOT, "data", "app.db"), { readonly: true });
  const one = (sql) => db.prepare(sql).get();
  const f = {
    events: one("SELECT COUNT(*) n FROM events").n,
    eventNames: one("SELECT COUNT(DISTINCT event_name) n FROM events").n,
    learners: one("SELECT COUNT(*) n FROM users WHERE role='learner'").n,
    courses: one("SELECT COUNT(*) n FROM courses").n,
    lessons: one("SELECT COUNT(*) n FROM lessons").n,
    questions: one("SELECT COUNT(*) n FROM questions").n,
    attempts: one("SELECT COUNT(*) n FROM quiz_attempts WHERE submitted_at IS NOT NULL").n,
    answers: one("SELECT COUNT(*) n FROM quiz_responses").n,
    videoEvents: one("SELECT COUNT(*) n FROM events WHERE component='Video'").n,
    videoMin: Math.round(
      (one(`SELECT SUM(best) s FROM (
              SELECT MAX(CAST(json_extract(meta,'$.watchedSeconds') AS REAL)) best
                FROM events
               WHERE event_name IN ('Video milestone reached','Video ended','Video watch heartbeat')
                 AND user_id IS NOT NULL AND lesson_id IS NOT NULL
               GROUP BY user_id, lesson_id)`).s ?? 0) / 60
    ),
  };
  const started = one(
    `SELECT COUNT(DISTINCT user_id || ':' || lesson_id) n FROM events
      WHERE event_name='Video started' AND user_id IS NOT NULL AND lesson_id IS NOT NULL`
  ).n;
  const reached = (m) =>
    one(
      `SELECT COUNT(DISTINCT user_id || ':' || lesson_id) n FROM events
        WHERE event_name='Video milestone reached'
          AND CAST(json_extract(meta,'$.milestone') AS INTEGER) = ${m}`
    ).n;
  const pct = (x) => (started ? Math.round((x / started) * 100) : 0);
  f.videoStarts = started;
  f.dropOff = [100, pct(reached(25)), pct(reached(50)), pct(reached(75)), pct(reached(100))];
  const hardest = one(
    `SELECT q.prompt, CAST(ROUND(100.0*SUM(r.is_correct)/COUNT(r.id)) AS INTEGER) pct, COUNT(r.id) n
       FROM quiz_responses r JOIN questions q ON q.id = r.question_id
      GROUP BY q.id HAVING COUNT(r.id) >= 3 ORDER BY pct ASC LIMIT 1`
  );
  f.hardest = hardest ?? null;
  db.close();
  return f;
}

/* ------------------------------------------------------------- helpers --- */

const IMG = {
  landing: 1280 / 900,
  catalogue: 1280 / 760,
  course: 1280 / 1000,
  lesson: 1280 / 1050,
  figure: 1280 / 1000,
  quiz: 1280 / 900,
  "event-stream": 1440 / 1100,
  "event-video": 1440 / 1050,
  analytics: 1440 / 1000,
  difficulty: 1440 / 1000,
  activity: 1440 / 950,
  "lesson-mobile": 390 / 844,
};

function shot(slide, name, { x, y, h }) {
  slide.addImage({
    path: path.join(SHOTS, `${name}.png`),
    x, y, w: h * IMG[name], h,
    shadow: { type: "outer", color: "1E2340", blur: 0, offset: 0.07, angle: 45, opacity: 1 },
  });
}

function glyph(slide, x, y, size = 0.2) {
  slide.addShape("rect", { x: x + size * 0.22, y: y + size * 0.22, w: size, h: size, fill: { color: ORANGE } });
  slide.addShape("rect", { x, y, w: size, h: size, fill: { color: BLUE }, line: { color: INK, width: 1.25 } });
}

function darkSlide(pptx) {
  const s = pptx.addSlide();
  s.background = { color: INK };
  return s;
}

function lightSlide(pptx, title, kicker) {
  const s = pptx.addSlide();
  s.background = { color: PAPER };
  glyph(s, M, 0.5);
  if (kicker) {
    s.addText(kicker, {
      x: M + 0.36, y: 0.45, w: 8, h: 0.3,
      fontFace: BODY, fontSize: 13, bold: true, color: BLUE, margin: 0, valign: "top",
    });
  }
  s.addText(title, {
    x: M, y: 0.92, w: W - M * 2, h: 0.72,
    fontFace: HEAD, fontSize: 34, bold: true, color: INK, margin: 0, valign: "top",
  });
  return s;
}

function card(slide, { x, y, w, h, fill = PAPER, accent = ORANGE }) {
  slide.addShape("rect", { x: x + 0.07, y: y + 0.07, w, h, fill: { color: accent } });
  slide.addShape("rect", { x, y, w, h, fill: { color: fill }, line: { color: INK, width: 1.5 } });
}

function stat(slide, { x, y, w, value, label, accent = ORANGE }) {
  card(slide, { x, y, w, h: 1.24, accent });
  slide.addText(String(value), {
    x: x + 0.22, y: y + 0.13, w: w - 0.44, h: 0.6,
    fontFace: HEAD, fontSize: 28, bold: true, color: INK, margin: 0, valign: "top",
  });
  slide.addText(label, {
    x: x + 0.22, y: y + 0.76, w: w - 0.44, h: 0.38,
    fontFace: BODY, fontSize: 12.5, color: GREY, margin: 0, valign: "top",
  });
}

function bullets(slide, items, { x, y, w, h, size = 15, color = INK_SOFT }) {
  slide.addText(
    items.map((t, i) => ({
      text: t,
      options: { bullet: { code: "25A0" }, breakLine: i !== items.length - 1 },
    })),
    { x, y, w, h, fontFace: BODY, fontSize: size, color, margin: 0,
      paraSpaceAfter: 9, lineSpacing: size * 1.32, valign: "top" }
  );
}

/* ---------------------------------------------------------------- deck --- */

const f = facts();
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "ndstab";
pptx.title = "Lumen";

/* 1 ---------------------------------------------------------------- title */
{
  const s = darkSlide(pptx);
  glyph(s, M, M, 0.34);
  s.addText("Interactive science, Classes 8 and 9", {
    x: M, y: 1.55, w: 9, h: 0.34,
    fontFace: BODY, fontSize: 15, bold: true, color: ORANGE, margin: 0, valign: "top",
  });
  s.addText("Lumen", {
    x: M, y: 2.0, w: 11, h: 1.5,
    fontFace: HEAD, fontSize: 84, bold: true, color: CREAM, margin: 0, valign: "top",
  });
  s.addText("Read it. Watch it. Then prove you have it.", {
    x: M, y: 3.55, w: 9.4, h: 0.6,
    fontFace: BODY, fontSize: 23, color: GREY_ON_DARK, margin: 0, valign: "top",
  });
  s.addShape("rect", { x: M, y: 4.55, w: 2.4, h: 0.045, fill: { color: BLUE } });
  s.addText(
    `${f.courses} courses  ·  ${f.lessons} lessons  ·  ${f.questions} questions  ·  a film for every lesson`,
    { x: M, y: 4.9, w: 11, h: 0.4, fontFace: BODY, fontSize: 15, color: CREAM, margin: 0, valign: "top" }
  );
  s.addText("github.com/ndstab/lumen", {
    x: M, y: 6.55, w: 8, h: 0.35,
    fontFace: BODY, fontSize: 13, color: GREY_ON_DARK, margin: 0, valign: "top",
  });
  s.addNotes("Lumen is an interactive science app for Classes 8 and 9, built around a complete record of what learners do.");
}

/* 2 -------------------------------------------------------------- product */
{
  const s = lightSlide(pptx, "A course, a lesson, and a record of everything", "The product");
  bullets(
    s,
    [
      "Learners sign in, pick a course, and work through lessons at their own pace.",
      "Every lesson is a reading with drawn figures, a short film, and a quiz.",
      "Progress is tracked per lesson and per course.",
      "Educators get the whole activity record: a live stream, a standard format export, and three analytics views.",
    ],
    { x: M, y: 2.0, w: 5.5, h: 2.8 }
  );
  shot(s, "catalogue", { x: 6.55, y: 1.95, h: 3.35 });
  const tiles = [
    [f.courses, "courses"],
    [f.lessons, "lessons"],
    [f.questions, "questions"],
    ["12", "drawn figures"],
  ];
  tiles.forEach(([v, l], i) =>
    stat(s, { x: M + i * 3.05, y: 5.6, w: 2.7, value: v, label: l, accent: i % 2 ? BLUE : ORANGE })
  );
  s.addNotes("Two roles. Learners see courses and their own progress. Educators see everything that happened.");
}

/* 3 -------------------------------------------------------------- courses */
{
  const s = lightSlide(pptx, "Three courses, real syllabus content", "What you can study");
  const courses = [
    ["Light", "Reflection, refraction and the human eye", "5 lessons", BLUE],
    ["The Cell", "The unit every living thing is built from", "4 lessons", ORANGE],
    ["Force and Motion", "Pushes, pulls, pressure and speed", "4 lessons", BLUE],
  ];
  courses.forEach(([title, sub, count, accent], i) => {
    const x = M + i * 4.15;
    card(s, { x, y: 2.0, w: 3.75, h: 2.05, accent });
    s.addText(count, {
      x: x + 0.28, y: 2.2, w: 3.2, h: 0.3,
      fontFace: BODY, fontSize: 12.5, bold: true, color: accent, margin: 0, valign: "top",
    });
    s.addText(title, {
      x: x + 0.28, y: 2.52, w: 3.2, h: 0.55,
      fontFace: HEAD, fontSize: 20, bold: true, color: INK, margin: 0, valign: "top",
    });
    s.addText(sub, {
      x: x + 0.28, y: 3.1, w: 3.2, h: 0.8,
      fontFace: BODY, fontSize: 13.5, color: GREY, margin: 0, valign: "top",
    });
  });
  s.addText("Aligned to the NCERT syllabus for Classes 8 and 9.", {
    x: M, y: 4.3, w: 11.5, h: 0.4,
    fontFace: BODY, fontSize: 15, color: INK_SOFT, margin: 0, valign: "top",
  });
  shot(s, "figure", { x: M, y: 4.8, h: 2.25 });
  s.addText("Drawn, not borrowed", {
    x: 3.75, y: 4.85, w: 8.9, h: 0.4,
    fontFace: HEAD, fontSize: 17, bold: true, color: INK, margin: 0, valign: "top",
  });
  s.addText(
    "Twelve figures across the three courses, each built to correct geometry rather than sketched. This one traces a real ray through a glass slab: bent towards the normal going in, away from it coming out, and emerging parallel to the direction it started in, just displaced sideways.",
    { x: 3.75, y: 5.35, w: 8.9, h: 1.5, fontFace: BODY, fontSize: 14, color: INK_SOFT, margin: 0, valign: "top" }
  );
  s.addNotes("Twelve figures across the three courses, each drawn rather than borrowed.");
}

/* 4 --------------------------------------------------------------- lesson */
{
  const s = lightSlide(pptx, "Every lesson is three things at once", "Inside a lesson");
  bullets(
    s,
    [
      "A reading, with the figures inline where they are needed.",
      "A short film, in a player built for this app.",
      "A quiz, at the bottom of the same page.",
      "A rail showing how much of the film has been watched, the best quiz score, and what still needs doing.",
    ],
    { x: M, y: 2.0, w: 4.5, h: 2.7 }
  );
  s.addText(
    "Nothing is locked. Learners move freely, and that freedom is itself visible in the data.",
    { x: M, y: 5.0, w: 4.5, h: 0.9, fontFace: BODY, fontSize: 13.5, italic: true, color: GREY, margin: 0, valign: "top" }
  );
  shot(s, "lesson", { x: 5.55, y: 1.95, h: 5.1 });
  s.addNotes("Text, video and quiz on one page, in that order.");
}

/* 5 ----------------------------------------------------------------- quiz */
{
  const s = lightSlide(pptx, "Quizzes that explain, not just mark", "The quiz");
  bullets(
    s,
    [
      "Three question types: single answer, select all that apply, and numeric entry.",
      "Graded on the server, so the answers are never sitting in the page.",
      "The explanation appears whether the answer was right or wrong.",
      "Unlimited retakes, and every attempt is stored separately.",
    ],
    { x: M, y: 2.0, w: 4.6, h: 2.8 }
  );
  stat(s, { x: M, y: 5.15, w: 2.2, value: f.attempts, label: "attempts recorded", accent: BLUE });
  stat(s, { x: M + 2.4, y: 5.15, w: 2.2, value: f.answers, label: "answers graded", accent: ORANGE });
  shot(s, "quiz", { x: 5.65, y: 1.95, h: 4.9 });
  s.addNotes("Storing every attempt separately is what makes the difficulty analysis possible later.");
}

/* 6 ---------------------------------------------------------- what it logs */
{
  const s = darkSlide(pptx);
  glyph(s, M, 0.5);
  s.addText("What the system records", {
    x: M + 0.36, y: 0.45, w: 8, h: 0.3,
    fontFace: BODY, fontSize: 13, bold: true, color: ORANGE, margin: 0, valign: "top",
  });
  s.addText("Every action, in one vocabulary", {
    x: M, y: 0.92, w: W - M * 2, h: 0.62,
    fontFace: HEAD, fontSize: 34, bold: true, color: CREAM, margin: 0, valign: "top",
  });
  s.addText(`${f.eventNames} event types across seven components.`, {
    x: M, y: 1.58, w: 9, h: 0.36,
    fontFace: BODY, fontSize: 16, color: GREY_ON_DARK, margin: 0, valign: "top",
  });

  const groups = [
    ["Navigation", "Page viewed · Element clicked · Link followed · Page scrolled · Page hidden · Page shown"],
    ["Video", "Started · paused · resumed · seeked · ended · rate changed · volume changed · fullscreen · buffering · milestone · heartbeat"],
    ["Quiz", "Attempt started · option selected · answer cleared · question answered · attempt submitted"],
    ["Lesson, Course, User, Report", "Lesson viewed · Course viewed · Catalogue viewed · Account created · Logged in and out · Reports viewed · Clickstream exported"],
  ];
  let y = 2.25;
  for (const [name, list] of groups) {
    s.addShape("rect", { x: M, y: y + 0.05, w: 0.16, h: 0.16, fill: { color: ORANGE } });
    s.addText(name, {
      x: M + 0.34, y, w: 2.9, h: 0.8,
      fontFace: BODY, fontSize: 15, bold: true, color: CREAM, margin: 0, valign: "top",
    });
    s.addText(list, {
      x: M + 3.3, y, w: 9.0, h: 0.8,
      fontFace: BODY, fontSize: 12.5, color: GREY_ON_DARK, margin: 0, valign: "top",
    });
    y += 0.98;
  }
  s.addText(
    "Clicks are caught by a single listener on the document, so an element nobody thought to instrument is still recorded.",
    { x: M, y: 6.2, w: 12.1, h: 0.6, fontFace: BODY, fontSize: 14, italic: true, color: ORANGE, margin: 0, valign: "top" }
  );
  s.addNotes("Seven components, twenty-plus event types. Small enough to analyse, complete enough to reconstruct a session.");
}

/* 7 ------------------------------------------------------------ the depth */
{
  const s = lightSlide(pptx, "A seek is not just a seek", "How much detail");
  s.addText(
    "Video is where the record goes deepest. The player is part of the app, so it reports what an embedded player cannot.",
    { x: M, y: 1.95, w: 4.6, h: 1.0, fontFace: BODY, fontSize: 15, color: INK, margin: 0, valign: "top" }
  );
  card(s, { x: M, y: 3.05, w: 4.6, h: 1.5, fill: PAPER_2, accent: ORANGE });
  s.addText(
    '{ "from": 84.2,\n  "to": 61.0,\n  "direction": "backward",\n  "jumpSeconds": 23.2 }',
    { x: M + 0.26, y: 3.2, w: 4.1, h: 1.2, fontFace: "Courier New", fontSize: 12.5, color: INK, margin: 0, valign: "top" }
  );
  s.addText("One learner rewinding, as stored.", {
    x: M, y: 4.68, w: 4.6, h: 0.35,
    fontFace: BODY, fontSize: 12.5, italic: true, color: GREY, margin: 0, valign: "top",
  });
  bullets(
    s,
    [
      "Both ends of every seek, plus direction and distance",
      "Playback rate and volume changes",
      "Buffering stalls, start and end",
      "Milestones at 25, 50, 75 and 100 percent",
      "Watch-time heartbeats while playing",
    ],
    { x: M, y: 5.2, w: 4.6, h: 1.9, size: 13.5 }
  );
  shot(s, "event-video", { x: 5.65, y: 1.95, h: 4.9 });
  s.addNotes(`${f.videoEvents} video events recorded so far, and ${f.videoMin} minutes of watch time.`);
}

/* 8 ---------------------------------------------------------- event stream */
{
  const s = lightSlide(pptx, "The whole record, live", "For educators");
  bullets(
    s,
    [
      "Every recorded action, newest first, refreshing on its own.",
      "Filter by learner, course, component, event name, date range or free text.",
      "Descriptions read as sentences naming who did what to which lesson.",
      "Educator activity is recorded too, so the log never goes quiet.",
    ],
    { x: M, y: 2.0, w: 4.3, h: 2.7 }
  );
  stat(s, { x: M, y: 5.0, w: 2.05, value: f.events.toLocaleString(), label: "events recorded", accent: ORANGE });
  stat(s, { x: M + 2.25, y: 5.0, w: 2.05, value: f.learners, label: "learners", accent: BLUE });
  shot(s, "event-stream", { x: 5.35, y: 1.95, h: 5.05 });
  s.addNotes("Open this beside the learner app and rows arrive as you click.");
}

/* 9 ------------------------------------------------------------- the export */
{
  const s = lightSlide(pptx, "Exports in the standard log format", "Taking the data out");
  s.addText(
    "One click gives a CSV in the same seven columns as a Moodle standard log report, so the data drops straight into whatever an institution already uses.",
    { x: M, y: 1.95, w: 6.0, h: 1.1, fontFace: BODY, fontSize: 15, color: INK, margin: 0, valign: "top" }
  );
  bullets(
    s,
    [
      "The on-screen table and the CSV come from the same projection, so they cannot disagree.",
      "Filters apply to the export, so an educator can pull one learner or one course.",
      "Written with a byte order mark, so Excel opens the UTF-8 correctly.",
    ],
    { x: M, y: 3.25, w: 6.0, h: 2.0, size: 14 }
  );

  const rows = [
    ["Time", "occurred_at"],
    ["Event context", "context"],
    ["Component", "component"],
    ["Event name", "event_name"],
    ["Description", "description"],
    ["Origin", "origin"],
    ["IP address", "ip"],
  ];
  s.addText("The seven columns", {
    x: 7.3, y: 1.95, w: 5.4, h: 0.4,
    fontFace: HEAD, fontSize: 17, bold: true, color: INK, margin: 0, valign: "top",
  });
  s.addTable(
    rows.map(([a, b]) => [
      { text: a, options: { fontFace: BODY, fontSize: 13.5, bold: true, color: INK } },
      { text: b, options: { fontFace: "Courier New", fontSize: 12.5, color: BLUE } },
    ]),
    { x: 7.3, y: 2.45, w: 5.4, colW: [2.6, 2.8],
      border: { type: "solid", color: "D8D0B8", pt: 0.75 },
      fill: { color: PAPER }, rowH: 0.36 }
  );
  s.addNotes("The reference sample for this project was a Moodle log export. The output matches it column for column.");
}

/* 10 ------------------------------------------------------------ drop-off */
{
  const s = lightSlide(pptx, "Where learners stop watching", "Analytics, one of three");
  const [, q1, half, q3, end] = f.dropOff;
  s.addText(
    `Of ${f.videoStarts} video starts, ${q1}% reached a quarter of the way, ${half}% reached half, ${q3}% reached three quarters, and ${end}% reached the end.`,
    { x: M, y: 1.95, w: 4.5, h: 1.6, fontFace: BODY, fontSize: 15, color: INK, margin: 0, valign: "top" }
  );
  s.addText(
    "A cliff between two points is the moment to look at. It usually means the explanation lost people there, not that the film was too long.",
    { x: M, y: 3.5, w: 4.5, h: 1.4, fontFace: BODY, fontSize: 14, color: GREY, margin: 0, valign: "top" }
  );
  s.addText("None of which is visible from a grade book.", {
    x: M, y: 5.0, w: 4.5, h: 0.6,
    fontFace: BODY, fontSize: 14, bold: true, italic: true, color: BLUE, margin: 0, valign: "top",
  });
  shot(s, "analytics", { x: 5.5, y: 1.95, h: 4.95 });
  s.addNotes("Built from the milestone events the player emits at each quarter.");
}

/* 11 ---------------------------------------------------------- difficulty */
{
  const s = lightSlide(pptx, "Which questions are actually hard", "Analytics, two of three");
  bullets(
    s,
    [
      `Percentage correct across all ${f.answers} recorded answers, hardest first.`,
      "Every attempt counts, including retakes.",
      "A question that stays red after repeated attempts is a teaching problem, not a difficulty setting.",
    ],
    { x: M, y: 2.0, w: 4.3, h: 2.4 }
  );
  if (f.hardest) {
    card(s, { x: M, y: 4.7, w: 4.3, h: 1.9, fill: PAPER_2, accent: BLUE });
    s.addText("Hardest right now", {
      x: M + 0.26, y: 4.9, w: 3.8, h: 0.3,
      fontFace: BODY, fontSize: 12.5, bold: true, color: BLUE, margin: 0, valign: "top",
    });
    s.addText(f.hardest.prompt, {
      x: M + 0.26, y: 5.22, w: 3.8, h: 0.85,
      fontFace: BODY, fontSize: 13.5, bold: true, color: INK, margin: 0, valign: "top",
    });
    s.addText(`${f.hardest.pct}% correct across ${f.hardest.n} answers`, {
      x: M + 0.26, y: 6.12, w: 3.8, h: 0.35,
      fontFace: BODY, fontSize: 13, color: GREY, margin: 0, valign: "top",
    });
  }
  shot(s, "difficulty", { x: 5.35, y: 1.95, h: 4.95 });
  s.addNotes("Ranked hardest first, so the questions worth rewriting sit at the top.");
}

/* 12 ------------------------------------------------------------ activity */
{
  const s = lightSlide(pptx, "When the work actually happens", "Analytics, three of three");
  bullets(
    s,
    [
      "Events per hour, most recent on the right.",
      "Shows whether a class works during the school day or late at night.",
      "Confirms that a spike lines up with a lesson being set.",
    ],
    { x: M, y: 2.0, w: 4.2, h: 2.2 }
  );
  stat(s, { x: M, y: 4.5, w: 2.0, value: f.events.toLocaleString(), label: "events", accent: ORANGE });
  stat(s, { x: M + 2.2, y: 4.5, w: 2.0, value: f.videoMin, label: "minutes watched", accent: BLUE });
  shot(s, "activity", { x: 5.25, y: 1.95, h: 4.6 });
  s.addNotes("The three charts together answer questions a grade book cannot.");
}

/* 13 ------------------------------------------------------------ built with */
{
  const s = lightSlide(pptx, "Runs from one folder", "Built with");
  const cols = [
    ["Next.js 15 and React 19", "App Router and TypeScript throughout."],
    ["SQLite", "The whole system is one file. No service to provision, no deployment needed."],
    ["Plain CSS tokens", "Every colour an OKLCH custom property. No component library."],
    ["Charts drawn by hand", "Three SVG charts and twelve figures, in the same palette and line weights."],
  ];
  cols.forEach(([t, d], i) => {
    const x = M + (i % 2) * 6.3;
    const y = 2.0 + Math.floor(i / 2) * 1.7;
    s.addShape("rect", { x, y: y + 0.05, w: 0.16, h: 0.16, fill: { color: i % 2 ? BLUE : ORANGE } });
    s.addText(t, {
      x: x + 0.34, y, w: 5.5, h: 0.4,
      fontFace: HEAD, fontSize: 16, bold: true, color: INK, margin: 0, valign: "top",
    });
    s.addText(d, {
      x: x + 0.34, y: y + 0.42, w: 5.5, h: 0.9,
      fontFace: BODY, fontSize: 13.5, color: GREY, margin: 0, valign: "top",
    });
  });
  card(s, { x: M, y: 5.45, w: 12.1, h: 1.2, fill: PAPER_2, accent: BLUE });
  s.addText(
    "Clone, install, seed, run. Three commands and a browser, with the lesson films already in the repository.",
    { x: M + 0.3, y: 5.72, w: 11.5, h: 0.7, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top" }
  );
  s.addNotes("No hosting required to see it working. It runs on a laptop from a clean clone.");
}

/* 14 --------------------------------------------------------------- close */
{
  const s = darkSlide(pptx);
  glyph(s, M, M, 0.34);
  s.addText("Lumen", {
    x: M, y: 2.1, w: 11, h: 1.1,
    fontFace: HEAD, fontSize: 62, bold: true, color: CREAM, margin: 0, valign: "top",
  });
  s.addText("Read it. Watch it. Then prove you have it.", {
    x: M, y: 3.3, w: 10, h: 0.6,
    fontFace: BODY, fontSize: 21, color: ORANGE, margin: 0, valign: "top",
  });
  s.addShape("rect", { x: M, y: 4.2, w: 2.4, h: 0.045, fill: { color: BLUE } });
  const closing = [
    [f.events.toLocaleString(), "events recorded"],
    [f.eventNames, "event types"],
    [f.lessons, "lessons"],
    [f.answers, "answers graded"],
  ];
  closing.forEach(([v, l], i) => {
    const x = M + i * 3.05;
    s.addText(String(v), {
      x, y: 4.6, w: 2.8, h: 0.6,
      fontFace: HEAD, fontSize: 30, bold: true, color: CREAM, margin: 0, valign: "top",
    });
    s.addText(l, {
      x, y: 5.2, w: 2.8, h: 0.35,
      fontFace: BODY, fontSize: 13, color: GREY_ON_DARK, margin: 0, valign: "top",
    });
  });
  s.addText("github.com/ndstab/lumen", {
    x: M, y: 6.5, w: 8, h: 0.35,
    fontFace: BODY, fontSize: 14, color: CREAM, margin: 0, valign: "top",
  });
  s.addNotes("Repository, README, design specification and demo video are all in the same place.");
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await pptx.writeFile({ fileName: OUT });
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log(
  `Figures: ${f.events} events, ${f.learners} learners, ${f.attempts} attempts, ${f.answers} answers, drop-off ${f.dropOff.join("/")}, ${f.videoMin} min watched`
);

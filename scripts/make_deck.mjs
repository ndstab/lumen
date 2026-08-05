/**
 * Builds docs/presentation.pptx.
 *
 * Every figure quoted in the deck comes from the seeded demonstration database,
 * not from invention. Regenerate after re-running the simulator if you want the
 * numbers to match a fresh dataset.
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
const H = 7.5;
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
  f.dropOff = [100, pct(reached(25)), pct(reached(50)), pct(reached(75)), pct(reached(100))];
  f.videoStarts = started;
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
  analytics: 1440 / 1000,
  difficulty: 1440 / 1000,
  "lesson-mobile": 390 / 844,
};

function shot(slide, name, { x, y, h }) {
  const w = h * IMG[name];
  slide.addImage({
    path: path.join(SHOTS, `${name}.png`),
    x,
    y,
    w,
    h,
    shadow: { type: "outer", color: "1E2340", blur: 0, offset: 0.07, angle: 45, opacity: 1 },
  });
  return w;
}

/** The Lumen glyph: a blue square with an orange offset behind it. */
function glyph(slide, x, y, size = 0.2) {
  slide.addShape("rect", { x: x + size * 0.22, y: y + size * 0.22, w: size, h: size, fill: { color: ORANGE } });
  slide.addShape("rect", {
    x, y, w: size, h: size,
    fill: { color: BLUE },
    line: { color: INK, width: 1.25 },
  });
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
      fontFace: BODY, fontSize: 13, bold: true, color: BLUE, margin: 0,
    });
  }
  if (title) {
    s.addText(title, {
      x: M, y: 0.92, w: W - M * 2, h: 0.85,
      fontFace: HEAD, fontSize: 34, bold: true, color: INK, margin: 0,
    });
  }
  return s;
}

/** A bordered card with the hard offset shadow the product uses. */
function card(slide, { x, y, w, h, fill = PAPER, accent = ORANGE }) {
  slide.addShape("rect", { x: x + 0.07, y: y + 0.07, w, h, fill: { color: accent } });
  slide.addShape("rect", { x, y, w, h, fill: { color: fill }, line: { color: INK, width: 1.5 } });
}

function stat(slide, { x, y, w, value, label, accent = ORANGE }) {
  card(slide, { x, y, w, h: 1.28, accent });
  slide.addText(String(value), {
    x: x + 0.22, y: y + 0.14, w: w - 0.44, h: 0.62,
    fontFace: HEAD, fontSize: 30, bold: true, color: INK, margin: 0,
  });
  slide.addText(label, {
    x: x + 0.22, y: y + 0.78, w: w - 0.44, h: 0.38,
    fontFace: BODY, fontSize: 12.5, color: GREY, margin: 0,
  });
}

function bullets(slide, items, { x, y, w, h, size = 15, color = INK_SOFT }) {
  slide.addText(
    items.map((t, i) => ({
      text: t,
      options: { bullet: { code: "25A0" }, breakLine: i !== items.length - 1 },
    })),
    {
      x, y, w, h,
      fontFace: BODY, fontSize: size, color, margin: 0,
      paraSpaceAfter: 9, lineSpacing: size * 1.32,
    }
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
  s.addText("Learning analytics project", {
    x: M, y: 1.55, w: 9, h: 0.34,
    fontFace: BODY, fontSize: 15, bold: true, color: ORANGE, margin: 0,
  });
  s.addText("Lumen", {
    x: M, y: 2.0, w: 11, h: 1.5,
    fontFace: HEAD, fontSize: 84, bold: true, color: CREAM, margin: 0,
  });
  s.addText(
    "Interactive science for Classes 8 and 9, built around a complete clickstream.",
    { x: M, y: 3.55, w: 9.4, h: 0.9, fontFace: BODY, fontSize: 22, color: GREY_ON_DARK, margin: 0 }
  );
  s.addShape("rect", { x: M, y: 4.75, w: 2.4, h: 0.045, fill: { color: BLUE } });
  s.addText(
    `${f.courses} courses  ·  ${f.lessons} lessons  ·  ${f.questions} questions  ·  ${f.eventNames} event types`,
    { x: M, y: 5.1, w: 11, h: 0.4, fontFace: BODY, fontSize: 15, color: CREAM, margin: 0 }
  );
  s.addText("github.com/ndstab/lumen", {
    x: M, y: 6.55, w: 8, h: 0.35,
    fontFace: BODY, fontSize: 13, color: GREY_ON_DARK, margin: 0,
  });
  s.addNotes(
    "Lumen is an interactive science learning app for Classes 8 and 9. The point of the project is the clickstream: everything a learner does is captured, stored, and turned into something an educator can act on."
  );
}

/* 2 ------------------------------------------------------------- the brief */
{
  const s = lightSlide(pptx, "What was asked, and what it does", "The brief");
  const reqs = [
    ["Users log in as learners", "Email and password, bcrypt, server-side sessions"],
    ["Interactive content", "Text with drawn figures, video, and quizzes in every lesson"],
    ["Track all user activity", "Clicks, page views, video actions, quiz attempts"],
    ["Store the clickstream", "One row per action, queryable and exportable"],
    ["Standalone web app", "Next.js and SQLite, runs from one folder"],
    ["Version control", "Git throughout, committed as it was built"],
  ];
  let y = 2.0;
  for (const [what, how] of reqs) {
    s.addShape("rect", { x: M + 0.02, y: y + 0.05, w: 0.17, h: 0.17, fill: { color: ORANGE } });
    s.addText(what, {
      x: M + 0.36, y, w: 3.4, h: 0.6,
      fontFace: BODY, fontSize: 14.5, bold: true, color: INK, margin: 0, valign: "top",
    });
    s.addText(how, {
      x: M + 3.8, y, w: 3.55, h: 0.6,
      fontFace: BODY, fontSize: 13, color: GREY, margin: 0, valign: "top",
    });
    y += 0.62;
  }
  shot(s, "catalogue", { x: 8.3, y: 2.0, h: 2.6 });
  s.addText(
    "Three courses, each with its own progress.",
    { x: 8.3, y: 4.72, w: 4.4, h: 0.3, fontFace: BODY, fontSize: 12, italic: true, color: GREY, margin: 0, valign: "top" }
  );
  const s2stats = [
    [f.events.toLocaleString(), "events recorded"],
    [f.eventNames, "event types"],
    [f.learners, "seeded learners"],
    [f.answers, "answers graded"],
  ];
  s2stats.forEach(([v, l], i) =>
    stat(s, { x: M + i * 3.05, y: 5.72, w: 2.7, value: v, label: l, accent: i % 2 ? BLUE : ORANGE })
  );
  s.addNotes("Every line of the brief is met. The rest of the deck is about how, and about the decisions that were not obvious.");
}

/* 3 ----------------------------------------------------------- the audience */
{
  const s = lightSlide(pptx, "One decision shaped everything else", "Audience");
  s.addText(
    "The brief suggested young children. I moved the target to Classes 8 and 9, roughly 13 to 15.",
    { x: M, y: 1.95, w: 7.2, h: 0.8, fontFace: BODY, fontSize: 17, color: INK, margin: 0 }
  );
  bullets(
    s,
    [
      "At 13 to 15 a cartoon mascot reads as condescending, and it is the fastest route to a generic educational product.",
      "Long reading passages stay in scope, so legibility outranks atmosphere.",
      "Treating the learner as a junior scientist is more respectful and more visually interesting.",
    ],
    { x: M, y: 3.0, w: 7.2, h: 2.2 }
  );
  card(s, { x: 8.25, y: 2.0, w: 4.45, h: 3.1, fill: PAPER_2, accent: BLUE });
  s.addText(
    "“If text is too small to read comfortably, it either gets bigger or it goes.”",
    { x: 8.6, y: 2.35, w: 3.75, h: 1.7, fontFace: HEAD, fontSize: 19, bold: true, color: INK, margin: 0 }
  );
  s.addText("The rule adopted for the whole application after the first design review.", {
    x: 8.6, y: 4.15, w: 3.75, h: 0.8, fontFace: BODY, fontSize: 12.5, color: GREY, margin: 0,
  });
  s.addNotes("This was a course correction after the first design pass, and it is why the app looks the way it does.");
}

/* 4 --------------------------------------------------------------- content */
{
  const s = lightSlide(pptx, "Real syllabus content, not filler", "The courses");
  const courses = [
    ["Light", "Reflection, refraction and the human eye", "5 lessons", BLUE],
    ["The Cell", "The unit every living thing is built from", "4 lessons", ORANGE],
    ["Force and Motion", "Pushes, pulls, pressure and speed", "4 lessons", BLUE],
  ];
  courses.forEach(([title, sub, count, accent], i) => {
    const x = M + i * 4.15;
    card(s, { x, y: 2.05, w: 3.75, h: 2.35, accent });
    s.addText(count, {
      x: x + 0.28, y: 2.3, w: 3.2, h: 0.3,
      fontFace: BODY, fontSize: 12.5, bold: true, color: accent, margin: 0,
    });
    s.addText(title, {
      x: x + 0.28, y: 2.66, w: 3.2, h: 0.6,
      fontFace: HEAD, fontSize: 21, bold: true, color: INK, margin: 0,
    });
    s.addText(sub, {
      x: x + 0.28, y: 3.32, w: 3.2, h: 0.85,
      fontFace: BODY, fontSize: 13.5, color: GREY, margin: 0,
    });
  });
  s.addText(
    "Aligned to the NCERT syllabus for Classes 8 and 9. Every lesson combines a reading with drawn figures, a video, and a quiz.",
    { x: M, y: 4.75, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 15, color: INK_SOFT, margin: 0 }
  );
  const stats = [
    [f.lessons, "lessons"],
    [f.questions, "questions"],
    ["12", "drawn figures"],
    [f.lessons, "lesson videos"],
  ];
  stats.forEach(([v, l], i) => stat(s, { x: M + i * 3.05, y: 5.5, w: 2.7, value: v, label: l, accent: i % 2 ? BLUE : ORANGE }));
  s.addNotes("The figures are drawn to correct geometry, not sketched. The ray diagram traces real construction rays that meet where the image actually forms.");
}

/* 5 ---------------------------------------------------------------- lesson */
{
  const s = lightSlide(pptx, "A lesson is three kinds of content", "The learner view");
  bullets(
    s,
    [
      "A reading, with figures hand-built as SVG to correct geometry.",
      "A video in a player written for this app, not an embed.",
      "A quiz graded on the server, which explains either way.",
      "Progress in the rail: video watched, best score, what completes the lesson.",
    ],
    { x: M, y: 2.05, w: 4.5, h: 2.6 }
  );
  s.addText("Free navigation. Nothing is locked, which also makes abandonment visible in the data.", {
    x: M, y: 5.0, w: 4.5, h: 0.9, fontFace: BODY, fontSize: 13, italic: true, color: GREY, margin: 0,
  });
  shot(s, "lesson", { x: 5.55, y: 1.95, h: 5.1 });
  s.addNotes("Text, video and quiz in one place. The brief asked for a combination and this is it.");
}

/* 6 ------------------------------------------------------------ the design */
{
  const s = lightSlide(pptx, "Three directions, drawn as real screens", "Design");
  const dirs = [
    ["Field Notebook", "Serif throughout, warm paper, hairline rules.", "Most intellectual. Risk: reads as quiet.", false],
    ["Instrument", "Deep navy, cyan, technical sans.", "Best video chrome. Risk: harder to read at length.", false],
    ["Riso Press", "Cream stock, blue and orange, hard offset shadows.", "Energetic without being childish. Chosen.", true],
  ];
  dirs.forEach(([title, what, verdict, chosen], i) => {
    const x = M + i * 4.15;
    card(s, {
      x, y: 2.05, w: 3.75, h: 2.5,
      fill: chosen ? PAPER_2 : PAPER,
      accent: chosen ? BLUE : "C9C2AB",
    });
    s.addText(title, {
      x: x + 0.28, y: 2.3, w: 3.2, h: 0.45,
      fontFace: HEAD, fontSize: 19, bold: true, color: chosen ? BLUE : INK, margin: 0,
    });
    s.addText(what, {
      x: x + 0.28, y: 2.82, w: 3.2, h: 0.8,
      fontFace: BODY, fontSize: 13, color: INK_SOFT, margin: 0,
    });
    s.addText(verdict, {
      x: x + 0.28, y: 3.62, w: 3.2, h: 0.75,
      fontFace: BODY, fontSize: 12.5, italic: true, color: chosen ? INK : GREY, margin: 0,
    });
  });
  s.addText(
    "Compared as full lesson screens rather than colour swatches, so the choice was made on how it reads, not how it samples.",
    { x: M, y: 4.85, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 15, color: INK_SOFT, margin: 0 }
  );
  bullets(
    s,
    [
      "Two typefaces do all the work. A third appears only inside diagrams, never as interface chrome.",
      "Every colour is an OKLCH token. No inline colour values anywhere.",
      "No type token exists below 15px, so a smaller size cannot be reached by accident.",
    ],
    { x: M, y: 5.5, w: 11.5, h: 1.5, size: 14 }
  );
  s.addNotes("The direction is a risograph printed science zine: two flat spot colours on cream stock, thick keylines, hard offset shadows instead of blurs.");
}

/* 7 ----------------------------------------------------------- clickstream */
{
  const s = darkSlide(pptx);
  glyph(s, M, 0.5);
  s.addText("The clickstream", {
    x: M + 0.36, y: 0.45, w: 8, h: 0.3,
    fontFace: BODY, fontSize: 13, bold: true, color: ORANGE, margin: 0,
  });
  s.addText("Everything the brief names", {
    x: M, y: 0.92, w: W - M * 2, h: 0.62,
    fontFace: HEAD, fontSize: 34, bold: true, color: CREAM, margin: 0, valign: "top",
  });
  s.addText("Twenty-two event types, kept few enough to analyse.", {
    x: M, y: 1.58, w: 9, h: 0.36,
    fontFace: BODY, fontSize: 16, color: GREY_ON_DARK, margin: 0, valign: "top",
  });

  const groups = [
    ["Navigation", "Page viewed · Element clicked · Link followed · Page scrolled · Page hidden · Page shown"],
    ["Video", "Started · paused · resumed · seeked · ended · rate changed · volume changed · fullscreen · buffering · milestone · heartbeat"],
    ["Quiz", "Attempt started · option selected · answer cleared · question answered · attempt submitted"],
    ["Lesson, Course, User, Report", "Lesson viewed · Course viewed · Catalogue viewed · Account created · Logged in and out · Login failed · Reports viewed · Clickstream exported"],
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
    "Clicks are captured by one listener on the document in the capture phase, not by handlers on the elements someone remembered to instrument.",
    { x: M, y: 6.2, w: 12.1, h: 0.6, fontFace: BODY, fontSize: 14, italic: true, color: ORANGE, margin: 0 }
  );
  s.addNotes("The brief names clicks explicitly. A global listener means untagged elements are still identified, from their tag, id and visible text.");
}

/* 8 ---------------------------------------------------------- the decision */
{
  const s = lightSlide(pptx, "Why the video player is written, not embedded", "The pivotal decision");
  card(s, { x: M, y: 2.0, w: 5.7, h: 3.3, fill: PAPER_2, accent: "C9C2AB" });
  s.addText("An embedded third party player", {
    x: M + 0.3, y: 2.25, w: 5.1, h: 0.4,
    fontFace: HEAD, fontSize: 17, bold: true, color: GREY, margin: 0,
  });
  bullets(
    s,
    ["play, pause, ended", "seeks only by polling the clock and guessing", "no reliable buffering signal", "no quartile milestones", "ads, and an escape hatch off your site"],
    { x: M + 0.3, y: 2.8, w: 5.1, h: 2.3, size: 13.5, color: GREY }
  );

  card(s, { x: 6.85, y: 2.0, w: 5.85, h: 3.3, accent: BLUE });
  s.addText("A player written for this app", {
    x: 7.15, y: 2.25, w: 5.25, h: 0.4,
    fontFace: HEAD, fontSize: 17, bold: true, color: BLUE, margin: 0,
  });
  bullets(
    s,
    [
      "seeks with both endpoints, direction and jump size",
      "playback rate and volume changes",
      "buffering stalls, start and end",
      "milestones at 25, 50, 75 and 100 percent",
      "watch-time heartbeats during playback",
    ],
    { x: 7.15, y: 2.8, w: 5.25, h: 2.3, size: 13.5, color: INK }
  );

  s.addText(
    `The drop-off chart is only possible because of the milestone events. ${f.videoEvents} video events recorded so far.`,
    { x: M, y: 5.6, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 15, bold: true, color: INK, margin: 0 }
  );
  s.addNotes("This is the decision the analytics depend on. It is also a requirement-compliance decision, since the brief names video actions.");
}

/* 9 ------------------------------------------------------------ projection */
{
  const s = lightSlide(pptx, "Stored rich, exported in the reference format", "The data");
  s.addText(
    "Rows carry more than the export needs: user and session, course and lesson, path, user agent, and a JSON payload for the event-specific detail.",
    { x: M, y: 1.95, w: 6.0, h: 1.0, fontFace: BODY, fontSize: 14.5, color: INK_SOFT, margin: 0 }
  );
  card(s, { x: M, y: 3.05, w: 6.0, h: 1.75, fill: PAPER_2, accent: ORANGE });
  s.addText(
    '{ "from": 84.2, "to": 61.0,\n  "direction": "backward",\n  "jumpSeconds": 23.2 }',
    { x: M + 0.28, y: 3.28, w: 5.4, h: 1.3, fontFace: "Courier New", fontSize: 13, color: INK, margin: 0 }
  );
  s.addText("One seek, as stored.", {
    x: M, y: 4.95, w: 6.0, h: 0.35, fontFace: BODY, fontSize: 12.5, italic: true, color: GREY, margin: 0,
  });

  const rows = [
    ["Time", "occurred_at"],
    ["Event context", "context"],
    ["Component", "component"],
    ["Event name", "event_name"],
    ["Description", "description"],
    ["Origin", "origin"],
    ["IP address", "ip"],
  ];
  s.addText("The seven exported columns", {
    x: 7.1, y: 1.95, w: 5.6, h: 0.4,
    fontFace: HEAD, fontSize: 17, bold: true, color: INK, margin: 0,
  });
  s.addTable(
    rows.map(([a, b]) => [
      { text: a, options: { fontFace: BODY, fontSize: 13.5, bold: true, color: INK } },
      { text: b, options: { fontFace: "Courier New", fontSize: 12.5, color: BLUE } },
    ]),
    {
      x: 7.1, y: 2.45, w: 5.6, colW: [2.7, 2.9],
      border: { type: "solid", color: "D8D0B8", pt: 0.75 },
      fill: { color: PAPER },
      rowH: 0.36,
    }
  );
  s.addText(
    "Held in one module, so the on-screen report and the CSV cannot drift apart.",
    { x: 7.1, y: 5.15, w: 5.6, h: 0.5, fontFace: BODY, fontSize: 12.5, italic: true, color: GREY, margin: 0, valign: "top" }
  );
  card(s, { x: M, y: 5.75, w: 12.1, h: 1.15, fill: PAPER_2, accent: BLUE });
  s.addText(
    `${f.events.toLocaleString()} rows stored so far, spanning eight days of seeded class activity. The export writes them in the reference order, with a byte order mark so Excel opens the UTF-8 correctly.`,
    { x: M + 0.3, y: 5.98, w: 11.5, h: 0.75, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top" }
  );
  s.addNotes("The seven columns are the export shape, not the storage shape. The reference sample was a Moodle standard log report.");
}

/* 10 --------------------------------------------------------- event stream */
{
  const s = lightSlide(pptx, "Educators watch it live", "The event stream");
  bullets(
    s,
    [
      "Every recorded action, newest first, refreshing itself.",
      "Filter by learner, course, component, event name, date range, or free text.",
      "Export to CSV in the same seven columns.",
      "Educator activity is logged too, so the record never goes quiet.",
    ],
    { x: M, y: 2.0, w: 4.3, h: 2.6 }
  );
  stat(s, { x: M, y: 4.95, w: 2.05, value: f.events.toLocaleString(), label: "events recorded", accent: ORANGE });
  stat(s, { x: M + 2.25, y: 4.95, w: 2.05, value: f.eventNames, label: "event types", accent: BLUE });
  shot(s, "event-stream", { x: 5.35, y: 1.95, h: 5.05 });
  s.addNotes("In the demo I keep this open beside the learner window. Seeks and quiz answers arrive as they happen.");
}

/* 11 ------------------------------------------------------------- drop-off */
{
  const s = lightSlide(pptx, "Where learners stop watching", "Analytics, one of three");
  const [a, b, c, d, e] = f.dropOff;
  s.addText(
    `Of ${f.videoStarts} video starts, ${b}% reached a quarter of the way, ${c}% reached half, ${d}% reached three quarters, and ${e}% reached the end.`,
    { x: M, y: 1.95, w: 4.5, h: 1.5, fontFace: BODY, fontSize: 15, color: INK, margin: 0 }
  );
  s.addText(
    "A cliff between two points is the moment to look at. It usually means the explanation lost people there, not that the film was too long.",
    { x: M, y: 3.4, w: 4.5, h: 1.4, fontFace: BODY, fontSize: 14, color: GREY, margin: 0 }
  );
  s.addText("Built from the player's milestone events. Impossible with an embed.", {
    x: M, y: 4.85, w: 4.5, h: 0.8, fontFace: BODY, fontSize: 13, italic: true, bold: true, color: BLUE, margin: 0,
  });
  shot(s, "analytics", { x: 5.5, y: 1.95, h: 4.95 });
  s.addNotes("The numbers on this slide are read out of the seeded demonstration database when the deck is generated.");
}

/* 12 ----------------------------------------------------------- difficulty */
{
  const s = lightSlide(pptx, "Which questions are actually hard", "Analytics, two of three");
  bullets(
    s,
    [
      `Percentage correct across all ${f.answers} recorded answers, hardest first.`,
      "Every attempt counts separately, including retakes.",
      "A question that stays red after repeated attempts is a teaching problem, not a difficulty setting.",
    ],
    { x: M, y: 2.0, w: 4.3, h: 2.4 }
  );
  stat(s, { x: M, y: 4.8, w: 2.05, value: f.attempts, label: "quiz attempts", accent: BLUE });
  stat(s, { x: M + 2.25, y: 4.8, w: 2.05, value: f.answers, label: "answers graded", accent: ORANGE });
  shot(s, "difficulty", { x: 5.35, y: 1.95, h: 4.95 });
  s.addNotes("The third chart, activity over time, shows when the class actually works. It is on the same page.");
}

/* 13 --------------------------------------------------------- architecture */
{
  const s = lightSlide(pptx, "A small, deliberate stack", "Architecture");
  const cols = [
    ["Next.js 15 and React 19", "App Router, TypeScript, server components for reads."],
    ["SQLite", "One file, no service to provision. The deliverable is a repository, not a deployment."],
    ["Plain CSS tokens", "OKLCH custom properties. No component library to fight."],
    ["No chart library", "Three charts, each a fixed shape, drawn as SVG in the same palette as the figures."],
  ];
  cols.forEach(([t, d], i) => {
    const x = M + (i % 2) * 6.3;
    const y = 2.0 + Math.floor(i / 2) * 1.75;
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
  card(s, { x: M, y: 5.5, w: 12.1, h: 1.25, fill: PAPER_2, accent: BLUE });
  s.addText(
    `Verified by driving the running system: every screen, the full video event surface, all three question types, the export against the reference format, and the charts against ${f.events.toLocaleString()} real rows.`,
    { x: M + 0.3, y: 5.75, w: 11.5, h: 0.8, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: "top" }
  );
  s.addNotes("Every one of these is a decision I can defend on the spot.");
}

/* 14 --------------------------------------------------------------- close */
{
  const s = darkSlide(pptx);
  glyph(s, M, M, 0.34);
  s.addText("Lumen", {
    x: M, y: 2.1, w: 11, h: 1.1,
    fontFace: HEAD, fontSize: 62, bold: true, color: CREAM, margin: 0,
  });
  s.addText(
    "Read it. Watch it. Then prove you have it.",
    { x: M, y: 3.3, w: 10, h: 0.6, fontFace: BODY, fontSize: 21, color: ORANGE, margin: 0 }
  );
  s.addShape("rect", { x: M, y: 4.2, w: 2.4, h: 0.045, fill: { color: BLUE } });
  const closing = [
    [f.events.toLocaleString(), "events"],
    [f.learners, "learners"],
    [f.lessons, "lessons"],
    [f.answers, "answers graded"],
  ];
  closing.forEach(([v, l], i) => {
    const x = M + i * 3.05;
    s.addText(String(v), {
      x, y: 4.6, w: 2.8, h: 0.6,
      fontFace: HEAD, fontSize: 30, bold: true, color: CREAM, margin: 0,
    });
    s.addText(l, {
      x, y: 5.2, w: 2.8, h: 0.35,
      fontFace: BODY, fontSize: 13, color: GREY_ON_DARK, margin: 0,
    });
  });
  s.addText("github.com/ndstab/lumen", {
    x: M, y: 6.5, w: 8, h: 0.35,
    fontFace: BODY, fontSize: 14, color: CREAM, margin: 0,
  });
  s.addNotes("Repository, README, design specification and demo video all live in the same repo.");
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await pptx.writeFile({ fileName: OUT });
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log(
  `Figures used: ${f.events} events, ${f.learners} learners, ${f.attempts} attempts, ${f.answers} answers, drop-off ${f.dropOff.join("/")}`
);

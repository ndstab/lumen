# Lumen

An interactive science learning app for Classes 8 and 9, built around a complete
clickstream. Every page view, click, scroll, video action and quiz answer is
captured and stored, then made available to educators as a live event stream, a
CSV export in the standard seven column log format, and three analytics views.

Three courses, thirteen lessons, seventy questions, and a lesson video for every
lesson.

![The Lumen landing page](docs/screens/landing.png)

---

## Contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Accounts](#accounts)
- [Take the tour](#take-the-tour)
- [The clickstream](#the-clickstream)
- [Analytics](#analytics)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [Design](#design)
- [Scripts](#scripts)

---

## What it does

### For learners

- Sign up or sign in as a learner
- Browse three courses and pick a lesson
- Every lesson combines three kinds of interactive content: **text** with hand
  drawn figures, a **video** in a custom player, and a **quiz**
- Quizzes offer three question types (single answer, select all that apply, and
  numeric entry), graded on the server, with an explanation shown whether the
  answer was right or wrong
- Unlimited retakes, and every attempt is stored separately
- Progress is tracked per lesson and per course

A lesson page: the reading, a hand built figure, the video player, and progress
in the rail.

![A lesson page](docs/screens/lesson.png)

Quizzes are graded on the server and explain either way.

![A quiz question](docs/screens/quiz.png)

### For educators

- A live **event stream**: every recorded action, newest first, filterable by
  learner, course, component, event name, date range and free text search
- **CSV export** in the exact seven column layout of a Moodle standard log report
- Three **analytics** views built from the clickstream: video drop-off, quiz item
  difficulty, and activity over time

![The event stream](docs/screens/event-stream.png)

---

## Quick start

Requirements: **Node 20 or newer**. Nothing else.

```bash
npm install
npm run seed
npm run dev
```

Open http://localhost:3000 and sign in with one of the [accounts](#accounts)
below.

`npm run seed` creates `data/app.db`, applies the schema, loads the three
courses and creates the demonstration accounts. It is safe to re-run: course
content is rebuilt and recorded events are kept. Use `npm run seed:fresh` for a
completely clean database.

The lesson videos are committed to the repository, so the app works immediately
after cloning with no extra tooling.

### Populating the analytics

A brand new database has no activity in it, so the charts start empty. To fill
them with a body of realistic demonstration activity, leave the dev server
running and in a second terminal run:

```bash
npm run simulate
```

This signs in as each seeded learner and works through lessons, videos and
quizzes over the real HTTP endpoints, so everything it produces passes through
the same tracking and grading code a real learner would. It spreads the
generated activity across the previous few days, so the activity chart shows a
daily rhythm rather than a single tall bar.

---

## Accounts

The password for every seeded account is `lumen1234`.

| Email | Role |
| --- | --- |
| `aarav@lumen.school` | learner |
| `diya@lumen.school` | learner |
| `kabir@lumen.school` | learner |
| `teacher@lumen.school` | **educator** |

There are ten seeded learners in total (`aarav`, `diya`, `kabir`, `meera`,
`rohan`, `ananya`, `vihaan`, `ishita`, `arjun` and `sara`, all
`@lumen.school`), each with a different work rate and ability so the analytics
have a realistic spread. You can also create your own learner account from the
sign-up page.

Only `teacher@lumen.school` can reach the event stream and the analytics.

---

## Take the tour

The most interesting thing about this project is watching the clickstream fill
in while you use the app. To see that, open two browser windows side by side.

1. In the **first window**, sign in as `teacher@lumen.school` and open the event
   stream. Leave it there. It refreshes itself.
2. In a **second window** (use a private window so the sessions do not collide),
   sign in as `aarav@lumen.school` and open a lesson.
3. Press play. **Drag the scrubber backwards.** Change the playback speed. Then
   take the quiz and get one wrong on purpose.
4. Watch the first window. Seeks arrive with both endpoints, quiz answers arrive
   with the attempt they belonged to.

Three more things worth trying:

- **Click a plain paragraph.** An `Element clicked` row still appears, because
  clicks are captured by one listener on the document rather than by handlers
  added to individual elements.
- **Press Export CSV** on the event stream and open the file. Seven columns,
  matching the reference log format.
- **Narrow the window to phone width.** No horizontal scroll, and no clickable
  label wraps to two lines.

If you would rather watch than run it, there is a silent 80 second walkthrough of
the running application at [`docs/demo.mp4`](docs/demo.mp4).

---

## The clickstream

Everything worth tracking is tracked, and the vocabulary is kept small enough to
analyse.

| Component | Events |
| --- | --- |
| **Navigation** | Page viewed, Element clicked, Link followed, Page scrolled, Page hidden, Page shown |
| **Video** | Video started, paused, resumed, seeked, ended, playback rate changed, volume changed, entered and exited fullscreen, buffering started and ended, milestone reached, watch heartbeat |
| **Quiz** | Quiz attempt started, Quiz option selected, Quiz answer cleared, Quiz question answered, Quiz attempt submitted |
| **Lesson** | Lesson viewed |
| **Course** | Course viewed, Course catalogue viewed |
| **User** | User account created, User logged in, User logged out, Login failed |
| **Report** | Event stream viewed, Analytics dashboard viewed, Clickstream exported |

Some details worth calling out:

- **Clicks are captured globally.** The tracker listens on the document in the
  capture phase rather than relying on handlers being added to each element, so
  untagged elements still produce a usable identifier from their tag, id and
  visible text.
- **Seeks carry both endpoints.** A seek records where the learner jumped from,
  where they jumped to, the direction and the size of the jump. That is only
  possible because the video player is self hosted rather than an embed.
- **Identity is resolved on the server.** The browser reports what happened, not
  who did it. A tampered payload cannot forge another learner's activity, and
  the event names a browser is allowed to send are checked against a closed list.
- **Events survive navigation.** The queue is batched and flushed with
  `navigator.sendBeacon` on page hide, where a normal request would be cancelled.
- **Logging never breaks the lesson.** Every write is wrapped, so a failure to
  record an event cannot interrupt what the learner was doing.
- **Reports do not log their own refreshes.** The event stream reloads itself so
  it can be watched live. Those ticks are throttled out, so the report does not
  fill the log by observing itself. A real navigation or reload still records.

### The seven column projection

Rows are shaped so a Moodle standard log report can be projected straight out of
them. `src/lib/moodle.ts` holds that projection, so the on-screen table and the
CSV export can never drift apart.

| Moodle column | Source |
| --- | --- |
| Time | `occurred_at`, rendered as `5/08/26, 09:56:05` |
| Event context | `context`, for example `Lesson: Where the image forms in a convex lens` |
| Component | `component` |
| Event name | `event_name` |
| Description | `description`, written as a sentence naming the actor and the object |
| Origin | `origin` |
| IP address | `ip` |

The stored row carries more than these seven columns: user id, session id,
course and lesson ids, path, user agent, and a JSON `meta` object holding the
event specific payload. For a seek, that payload looks like this:

```json
{ "from": 84.2, "to": 61.0, "direction": "backward", "jumpSeconds": 23.2 }
```

The seven columns are the export shape, not the storage shape.

---

## Analytics

Three views, each answering a question a grade book cannot.

![Video drop-off](docs/screens/analytics.png)

**Where learners stop watching.** The share of video starts that reached each
quarter of the film. A cliff between two points marks the moment an explanation
lost people. Built from the milestone events the player emits at 25, 50, 75 and
100 percent, which is why the player had to be self hosted.

![Question difficulty](docs/screens/difficulty.png)

**Which questions are actually hard.** Percentage of recorded answers that were
correct, hardest first. Every attempt counts separately, including retakes, so a
question that stays red after repeated attempts is a teaching problem rather
than a difficulty setting.

**When the work happens.** Events per hour, useful for seeing whether a class
works during the school day or late at night.

The charts are drawn by hand as SVG rather than pulled from a plotting library.
There are only three, each is a fixed shape, and drawing them keeps them in the
same palette and line weights as the lesson figures.

---

## Architecture

```
Browser                          Server                        SQLite
-------                          ------                        ------
Tracker (global listeners)  ->   POST /api/events         ->   events
VideoPlayer (media events)  ->   POST /api/events         ->   events
                            ->   POST /api/progress/video ->   lesson_progress
Quiz                        ->   POST /api/quiz/start     ->   quiz_attempts
                            ->   POST /api/quiz/answer    ->   quiz_responses + events
                            ->   POST /api/quiz/submit    ->   quiz_attempts + events
Server components           ->   recordEvent()            ->   events

Educator pages              <-   lib/analytics.ts         <-   events, quiz_*
GET /api/events/export      <-   lib/moodle.ts            <-   events
```

**Stack**: Next.js 15 (App Router) with React 19 and TypeScript, SQLite through
`better-sqlite3`, and plain CSS with a custom property token layer. Passwords are
hashed with bcrypt, and sessions are opaque tokens in an httpOnly cookie, stored
server side.

**Why SQLite**: the whole application runs from a single file with no service to
provision, so cloning the repository is enough to get a working system.
`better-sqlite3` is synchronous, which suits request handlers doing a handful of
small reads.

**Why no chart or component library**: the visual design is specific enough that
a library would have been fought rather than used, and the three charts and
twelve figures are each simple in isolation.

---

## Project layout

```
scripts/
  seed.mjs              creates and loads the database
  content/              the three courses, as plain data
  make_videos.py        renders lesson videos from the lesson content
  simulate.mjs          generates demonstration activity over real endpoints
src/
  app/
    page.tsx            landing
    login/  signup/     authentication screens
    courses/            catalogue, course overview, lesson pages
    educator/           event stream and analytics
    api/                auth, events, quiz and progress endpoints
    globals.css         the design system
  components/
    Tracker.tsx         global clickstream capture
    VideoPlayer.tsx     custom player and its event surface
    Quiz.tsx            question rendering and immediate feedback
    Figures.tsx         the hand built lesson diagrams
    Charts.tsx          the three analytics charts
  lib/
    schema.sql          database schema
    db.ts               connection and row types
    session.ts          passwords, sessions, request context
    events.ts           the clickstream writer
    moodle.ts           the seven column projection and CSV
    content.ts          course and progress queries
    analytics.ts        the educator queries
docs/
  design.md             the design specification
  demo.mp4              walkthrough of the running app
  presentation.pptx     project presentation
  screens/              screenshots used in this README
```

---

## Design

The direction is **Riso Press**: a risograph printed science zine. Two flat spot
colours (blue and orange) on cream stock, a heavy geometric display face, thick
keylines, and hard offset shadows instead of blurs. It targets 13 to 15 year
olds, which is old enough that a cartoon mascot would read as condescending and
young enough that a plain document would read as homework.

Rules the stylesheet enforces:

1. Nothing renders below 15px. There is no smaller type token.
2. No uppercase letterspaced micro-labels. Labels are sentence case and say
   something.
3. Every colour is an OKLCH token. No inline colour values.
4. Every interactive element styles all eight states.
5. Motion animates transform and opacity only, and collapses under
   `prefers-reduced-motion`.

Two typefaces do all the work: **Bricolage Grotesque** for headings and **Work
Sans** for everything read. **JetBrains Mono** appears only inside technical
drawings, never as interface chrome.

The lesson figures are drawn to correct geometry rather than sketched. The convex
lens diagram traces a real parallel ray through the far focus and a real central
ray, and they meet where the image actually forms. The cell size chart is
genuinely logarithmic.

It holds up on a phone: no horizontal scroll at 375px, and no clickable label
ever wraps to two lines.

<img src="docs/screens/lesson-mobile.png" alt="A lesson page on a phone" width="320">

The full specification is in [docs/design.md](docs/design.md).

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run seed` | Create or refresh the database and course content |
| `npm run seed:fresh` | Delete the database and start over |
| `npm run simulate` | Generate demonstration activity (dev server must be running) |
| `npm run media` | Rebuild the lesson videos (needs Python with Pillow, and ffmpeg) |

If you run `npm run seed:fresh` while the dev server is running, restart the
server afterwards. It holds an open handle to the database file that was
replaced.

---

The seeded accounts, learners and activity are demonstration data, created so
the analytics have something to show on a fresh install.

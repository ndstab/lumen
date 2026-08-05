# Lumen: design specification

Written before the build, kept in step with it. This is the record of what was
decided and why.

---

## 1. The brief, restated

Build a learning application where users log in as learners. Offer interactive
content combining text, video and quizzes. Track all user activity (clicks, page
views, video actions, quiz attempts) and store that clickstream. Deliver a
standalone web app under version control, with a README, a demo video and a
presentation.

The reference for the clickstream shape is a Moodle standard log export with
seven columns: Time, Event context, Component, Event name, Description, Origin,
IP address.

---

## 2. Audience

**Classes 8 and 9, roughly 13 to 15 years old.**

This was revised upward from an initial "young kids" framing, and the revision
drove most of the design. At 13 to 15:

- A cartoon mascot reads as condescending. It is the single fastest route to a
  generic, primary-coloured, indistinguishable educational product.
- Long reading passages are still in scope, so legibility outranks atmosphere.
- Treating the learner as a junior scientist rather than a child is both more
  respectful and more visually interesting.

Content is aligned to the NCERT syllabus so it is real material rather than
invented filler.

---

## 3. Scope

| Area | Decision |
| --- | --- |
| Courses | Three. One flagship built to full depth, two lighter ones proving the system is not a one-off |
| Lessons | 13 total, each with text, a video and a quiz |
| Question types | Single answer, select all that apply, numeric entry |
| Quiz behaviour | Unlimited retakes, immediate per-question feedback with explanation, every attempt stored separately |
| Navigation | Free. No forced linear unlock |
| Roles | Learner and educator, as a real role on the account |
| Educator view | Live filterable event stream, CSV export, three charts |
| Video | Self hosted MP4 with a custom player |

---

## 4. Visual direction

### The choice

Three directions were drawn as full lesson screens and compared side by side,
rather than as colour swatches:

- **Field Notebook**: Fraunces and Newsreader, warm paper, vermilion, hairline
  rules. The most intellectual. Risk: reads as quiet.
- **Instrument**: Space Grotesk and IBM Plex, deep navy, cyan. Best video
  chrome. Risk: harder to read long passages, feels more product than school.
- **Riso Press**: Bricolage Grotesque and Work Sans, cream stock, blue and
  orange, hard offset shadows. Most energetic without being childish.

**Riso Press was chosen.** A risograph printed science zine: two flat spot
colours on cream stock, heavy geometric display, thick keylines, and hard offset
shadows instead of blurs.

### The legibility revision

The first Riso Press draft used an 11px uppercase letterspaced breadcrumb
(`LIGHT / LESSON 3`) and a 10.5px `CHECK YOURSELF` label. Both were decoration
rather than communication, and both were cut. The rule adopted for the whole
application:

> If text is too small to read comfortably, it either gets bigger or it goes.

Concretely:

- The breadcrumb became `Light · Lesson 3` at 16px, sentence case, and a working
  link.
- `CHECK YOURSELF` became "Question 2 of 6", which tells the learner something.
- Diagram labels went from 10px to 14px.
- **There is no type token below 15px.** Not a guideline: the smallest value in
  the scale is 15px, so a smaller size cannot be reached without adding one.

### Tokens

Colour is OKLCH throughout, declared once at `:root`. No inline colour values
anywhere in the codebase.

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `oklch(96.5% 0.022 92)` | Cream stock |
| `--ink` | `oklch(23% 0.040 265)` | Body text |
| `--accent` | `oklch(52% 0.210 262)` | Riso blue |
| `--accent-2` | `oklch(68% 0.190 42)` | Riso orange |
| `--ok` / `--bad` | green / red | Quiz feedback only |

Type scale, six steps: 15, 16, 17.5, 20, 24, 30px, plus a clamped display size.

Spacing is a 4pt scale with semantic names. Border radius is `0`. Shadows are
hard offsets (`5px 5px 0`), never blurs.

### Typography

Two families do all the work, plus one confined to drawings:

- **Bricolage Grotesque** (700, 800): every heading.
- **Work Sans** (400 to 700): everything read.
- **JetBrains Mono** (400, 500): inside technical diagrams only. Never interface
  chrome.

That restraint is most of why the result does not look generated.

### Interaction

Every interactive element styles all eight states: default, hover,
`:focus-visible`, active, disabled, loading, error, success. Focus rings are
never animated. Motion animates `transform` and `opacity` only, uses three named
easings, and collapses under `prefers-reduced-motion`.

### Figures

Twelve lesson diagrams, hand-built as SVG, sharing one drawing language through
the `.dgm` classes.

They are drawn to correct geometry rather than sketched:

- The convex lens diagram traces a real parallel ray refracting through the far
  focus and a real central ray passing undeviated, and they meet at 2F where the
  image actually forms.
- The reflection diagram measures both angles from the normal, which is the
  distinction the lesson is about.
- The refraction diagram bends toward the normal on entry and away on exit, and
  the emergent ray is genuinely parallel to the incident one.
- The cell size chart is genuinely logarithmic, one decade per step.

---

## 5. Data model

Ten tables. The interesting one is `events`.

```
users ──< sessions
users ──< quiz_attempts ──< quiz_responses >── questions >── lessons >── courses
users ──< lesson_progress >── lessons
                                 lessons ──< lesson_blocks
                                 questions ──< options
events (user_id, course_id, lesson_id nullable)
```

### The events table

One row per observed action. Columns beyond the seven exported ones exist so the
data can be analysed, not just displayed: `user_id`, `session_id`, `role`,
`action`, `target`, `path`, `user_agent`, `course_id`, `lesson_id`, `client_ts`,
and a JSON `meta` object holding the event-specific payload.

`meta` is where the analytically useful detail lives:

```json
{ "from": 84.2, "to": 61.0, "direction": "backward", "jumpSeconds": 23.2 }
{ "milestone": 75, "position": 96.0, "watchedSeconds": 91 }
{ "attemptId": 12, "questionNumber": 3, "kind": "multi", "correct": false }
```

The seven Moodle columns are a **projection** of this table, held in one place
(`src/lib/moodle.ts`) so the on-screen report and the CSV export cannot drift
apart.

---

## 6. Clickstream design

### Principles

1. **Capture clicks globally.** The brief names clicks explicitly. A set of
   handlers on the elements we remembered to instrument would silently miss
   everything else, so the tracker listens on the document in the capture phase
   and derives an identifier from `data-track`, then id, then tag and visible
   text.
2. **Resolve identity on the server.** The browser reports what happened, never
   who did it. User, session, role, IP and user agent are attached server side.
3. **Close the event vocabulary.** Browser-reported event names are checked
   against an allowlist. This keeps a curious student from filling the log with
   noise and keeps the vocabulary small enough to analyse.
4. **Never break the lesson.** Every write is wrapped. A logging failure must
   not interrupt what the learner was doing. A failed flush requeues.
5. **Survive navigation.** The queue flushes with `sendBeacon` on page hide,
   where a normal request would be cancelled.

### Why the video player is self hosted

This was the pivotal technical decision. An embedded third party player exposes
play, pause and ended, and seeks only by polling `currentTime` and inferring a
jump. A self-hosted `<video>` with custom controls exposes the whole surface:

- seeks with **both endpoints**, direction and jump size
- playback rate and volume changes
- buffering stalls, start and end
- quartile milestones at 25, 50, 75 and 100 percent
- periodic watch-time heartbeats during playback

The video drop-off chart is only possible because of the milestone events. The
brief names video actions explicitly, so this is a requirement-compliance
decision as much as an analytics one.

Watch time counts only forward movement at roughly playback speed, so seeking
cannot inflate it.

---

## 7. Architecture

**Next.js 15 App Router, React 19, TypeScript, SQLite via `better-sqlite3`,
plain CSS with a custom property token layer.**

- **SQLite** because the whole application runs from one file with no service to
  provision. The deliverable is a repository and a video, not a deployment.
- **No chart library.** Three charts, each a fixed shape. Drawing them by hand
  keeps them in the same palette and line weights as the lesson figures, and
  avoids the recognisable default look of a plotting library.
- **No component library.** The visual design is specific enough that a library
  would have been fought rather than used.
- **Server-side grading.** Correctness never reaches the browser before the
  learner answers. Options are stripped to id and text.

---

## 8. Testing and verification

Verified by driving the running application rather than by assertion:

- Sign up, sign in, sign out, and role-based redirection
- Course catalogue, course overview, all lesson pages
- Video playback, metadata loading, seeking, and the full event surface
- Quiz flow for all three question types, including server-side grading and
  immediate feedback
- Educator event stream with filters and pagination
- CSV export, checked against the seven column reference format
- All three charts against a populated dataset
- Mobile at 375px: no horizontal overflow, no two-line clickable labels
- TypeScript compiles clean
- A clean clone installs, seeds, typechecks and builds with no warnings

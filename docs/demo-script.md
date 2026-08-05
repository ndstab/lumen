# Demo video script

Target length: **3 minutes**. The single most important thing to show is the
event stream filling in live while you use the learner app, so set that up
before you press record.

## Before recording

```bash
npm run seed:fresh     # clean database
npm run dev            # leave running
npm run simulate       # in a second terminal, gives the analytics a history
```

Then:

1. Open **two browser windows side by side**, each at roughly half screen.
2. **Left window**: sign in as `teacher@lumen.school` / `lumen1234`, go to
   `/educator`. Leave it on the event stream. It refreshes itself.
3. **Right window**: open a private or second-profile window so the sessions do
   not collide. Sign in as `aarav@lumen.school` / `lumen1234`.
4. Zoom both to about 90 percent so the event table shows several rows.

---

## Beat sheet

### 0:00 to 0:20 — What it is

**On screen**: the landing page in the right window.

> "This is Lumen, an interactive science app for Classes 8 and 9. Three courses,
> thirteen lessons. Every lesson has a reading, a video and a quiz. The point of
> the project is what happens underneath: every single thing a learner does is
> captured."

Point at the left window.

> "That is the educator's event stream, live. Watch it as I use the app."

### 0:20 to 0:45 — Signing in and browsing

**Do**: sign in as Aarav. Land on the catalogue. Open **Light**. Open lesson 4,
**Where the image forms in a convex lens**.

> "Logging in is an event. Opening the catalogue is an event. Opening a course,
> opening a lesson, and every click on the way."

Let the viewer see rows arriving on the left. Do not rush this.

### 0:45 to 1:20 — The lesson, and the video

**Do**: scroll the lesson so the ray diagram is visible. Pause on it.

> "The figures are drawn to correct geometry, not sketched. That is a real
> construction: a parallel ray refracting through the focus, a central ray
> passing straight through, meeting where the image actually forms."

**Do**: press play. Let it run a few seconds. **Drag the scrubber backwards.**
Change the speed to 1.5x. Then pause.

> "The player is written for this app rather than embedded, and that is the
> decision the whole analytics side depends on. A seek is logged with where you
> jumped from, where you jumped to, the direction and the size of the jump.
> Speed changes, volume, buffering, and milestones at every quarter."

Point at the left window, where the video events are arriving.

### 1:20 to 1:50 — The quiz

**Do**: scroll to the quiz. Start it. Answer the first question **wrong on
purpose**. Show the explanation. Answer the next one correctly. Skip to the
result if time is short.

> "Grading happens on the server, so the answers are not sitting in the page.
> You get the explanation either way, and retakes are unlimited, which matters
> because every attempt is stored separately."

### 1:50 to 2:20 — The event stream

**Do**: switch focus to the left window. Filter by learner Aarav. Then filter by
component **Video**. Show a seek row and read the description aloud.

> "Everything is here, filterable by learner, course, component, event name and
> date. The description reads like a sentence because the reference format for
> this project was a Moodle log."

**Do**: press **Export CSV**. Open the file.

> "Seven columns: Time, Event context, Component, Event name, Description,
> Origin, IP address. Exactly the reference format."

### 2:20 to 2:50 — Analytics

**Do**: click **Analytics**.

> "Three questions a grade book cannot answer. Where learners stop watching:
> almost everyone gets past the first quarter, and then it falls off a cliff.
> That is where the explanation is losing people."

Scroll to the difficulty chart.

> "Which questions are actually hard, ranked by how often they are answered
> correctly across every attempt including retakes. And when the work actually
> happens."

### 2:50 to 3:00 — Close

> "Next.js and SQLite, runs from one folder. The repository has the README, the
> design specification and the deck. Thanks for watching."

---

## Things worth showing if you have time

- **Resize the window to phone width.** No horizontal scroll, nothing clipped.
- **Sign out and sign up as a new learner.** Proves the account flow.
- **The `Live: on` toggle** on the event stream.
- **Click something untracked**, like a paragraph, and show the
  `Element clicked` row still arriving. That demonstrates the global listener
  rather than hand-instrumented handlers.

## Things to avoid

- Do not narrate the code. Show the product.
- Do not apologise for the generated lesson videos. Mention once that they are
  built from the lesson content, and move on.
- Do not read the whole event table aloud. Read one row well.

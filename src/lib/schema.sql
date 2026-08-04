-- Lumen schema.
-- One file, applied by scripts/seed.mjs. SQLite, so keep types loose and
-- constraints explicit.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- people --

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','educator')),
  grade         INTEGER,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT    NOT NULL,
  ip         TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- --------------------------------------------------------------- content --

CREATE TABLE IF NOT EXISTS courses (
  id          INTEGER PRIMARY KEY,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  subtitle    TEXT    NOT NULL,
  subject     TEXT    NOT NULL,
  grade_band  TEXT    NOT NULL,
  description TEXT    NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id               INTEGER PRIMARY KEY,
  course_id        INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug             TEXT    NOT NULL,
  title            TEXT    NOT NULL,
  summary          TEXT    NOT NULL,
  position         INTEGER NOT NULL DEFAULT 0,
  reading_minutes  INTEGER NOT NULL DEFAULT 4,
  video_src        TEXT,
  video_title      TEXT,
  video_duration_s INTEGER,
  UNIQUE (course_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);

-- Lesson body, stored as ordered blocks so the renderer stays dumb.
-- kind: heading | paragraph | list | callout | figure
-- For figure blocks, `content` holds the figure key that maps to a hand-built
-- SVG component; `caption` holds the caption text.
CREATE TABLE IF NOT EXISTS lesson_blocks (
  id        INTEGER PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  kind      TEXT    NOT NULL CHECK (kind IN ('heading','paragraph','list','callout','figure')),
  content   TEXT    NOT NULL,
  caption   TEXT
);
CREATE INDEX IF NOT EXISTS idx_blocks_lesson ON lesson_blocks(lesson_id, position);

-- ----------------------------------------------------------------- quiz ---

CREATE TABLE IF NOT EXISTS questions (
  id                INTEGER PRIMARY KEY,
  lesson_id         INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position          INTEGER NOT NULL,
  kind              TEXT    NOT NULL CHECK (kind IN ('mcq','multi','numeric')),
  prompt            TEXT    NOT NULL,
  explanation       TEXT    NOT NULL,
  numeric_answer    REAL,
  numeric_tolerance REAL DEFAULT 0.01,
  unit              TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_lesson ON questions(lesson_id, position);

CREATE TABLE IF NOT EXISTS options (
  id          INTEGER PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  body        TEXT    NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id, position);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           INTEGER PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  attempt_no   INTEGER NOT NULL,
  started_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  score        REAL,
  max_score    REAL
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_lesson ON quiz_attempts(user_id, lesson_id);

CREATE TABLE IF NOT EXISTS quiz_responses (
  id          INTEGER PRIMARY KEY,
  attempt_id  INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  response    TEXT    NOT NULL,
  is_correct  INTEGER NOT NULL,
  answered_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON quiz_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON quiz_responses(question_id);

-- ------------------------------------------------------------- progress ---

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id         INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  first_viewed_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  last_viewed_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  video_watched_pct REAL    NOT NULL DEFAULT 0,
  quiz_best_score   REAL,
  completed_at      TEXT,
  PRIMARY KEY (user_id, lesson_id)
);

-- ----------------------------------------------------------- clickstream ---

-- The heart of the project. Every row is one observed user action.
-- The seven Moodle report columns are derived from this table:
--   Time          -> occurred_at
--   Event context -> context
--   Component     -> component
--   Event name    -> event_name
--   Description   -> description
--   Origin        -> origin
--   IP address    -> ip
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY,
  occurred_at TEXT    NOT NULL,
  client_ts   TEXT,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id  TEXT,
  role        TEXT,
  component   TEXT    NOT NULL,
  event_name  TEXT    NOT NULL,
  action      TEXT    NOT NULL,
  target      TEXT,
  context     TEXT    NOT NULL,
  description TEXT    NOT NULL,
  origin      TEXT    NOT NULL DEFAULT 'web',
  ip          TEXT,
  user_agent  TEXT,
  path        TEXT,
  course_id   INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id   INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  meta        TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_time    ON events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user    ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_course  ON events(course_id);
CREATE INDEX IF NOT EXISTS idx_events_lesson  ON events(lesson_id);
CREATE INDEX IF NOT EXISTS idx_events_name    ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_comp    ON events(component);

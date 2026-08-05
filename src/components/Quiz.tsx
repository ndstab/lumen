"use client";

import { useState } from "react";
import { track, flush } from "@/lib/track";

/**
 * Lesson quiz.
 *
 * One question at a time, graded on the server as soon as the learner checks
 * it, with the explanation shown whether they were right or wrong. Retakes are
 * unlimited and every attempt is stored separately, which is what makes the
 * item difficulty analysis in the educator view possible.
 */

export interface QuizOption {
  id: number;
  body: string;
}

export interface QuizQuestion {
  id: number;
  kind: "mcq" | "multi" | "numeric";
  prompt: string;
  unit: string | null;
  options: QuizOption[];
}

interface Feedback {
  correct: boolean;
  explanation: string;
  correctOptionIds: number[];
  correctValue: number | null;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function Quiz({
  lessonId,
  questions,
  contextLabel,
  bestScore,
}: {
  lessonId: number;
  questions: QuizQuestion[];
  contextLabel: string;
  bestScore: number | null;
}) {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tally, setTally] = useState<boolean[]>([]);
  const [result, setResult] = useState<{ score: number; max: number; percent: number } | null>(null);

  const question = questions[index];
  const ctx = { context: contextLabel };

  const resetQuestionState = () => {
    setChosen([]);
    setTyped("");
    setFeedback(null);
    setError(null);
  };

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) throw new Error("start failed");
      const data = (await res.json()) as { attemptId: number };
      setAttemptId(data.attemptId);
      setPhase("running");
      setIndex(0);
      setTally([]);
      setResult(null);
      resetQuestionState();
      void flush();
    } catch {
      setError("Could not start the quiz. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleOption(optionId: number) {
    if (feedback) return;
    setChosen((prev) => {
      let next: number[];
      if (question.kind === "multi") {
        next = prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId];
      } else {
        next = prev[0] === optionId ? [] : [optionId];
      }
      track({
        component: "Quiz",
        eventName: next.length < prev.length ? "Quiz answer cleared" : "Quiz option selected",
        action: next.length < prev.length ? "cleared an option in" : "selected an option in",
        target: "question",
        ...ctx,
        meta: {
          questionId: question.id,
          questionNumber: index + 1,
          optionId,
          kind: question.kind,
          selectedCount: next.length,
        },
      });
      return next;
    });
  }

  async function check() {
    if (!attemptId) return;
    const response = question.kind === "numeric" ? typed.trim() : [...chosen].sort((a, b) => a - b).join(",");
    if (!response) {
      setError(
        question.kind === "numeric" ? "Type your answer first." : "Choose an answer first."
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId: question.id, response }),
      });
      if (!res.ok) throw new Error("answer failed");
      const data = (await res.json()) as Feedback;
      setFeedback(data);
      setTally((t) => [...t, data.correct]);
      void flush();
    } catch {
      setError("Could not check that answer. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      resetQuestionState();
      return;
    }
    if (!attemptId) return;

    setBusy(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      if (!res.ok) throw new Error("submit failed");
      setResult((await res.json()) as { score: number; max: number; percent: number });
      setPhase("done");
      void flush();
    } catch {
      setError("Could not submit the quiz. Try again.");
    } finally {
      setBusy(false);
    }
  }

  /* ------------------------------------------------------------- idle --- */

  if (phase === "idle") {
    return (
      <section className="quiz panel panel-raised" aria-labelledby="quiz-heading">
        <h3 id="quiz-heading">Check yourself</h3>
        <p className="meta" style={{ marginTop: "var(--space-2)" }}>
          {questions.length} questions. You get the explanation either way, and you can retake it as
          many times as you like.
        </p>
        {bestScore !== null && (
          <p className="meta" style={{ marginTop: "var(--space-2)" }}>
            Your best so far: <strong>{bestScore}%</strong>
          </p>
        )}
        {error && (
          <p className="notice notice-error" role="alert" style={{ marginTop: "var(--space-4)" }}>
            {error}
          </p>
        )}
        <button
          className="btn btn-primary"
          style={{ marginTop: "var(--space-5)" }}
          onClick={start}
          disabled={busy}
          data-state={busy ? "loading" : undefined}
          data-track="quiz-start"
        >
          {busy ? "Starting..." : bestScore !== null ? "Take it again" : "Start the quiz"}
        </button>
      </section>
    );
  }

  /* ------------------------------------------------------------- done --- */

  if (phase === "done" && result) {
    const passed = result.percent >= 60;
    return (
      <section className="quiz panel panel-raised" aria-labelledby="quiz-heading">
        <h3 id="quiz-heading">
          {result.score} out of {result.max}
        </h3>
        <p className="lede" style={{ marginTop: "var(--space-2)" }}>
          {passed
            ? "That is a pass. The explanations are worth a second read before you move on."
            : "Not a pass yet. Read back through the lesson and try again."}
        </p>

        <ol className="quiz-tally" aria-label="Result for each question">
          {tally.map((ok, i) => (
            <li key={i} className={ok ? "ok" : "bad"}>
              <span className="mono">{i + 1}</span>
              <span>{ok ? "Correct" : "Wrong"}</span>
            </li>
          ))}
        </ol>

        <button
          className="btn btn-primary"
          style={{ marginTop: "var(--space-5)" }}
          onClick={start}
          disabled={busy}
          data-track="quiz-retake"
        >
          Try again
        </button>
      </section>
    );
  }

  /* ---------------------------------------------------------- running --- */

  const isNumeric = question.kind === "numeric";

  return (
    <section className="quiz panel panel-raised" aria-labelledby="quiz-heading">
      <div className="row-between">
        <p className="quiz-counter">
          Question {index + 1} of {questions.length}
        </p>
        {question.kind === "multi" && <span className="tag tag-orange">Select all that apply</span>}
        {isNumeric && <span className="tag tag-blue">Type a number</span>}
      </div>

      <h3 id="quiz-heading" className="quiz-prompt">
        {question.prompt}
      </h3>

      {isNumeric ? (
        <div className="field" style={{ maxWidth: 280 }}>
          <label htmlFor="numeric-answer">Your answer{question.unit ? ` (${question.unit})` : ""}</label>
          <input
            className="input"
            id="numeric-answer"
            type="text"
            inputMode="decimal"
            value={typed}
            disabled={Boolean(feedback)}
            onChange={(e) => setTyped(e.target.value)}
            data-track="quiz-numeric-input"
          />
        </div>
      ) : (
        <fieldset className="quiz-options">
          <legend className="visually-hidden">Answer options</legend>
          {question.options.map((option, i) => {
            const selected = chosen.includes(option.id);
            const isRight = feedback?.correctOptionIds.includes(option.id);
            const state = !feedback
              ? selected
                ? "selected"
                : undefined
              : isRight
                ? "right"
                : selected
                  ? "wrong"
                  : undefined;

            return (
              <label className="quiz-option" key={option.id} data-state={state}>
                <input
                  type={question.kind === "multi" ? "checkbox" : "radio"}
                  name="answer"
                  className="visually-hidden"
                  checked={selected}
                  disabled={Boolean(feedback)}
                  onChange={() => toggleOption(option.id)}
                  data-track={`quiz-option-${LETTERS[i]}`}
                />
                <span className="quiz-key" aria-hidden="true">
                  {LETTERS[i]}
                </span>
                <span>{option.body}</span>
              </label>
            );
          })}
        </fieldset>
      )}

      {error && (
        <p className="notice notice-error" role="alert" style={{ marginTop: "var(--space-4)" }}>
          {error}
        </p>
      )}

      {feedback && (
        <div
          className={`notice ${feedback.correct ? "notice-success" : "notice-error"}`}
          role="status"
          style={{ marginTop: "var(--space-4)" }}
        >
          <strong>{feedback.correct ? "Correct." : "Not quite."}</strong>{" "}
          {isNumeric && !feedback.correct && feedback.correctValue !== null && (
            <>The answer is {feedback.correctValue}. </>
          )}
          {feedback.explanation}
        </div>
      )}

      <div className="row" style={{ marginTop: "var(--space-5)" }}>
        {!feedback ? (
          <button
            className="btn btn-primary"
            onClick={check}
            disabled={busy}
            data-state={busy ? "loading" : undefined}
            data-track="quiz-check"
          >
            {busy ? "Checking..." : "Check answer"}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={next}
            disabled={busy}
            data-track="quiz-next"
          >
            {index + 1 < questions.length ? "Next question" : "See my result"}
          </button>
        )}
      </div>
    </section>
  );
}

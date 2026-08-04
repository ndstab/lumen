import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/session";
import { recordEventAs } from "@/lib/events";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const gradeRaw = String(form.get("grade") ?? "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(
        `/signup?error=${encodeURIComponent(message)}&name=${encodeURIComponent(
          name
        )}&email=${encodeURIComponent(email)}`,
        request.url
      ),
      303
    );

  if (name.length < 2) return fail("Please enter your name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Please enter a valid email address.");
  if (password.length < 8) return fail("Choose a password of at least 8 characters.");

  const grade = gradeRaw === "8" || gradeRaw === "9" ? Number(gradeRaw) : null;

  const db = getDb();
  const taken = db.prepare(`SELECT 1 FROM users WHERE email = ?`).get(email);
  if (taken) return fail("An account already exists for that email address.");

  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, grade)
       VALUES (?, ?, ?, 'learner', ?)`
    )
    .run(name, email, await hashPassword(password), grade);

  const userId = Number(info.lastInsertRowid);
  const sessionId = await createSession(userId);

  await recordEventAs(
    {
      component: "User",
      eventName: "User account created",
      action: "created an account",
      target: null,
      context: "System",
      description: `The user with id '${userId}' created a learner account.`,
      meta: { grade },
    },
    userId,
    "learner",
    sessionId
  );

  return NextResponse.redirect(new URL("/courses", request.url), 303);
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/session";
import { recordEventAs } from "@/lib/events";

interface Row {
  id: number;
  name: string;
  role: string;
  password_hash: string;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
      303
    );

  if (!email || !password) return fail("Enter your email and password.");

  const row = getDb()
    .prepare(`SELECT id, name, role, password_hash FROM users WHERE email = ?`)
    .get(email) as Row | undefined;

  // Same message either way, so the form cannot be used to discover which
  // email addresses have accounts.
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    await recordEventAs(
      {
        component: "User",
        eventName: "Login failed",
        action: "failed to sign in as",
        target: `account ${email}`,
        context: "System",
        description: `A failed sign in attempt was made for '${email}'.`,
      },
      null,
      null,
      null
    );
    return fail("That email and password do not match.");
  }

  const sessionId = await createSession(row.id);

  await recordEventAs(
    {
      component: "User",
      eventName: "User logged in",
      action: "signed in",
      target: null,
      context: "System",
      description: `The user with id '${row.id}' has signed in.`,
      meta: { role: row.role },
    },
    row.id,
    row.role,
    sessionId
  );

  const destination = row.role === "educator" ? "/educator" : "/courses";
  return NextResponse.redirect(new URL(destination, request.url), 303);
}

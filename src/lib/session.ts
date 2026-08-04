import "server-only";
import { cookies, headers } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb, type Role, type User } from "./db";

export const SESSION_COOKIE = "lumen_session";
const SESSION_DAYS = 30;

export interface Actor {
  user: User;
  sessionId: string;
}

/* ------------------------------------------------------------- passwords -- */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* -------------------------------------------------------------- requests -- */

/**
 * Best-effort client IP. Behind a proxy the forwarded header wins; running
 * locally there is no forwarded header, so we record the loopback address
 * rather than leaving the column empty.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "127.0.0.1";
}

export async function userAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "unknown";
}

/* -------------------------------------------------------------- sessions -- */

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, expires, await clientIp(), await userAgent());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
    secure: process.env.NODE_ENV === "production",
  });

  return id;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) getDb().prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  jar.delete(SESSION_COOKIE);
}

export async function getActor(): Promise<Actor | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const row = getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.grade, u.created_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > datetime('now')`
    )
    .get(id) as User | undefined;

  return row ? { user: row, sessionId: id } : null;
}

export async function getCurrentUser(): Promise<User | null> {
  return (await getActor())?.user ?? null;
}

export function hasRole(user: User | null, role: Role): boolean {
  return user?.role === role;
}

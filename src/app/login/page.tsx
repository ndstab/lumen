import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "educator" ? "/educator" : "/courses");

  const { error } = await searchParams;

  return (
    <div className="shell">
      <div className="auth">
        <h1>Welcome back</h1>
        <p className="lede" style={{ marginTop: "var(--space-3)" }}>
          Sign in to pick up where you left off.
        </p>

        {error && (
          <p className="notice notice-error" role="alert" style={{ marginTop: "var(--space-5)" }}>
            {error}
          </p>
        )}

        <form className="stack-5" method="post" action="/api/auth/login">
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              data-track="login-email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-track="login-password"
            />
          </div>

          <button className="btn btn-primary" type="submit" data-track="login-submit">
            Sign in
          </button>
        </form>

        <p className="switch">
          No account yet? <Link href="/signup">Create one</Link>.
        </p>

        <div className="demo-key">
          <strong>Demonstration accounts</strong>
          <ul className="mono">
            <li>
              <span>aarav@lumen.school</span>
              <span className="muted">learner</span>
            </li>
            <li>
              <span>diya@lumen.school</span>
              <span className="muted">learner</span>
            </li>
            <li>
              <span>teacher@lumen.school</span>
              <span className="muted">educator</span>
            </li>
          </ul>
          <p style={{ marginTop: "var(--space-3)" }}>
            The password for all seeded accounts is <span className="mono">lumen1234</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

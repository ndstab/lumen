import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string; email?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "educator" ? "/educator" : "/courses");

  const { error, name, email } = await searchParams;

  return (
    <div className="shell">
      <div className="auth">
        <h1>Start learning</h1>
        <p className="lede" style={{ marginTop: "var(--space-3)" }}>
          One account, three courses, and a record of your own progress.
        </p>

        {error && (
          <p className="notice notice-error" role="alert" style={{ marginTop: "var(--space-5)" }}>
            {error}
          </p>
        )}

        <form className="stack-5" method="post" action="/api/auth/signup">
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input
              className="input"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={name ?? ""}
              required
              minLength={2}
              data-track="signup-name"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={email ?? ""}
              required
              data-track="signup-email"
            />
          </div>

          <div className="field">
            <label htmlFor="grade">Which class are you in?</label>
            <select className="input" id="grade" name="grade" defaultValue="" data-track="signup-grade">
              <option value="">Prefer not to say</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              data-track="signup-password"
            />
            <span className="hint">At least 8 characters.</span>
          </div>

          <button className="btn btn-primary" type="submit" data-track="signup-submit">
            Create my account
          </button>
        </form>

        <p className="switch">
          Already registered? <Link href="/login">Sign in</Link>.
        </p>
      </div>
    </div>
  );
}

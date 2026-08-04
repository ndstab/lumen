import Link from "next/link";
import type { User } from "@/lib/db";

export default function Masthead({ user }: { user: User | null }) {
  const educator = user?.role === "educator";

  return (
    <header className="masthead">
      <div className="shell masthead-inner">
        <Link href={user ? "/courses" : "/"} className="wordmark" data-track="wordmark">
          <span className="glyph" aria-hidden="true" />
          Lumen
        </Link>

        <nav className="nav" aria-label="Main">
          {user ? (
            <>
              <Link href="/courses" data-track="nav-courses">
                Courses
              </Link>
              {educator && (
                <>
                  <Link href="/educator" data-track="nav-events">
                    Event stream
                  </Link>
                  <Link href="/educator/analytics" data-track="nav-analytics">
                    Analytics
                  </Link>
                </>
              )}
              <span className="meta" aria-label="Signed in as">
                {user.name}
                {educator ? " (educator)" : ""}
              </span>
              <form action="/api/auth/logout" method="post">
                <button className="btn btn-quiet btn-sm" type="submit" data-track="sign-out">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" data-track="nav-login">
                Log in
              </Link>
              <Link className="btn btn-primary btn-sm" href="/signup" data-track="nav-signup">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

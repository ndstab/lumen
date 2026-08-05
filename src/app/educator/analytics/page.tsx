import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  videoDropOff,
  itemDifficulty,
  activityByHour,
  headlines,
} from "@/lib/analytics";
import { recordEvent } from "@/lib/events";
import { DropOffChart, DifficultyChart, ActivityChart } from "@/components/Charts";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "educator") redirect("/courses");

  const dropOff = videoDropOff();
  const items = itemDifficulty();
  const activity = activityByHour();
  const stats = headlines();

  await recordEvent({
    component: "Report",
    eventName: "Analytics dashboard viewed",
    action: "viewed the analytics dashboard",
    target: null,
    context: "Report: analytics",
    description: `The user with id '${user.id}' viewed the analytics dashboard.`,
  });

  const finished = dropOff.points.find((p) => p.milestone === 100)?.percent ?? 0;
  const hardest = items[0];

  return (
    <div className="shell">
      <div className="row-between" style={{ alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)" }}>Analytics</h1>
          <p className="lede" style={{ marginTop: "var(--space-3)" }}>
            Three questions the clickstream can answer that a grade book cannot.
          </p>
        </div>
        <Link className="btn" href="/educator" data-track="to-stream">
          Back to the event stream
        </Link>
      </div>

      <dl className="headline-grid">
        <div><dt>Events recorded</dt><dd>{stats.events.toLocaleString()}</dd></div>
        <div><dt>Video starts</dt><dd>{dropOff.started}</dd></div>
        <div><dt>Watched to the end</dt><dd>{finished}%</dd></div>
        <div><dt>Questions analysed</dt><dd>{items.length}</dd></div>
      </dl>

      <section className="chart-card">
        <h3>Where learners stop watching</h3>
        <p className="why">
          Each point is the share of video starts that reached that quarter of the film. A cliff
          between two points is the moment to look at: it usually means the explanation lost people
          there, not that the video was too long. Built from the milestone events the player emits
          at 25, 50, 75 and 100 percent.
        </p>
        <div className="chart-frame">
          <DropOffChart points={dropOff.points} started={dropOff.started} />
        </div>
      </section>

      <section className="chart-card">
        <h3>Which questions are actually hard</h3>
        <p className="why">
          Percentage of all recorded answers that were correct, hardest first. Every attempt counts
          separately, including retakes, so a question that stays red after repeated attempts is a
          teaching problem rather than a difficulty setting.
          {hardest && (
            <>
              {" "}
              Currently hardest: <strong>{hardest.prompt}</strong> at {hardest.percent} percent
              correct across {hardest.answers} answers.
            </>
          )}
        </p>
        <div className="chart-frame">
          <DifficultyChart items={items} />
        </div>
      </section>

      <section className="chart-card">
        <h3>When the work happens</h3>
        <p className="why">
          Events per hour, most recent on the right. Useful for spotting whether a class works
          during the school day or late at night, and for confirming that a spike in activity lines
          up with a lesson being set.
        </p>
        <div className="chart-frame">
          <ActivityChart buckets={activity} />
        </div>
      </section>
    </div>
  );
}

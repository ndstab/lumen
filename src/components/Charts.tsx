import type { DropOffPoint, ItemDifficulty, ActivityBucket } from "@/lib/analytics";

/**
 * Charts are drawn by hand as SVG rather than pulled from a plotting library.
 * There are only three of them, each is a fixed shape, and hand drawing keeps
 * them inside the same palette and line weights as the lesson figures.
 */

/* ------------------------------------------------------ video drop-off --- */

export function DropOffChart({ points, started }: { points: DropOffPoint[]; started: number }) {
  const W = 720;
  const H = 320;
  const pad = { top: 44, right: 40, bottom: 64, left: 64 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  if (started === 0) {
    return (
      <p className="empty-note">
        No video has been played yet. Open a lesson, press play, and this curve will fill in.
      </p>
    );
  }

  const x = (i: number) => pad.left + (i / (points.length - 1)) * plotW;
  const y = (pct: number) => pad.top + plotH - (pct / 100) * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p.percent)}`).join(" ");
  const area = `${line} L${x(points.length - 1)} ${pad.top + plotH} L${x(0)} ${pad.top + plotH} Z`;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Video drop-off curve. Of ${started} video starts, ${points[4]?.percent ?? 0} percent reached the end.`}>
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line className="grid" x1={pad.left} y1={y(tick)} x2={W - pad.right} y2={y(tick)} />
          <text className="lbl" x={pad.left - 12} y={y(tick) + 5} textAnchor="end">
            {tick}%
          </text>
        </g>
      ))}

      <path className="area" d={area} />
      <path className="line" d={line} />

      {points.map((p, i) => (
        <g key={p.milestone}>
          <circle className="dot" cx={x(i)} cy={y(p.percent)} r="6" />
          <text className="lbl-b" x={x(i)} y={y(p.percent) - 16} textAnchor="middle">
            {p.percent}%
          </text>
          <text className="lbl" x={x(i)} y={pad.top + plotH + 26} textAnchor="middle">
            {p.milestone === 0 ? "Started" : `${p.milestone}%`}
          </text>
          <text className="lbl" x={x(i)} y={pad.top + plotH + 48} textAnchor="middle">
            {p.reached}
          </text>
        </g>
      ))}

      <line className="axis" x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} />
      <line className="axis" x1={pad.left} y1={pad.top + plotH} x2={W - pad.right} y2={pad.top + plotH} />
    </svg>
  );
}

/* ------------------------------------------------------ item difficulty --- */

export function DifficultyChart({ items }: { items: ItemDifficulty[] }) {
  if (items.length === 0) {
    return (
      <p className="empty-note">
        No quiz answers recorded yet. Take a quiz as a learner and every question will appear
        here ranked by how often it is answered correctly.
      </p>
    );
  }

  const rowH = 56;
  const W = 760;
  const pad = { top: 36, right: 58, bottom: 16, left: 316 };
  const H = pad.top + items.length * rowH + pad.bottom;
  const plotW = W - pad.left - pad.right;

  // Labels are drawn left aligned from the origin rather than right aligned
  // against the plot, so a long prompt can never spill off the left edge.
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}...` : s);

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Percentage of answers correct for each quiz question, hardest first.">
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line
            className="grid"
            x1={pad.left + (tick / 100) * plotW}
            y1={pad.top - 8}
            x2={pad.left + (tick / 100) * plotW}
            y2={H - pad.bottom}
          />
          <text
            className="lbl"
            x={pad.left + (tick / 100) * plotW}
            y={pad.top - 16}
            textAnchor="middle"
          >
            {tick}%
          </text>
        </g>
      ))}

      {items.map((item, i) => {
        const y = pad.top + i * rowH + 12;
        const w = Math.max(2, (item.percent / 100) * plotW);
        const cls =
          item.percent < 40 ? "bar-fill-bad" : item.percent < 70 ? "bar-fill-warn" : "bar-fill";
        return (
          <g key={item.question_id}>
            <text className="lbl-b" x={0} y={y + 8}>
              {clip(item.prompt, 40)}
            </text>
            <text className="lbl" x={0} y={y + 28}>
              {clip(`${item.course_title} · ${item.lesson_title}`, 40)}
            </text>
            <rect className={`${cls} bar-edge`} x={pad.left} y={y} width={w} height={26} />
            <text className="lbl-b" x={pad.left + w + 10} y={y + 19}>
              {item.percent}%
            </text>
            <text className="lbl" x={pad.left + w + 10} y={y + 38}>
              {item.answers} {item.answers === 1 ? "answer" : "answers"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------------------------------------------------- activity ----- */

export function ActivityChart({ buckets }: { buckets: ActivityBucket[] }) {
  if (buckets.length === 0) {
    return <p className="empty-note">No activity recorded yet.</p>;
  }

  const W = 720;
  const H = 300;
  const pad = { top: 28, right: 24, bottom: 62, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const max = Math.max(...buckets.map((b) => b.n), 1);
  const slot = plotW / buckets.length;
  const barW = Math.max(4, Math.min(38, slot - 8));

  const hourOf = (bucket: string) => bucket.slice(11, 13);
  const dayOf = (bucket: string) => bucket.slice(5, 10);

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Events per hour. Busiest hour recorded ${max} events.`}>
      {[0, 0.5, 1].map((f) => {
        const value = Math.round(max * f);
        const y = pad.top + plotH - f * plotH;
        return (
          <g key={f}>
            <line className="grid" x1={pad.left} y1={y} x2={W - pad.right} y2={y} />
            <text className="lbl" x={pad.left - 12} y={y + 5} textAnchor="end">
              {value}
            </text>
          </g>
        );
      })}

      {buckets.map((b, i) => {
        const h = (b.n / max) * plotH;
        const x = pad.left + i * slot + (slot - barW) / 2;
        const y = pad.top + plotH - h;
        const showLabel = buckets.length <= 14 || i % 3 === 0;
        return (
          <g key={b.bucket}>
            <rect className="bar-fill bar-edge" x={x} y={y} width={barW} height={Math.max(2, h)} />
            {b.n > 0 && (
              <text className="lbl" x={x + barW / 2} y={y - 8} textAnchor="middle">
                {b.n}
              </text>
            )}
            {showLabel && (
              <>
                <text className="lbl" x={x + barW / 2} y={pad.top + plotH + 24} textAnchor="middle">
                  {hourOf(b.bucket)}h
                </text>
                <text className="lbl" x={x + barW / 2} y={pad.top + plotH + 44} textAnchor="middle">
                  {dayOf(b.bucket)}
                </text>
              </>
            )}
          </g>
        );
      })}

      <line className="axis" x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} />
      <line className="axis" x1={pad.left} y1={pad.top + plotH} x2={W - pad.right} y2={pad.top + plotH} />
    </svg>
  );
}

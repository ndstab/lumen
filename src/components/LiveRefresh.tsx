"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the event stream current without a manual reload, so the educator view
 * can sit open next to the learner app during a demonstration.
 *
 * Refreshing pauses while the tab is hidden, which stops the report quietly
 * generating its own page view events in the background.
 */
export default function LiveRefresh({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [live, intervalMs, router]);

  return (
    <div className="live-toggle">
      <span className={`live-dot${live ? " on" : ""}`} aria-hidden="true" />
      <button
        className="btn btn-quiet btn-sm"
        onClick={() => setLive((v) => !v)}
        aria-pressed={live}
        data-track="live-toggle"
      >
        {live ? "Live: on" : "Live: off"}
      </button>
    </div>
  );
}

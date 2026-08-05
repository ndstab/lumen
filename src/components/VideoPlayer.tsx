"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track, flush } from "@/lib/track";

/**
 * Lesson video player.
 *
 * Self hosted media with custom controls, chosen over an embedded third party
 * player specifically so the full event surface is available: seeks with both
 * endpoints, rate and volume changes, buffering stalls, quartile milestones and
 * periodic watch-time heartbeats. None of that is reliably observable through
 * an iframe embed, and the drop-off chart in the analytics view depends on it.
 */

const MILESTONES = [25, 50, 75, 100] as const;
const HEARTBEAT_MS = 15000;
const RATES = [0.75, 1, 1.25, 1.5, 2] as const;

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({
  src,
  title,
  lessonId,
  contextLabel,
}: {
  src: string;
  title: string;
  lessonId: number;
  contextLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [full, setFull] = useState(false);
  const [failed, setFailed] = useState(false);

  const seenMilestones = useRef<Set<number>>(new Set());
  const startedOnce = useRef(false);
  const lastTime = useRef(0);
  const seekFrom = useRef<number | null>(null);
  const stalled = useRef(false);
  const watchedSeconds = useRef(0);
  const furthest = useRef(0);
  const reportedPct = useRef(0);

  const ctx = { context: contextLabel };

  /* --------------------------------------------------- progress reporting */

  const reportProgress = useCallback(
    (pct: number, force = false) => {
      const rounded = Math.min(100, Math.round(pct));
      if (!force && rounded <= reportedPct.current) return;
      reportedPct.current = rounded;
      void fetch("/api/progress/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, percent: rounded }),
        keepalive: true,
      }).catch(() => {
        /* progress is best effort and must not interrupt playback */
      });
    },
    [lessonId]
  );

  /* --------------------------------------------------------- heartbeat -- */

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      track({
        component: "Video",
        eventName: "Video watch heartbeat",
        action: "was watching",
        target: "video",
        ...ctx,
        meta: {
          position: Number(v.currentTime.toFixed(1)),
          watchedSeconds: Math.round(watchedSeconds.current),
          percent: duration ? Math.round((v.currentTime / duration) * 100) : 0,
          rate: v.playbackRate,
        },
      });
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, contextLabel]);

  /* ------------------------------------------------------- fullscreen --- */

  useEffect(() => {
    function onFsChange() {
      const isFull = document.fullscreenElement === shellRef.current;
      setFull(isFull);
      track({
        component: "Video",
        eventName: isFull ? "Video entered fullscreen" : "Video exited fullscreen",
        action: isFull ? "entered fullscreen on" : "exited fullscreen on",
        target: "video",
        ...ctx,
        meta: { position: Number((videoRef.current?.currentTime ?? 0).toFixed(1)) },
      });
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLabel]);

  /* ------------------------------------------------------ media events -- */

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setReady(true);
  };

  // The element can finish loading metadata before React hydrates and attaches
  // the handler above, in which case the event is missed entirely. Read the
  // state directly once on mount to cover that race.
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1 && Number.isFinite(v.duration)) {
      setDuration(v.duration);
      setReady(true);
    }
  }, []);

  const onPlay = () => {
    setPlaying(true);
    const v = videoRef.current;
    const first = !startedOnce.current;
    startedOnce.current = true;
    track({
      component: "Video",
      eventName: first ? "Video started" : "Video resumed",
      action: first ? "started playing" : "resumed",
      target: "video",
      ...ctx,
      meta: { position: Number((v?.currentTime ?? 0).toFixed(1)), title },
    });
    if (first) void flush();
  };

  const onPause = () => {
    const v = videoRef.current;
    setPlaying(false);
    // The pause fired by reaching the end is reported as "ended" instead.
    if (v && v.ended) return;
    track({
      component: "Video",
      eventName: "Video paused",
      action: "paused",
      target: "video",
      ...ctx,
      meta: {
        position: Number((v?.currentTime ?? 0).toFixed(1)),
        percent: duration ? Math.round(((v?.currentTime ?? 0) / duration) * 100) : 0,
      },
    });
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;

    const delta = v.currentTime - lastTime.current;
    // Count only forward movement at roughly playback speed as watch time, so
    // a seek does not inflate the total.
    if (delta > 0 && delta < 1.5) watchedSeconds.current += delta;
    lastTime.current = v.currentTime;
    setCurrent(v.currentTime);

    if (v.currentTime > furthest.current) furthest.current = v.currentTime;

    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }

    if (!v.duration) return;
    const pct = (furthest.current / v.duration) * 100;

    for (const mark of MILESTONES) {
      if (pct >= mark && !seenMilestones.current.has(mark)) {
        seenMilestones.current.add(mark);
        track({
          component: "Video",
          eventName: "Video milestone reached",
          action: "reached a milestone in",
          target: "video",
          ...ctx,
          meta: {
            milestone: mark,
            position: Number(v.currentTime.toFixed(1)),
            watchedSeconds: Math.round(watchedSeconds.current),
          },
        });
        reportProgress(mark, true);
        void flush();
      }
    }
    reportProgress(pct);
  };

  const onSeeking = () => {
    if (seekFrom.current === null) seekFrom.current = lastTime.current;
  };

  const onSeeked = () => {
    const v = videoRef.current;
    if (!v) return;
    const from = seekFrom.current ?? lastTime.current;
    seekFrom.current = null;
    lastTime.current = v.currentTime;

    // Ignore the tiny adjustments the browser makes on its own.
    if (Math.abs(v.currentTime - from) < 0.6) return;

    track({
      component: "Video",
      eventName: "Video seeked",
      action: "seeked within",
      target: "video",
      ...ctx,
      meta: {
        from: Number(from.toFixed(1)),
        to: Number(v.currentTime.toFixed(1)),
        direction: v.currentTime > from ? "forward" : "backward",
        jumpSeconds: Number(Math.abs(v.currentTime - from).toFixed(1)),
      },
    });
  };

  const onRateChange = () => {
    const v = videoRef.current;
    if (!v) return;
    setRate(v.playbackRate);
    track({
      component: "Video",
      eventName: "Video playback rate changed",
      action: "changed the playback rate of",
      target: "video",
      ...ctx,
      meta: { rate: v.playbackRate, position: Number(v.currentTime.toFixed(1)) },
    });
  };

  const onVolumeChange = () => {
    const v = videoRef.current;
    if (!v) return;
    setVolume(v.volume);
    setMuted(v.muted);
    track({
      component: "Video",
      eventName: "Video volume changed",
      action: "changed the volume of",
      target: "video",
      ...ctx,
      meta: { volume: Number(v.volume.toFixed(2)), muted: v.muted },
    });
  };

  const onWaiting = () => {
    if (stalled.current) return;
    stalled.current = true;
    track({
      component: "Video",
      eventName: "Video buffering started",
      action: "stalled while watching",
      target: "video",
      ...ctx,
      meta: { position: Number((videoRef.current?.currentTime ?? 0).toFixed(1)) },
    });
  };

  const onPlaying = () => {
    if (!stalled.current) return;
    stalled.current = false;
    track({
      component: "Video",
      eventName: "Video buffering ended",
      action: "resumed after buffering",
      target: "video",
      ...ctx,
      meta: { position: Number((videoRef.current?.currentTime ?? 0).toFixed(1)) },
    });
  };

  const onEnded = () => {
    setPlaying(false);
    track({
      component: "Video",
      eventName: "Video ended",
      action: "finished watching",
      target: "video",
      ...ctx,
      meta: { watchedSeconds: Math.round(watchedSeconds.current), title },
    });
    reportProgress(100, true);
    void flush();
  };

  /* ------------------------------------------------------------ controls */

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setFailed(true));
    else v.pause();
  };

  const scrubTo = (clientX: number, el: HTMLElement) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const box = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    v.currentTime = ratio * v.duration;
  };

  const nudge = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + seconds));
  };

  const cycleRate = () => {
    const v = videoRef.current;
    if (!v) return;
    const i = RATES.indexOf(v.playbackRate as (typeof RATES)[number]);
    v.playbackRate = RATES[(i + 1) % RATES.length];
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen().catch(() => {});
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        toggle();
        break;
      case "ArrowRight":
        e.preventDefault();
        nudge(5);
        break;
      case "ArrowLeft":
        e.preventDefault();
        nudge(-5);
        break;
      case "m":
        e.preventDefault();
        toggleMute();
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  };

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      className="player"
      ref={shellRef}
      data-full={full || undefined}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`Video: ${title}`}
    >
      <div className="player-stage" data-playing={playing || undefined}>
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          playsInline
          onLoadedMetadata={onLoadedMetadata}
          onPlay={onPlay}
          onPause={onPause}
          onTimeUpdate={onTimeUpdate}
          onSeeking={onSeeking}
          onSeeked={onSeeked}
          onRateChange={onRateChange}
          onVolumeChange={onVolumeChange}
          onWaiting={onWaiting}
          onPlaying={onPlaying}
          onEnded={onEnded}
          onDurationChange={onLoadedMetadata}
          onCanPlay={onLoadedMetadata}
          onError={() => setFailed(true)}
          onClick={toggle}
          data-track="video-surface"
        />

        {failed && (
          <div className="player-message">
            <p>
              This lesson video is not on disk yet. Run <span className="mono">npm run media</span> to
              generate it.
            </p>
          </div>
        )}

        {!playing && !failed && (
          <button
            className="player-big-play"
            onClick={toggle}
            aria-label="Play video"
            data-track="video-big-play"
          >
            <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">
              <path d="M3 2 L24 15 L3 28 Z" fill="var(--on-accent)" />
            </svg>
          </button>
        )}

        <span className="player-title">{title}</span>
      </div>

      <div className="player-controls">
        <div
          className="player-scrub"
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${clock(current)} of ${clock(duration)}`}
          onClick={(e) => scrubTo(e.clientX, e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); nudge(5); }
            if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-5); }
          }}
          data-track="video-scrubber"
        >
          <span className="player-buffered" style={{ width: `${bufPct}%` }} />
          <span className="player-played" style={{ width: `${pct}%` }} />
          <span className="player-head" style={{ left: `${pct}%` }} />
        </div>

        <div className="player-row">
          <div className="player-group">
            <button className="player-btn" onClick={toggle} data-track="video-play-toggle"
              aria-label={playing ? "Pause" : "Play"}>
              {playing ? "Pause" : "Play"}
            </button>
            <button className="player-btn" onClick={() => nudge(-10)} data-track="video-back-10"
              aria-label="Back 10 seconds">
              -10s
            </button>
            <button className="player-btn" onClick={() => nudge(10)} data-track="video-fwd-10"
              aria-label="Forward 10 seconds">
              +10s
            </button>
            <span className="player-time mono">
              {clock(current)} / {ready ? clock(duration) : "--:--"}
            </span>
          </div>

          <div className="player-group">
            <button className="player-btn" onClick={toggleMute} data-track="video-mute"
              aria-label={muted ? "Unmute" : "Mute"}>
              {muted || volume === 0 ? "Unmute" : "Mute"}
            </button>
            <button className="player-btn" onClick={cycleRate} data-track="video-rate"
              aria-label="Change playback speed">
              {rate}x
            </button>
            <button className="player-btn" onClick={toggleFullscreen} data-track="video-fullscreen"
              aria-label={full ? "Exit full screen" : "Full screen"}>
              {full ? "Exit full screen" : "Full screen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

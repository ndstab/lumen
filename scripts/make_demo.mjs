/**
 * Records a silent walkthrough video of the running app.
 *
 * This exists so the repository ships with a usable demo even before you record
 * your own narrated one. It drives headless Chrome over the DevTools protocol
 * and captures a real screencast, so what you see is the actual application,
 * not a slideshow of stills.
 *
 *   npm run demo
 *
 * Produces docs/demo.mp4. The dev server must be running, and ffmpeg is needed
 * for the encode. See docs/demo-script.md for the narrated version worth
 * recording by hand.
 */

import Database from "better-sqlite3";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const OUT = path.join(ROOT, "docs", "demo.mp4");
const PORT = 9444;
const VIEW = { w: 1440, h: 900 };
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------- sessions -- */

function session(email) {
  const db = new Database(path.join(ROOT, "data", "app.db"));
  const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (!user) throw new Error(`No such user: ${email}`);
  const id = randomBytes(32).toString("hex");
  db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, ip, user_agent)
     VALUES (?, ?, datetime('now', '+1 day'), '127.0.0.1', 'demo-recorder')`
  ).run(id, user.id);
  db.close();
  return id;
}

/* ------------------------------------------------------------------ CDP -- */

let nextId = 1;

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const handlers = new Map();

  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method && handlers.has(msg.method)) {
      handlers.get(msg.method)(msg.params);
    }
  });

  const ready = new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });

  return {
    ready,
    on: (method, fn) => handlers.set(method, fn),
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close: () => ws.close(),
  };
}

/* ------------------------------------------------------------ the script -- */

async function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}`);
  if (!spawnSync("ffmpeg", ["-version"]).stdout) throw new Error("ffmpeg is required");
  if (!(await fetch(BASE).catch(() => null))) {
    throw new Error(`No server at ${BASE}. Start it with: npm run dev`);
  }

  const learner = session("aarav@lumen.school");
  const educator = session("teacher@lumen.school");

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "lumen-demo-"));
  const frameDir = fs.mkdtempSync(path.join(os.tmpdir(), "lumen-frames-"));

  const chrome = spawn(
    CHROME,
    [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
      "--autoplay-policy=no-user-gesture-required",
      "--mute-audio",
      `--window-size=${VIEW.w},${VIEW.h}`,
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  const frames = [];
  let cdp;

  try {
    let version = null;
    for (let i = 0; i < 40 && !version; i++) {
      version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).catch(() => null);
      if (!version) await sleep(250);
    }
    if (!version) throw new Error("Chrome did not expose its debugging port");

    const target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
    cdp = connect(target.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: VIEW.w, height: VIEW.h, deviceScaleFactor: 1, mobile: false,
    });

    const domain = new URL(BASE).hostname;
    const setUser = (value) =>
      cdp.send("Network.setCookie", {
        name: "lumen_session", value, domain, path: "/", httpOnly: true, sameSite: "Lax",
      });

    /* frame capture */
    let n = 0;
    let last = Date.now();
    cdp.on("Page.screencastFrame", async ({ data, sessionId }) => {
      const now = Date.now();
      const file = path.join(frameDir, `f${String(n++).padStart(5, "0")}.jpg`);
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      // The screencast only emits on change, so a still page produces no
      // frames. Hold the previous frame for the real elapsed time rather than
      // collapsing the pause, or the video runs faster than the walkthrough did.
      frames.push({ file, dt: Math.min(3, Math.max(0.04, (now - last) / 1000)) });
      last = now;
      try { await cdp.send("Page.screencastFrameAck", { sessionId }); } catch {}
    });

    const go = async (url, settle = 1200) => {
      await cdp.send("Page.navigate", { url: `${BASE}${url}` });
      await sleep(settle);
    };
    const js = (expression) => cdp.send("Runtime.evaluate", { expression, awaitPromise: true });
    const smoothScroll = async (to, ms = 1200) => {
      await js(`window.scrollTo({top:${to},behavior:'smooth'}); true`);
      await sleep(ms);
    };

    await setUser(learner);
    await go("/", 800);
    await cdp.send("Page.startScreencast", {
      format: "jpeg", quality: 80, maxWidth: VIEW.w, maxHeight: VIEW.h, everyNthFrame: 1,
    });

    // 1. Landing
    await sleep(2200);
    await smoothScroll(520, 1600);
    await sleep(900);

    // 2. Catalogue
    await go("/courses", 1600);
    await sleep(1600);

    // 3. Course, then a lesson
    await go("/courses/light", 1500);
    await sleep(1600);
    await go("/courses/light/convex-lens", 1800);
    await sleep(1200);

    // 4. The figure
    await smoothScroll(1150, 1500);
    await sleep(1800);

    // 5. The video: play, seek back, change speed, pause
    await smoothScroll(430, 1200);
    await js(`document.querySelector('.player video').play(); true`);
    await sleep(4500);
    await js(`(() => { const v = document.querySelector('.player video');
                        v.currentTime = Math.max(0, v.currentTime - 18); return true; })()`);
    await sleep(2600);
    await js(`[...document.querySelectorAll('.player-btn')].find(b=>/x$/.test(b.textContent))?.click(); true`);
    await sleep(2200);
    await js(`document.querySelector('.player video').pause(); true`);
    await sleep(1000);

    // 6. The quiz
    await js(`document.querySelector('.quiz').scrollIntoView({behavior:'smooth',block:'center'}); true`);
    await sleep(1600);
    await js(`[...document.querySelectorAll('button')].find(b=>/Start the quiz|Take it again/.test(b.textContent))?.click(); true`);
    await sleep(2000);
    await js(`document.querySelectorAll('.quiz-option')[1]?.click(); true`);
    await sleep(1400);
    await js(`[...document.querySelectorAll('button')].find(b=>/Check answer/.test(b.textContent))?.click(); true`);
    await sleep(3200);

    // 7. Educator: the event stream
    await setUser(educator);
    await go("/educator", 2200);
    await sleep(2000);
    await smoothScroll(700, 1500);
    await sleep(2400);
    await go("/educator?component=Video", 2000);
    await smoothScroll(760, 1400);
    await sleep(2600);

    // 8. Analytics
    await go("/educator/analytics", 2200);
    await sleep(2200);
    await smoothScroll(700, 1600);
    await sleep(2400);
    await smoothScroll(1600, 1600);
    await sleep(2600);
    await smoothScroll(2500, 1600);
    await sleep(2400);

    await cdp.send("Page.stopScreencast");
    await sleep(400);

    /* encode */
    if (frames.length < 10) throw new Error(`Only captured ${frames.length} frames`);

    const listPath = path.join(frameDir, "frames.txt");
    const lines = [];
    // Each frame's dt is the gap before it, so shift them to become hold times.
    for (let i = 0; i < frames.length; i++) {
      const hold = i + 1 < frames.length ? frames[i + 1].dt : 1.5;
      lines.push(`file '${frames[i].file}'`);
      lines.push(`duration ${hold.toFixed(3)}`);
    }
    lines.push(`file '${frames[frames.length - 1].file}'`);
    fs.writeFileSync(listPath, lines.join("\n"));

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const enc = spawnSync(
      "ffmpeg",
      [
        "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", listPath,
        "-vf", "fps=24,scale=1440:-2:flags=lanczos,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "23",
        "-movflags", "+faststart",
        OUT,
      ],
      { stdio: "inherit" }
    );
    if (enc.status !== 0) throw new Error("ffmpeg failed");

    const secs = frames.reduce((t, f) => t + f.dt, 0);
    const mb = fs.statSync(OUT).size / 1e6;
    console.log(
      `Wrote ${path.relative(ROOT, OUT)}  ${frames.length} frames  ${secs.toFixed(1)}s  ${mb.toFixed(1)} MB`
    );
  } finally {
    try { cdp?.close(); } catch {}
    chrome.kill();
    await sleep(500);
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    fs.rmSync(frameDir, { recursive: true, force: true, maxRetries: 5 });
  }
}

main().catch((err) => {
  console.error("Demo recording failed:", err.message);
  process.exit(1);
});

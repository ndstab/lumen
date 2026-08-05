/**
 * Captures the screenshots used in the README and the presentation.
 *
 * Drives headless Chrome over the DevTools protocol using Node's built in
 * WebSocket client, so there is no browser automation dependency to install.
 * Sessions are created directly in the database, which is the same thing the
 * sign-in route does, so the authenticated pages can be captured.
 *
 *   node scripts/screenshots.mjs [baseUrl]
 *
 * The dev server must be running.
 */

import Database from "better-sqlite3";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const OUT = path.join(ROOT, "docs", "screens");
const PORT = 9333;

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SHOTS = [
  { name: "landing", url: "/", as: null, w: 1280, h: 900 },
  { name: "catalogue", url: "/courses", as: "aarav@lumen.school", w: 1280, h: 760 },
  { name: "course", url: "/courses/light", as: "aarav@lumen.school", w: 1280, h: 1000 },
  { name: "lesson", url: "/courses/light/convex-lens", as: "aarav@lumen.school", w: 1280, h: 1050 },
  { name: "figure", url: "/courses/light/refraction", as: "aarav@lumen.school", w: 1280, h: 1000, scrollTo: 1400 },
  { name: "quiz", url: "/courses/cell/discovering-the-cell", as: "aarav@lumen.school", w: 1280, h: 900, quiz: true },
  { name: "event-stream", url: "/educator", as: "teacher@lumen.school", w: 1440, h: 1100 },
  { name: "analytics", url: "/educator/analytics", as: "teacher@lumen.school", w: 1440, h: 1000 },
  { name: "difficulty", url: "/educator/analytics", as: "teacher@lumen.school", w: 1440, h: 1000, scrollTo: 1150 },
  { name: "lesson-mobile", url: "/courses/light/convex-lens", as: "aarav@lumen.school", w: 390, h: 844 },
];

/* --------------------------------------------------------------- sessions -- */

function makeSession(email) {
  const db = new Database(path.join(ROOT, "data", "app.db"));
  const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (!user) throw new Error(`No such user: ${email}`);
  const id = randomBytes(32).toString("hex");
  db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, ip, user_agent)
     VALUES (?, ?, datetime('now', '+1 day'), '127.0.0.1', 'screenshot-script')`
  ).run(id, user.id);
  db.close();
  return id;
}

/* ------------------------------------------------------------------- CDP -- */

let nextId = 1;

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const waiters = [];

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      return;
    }
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].method === msg.method) {
        waiters[i].resolve(msg.params);
        waiters.splice(i, 1);
      }
    }
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  return {
    ready,
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    once(method, timeoutMs = 15000) {
      return new Promise((resolve) => {
        waiters.push({ method, resolve });
        setTimeout(resolve, timeoutMs);
      });
    },
    close: () => ws.close(),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function httpJson(url, method = "GET") {
  const res = await fetch(url, { method });
  return res.json();
}

// Recent Chrome builds only accept PUT on /json/new.
const newTab = () => httpJson(`http://127.0.0.1:${PORT}/json/new?about:blank`, "PUT");

/* ------------------------------------------------------------------ main -- */

async function main() {
  if (!fs.existsSync(CHROME)) {
    console.error(`Chrome not found at ${CHROME}`);
    process.exit(1);
  }
  const probe = await fetch(BASE).catch(() => null);
  if (!probe) {
    console.error(`No server at ${BASE}. Start it with: npm run dev`);
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

  const profile = fs.mkdtempSync(path.join(ROOT, ".chrome-profile-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--force-device-scale-factor=2",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  try {
    // Wait for the debugging endpoint to come up.
    let version = null;
    for (let i = 0; i < 40 && !version; i++) {
      version = await httpJson(`http://127.0.0.1:${PORT}/json/version`).catch(() => null);
      if (!version) await sleep(250);
    }
    if (!version) throw new Error("Chrome did not expose its debugging port");

    const sessions = new Map();
    const { host } = new URL(BASE);
    const domain = host.split(":")[0];

    for (const shot of SHOTS) {
      const target = await newTab();
      const cdp = connect(target.webSocketDebuggerUrl);
      await cdp.ready;

      await cdp.send("Page.enable");
      await cdp.send("Network.enable");
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: shot.w,
        height: shot.h,
        deviceScaleFactor: 2,
        mobile: shot.w < 500,
      });

      if (shot.as) {
        if (!sessions.has(shot.as)) sessions.set(shot.as, makeSession(shot.as));
        await cdp.send("Network.setCookie", {
          name: "lumen_session",
          value: sessions.get(shot.as),
          domain,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        });
      }

      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `${BASE}${shot.url}` });
      await loaded;
      await sleep(1400); // fonts, hydration, and the first paint of the SVGs

      if (shot.quiz) {
        await cdp.send("Runtime.evaluate", {
          expression: `(() => {
            const b = [...document.querySelectorAll('button')]
              .find(x => /Start the quiz|Take it again/.test(x.textContent));
            if (b) b.click();
            return true;
          })()`,
        });
        await sleep(900);
        await cdp.send("Runtime.evaluate", {
          expression: `(() => {
            const o = document.querySelectorAll('.quiz-option');
            if (o[0]) o[0].click();
            document.querySelector('.quiz').scrollIntoView({block:'center'});
            return true;
          })()`,
        });
        await sleep(700);
      } else if (shot.scrollTo) {
        await cdp.send("Runtime.evaluate", {
          expression: `window.scrollTo(0, ${shot.scrollTo}); true`,
        });
        await sleep(700);
      }

      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      fs.writeFileSync(path.join(OUT, `${shot.name}.png`), Buffer.from(data, "base64"));
      const kb = Math.round(fs.statSync(path.join(OUT, `${shot.name}.png`)).size / 1024);
      console.log(`  ${shot.name}.png  ${shot.w}x${shot.h}  ${kb} KB`);

      cdp.close();
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});
    }

    console.log(`Wrote ${SHOTS.length} screenshots to docs/screens`);
  } finally {
    chrome.kill();
    // Chrome can still be flushing its profile as it exits, so give it a
    // moment and do not let a cleanup failure mask a real error.
    await sleep(600);
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      console.warn(`Could not remove ${path.basename(profile)}; safe to delete by hand.`);
    }
  }
}

main().catch((err) => {
  console.error("Screenshots failed:", err.message);
  process.exit(1);
});

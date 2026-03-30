const fs = require("fs");
const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const webpush = require("web-push");

loadEnv(path.join(__dirname, ".env"));

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_only_change_me";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:you@example.com";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://jennervira.github.io";
const ALLOWED_ORIGINS = new Set(
  [FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean)
);

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn("[push] Missing VAPID keys. Push notifications are disabled until configured.");
}

const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "mood-diary.db");
const db = new sqlite3.Database(dbPath);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

initializeSchema().then(startServer).catch((err) => {
  console.error("Failed to initialize DB", err);
  process.exit(1);
});

async function initializeSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      score INTEGER NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      logs_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await ensureColumn("entries", "logs_json", "TEXT NOT NULL DEFAULT '[]'");

  await run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL,
      time TEXT NOT NULL,
      text TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders (remind_at, sent_at)
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      subscription_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, endpoint),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
}

function startServer() {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || "").trim();
      if (!email || password.length < 6) {
        return res.status(400).json({ error: "邮箱无效或密码长度小于 6 位" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await run(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        [email, passwordHash]
      );

      const token = signToken(result.lastID, email);
      res.json({ token, user: { id: result.lastID, email } });
    } catch (err) {
      if (String(err.message || "").includes("UNIQUE")) {
        return res.status(409).json({ error: "该邮箱已注册" });
      }
      res.status(500).json({ error: "注册失败" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password || "");
      const user = await get("SELECT id, email, password_hash FROM users WHERE email = ?", [email]);
      if (!user) return res.status(401).json({ error: "账号或密码错误" });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: "账号或密码错误" });

      const token = signToken(user.id, user.email);
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch {
      res.status(500).json({ error: "登录失败" });
    }
  });

  app.get("/api/auth/me", authRequired, async (req, res) => {
    res.json({ user: { id: req.user.id, email: req.user.email } });
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      vapidPublicKey: VAPID_PUBLIC_KEY || null,
      pushEnabled: Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
    });
  });

  app.get("/api/entries", authRequired, async (req, res) => {
    try {
      const year = String(req.query.year || "").trim();
      if (!/^\d{4}$/.test(year)) {
        return res.status(400).json({ error: "year 参数无效" });
      }

      const entryRows = await all(
        `SELECT date, score, summary, logs_json, updated_at FROM entries
         WHERE user_id = ? AND date >= ? AND date <= ?
         ORDER BY date ASC`,
        [req.user.id, `${year}-01-01`, `${year}-12-31`]
      );

      const reminderRows = await all(
        `SELECT entry_date, time, text, remind_at FROM reminders
         WHERE user_id = ? AND entry_date >= ? AND entry_date <= ?
         ORDER BY remind_at ASC`,
        [req.user.id, `${year}-01-01`, `${year}-12-31`]
      );

      const remindersByDate = {};
      reminderRows.forEach((r) => {
        remindersByDate[r.entry_date] = remindersByDate[r.entry_date] || [];
        remindersByDate[r.entry_date].push({
          time: r.time,
          text: r.text,
          remindAt: r.remind_at
        });
      });

      const entries = entryRows.map((e) => ({
        date: e.date,
        score: e.score,
        summary: e.summary,
        logs: parseLogs(e.logs_json),
        reminders: remindersByDate[e.date] || [],
        updatedAt: e.updated_at
      }));

      res.json({ entries });
    } catch {
      res.status(500).json({ error: "读取日记失败" });
    }
  });

  app.put("/api/entries/:date", authRequired, async (req, res) => {
    const date = String(req.params.date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "日期格式必须是 YYYY-MM-DD" });
    }

    const score = Number(req.body.score);
    const summary = String(req.body.summary || "").slice(0, 200);
    const logs = normalizeLogs(req.body.logs);
    const reminders = Array.isArray(req.body.reminders) ? req.body.reminders : [];

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return res.status(400).json({ error: "score 必须在 1-10" });
    }

    try {
      await run("BEGIN TRANSACTION");

      await run(
        `INSERT INTO entries (user_id, date, score, summary, logs_json, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, date)
         DO UPDATE SET score=excluded.score, summary=excluded.summary, logs_json=excluded.logs_json, updated_at=datetime('now')`,
        [req.user.id, date, score, summary, JSON.stringify(logs)]
      );

      await run("DELETE FROM reminders WHERE user_id = ? AND entry_date = ?", [req.user.id, date]);

      for (const reminder of reminders) {
        const time = String(reminder.time || "").trim();
        const text = String(reminder.text || "").trim().slice(0, 80);
        const remindAt = String(reminder.remindAt || "").trim();

        if (!/^\d{2}:\d{2}$/.test(time) || !text || !isISODateTime(remindAt)) {
          continue;
        }

        await run(
          `INSERT INTO reminders (user_id, entry_date, time, text, remind_at)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, date, time, text, remindAt]
        );
      }

      await run("COMMIT");
      res.json({ ok: true });
    } catch (err) {
      await run("ROLLBACK").catch(() => {});
      console.error("save entry error", err);
      res.status(500).json({ error: "保存失败" });
    }
  });

  app.post("/api/push/subscribe", authRequired, async (req, res) => {
    if (!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)) {
      return res.status(400).json({ error: "服务端未配置推送密钥" });
    }

    const subscription = req.body.subscription;
    if (!subscription || typeof subscription !== "object" || !subscription.endpoint) {
      return res.status(400).json({ error: "subscription 无效" });
    }

    try {
      await run(
        `INSERT INTO push_subscriptions (user_id, endpoint, subscription_json, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(user_id, endpoint)
         DO UPDATE SET subscription_json=excluded.subscription_json, updated_at=datetime('now')`,
        [req.user.id, subscription.endpoint, JSON.stringify(subscription)]
      );
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "订阅推送失败" });
    }
  });

  app.post("/api/push/unsubscribe", authRequired, async (req, res) => {
    const endpoint = String(req.body.endpoint || "").trim();
    if (!endpoint) return res.status(400).json({ error: "endpoint 不能为空" });

    try {
      await run("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?", [req.user.id, endpoint]);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "取消订阅失败" });
    }
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  setInterval(processDueReminders, 60 * 1000);
  processDueReminders().catch(() => {});

  app.listen(PORT, () => {
    console.log(`Mood Diary server running at http://localhost:${PORT}`);
  });
}

async function processDueReminders() {
  if (!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)) return;

  const nowIso = new Date().toISOString();
  const due = await all(
    `SELECT id, user_id, entry_date, time, text, remind_at
     FROM reminders
     WHERE sent_at IS NULL AND remind_at <= ?
     ORDER BY remind_at ASC
     LIMIT 200`,
    [nowIso]
  );

  for (const item of due) {
    const subscriptions = await all(
      "SELECT id, endpoint, subscription_json FROM push_subscriptions WHERE user_id = ?",
      [item.user_id]
    );

    const payload = JSON.stringify({
      title: "心情日历提醒",
      body: `${item.time} ${item.text}`,
      url: `/#day=${item.entry_date}`
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(JSON.parse(sub.subscription_json), payload);
      } catch (err) {
        const statusCode = Number(err.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          await run("DELETE FROM push_subscriptions WHERE id = ?", [sub.id]);
        } else {
          console.error("push failed", statusCode, err.body || err.message);
        }
      }
    }

    await run("UPDATE reminders SET sent_at = datetime('now') WHERE id = ?", [item.id]);
  }
}

function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "未登录" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "登录已过期" });
  }
}

function signToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "30d" });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isISODateTime(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function ensureColumn(tableName, columnName, columnDefinition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((col) => col.name === columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

function parseLogs(value) {
  try {
    const arr = JSON.parse(value || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function normalizeLogs(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(-200)
    .map((item) => ({
      score: Number(item.score),
      summary: String(item.summary || "").slice(0, 200),
      at: String(item.at || "")
    }))
    .filter((item) => Number.isInteger(item.score) && item.score >= 1 && item.score <= 10 && item.at);
}

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx < 0) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

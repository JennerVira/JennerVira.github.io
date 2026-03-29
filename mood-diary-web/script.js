const TOKEN_KEY = "moodDiaryTokenV1";
const LOCAL_DATA_KEY = "moodDiaryGuestDataV1";
const API_BASE = String(window.MOOD_DIARY_API_BASE || "").trim().replace(/\/$/, "");

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

const bookPool = [
  {
    title: "《小王子》",
    author: "安托万·德·圣埃克苏佩里",
    summary: "通过童话叙事讨论爱、责任与成长，提醒我们看见本质。",
    doubanUrl: "https://book.douban.com/subject/1084336/"
  },
  {
    title: "《被讨厌的勇气》",
    author: "岸见一郎 / 古贺史健",
    summary: "基于阿德勒心理学，讨论课题分离、自我接纳和人际自由。",
    doubanUrl: "https://book.douban.com/subject/26369699/"
  },
  {
    title: "《活着》",
    author: "余华",
    summary: "讲述普通人在时代洪流中的命运起伏，展现生命韧性。",
    doubanUrl: "https://book.douban.com/subject/4913064/"
  },
  {
    title: "《原则》",
    author: "瑞·达利欧",
    summary: "总结个人与组织决策原则，强调透明、复盘与系统化思考。",
    doubanUrl: "https://book.douban.com/subject/27608239/"
  },
  {
    title: "《人类简史》",
    author: "尤瓦尔·赫拉利",
    summary: "从认知革命到现代社会，梳理人类文明演进脉络。",
    doubanUrl: "https://book.douban.com/subject/25985021/"
  },
  {
    title: "《纳瓦尔宝典》",
    author: "埃里克·乔根森（整理）",
    summary: "围绕财富、幸福与长期主义，给出可执行的思维框架。",
    doubanUrl: "https://book.douban.com/subject/34938449/"
  },
  {
    title: "《刻意练习》",
    author: "安德斯·艾利克森 / 罗伯特·普尔",
    summary: "解释高水平能力形成机制，强调反馈与有目标的训练。",
    doubanUrl: "https://book.douban.com/subject/26895993/"
  },
  {
    title: "《深度工作》",
    author: "卡尔·纽波特",
    summary: "提出高质量专注工作的原则，帮助提升产出与掌控感。",
    doubanUrl: "https://book.douban.com/subject/27056410/"
  }
];

const historyMap = {
  "01-01": "公历新年。适合给自己写下一年的关键词。",
  "03-08": "国际妇女节。感谢并支持身边每一位女性。",
  "04-23": "世界读书日。今天读 20 分钟就很棒。",
  "05-01": "劳动节。肯定你的每一份付出。",
  "06-01": "国际儿童节。允许自己快乐一点。",
  "10-01": "国庆节。适合和家人朋友聚一聚。",
  "12-31": "一年的最后一天。感谢过去，也拥抱下一年。"
};

const defaultAiTips = [
  "每天早上固定时间补水提醒",
  "抢票前 30 分钟提醒登录账号并检查网络",
  "晚间提醒回顾今天三件完成的小事"
];

const state = {
  year: new Date().getFullYear(),
  selectedDate: toISODate(new Date()),
  data: loadGuestData(),
  token: localStorage.getItem(TOKEN_KEY) || "",
  user: null,
  pushEnabled: false,
  vapidPublicKey: null,
  swReg: null
};

const authPanel = document.getElementById("auth-panel");
const homeView = document.getElementById("home-view");
const dayView = document.getElementById("day-view");

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateCN(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function hashForDate(dateStr) {
  return `#day=${dateStr}`;
}

function scoreClass(score) {
  if (score <= 4) return "day-score-weak";
  if (score <= 7) return "day-score-mid";
  return "day-score-good";
}

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(apiUrl(path), { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

function apiUrl(path) {
  if (!API_BASE) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "#d62839" : "#59607a";
}

function loadGuestData() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveGuestData() {
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(state.data));
}

function getEntry(dateStr) {
  if (!state.data[dateStr]) {
    state.data[dateStr] = {
      score: 5,
      summary: "",
      reminders: []
    };
  }
  return state.data[dateStr];
}

async function loadConfig() {
  try {
    const config = await api("/api/config", { method: "GET", headers: {} });
    state.vapidPublicKey = config.vapidPublicKey;
    state.pushEnabled = Boolean(config.pushEnabled);
  } catch {
    state.vapidPublicKey = null;
    state.pushEnabled = false;
  }
}

async function loadCurrentUser() {
  if (!state.token) return;

  try {
    const data = await api("/api/auth/me", { method: "GET" });
    state.user = data.user;
    await syncYear(state.year);
  } catch {
    state.token = "";
    state.user = null;
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function syncYear(year) {
  if (!state.user) return;
  const data = await api(`/api/entries?year=${year}`, { method: "GET" });

  for (const entry of data.entries) {
    state.data[entry.date] = {
      score: Number(entry.score),
      summary: entry.summary || "",
      reminders: Array.isArray(entry.reminders) ? entry.reminders : []
    };
  }
}

function renderAuthPanel() {
  if (state.user) {
    authPanel.innerHTML = `
      <div class="auth-row">
        <div>
          <strong>已登录：</strong>${state.user.email}
          <p class="muted">数据自动同步到云端。提醒将由服务端按时推送。</p>
        </div>
        <div class="inline">
          <button id="sync-now" class="btn ghost">立即同步</button>
          <button id="logout" class="btn ghost">退出登录</button>
        </div>
      </div>
    `;

    document.getElementById("sync-now").addEventListener("click", async () => {
      try {
        await syncYear(state.year);
        renderHome();
        alert("已从云端同步当前年份数据");
      } catch (err) {
        alert(err.message);
      }
    });

    document.getElementById("logout").addEventListener("click", () => {
      state.user = null;
      state.token = "";
      localStorage.removeItem(TOKEN_KEY);
      renderAuthPanel();
    });

    return;
  }

  authPanel.innerHTML = `
    <h3>登录账号（启用云端同步与离线推送提醒）</h3>
    <div class="auth-grid">
      <input id="auth-email" type="email" placeholder="邮箱" />
      <input id="auth-password" type="password" placeholder="密码（至少 6 位）" />
      <button id="login-btn" class="btn">登录</button>
      <button id="register-btn" class="btn ghost">注册</button>
    </div>
    <p class="muted" id="auth-msg">未登录时只能在当前浏览器临时使用。</p>
  `;

  const emailEl = document.getElementById("auth-email");
  const pwdEl = document.getElementById("auth-password");
  const msgEl = document.getElementById("auth-msg");

  async function submit(mode) {
    const email = emailEl.value.trim();
    const password = pwdEl.value.trim();
    if (!email || !password) {
      showMessage(msgEl, "请填写邮箱和密码", true);
      return;
    }

    try {
      const data = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem(TOKEN_KEY, state.token);
      showMessage(msgEl, mode === "login" ? "登录成功" : "注册成功");

      await syncYear(state.year);
      renderAuthPanel();
      renderHome();
    } catch (err) {
      showMessage(msgEl, err.message, true);
    }
  }

  document.getElementById("login-btn").addEventListener("click", () => submit("login"));
  document.getElementById("register-btn").addEventListener("click", () => submit("register"));
}

function renderHome() {
  homeView.innerHTML = "";

  const control = document.createElement("div");
  control.className = "card";
  control.innerHTML = `
    <div class="day-header">
      <h2>${state.year} 年全年心情日历</h2>
      <div class="inline">
        <button class="back-btn" id="prev-year">上一年</button>
        <button class="back-btn" id="next-year">下一年</button>
      </div>
    </div>
    <p class="muted">已记录日期会高亮；登录后会自动云端同步。</p>
  `;

  const monthsGrid = document.createElement("div");
  monthsGrid.className = "months-grid";

  for (let month = 0; month < 12; month += 1) {
    monthsGrid.appendChild(renderMonthCard(state.year, month));
  }

  homeView.append(control, monthsGrid);

  document.getElementById("prev-year").addEventListener("click", async () => {
    state.year -= 1;
    if (state.user) {
      await syncYear(state.year).catch(() => {});
    }
    renderHome();
  });

  document.getElementById("next-year").addEventListener("click", async () => {
    state.year += 1;
    if (state.user) {
      await syncYear(state.year).catch(() => {});
    }
    renderHome();
  });
}

function renderMonthCard(year, month) {
  const tpl = document.getElementById("month-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".month-title").textContent = `${monthNames[month]} ${year}`;

  const monthGrid = node.querySelector(".month-grid");
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < startWeekday; i += 1) {
    const empty = document.createElement("button");
    empty.className = "day empty";
    monthGrid.appendChild(empty);
  }

  const today = toISODate(new Date());

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateStr = toISODate(date);
    const entry = state.data[dateStr];

    const btn = document.createElement("button");
    btn.className = "day";
    btn.textContent = String(day);

    if (dateStr === today) btn.classList.add("today");

    if (entry) {
      btn.classList.add("has-entry", scoreClass(entry.score));
      btn.title = `心情 ${entry.score}/10`;
    }

    btn.addEventListener("click", () => {
      location.hash = hashForDate(dateStr);
    });

    monthGrid.appendChild(btn);
  }

  return node;
}

function getBookRecommendation(dateStr) {
  const index = Math.abs(hashCode(dateStr)) % bookPool.length;
  return bookPool[index];
}

function getHistoryToday(dateStr) {
  const monthDay = dateStr.slice(5);
  if (historyMap[monthDay]) return historyMap[monthDay];
  return "这一天没有预设事件。你可以把今天定义成自己的历史时刻。";
}

function getAiTips(entry) {
  const tips = [...defaultAiTips];
  entry.reminders.forEach((r) => tips.unshift(`已设提醒 ${r.time} - ${r.text}`));
  return tips.slice(0, 6);
}

function buildRemindAt(dateStr, time) {
  const local = new Date(`${dateStr}T${time}:00`);
  return local.toISOString();
}

async function saveEntry(dateStr, entry) {
  if (!state.user) {
    saveGuestData();
    return;
  }

  await api(`/api/entries/${dateStr}`, {
    method: "PUT",
    body: JSON.stringify({
      score: entry.score,
      summary: entry.summary,
      reminders: entry.reminders.map((r) => ({
        time: r.time,
        text: r.text,
        remindAt: r.remindAt || buildRemindAt(dateStr, r.time)
      }))
    })
  });
}

async function ensurePushSubscribed() {
  if (!state.user) {
    alert("请先登录账号");
    return;
  }

  if (!state.pushEnabled || !state.vapidPublicKey) {
    alert("服务端未开启 Push，请先配置 VAPID 密钥");
    return;
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("当前浏览器不支持 Web Push");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("你拒绝了通知权限，无法接收离线提醒");
    return;
  }

  const reg = state.swReg || (await navigator.serviceWorker.register("/sw.js"));
  state.swReg = reg;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(state.vapidPublicKey)
    });
  }

  await api("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify({ subscription })
  });

  alert("推送订阅完成。网页关闭后仍可接收到点提醒（取决于系统通知设置）。");
}

function renderDay(dateStr) {
  const entry = getEntry(dateStr);
  const book = getBookRecommendation(dateStr);
  const history = getHistoryToday(dateStr);
  const tips = getAiTips(entry);

  dayView.innerHTML = `
    <div class="day-header">
      <h2>${formatDateCN(dateStr)}</h2>
      <button class="back-btn" id="go-home">返回全年日历</button>
    </div>

    <div class="cards">
      <article class="card">
        <h3>每日心情记录</h3>
        <div class="inline">
          <label for="score">今日打分（1-10）</label>
          <span id="score-tag" class="score-tag">${entry.score}/10</span>
        </div>
        <input id="score" type="range" min="1" max="10" value="${entry.score}" />

        <div style="margin-top:12px;">
          <label for="summary">一句话总结</label>
          <textarea id="summary" rows="4" maxlength="120" placeholder="例如：今天完成了关键任务，虽然很累但很踏实。">${entry.summary || ""}</textarea>
        </div>

        <div style="margin-top:12px;" class="inline">
          <button id="save-entry" class="btn">保存今日记录</button>
          <span class="muted" id="save-status"></span>
        </div>
      </article>

      <section class="stack">
        <article class="card">
          <h3>每日书籍推荐</h3>
          <p><strong>${book.title}</strong></p>
          <p class="muted">作者：${book.author}</p>
          <p class="muted">主要内容：${book.summary}</p>
          <p><a href="${book.doubanUrl}" target="_blank" rel="noopener noreferrer">豆瓣链接</a></p>
        </article>

        <article class="card">
          <h3>历史上的今天</h3>
          <p class="muted">${history}</p>
        </article>

        <article class="card">
          <h3>AI 辅助提示（提醒）</h3>
          <ul class="tip-list">
            ${tips.map((t) => `<li>${t}</li>`).join("")}
          </ul>

          <div class="divider"></div>

          <label for="reminder-time">添加提醒时间</label>
          <input id="reminder-time" type="time" value="09:00" />

          <label for="reminder-text" style="margin-top:10px;">提醒内容</label>
          <input id="reminder-text" type="text" maxlength="50" placeholder="例如：提醒我 19:58 抢票" />

          <div style="margin-top:10px;" class="inline">
            <button id="add-reminder" class="btn ghost">添加提醒</button>
            <button id="enable-push" class="btn ghost">开启离线推送提醒</button>
          </div>

          <ul id="reminder-list" class="reminder-list" style="margin-top:10px;"></ul>
        </article>
      </section>
    </div>
  `;

  document.getElementById("go-home").addEventListener("click", () => {
    location.hash = "#home";
  });

  const scoreEl = document.getElementById("score");
  const scoreTag = document.getElementById("score-tag");
  scoreEl.addEventListener("input", () => {
    scoreTag.textContent = `${scoreEl.value}/10`;
    scoreTag.style.background = scoreEl.value >= 8 ? "#2b9348" : scoreEl.value <= 4 ? "#d62839" : "#f4a261";
  });

  document.getElementById("save-entry").addEventListener("click", async () => {
    entry.score = Number(scoreEl.value);
    entry.summary = document.getElementById("summary").value.trim();

    try {
      await saveEntry(dateStr, entry);
      document.getElementById("save-status").textContent = state.user ? "已保存并同步到云端" : "已保存（本地）";
      renderHome();
    } catch (err) {
      document.getElementById("save-status").textContent = `保存失败：${err.message}`;
    }
  });

  const reminderList = document.getElementById("reminder-list");

  function renderReminders() {
    reminderList.innerHTML = "";

    if (!entry.reminders.length) {
      reminderList.innerHTML = '<li class="muted">当前日期暂无提醒</li>';
      return;
    }

    entry.reminders.forEach((item, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${item.time}</strong> ${item.text}
        <button class="back-btn" data-remove="${idx}" style="margin-left:8px; padding:3px 8px;">删除</button>
      `;
      reminderList.appendChild(li);
    });

    reminderList.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        entry.reminders.splice(Number(btn.dataset.remove), 1);
        try {
          await saveEntry(dateStr, entry);
          renderReminders();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  }

  renderReminders();

  document.getElementById("add-reminder").addEventListener("click", async () => {
    const time = document.getElementById("reminder-time").value;
    const text = document.getElementById("reminder-text").value.trim();

    if (!time || !text) {
      alert("请先填写提醒时间和内容");
      return;
    }

    entry.reminders.push({
      time,
      text,
      remindAt: buildRemindAt(dateStr, time)
    });

    try {
      await saveEntry(dateStr, entry);
      renderReminders();
      document.getElementById("reminder-text").value = "";
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById("enable-push").addEventListener("click", ensurePushSubscribed);
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function navigateByHash() {
  const hash = location.hash || "#home";

  if (hash.startsWith("#day=")) {
    const dateStr = hash.replace("#day=", "");
    state.selectedDate = dateStr;
    homeView.classList.add("hidden");
    dayView.classList.remove("hidden");
    renderDay(dateStr);
    return;
  }

  homeView.classList.remove("hidden");
  dayView.classList.add("hidden");
  renderHome();
}

function base64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function bootstrap() {
  await loadConfig();

  if ("serviceWorker" in navigator) {
    state.swReg = await navigator.serviceWorker.register("/sw.js").catch(() => null);
  }

  await loadCurrentUser();
  renderAuthPanel();
  navigateByHash();

  window.addEventListener("hashchange", navigateByHash);
}

bootstrap();

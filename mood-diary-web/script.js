const TOKEN_KEY = "moodDiaryTokenV1";
const LOCAL_DATA_KEY = "moodDiaryGuestDataV1";
const API_BASE = String(window.MOOD_DIARY_API_BASE || "").trim().replace(/\/$/, "");

const monthNames = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

const mediaPool = [
  { type: "book", title: "《小王子》", creator: "安托万·德·圣埃克苏佩里", summary: "关于爱与责任的童话寓言。", link: "https://book.douban.com/subject/1084336/" },
  { type: "book", title: "《活着》", creator: "余华", summary: "在苦难中保持生命韧性。", link: "https://book.douban.com/subject/4913064/" },
  { type: "book", title: "《被讨厌的勇气》", creator: "岸见一郎 / 古贺史健", summary: "阿德勒心理学入门。", link: "https://book.douban.com/subject/26369699/" },
  { type: "book", title: "《百年孤独》", creator: "加西亚·马尔克斯", summary: "魔幻与现实交织的家族史诗。", link: "https://book.douban.com/subject/6082808/" },
  { type: "book", title: "《追风筝的人》", creator: "卡勒德·胡赛尼", summary: "关于背叛、救赎与回归。", link: "https://book.douban.com/subject/1770782/" },
  { type: "book", title: "《解忧杂货店》", creator: "东野圭吾", summary: "跨越时空的温柔回信。", link: "https://book.douban.com/subject/25862578/" },
  { type: "book", title: "《围城》", creator: "钱钟书", summary: "幽默锋利的婚姻与人生观察。", link: "https://book.douban.com/subject/1008145/" },
  { type: "book", title: "《月亮与六便士》", creator: "毛姆", summary: "理想、欲望与代价。", link: "https://book.douban.com/subject/1858513/" },
  { type: "book", title: "《人间失格》", creator: "太宰治", summary: "孤独与自我剖析。", link: "https://book.douban.com/subject/4011670/" },
  { type: "book", title: "《平凡的世界》", creator: "路遥", summary: "时代洪流中的普通人奋斗史。", link: "https://book.douban.com/subject/1084165/" },
  { type: "book", title: "《三体》", creator: "刘慈欣", summary: "硬科幻与文明碰撞。", link: "https://book.douban.com/subject/2567698/" },
  { type: "book", title: "《白夜行》", creator: "东野圭吾", summary: "漫长黑夜中的命运纠缠。", link: "https://book.douban.com/subject/3259440/" },
  { type: "book", title: "《一句顶一万句》", creator: "刘震云", summary: "沟通与孤独的深层主题。", link: "https://book.douban.com/subject/2589359/" },
  { type: "book", title: "《纳瓦尔宝典》", creator: "埃里克·乔根森（整理）", summary: "财富与幸福的长期主义框架。", link: "https://book.douban.com/subject/34938449/" },
  { type: "book", title: "《深度工作》", creator: "卡尔·纽波特", summary: "系统提升专注力与产出。", link: "https://book.douban.com/subject/27056410/" },
  { type: "book", title: "《刻意练习》", creator: "安德斯·艾利克森", summary: "技能进阶的有效训练法。", link: "https://book.douban.com/subject/26895993/" },
  { type: "book", title: "《原则》", creator: "瑞·达利欧", summary: "面向决策与复盘的原则集合。", link: "https://book.douban.com/subject/27608239/" },
  { type: "book", title: "《乌合之众》", creator: "古斯塔夫·勒庞", summary: "群体心理经典读本。", link: "https://book.douban.com/subject/1012611/" },
  { type: "book", title: "《人类简史》", creator: "尤瓦尔·赫拉利", summary: "从宏观视角看文明演化。", link: "https://book.douban.com/subject/25985021/" },
  { type: "book", title: "《东京梦华录》", creator: "孟元老", summary: "北宋都城生活图卷。", link: "https://book.douban.com/subject/1065276/" },
  { type: "movie", title: "《霸王别姬》", creator: "导演：陈凯歌", summary: "时代巨变中的人生悲欢。", link: "https://movie.douban.com/subject/1291546/" },
  { type: "movie", title: "《肖申克的救赎》", creator: "导演：弗兰克·德拉邦特", summary: "希望与自由的经典叙事。", link: "https://movie.douban.com/subject/1292052/" },
  { type: "movie", title: "《海上钢琴师》", creator: "导演：朱塞佩·托纳多雷", summary: "天赋、孤独与选择。", link: "https://movie.douban.com/subject/1292001/" },
  { type: "movie", title: "《千与千寻》", creator: "导演：宫崎骏", summary: "成长与善意的奇幻旅程。", link: "https://movie.douban.com/subject/1291561/" },
  { type: "movie", title: "《你的名字。》", creator: "导演：新海诚", summary: "青春与时空交错的情感。", link: "https://movie.douban.com/subject/26683290/" },
  { type: "movie", title: "《花样年华》", creator: "导演：王家卫", summary: "克制而绵长的东方情绪。", link: "https://movie.douban.com/subject/1291557/" },
  { type: "movie", title: "《阳光普照》", creator: "导演：钟孟宏", summary: "家庭裂痕与和解。", link: "https://movie.douban.com/subject/30401849/" },
  { type: "movie", title: "《燃情岁月》", creator: "导演：爱德华·兹威克", summary: "家族、爱情与命运。", link: "https://movie.douban.com/subject/1295865/" },
  { type: "movie", title: "《心灵奇旅》", creator: "导演：彼特·道格特", summary: "意义与热爱的现代寓言。", link: "https://movie.douban.com/subject/24733428/" },
  { type: "movie", title: "《一一》", creator: "导演：杨德昌", summary: "细微日常中的生命体察。", link: "https://movie.douban.com/subject/1292434/" },
  { type: "movie", title: "《寄生虫》", creator: "导演：奉俊昊", summary: "阶层寓言与黑色幽默。", link: "https://movie.douban.com/subject/27010768/" },
  { type: "movie", title: "《让子弹飞》", creator: "导演：姜文", summary: "节奏凌厉的荒诞现实。", link: "https://movie.douban.com/subject/3742360/" },
  { type: "movie", title: "《重庆森林》", creator: "导演：王家卫", summary: "都市孤独与偶然邂逅。", link: "https://movie.douban.com/subject/1291999/" },
  { type: "movie", title: "《大佛普拉斯》", creator: "导演：黄信尧", summary: "冷峻与幽默并存的现实切片。", link: "https://movie.douban.com/subject/27145017/" },
  { type: "movie", title: "《饮食男女》", creator: "导演：李安", summary: "家庭关系的温柔辩证。", link: "https://movie.douban.com/subject/1291818/" },
  { type: "movie", title: "《情书》", creator: "导演：岩井俊二", summary: "纯净克制的青春怀念。", link: "https://movie.douban.com/subject/1292220/" },
  { type: "movie", title: "《白日梦想家》", creator: "导演：本·斯蒂勒", summary: "向内心出发的勇气。", link: "https://movie.douban.com/subject/2133323/" },
  { type: "movie", title: "《机器人总动员》", creator: "导演：安德鲁·斯坦顿", summary: "浪漫与环保主题的动画经典。", link: "https://movie.douban.com/subject/2131459/" },
  { type: "movie", title: "《十二怒汉》", creator: "导演：西德尼·吕美特", summary: "理性讨论的电影教科书。", link: "https://movie.douban.com/subject/1293182/" },
  { type: "movie", title: "《绿皮书》", creator: "导演：彼得·法雷里", summary: "偏见、友谊与成长。", link: "https://movie.douban.com/subject/27060077/" }
];

const renjianCiPool = [
  { title: "《虞美人》", author: "李煜", line: "问君能有几多愁，恰似一江春水向东流。" },
  { title: "《浪淘沙令》", author: "李煜", line: "流水落花春去也，天上人间。" },
  { title: "《蝶恋花》", author: "晏殊", line: "无可奈何花落去，似曾相识燕归来。" },
  { title: "《浣溪沙》", author: "晏殊", line: "一曲新词酒一杯，去年天气旧亭台。" },
  { title: "《蝶恋花》", author: "欧阳修", line: "庭院深深深几许，杨柳堆烟，帘幕无重数。" },
  { title: "《生查子》", author: "欧阳修", line: "月上柳梢头，人约黄昏后。" },
  { title: "《青玉案·元夕》", author: "辛弃疾", line: "众里寻他千百度，蓦然回首，那人却在，灯火阑珊处。" },
  { title: "《丑奴儿》", author: "辛弃疾", line: "少年不识愁滋味，爱上层楼。" },
  { title: "《破阵子》", author: "辛弃疾", line: "醉里挑灯看剑，梦回吹角连营。" },
  { title: "《鹧鸪天》", author: "辛弃疾", line: "晚日寒鸦一片愁，柳塘新绿却温柔。" },
  { title: "《念奴娇·赤壁怀古》", author: "苏轼", line: "大江东去，浪淘尽，千古风流人物。" },
  { title: "《水调歌头》", author: "苏轼", line: "但愿人长久，千里共婵娟。" },
  { title: "《定风波》", author: "苏轼", line: "莫听穿林打叶声，何妨吟啸且徐行。" },
  { title: "《卜算子·黄州定慧院寓居作》", author: "苏轼", line: "拣尽寒枝不肯栖，寂寞沙洲冷。" },
  { title: "《江城子》", author: "苏轼", line: "十年生死两茫茫，不思量，自难忘。" },
  { title: "《声声慢》", author: "李清照", line: "寻寻觅觅，冷冷清清，凄凄惨惨戚戚。" },
  { title: "《如梦令》", author: "李清照", line: "知否，知否？应是绿肥红瘦。" },
  { title: "《醉花阴》", author: "李清照", line: "莫道不销魂，帘卷西风，人比黄花瘦。" },
  { title: "《一剪梅》", author: "李清照", line: "此情无计可消除，才下眉头，却上心头。" },
  { title: "《武陵春》", author: "李清照", line: "物是人非事事休，欲语泪先流。" },
  { title: "《雨霖铃》", author: "柳永", line: "今宵酒醒何处？杨柳岸，晓风残月。" },
  { title: "《蝶恋花》", author: "柳永", line: "衣带渐宽终不悔，为伊消得人憔悴。" },
  { title: "《八声甘州》", author: "柳永", line: "对潇潇暮雨洒江天，一番洗清秋。" },
  { title: "《望海潮》", author: "柳永", line: "有三秋桂子，十里荷花。" },
  { title: "《鹊桥仙》", author: "秦观", line: "两情若是久长时，又岂在朝朝暮暮。" },
  { title: "《踏莎行》", author: "秦观", line: "雾失楼台，月迷津渡。" },
  { title: "《满庭芳》", author: "秦观", line: "山抹微云，天连衰草，画角声断谯门。" },
  { title: "《行香子》", author: "秦观", line: "便纵有千种风情，更与何人说。" },
  { title: "《浣溪沙》", author: "秦观", line: "自在飞花轻似梦，无边丝雨细如愁。" },
  { title: "《临江仙》", author: "晏几道", line: "落花人独立，微雨燕双飞。" },
  { title: "《鹧鸪天》", author: "晏几道", line: "从别后，忆相逢，几回魂梦与君同。" },
  { title: "《蝶恋花》", author: "晏几道", line: "梦入江南烟水路，行尽江南，不与离人遇。" },
  { title: "《木兰花》", author: "晏几道", line: "天涯地角有穷时，只有相思无尽处。" },
  { title: "《苏幕遮》", author: "范仲淹", line: "碧云天，黄叶地，秋色连波，波上寒烟翠。" },
  { title: "《渔家傲》", author: "范仲淹", line: "浊酒一杯家万里，燕然未勒归无计。" },
  { title: "《桂枝香·金陵怀古》", author: "王安石", line: "千里澄江似练，翠峰如簇。" },
  { title: "《千秋岁引》", author: "王安石", line: "别馆寒砧，孤城画角，一派秋声入寥廓。" },
  { title: "《清平乐》", author: "黄庭坚", line: "春归何处？寂寞无行路。" },
  { title: "《卜算子》", author: "陆游", line: "零落成泥碾作尘，只有香如故。" },
  { title: "《钗头凤》", author: "陆游", line: "山盟虽在，锦书难托。莫，莫，莫！" },
  { title: "《诉衷情》", author: "陆游", line: "此生谁料，心在天山，身老沧洲。" },
  { title: "《摸鱼儿》", author: "元好问", line: "问世间，情是何物，直教生死相许。" },
  { title: "《扬州慢》", author: "姜夔", line: "二十四桥仍在，波心荡，冷月无声。" },
  { title: "《暗香》", author: "姜夔", line: "旧时月色，算几番照我，梅边吹笛。" },
  { title: "《疏影》", author: "姜夔", line: "昭君不惯胡沙远，但暗忆、江南江北。" },
  { title: "《青玉案》", author: "贺铸", line: "试问闲愁都几许？一川烟草，满城风絮，梅子黄时雨。" },
  { title: "《天仙子》", author: "张先", line: "沙上并禽池上暝，云破月来花弄影。" },
  { title: "《千秋岁》", author: "张先", line: "天不老，情难绝。心似双丝网，中有千千结。" },
  { title: "《采桑子》", author: "欧阳修", line: "群芳过后西湖好，狼籍残红。" },
  { title: "《蝶恋花》", author: "王国维引晏殊", line: "昨夜西风凋碧树。独上高楼，望尽天涯路。" }
];

const defaultAiTips = [
  "每天早上固定时间补水提醒",
  "抢票前 30 分钟提醒提前检查网络",
  "晚间提醒回顾今天三件完成的小事"
];

const solarFestivals = {
  "01-01": "元旦",
  "02-14": "情人节",
  "03-08": "妇女节",
  "04-04": "清明",
  "05-01": "劳动节",
  "06-01": "儿童节",
  "10-01": "国庆",
  "12-25": "圣诞"
};

const lunarFestivals = {
  "正月初一": "春节",
  "正月十五": "元宵",
  "五月初五": "端午",
  "七月初七": "七夕",
  "八月十五": "中秋",
  "九月初九": "重阳",
  "腊月初八": "腊八",
  "腊月廿三": "小年",
  "腊月廿九": "除夕",
  "腊月三十": "除夕"
};

const state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  viewMode: "month",
  selectedDate: toISODate(new Date()),
  data: loadGuestData(),
  token: localStorage.getItem(TOKEN_KEY) || "",
  user: null,
  pushEnabled: false,
  vapidPublicKey: null,
  swReg: null
};

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

function scoreEmoji(score) {
  if (score >= 1 && score <= 3) return "😔";
  if (score >= 4 && score <= 6) return "😑";
  if (score >= 7 && score <= 8) return "😊";
  return "😄";
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
      reminders: [],
      logs: []
    };
  }
  if (!Array.isArray(state.data[dateStr].logs)) state.data[dateStr].logs = [];
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
      reminders: Array.isArray(entry.reminders) ? entry.reminders : [],
      logs: Array.isArray(entry.logs) ? entry.logs : []
    };
  }
}

function renderAuthPanel() {
  return;
}

function renderHome() {
  homeView.innerHTML = "";
  const monthStat = getMonthStats(state.year, state.month);

  const control = document.createElement("div");
  control.className = "card month-control";
  control.innerHTML = `
    <div class="day-header">
      <div>
        <h2>${state.year} 年 ${monthNames[state.month]} 心情日历</h2>
      </div>
      <div class="inline">
        <button class="back-btn" id="switch-view">${state.viewMode === "month" ? "年历视图" : "月历视图"}</button>
      </div>
    </div>
    <div class="month-meta">
      <span class="chip">已记录 ${monthStat.recordedDays} 天</span>
      <span class="chip">平均分 ${monthStat.avgScore}</span>
      <span class="chip">😔 1-3 / 😑 4-6 / 😊 7-8 / 😄 9-10</span>
    </div>
  `;

  if (state.viewMode === "month") {
    const stage = document.createElement("div");
    stage.className = "calendar-stage";
    stage.innerHTML = `
      <button class="nav-arrow left" id="prev-month" aria-label="上个月">&lt;</button>
      <div class="month-focus-wrap" id="month-focus-wrap"></div>
      <button class="nav-arrow right" id="next-month" aria-label="下个月">&gt;</button>
    `;
    stage.querySelector("#month-focus-wrap").appendChild(renderMonthCard(state.year, state.month, { large: true }));
    homeView.append(control, stage);

    document.getElementById("prev-month").addEventListener("click", async () => {
      state.month -= 1;
      if (state.month < 0) {
        state.month = 11;
        state.year -= 1;
      }
      if (state.user) {
        await syncYear(state.year).catch(() => {});
      }
      renderHome();
    });

    document.getElementById("next-month").addEventListener("click", async () => {
      state.month += 1;
      if (state.month > 11) {
        state.month = 0;
        state.year += 1;
      }
      if (state.user) {
        await syncYear(state.year).catch(() => {});
      }
      renderHome();
    });
  } else {
    const yearWrap = document.createElement("div");
    yearWrap.className = "months-grid year-grid";
    for (let month = 0; month < 12; month += 1) {
      yearWrap.appendChild(renderMonthCard(state.year, month, { compact: true }));
    }
    homeView.append(control, yearWrap);
  }

  document.getElementById("switch-view").addEventListener("click", () => {
    state.viewMode = state.viewMode === "month" ? "year" : "month";
    renderHome();
  });
}

function renderMonthCard(year, month, options = {}) {
  const tpl = document.getElementById("month-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  if (options.large) node.classList.add("month-card-large");
  if (options.compact) node.classList.add("month-card-compact");
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

    if (dateStr === today) btn.classList.add("today");

    const lunar = getLunarLabel(date);
    const festival = getFestivalLabel(date, lunar.full);
    const subText = festival || lunar.short;

    if (entry) {
      btn.classList.add("has-entry", scoreClass(entry.score));
      btn.title = `心情 ${entry.score}/10 ${festival ? `· ${festival}` : ""}`;
      btn.innerHTML = `
        <span class="day-number">${day}</span>
        <span class="day-sub">${subText}</span>
        <span class="day-emoji">${scoreEmoji(entry.score)}</span>
      `;
    } else {
      btn.title = festival ? `节日：${festival}` : lunar.full;
      btn.innerHTML = `
        <span class="day-number">${day}</span>
        <span class="day-sub">${subText}</span>
      `;
    }

    btn.addEventListener("click", () => {
      location.hash = hashForDate(dateStr);
    });

    monthGrid.appendChild(btn);
  }

  return node;
}

function getMonthStats(year, month) {
  const mm = String(month + 1).padStart(2, "0");
  const prefix = `${year}-${mm}-`;
  const entries = Object.entries(state.data)
    .filter(([date]) => date.startsWith(prefix))
    .map(([, value]) => value)
    .filter((value) => Number.isFinite(Number(value.score)));
  const recordedDays = entries.length;
  const avg = recordedDays
    ? (entries.reduce((sum, e) => sum + Number(e.score), 0) / recordedDays).toFixed(1)
    : "--";
  return { recordedDays, avgScore: avg };
}

function getLunarLabel(date) {
  try {
    const parts = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
      month: "numeric",
      day: "numeric"
    }).formatToParts(date);
    const monthRaw = parts.find((p) => p.type === "month")?.value || "";
    const dayRaw = parts.find((p) => p.type === "day")?.value || "";
    const monthNum = Number(monthRaw);
    const dayNum = Number(dayRaw);
    const month = lunarMonthName(monthNum);
    const day = lunarDayName(dayNum);
    const full = `${month}${day}`;
    const short = dayNum === 1 ? month : day;
    return { full, short };
  } catch {
    return { full: "", short: "" };
  }
}

function lunarMonthName(monthNum) {
  const names = ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
  if (monthNum >= 1 && monthNum <= 12) return names[monthNum - 1];
  return `${monthNum}月`;
}

function lunarDayName(dayNum) {
  const special = {
    10: "初十",
    20: "二十",
    30: "三十"
  };
  if (special[dayNum]) return special[dayNum];
  const prefix = ["初", "十", "廿", "三"];
  const nums = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const tens = Math.floor((dayNum - 1) / 10);
  const ones = (dayNum - 1) % 10;
  if (dayNum < 1 || dayNum > 30) return String(dayNum);
  return `${prefix[tens]}${nums[ones]}`;
}

function getFestivalLabel(date, lunarFull) {
  const solarKey = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (solarFestivals[solarKey]) return solarFestivals[solarKey];
  if (lunarFull && lunarFestivals[lunarFull]) return lunarFestivals[lunarFull];
  return "";
}

function getDailyMediaRecommendation(dateStr) {
  const index = getMonthlyUniqueIndex(dateStr, mediaPool.length, "media");
  return mediaPool[index];
}

function getDailyCiQuote(dateStr) {
  const index = getMonthlyUniqueIndex(dateStr, renjianCiPool.length, "ci");
  return renjianCiPool[index];
}

function getMonthlyUniqueIndex(dateStr, total, salt) {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const order = deterministicShuffle(total, hashCode(`${salt}-${year}-${month}`));
  return order[(day - 1) % total];
}

function deterministicShuffle(total, seed) {
  const arr = Array.from({ length: total }, (_, i) => i);
  const random = mulberry32(Math.abs(seed) + 1);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mulberry32(a) {
  return function random() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
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
      logs: Array.isArray(entry.logs) ? entry.logs : [],
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
  const media = getDailyMediaRecommendation(dateStr);
  const ciQuote = getDailyCiQuote(dateStr);
  const tips = getAiTips(entry);

  dayView.innerHTML = `
    <div class="day-header">
      <div>
        <h2>${formatDateCN(dateStr)}</h2>
        <p class="muted">专注记录今天，沉淀可回看的情绪轨迹。</p>
      </div>
      <button class="back-btn" id="go-home">返回月历</button>
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

        <div class="divider"></div>
        <h3 style="margin-top:0;">今日记录回看</h3>
        <ul id="mood-log-list" class="mood-log-list"></ul>
      </article>

      <section class="stack">
        <article class="card">
          <h3>每日书影推荐</h3>
          <p><strong>${media.type === "movie" ? "🎬" : "📚"} ${media.title}</strong></p>
          <p class="muted">${media.type === "movie" ? "导演" : "作者"}：${media.creator}</p>
          <p class="muted">推荐理由：${media.summary}</p>
          <p><a href="${media.link}" target="_blank" rel="noopener noreferrer">豆瓣链接</a></p>
        </article>

        <article class="card">
          <h3>人间词话 · 一日一词</h3>
          <p><strong>${ciQuote.title}</strong> · ${ciQuote.author}</p>
          <p class="muted">“${ciQuote.line}”</p>
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
  const logList = document.getElementById("mood-log-list");

  function renderMoodLogs() {
    if (!entry.logs.length) {
      logList.innerHTML = '<li class="muted">还没有记录，保存后会显示在这里。</li>';
      return;
    }
    const sortedLogs = [...entry.logs].sort((a, b) => String(b.at).localeCompare(String(a.at)));
    logList.innerHTML = sortedLogs.map((log) => {
      const when = formatLogTime(log.at);
      return `<li><strong>${scoreEmoji(log.score)} ${log.score}/10</strong> · <span class="muted">${when}</span><br/>${escapeHtml(log.summary || "（未填写总结）")}</li>`;
    }).join("");
  }

  renderMoodLogs();

  scoreEl.addEventListener("input", () => {
    scoreTag.textContent = `${scoreEl.value}/10`;
    scoreTag.style.background = scoreEl.value >= 8 ? "#2b9348" : scoreEl.value <= 4 ? "#d62839" : "#f4a261";
  });

  document.getElementById("save-entry").addEventListener("click", async () => {
    entry.score = Number(scoreEl.value);
    entry.summary = document.getElementById("summary").value.trim();
    entry.logs = Array.isArray(entry.logs) ? entry.logs : [];
    entry.logs.push({
      score: entry.score,
      summary: entry.summary,
      at: new Date().toISOString()
    });

    try {
      await saveEntry(dateStr, entry);
      document.getElementById("save-status").textContent = state.user ? "已保存并同步到云端" : "已保存（本地）";
      renderMoodLogs();
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatLogTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function bootstrap() {
  await loadConfig();

  if ("serviceWorker" in navigator) {
    state.swReg = await navigator.serviceWorker.register("/sw.js").catch(() => null);
  }

  navigateByHash();

  window.addEventListener("hashchange", navigateByHash);
}

bootstrap();

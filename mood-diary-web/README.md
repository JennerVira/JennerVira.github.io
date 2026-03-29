# 心情记录网页（账号 + 云端同步 + 离线推送提醒）

## 已实现功能

- 账号系统：注册 / 登录 / 退出
- 云端同步：每日心情与提醒保存到 SQLite 数据库
- 年历首页：按月份展示全年，可点击进入任意日期
- 每日详情：
  - 心情评分（1-10）
  - 一句话总结
  - 每日书籍推荐
  - 历史上的今天
  - AI 辅助提醒列表
- 关闭网页后提醒：
  - 使用 Web Push（Service Worker + 后端定时投递）
  - 需要浏览器允许通知、且服务端持续运行

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 生成推送密钥（首次）

```bash
npm run gen:vapid
```

3. 配置环境变量

```bash
cp .env.example .env
```

把上一步生成的 `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` 填入 `.env`。

4. 启动服务

```bash
npm run dev
```

5. 打开浏览器

```text
http://localhost:3000
```

## GitHub Pages + 后端部署

你的前端域名是 `https://jennervira.github.io/`，请按下面配置：

1. 部署后端（Render/Railway/Fly.io 均可），并拿到后端地址，例如 `https://mood-diary-api.onrender.com`
2. 在前端文件 `config.js` 中设置：

```js
window.MOOD_DIARY_API_BASE = "https://mood-diary-api.onrender.com";
```

3. 后端 `.env` 设置：

```env
FRONTEND_ORIGIN=https://jennervira.github.io
```

4. 把前端文件推到 GitHub Pages 仓库根目录（或 `docs/`），在仓库 Pages 设置中启用发布

完成后访问 `https://jennervira.github.io/`，前端会请求你配置的后端 API。

## 关键说明

- “网页关闭后还能提醒”依赖浏览器 Push 机制，不等于系统闹钟；实际行为受浏览器和系统通知策略影响。
- 只有登录账号后才会云端同步与推送提醒。
- 数据库存储在 `data/mood-diary.db`。
- GitHub Pages 只托管前端静态文件，`server.js` 必须单独部署在云端。

## 文件结构

- `server.js`：后端 API、鉴权、数据库、定时推送
- `script.js`：前端页面逻辑、登录、同步、订阅推送
- `config.js`：前端后端地址配置（`MOOD_DIARY_API_BASE`）
- `sw.js`：Service Worker，处理 Push 消息显示通知
- `styles.css`：样式
- `index.html`：页面结构
- `scripts/generate-vapid.js`：生成 VAPID 密钥

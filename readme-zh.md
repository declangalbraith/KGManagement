# 知识图谱平台（Vue 主前端）

## 目录结构

| 目录 | 说明 |
|------|------|
| `backend/` | Django + dvadmin 后端 |
| `web/` | **主前端** Vue3 + Vite + Element Plus |
| `web-react/remix_-qconnect/` | React 业务原型（对照用，Mock 数据参考） |
| `plan.md` | React → Vue 迁移计划与验收标准 |

## 业务前端架构（已迁移）

质量中心业务与 dvadmin 平台壳分离：

- **平台路由**：后端 `/api/system/menu/web_router/` 下发（用户、角色、系统配置等）
- **业务路由**：`web/src/router/businessRoutes.ts` 前端注册，与 `/home` **平级**
- **注册时机**：`backEnd.ts` / `frontEnd.ts` 在 `setAddRoute()` 之后调用 `registerBusinessRoutes(true)`，避免 `formatFlatteningRoutes` 打碎带 `:id` 的子路由

### 业务布局

- 壳：`web/src/views/system/qualityLayout/`（侧栏 + 顶栏 + Queen 悬浮助手）
- 工作台：`web/src/views/system/home/index.vue`（路由 `/home`）

### 业务路由一览

| 路由 | 视图目录 | 侧栏 |
|------|----------|------|
| `/home` | `home/` | 是 |
| `/issues`、`/issues/new`、`/issues/:id` | `issues/` | 是 |
| `/bom-management`、`/bom-management/:id/extract` | `bom/` | 是 |
| `/schema` | `schema/` | 是 |
| `/quality-docs`、`/quality-docs/new`、`/quality-docs/:id` | `qualityDocs/` | 是 |
| `/knowledge`、`/knowledge/:id` | `knowledge/` | 是 |
| `/analytics` | `analytics/` | 是 |
| `/admin` | `admin/` | 是 |
| `/audit` | `audit/` | 是 |
| `/tasks` | `qualityTask/` | 否 |
| `/rca`、`/rca/:id` | `rca/` | 否 |
| `/8d-reports`、`/8d-reports/:id` | `report8d/` | 否 |
| `/ai-assistant` | `aiAssistant/` | 否 |
| `/notifications` | `notifications/` | 否 |

平台左侧菜单仅注入 `/home`（`getBusinessMenuRoute()`），其余业务项在 **qualityLayout 侧栏** 展示。

## 如何新增业务页面

1. 在 `web/src/views/system/<模块>/` 按约定建文件：
   - `index.vue`（列表/主页）
   - 可选：`types.ts`、`mock.ts`、`api.ts`、`components/`
2. 在 `web/src/router/businessRoutes.ts` 的 `getBusinessRoutes()` 中增加 `shell(...)` 或 children
3. 在 `web/src/i18n/pages/<模块>/zh-cn.ts`（及 `en.ts`、`zh-tw.ts`）补充 `message.pages.*` 文案
4. 若需侧栏入口，改 `qualityLayout/components/Sidebar/index.vue` 的 `navItems`
5. 带 `:id` / `new` 的子路由请使用 `noCacheMeta`（`isKeepAlive: false`），避免 tagsView 缓存串页

## 本地开发

```bash
cd web
pnpm install
pnpm dev
```

默认 hash 路由，登录后落地 `#/home`。冒烟清单见 `ROUTES-SMOKE.md`。

## React 对照

`web-react/remix_-qconnect/` 保留完整交互与 Mock，Vue 实现以 **功能可达 + Element Plus UI** 为目标；复杂组件（如 Schema 全量设计器、完整 Queen 动效）可按 `plan.md` 分阶段增强。

## 配置说明

- `web/src/stores/themeConfig.ts`：`isRequestRoutes: true` 时走后端菜单
- `/home` 勿在 `menu.ts`、`frontendMenu.ts` 重复硬编码，由 `businessRoutes` 统一注入

# 知识图谱平台 — React → Vue 迁移计划

> 依据 [readme-zh.md](./readme-zh.md) 整理。目标：在保留 dvadmin 鉴权与路由体系的前提下，将 `web-react` 业务完整迁入 `web` 主前端。

---

## 1. 项目背景


| 层级   | 路径                           | 技术栈                                      | 职责                   |
| ---- | ---------------------------- | ---------------------------------------- | -------------------- |
| 后端   | `backend/`                   | Django + dvadmin                         | API、RBAC、动态菜单        |
| 主前端  | `web/`                       | Vue3 + TS + Vite + Element Plus          | 平台壳：登录、鉴权、系统管理、布局    |
| 业务原型 | `web-react/remix_-qconnect/` | React19 + react-router + Tailwind/shadcn | 知识图谱/质量中心完整业务 + Mock |


当前 **isRequestRoutes: true**（`web/src/stores/themeConfig.ts`），菜单由后端 `/api/system/menu/web_router/` 下发；同时 **/home** 在前后端两处被硬编码注入（`web/src/utils/menu.ts`、`web/src/stores/frontendMenu.ts`），登录后默认落地页。

React 应用为独立 SPA：自带 `Layout`（侧栏 + 顶栏 + `QueenAssistant`）与约 20+ 业务路由，数据以页面内 state / 模块 Mock 为主，尚未对接 Django API。

---

## 2. 迁移目标（验收标准）

1. **清空** `web/src/views/system/home/index.vue` 中原 dvadmin 演示首页（图表、公告等）。
2. **同一文件** `home/index.vue` 仅承载**工作台**（原 React `Dashboard`），不再作为全业务嵌套壳。
3. **路由自主**：九个业务入口与 `/home` **同级**（layout 下一级路由），由前端 `businessRoutes.ts` 注册；不依赖后端逐页配菜单。平台系统菜单（用户/角色等）仍走后端动态路由。
4. **共享业务布局**：各一级业务路由共用 `qualityLayout`（侧栏 + 顶栏 + `QueenAssistant`），业务侧栏与 React `Sidebar.tsx` 九项一致。
5. **功能对等**：React 侧用户可见页面与交互在 Vue 中可访问（含辅助深链页；允许 UI 组件库差异）。
6. **保留** Vue 侧 token、权限、国际化、主题、tagsView 等平台能力。
7. **嵌套 URL 可刷新**：如 `#/issues/:id`、`#/quality-docs/new` 在硬刷新后仍可访问（§4.1.1）。

### 2.1 一级业务导航（与 `/home` 平级）

| 序号 | 名称 | 路由 path | 目录（`views/system/`） |
|------|------|-----------|-------------------------|
| 1 | 工作台 | `/home` | `home/`（仅 Dashboard） |
| 2 | 问题管理 | `/issues` | `issues/` |
| 3 | BOM 管理 | `/bom-management` | `bom/` |
| 4 | 图谱 Schema 设计 | `/schema` | `schema/` |
| 5 | 质量文档管理 | `/quality-docs` | `qualityDocs/` |
| 6 | 知识库 | `/knowledge` | `knowledge/` |
| 7 | 数据分析 | `/analytics` | `analytics/` |
| 8 | 后台管理 | `/admin` | `admin/` |
| 9 | 日志与审计 | `/audit` | `audit/` |

辅助路由（**不在**业务侧栏九项内，挂到对应模块 **children** 或 `meta.isHide` 顶级路由）：`issues/new`、`issues/:id`、`tasks`、`rca`、`8d-reports`、`bom-management/:id/extract`、`ai-assistant`、`notifications` 等。

---

## 3. React 业务清单（迁移范围）

### 3.1 页面（`web-react/.../src/pages/`）


| 路由 (React)                    | 文件                          | 行数级   | 复杂度    | 说明               |
| ----------------------------- | --------------------------- | ----- | ------ | ---------------- |
| `/`                           | Dashboard.tsx               | ~300  | 中      | 首页看板、热点问题        |
| `/issues`                     | IssuesList.tsx              | ~270  | 中      | 问题列表             |
| `/issues/new`                 | CreateIssue.tsx             | ~160  | 低      | 新建问题             |
| `/issues/:id`                 | IssueDetails.tsx            | ~640  | **高**  | 8D 时间线、多 Tab     |
| `/tasks`                      | Tasks.tsx                   | ~730  | **高**  | 任务看板             |
| `/rca`, `/rca/:id`            | RootCauseAnalysis.tsx       | ~830  | **高**  | 鱼骨/RCA           |
| `/8d-reports`, `/:id`         | Report8D.tsx                | ~510  | 高      | 8D 报告            |
| `/knowledge`, `/:id`          | KnowledgeBase.tsx           | ~270  | 中      | 知识库              |
| `/ai-assistant`               | AiAssistant.tsx             | ~150  | 中      | AI 对话            |
| `/analytics`                  | DataAnalytics.tsx           | ~230  | 中      | 图表分析             |
| `/bom-management`             | BomList.tsx                 | ~210  | 中      | BOM 列表           |
| `/bom-management/:id/extract` | BomWorkbench.tsx            | ~570  | **高**  | BOM 抽取工作台        |
| `/schema`                     | SchemaDesign.tsx            | ~1150 | **极高** | 图谱 Schema 设计器    |
| `/notifications`              | Notifications.tsx           | ~140  | 低      | 通知               |
| `/admin`                      | Admin.tsx                   | ~130  | 低      | 管理入口             |
| `/audit`                      | Audit.tsx                   | ~155  | 低      | 审计               |
| —                             | FishboneCanvasWorkspace.tsx | ~620  | **高**  | 由 `RootCauseAnalysis` 内嵌，迁入 `system/rca/components/` |


### 3.2 子模块 quality-docs


| 路由                  | 页面         | Mock                                 |
| ------------------- | ---------- | ------------------------------------ |
| `/quality-docs`     | DocsList   | `modules/quality-docs/mocks/data.ts` |
| `/quality-docs/new` | DocForm    | 同上                                   |
| `/quality-docs/:id` | DocDetails | 同上                                   |


### 3.3 核心组件（需单独拆分）


| 组件                        | 行数级  | 技术依赖         |
| ------------------------- | ---- | ------------ |
| KnowledgeGraph.tsx        | ~650 | **d3** 力导向图  |
| KnowledgeGraphBuilder.tsx | ~430 | 图谱构建 UI      |
| QueenAssistant.tsx        | ~450 | motion、对话 UI |
| HolographicStoryline.tsx  | ~240 | 时间线动效        |
| Dynamic8DReport.tsx       | ~180 | 8D 报告块       |
| KnowledgeManagement.tsx   | ~240 | 知识管理         |
| DocumentViewer.tsx        | ~120 | 文档预览         |


### 3.4 React 导航入口

**业务侧栏九项**（`Sidebar.tsx`）与 §2.1 一致；React 工作台 path 为 `/`，Vue 定为 **`/home`**（保留 dvadmin 登录落地页）。

**无侧栏项、须注册路由**：`/tasks`、`/rca`、`/8d-reports`、`/ai-assistant`、`/notifications`，及各模块 `new`、`:id`、BOM `extract` 等（见 §4.1 辅助路由）。

---

## 4. 架构方案

### 4.1 路由自主（核心约束：九项与 `/home` 平级）

**原则：平台路由（后端菜单） vs 业务路由（前端注册、与 `/home` 同级）分离。**

```
dvadmin layout (hash #/)
├── /home                         ← 工作台（Dashboard）
├── /issues                       ← 问题管理（与 /home 平级）
├── /bom-management
├── /schema
├── /quality-docs
├── /knowledge
├── /analytics
├── /admin
├── /audit
│   └── （各模块可有 children，如 /issues/:id）
├── /system/user                  ← 后端菜单下发
└── /system/role
```

**实现要点：**

1. 新增 **`businessRoutes.ts`**：导出九项一级路由 + 辅助 children；**不要**写入后端菜单库。
2. **`/home` 仅工作台**：`home/index.vue` 只写 Dashboard 内容；外层壳由路由挂 `qualityLayout`（见 §4.1.1）。
3. **其余八项**：layout 下**独立顶级 path**，`component` = `qualityLayout`，`children` 挂各模块页面。
4. **注册分两步**（§4.1.1）：`frameIn` 合并 + `setAddRoute` 之后，再 `registerBusinessRoutes()` 向 layout（`name: '/'`）追加**带 children 的嵌套路由**，避免被 `formatFlatteningRoutes` 打碎。
5. **九项中八项** `meta.isHide: true`（不出现在平台左侧菜单）；**`/home`** 与现网一致 `isHide: false`、`isAffix: true`（平台「首页」仍指向工作台）。
6. 业务侧栏链接：`/home`、`/issues`、`/schema`…（**不要**再用 `#/home/issues`）。

**一级路由结构示意（每项同类）**

```ts
{
  path: '/issues',
  name: 'kg-issues',
  component: '/system/qualityLayout/index',
  meta: { isHide: true, title: 'message.pages.issues.title' },
  children: [
    { path: '', component: '/system/issues/index' },
    { path: 'new', component: '/system/issues/create/index' },
    { path: ':id', component: '/system/issues/detail/index' },
  ],
}
```

**辅助顶级路由（侧栏无入口，`meta.isHide: true`）**

| path | 说明 |
|------|------|
| `/tasks` | 任务看板 → `system/qualityTask` |
| `/rca`、`/rca/:id` | 根因分析 → `system/rca` |
| `/8d-reports`、`/8d-reports/:id` | 8D 报告 → `system/report8d` |
| `/ai-assistant` | AI 助手（可后期收进知识库） |
| `/notifications` | 通知中心 |

可选增强（后期）：九项同步到后端菜单管理——**第一期不做**。

#### 4.1.1 漏洞：`formatFlatteningRoutes` 与嵌套 children

dvadmin 在 `setAddRoute` 前会对路由做 `formatFlatteningRoutes`：把 `children` **摊平**为 layout 同级项。若 `businessRoutes` 里写相对子 path（`new`、`:id`），会变成 layout 下孤立的 `path: 'new'`，刷新 `#/issues/xxx` **404**。

**推荐做法（写入实施）**

```ts
// backEnd.ts — initBackEndControlRoutes 末尾
await setAddRoute();
registerBusinessRoutes(); // 不走 formatFlatteningRoutes

function registerBusinessRoutes() {
  const routes = backEndComponent(getBusinessRoutes()); // 解析 component
  const layoutName = '/'; // 与 route.ts 中 layout name 一致
  routes.forEach((r) => router.addRoute(layoutName, r));
}
```

- `getBusinessRoutes()`：九项 + 辅助项，结构如 §4.1 示意（`qualityLayout` + `children`）。
- **不要**把带 `children` 的 `businessRoutes` 放进 `dynamicRoutes[0].children` 再 `formatFlatteningRoutes`。
- `refreshRoutesForI18n`（`backEnd.ts`）里在刷新后端菜单后 **同样调用** `registerBusinessRoutes()`，避免切换语言后业务路由丢失。

**可选兜底**：子页一律用**完整 path** 的扁平路由（如 `/issues/new` 单独一项，`component` 仍为 `qualityLayout`，`meta.page` 指向页面组件），与后端菜单 `web_path` 风格一致。

#### 4.1.2 双层布局与平台「首页」

现网 layout = **平台左侧栏**（后端菜单）+ 顶栏 tagsView + 主内容区。`qualityLayout` 再在主内容区画 **业务侧栏**，形成双层导航——与 React 全屏 SPA 不同，**第一期接受**，业务区加 `kg-root` 占满主内容高度。

需产品知晓：平台菜单仍有「首页」→ `/home`；业务 Sidebar 第一项也是工作台 → `/home`（入口重复但一致）。

#### 4.1.3 `/home` 与 `menu.ts` 合并策略（避免双注册）

| 来源 | 现状 | 目标 |
|------|------|------|
| `menu.ts` / `frontendMenu.ts` | 硬编码 `/home` → `component: '/system/home/index'` | 改为 `qualityLayout` + child `home/index`，**或**删除硬编码、仅由 `businessRoutes` 提供 `/home` |
| `businessRoutes.ts` | 待建 | 含完整 `/home` 树（`isAffix: true`） |

**择一**：推荐 **删除 `menu.ts` 中 `/home` 硬编码**，在 `getBusinessRoutes()` 返回的数组**首位**插入 `/home`（带 affix meta），再与 `handleMenu(res.data)` 的 `frameIn` 合并（仅 `backEndComponent` 解析，不扁平化 children）；`frontendMenu.ts` 同步同样逻辑。

### 4.2 目录规划（九项均为 `views/system/{模块}/`）

**路由平级** ≠ 所有文件塞在 `home/components/`。九项一级导航各对应 **`views/system/` 下独立目录**；共享 UI 抽到 `qualityLayout`、`common`。

| 路径 | 说明 |
|------|------|
| `views/system/qualityLayout/` | 业务壳：`index.vue` + `components/Sidebar|Header|QueenAssistant` |
| `views/system/common/` | 跨模块组件（KnowledgeGraph、DocumentViewer 等） |
| `views/system/home/` | **仅工作台**：`index.vue`（Dashboard）+ `api.ts` + `types.ts` |
| `views/system/issues/` … `audit/` | 与 §2.1 中除 `home` 外八项一一对应 |
| `views/system/{qualityTask,rca,report8d}/` | 辅助模块（无侧栏项） |

每个业务目录：`index.vue` + `api.ts` + `types.ts` + `components/`（与 `menu` 模块相同）。

#### 目录树示意

```
web/src/views/system/
├── qualityLayout/          # 九项共用 layout（含 Sidebar 九链接）
│   ├── index.vue
│   └── components/
│       ├── Sidebar/index.vue
│       ├── Header/index.vue
│       └── QueenAssistant/index.vue
├── common/
│   ├── KnowledgeGraph/index.vue
│   ├── KnowledgeGraphBuilder/index.vue
│   └── DocumentViewer/index.vue
├── home/                   # 工作台 /home
│   ├── index.vue           # Dashboard 页面内容
│   ├── api.ts
│   └── types.ts
├── issues/                 # /issues（含 create/、detail/ 及 storyline 等子组件）
├── bom/                    # workbench/ 子目录
├── schema/
├── qualityDocs/
├── knowledge/
├── analytics/
├── admin/
├── audit/
├── qualityTask/            # 辅助 /tasks
├── rca/
├── report8d/
├── menu/                   # 平台既有
└── user/
```

```
web/src/router/businessRoutes.ts
web/src/composables/quality/
web/src/i18n/pages/{home,issues,schema,...}/
```

#### React → Vue 路径对照（节选）

| React | Vue 目标 |
|-------|----------|
| `pages/Dashboard.tsx` | `home/index.vue`（外层由 `qualityLayout` 包裹） |
| `components/layout/Layout.tsx` | `qualityLayout/index.vue` |
| `pages/IssuesList.tsx` | `issues/index.vue` |
| `pages/SchemaDesign.tsx` | `schema/index.vue` |
| `pages/DataAnalytics.tsx` | `analytics/index.vue` |
| `pages/Admin.tsx` | `admin/index.vue` |
| `pages/Audit.tsx` | `audit/index.vue` |

#### `businessRoutes.ts` 一级路由一览

| path | name | children 要点 | component（壳） |
|------|------|---------------|-----------------|
| `/home` | `kg-home` | `''` → Dashboard | `qualityLayout` |
| `/issues` | `kg-issues` | `''`、`new`、`:id` | 同上 |
| `/bom-management` | `kg-bom` | `''`、`:id/extract` | 同上 |
| `/schema` | `kg-schema` | `''` | 同上 |
| `/quality-docs` | `kg-quality-docs` | `''`、`new`、`:id` | 同上 |
| `/knowledge` | `kg-knowledge` | `''`、`:id` | 同上 |
| `/analytics` | `kg-analytics` | `''` | 同上 |
| `/admin` | `kg-admin` | `''` | 同上 |
| `/audit` | `kg-audit` | `''` | 同上 |

辅助顶级：`/tasks`、`/rca`、`/8d-reports`、`/ai-assistant`、`/notifications`（结构相同，`meta.isHide: true`）。

`/home` 定义只保留一处，见 §4.1.3（`qualityLayout` + child → `/system/home/index`）。

### 4.3 UI 与技术栈映射


| React                | Vue 建议                                                                              |
| -------------------- | ----------------------------------------------------------------------------------- |
| shadcn/ui + Tailwind | **Element Plus** 为主；复杂自定义区可保留 **scoped CSS** 或局部 Tailwind（需评估是否在 `web` 引入 Tailwind） |
| lucide-react         | `@element-plus/icons-vue` 或 `@iconify/vue`（项目已有）                                    |
| recharts             | **echarts**（`web` 已依赖）                                                              |
| d3                   | 新增 `d3` + `@types/d3`                                                               |
| motion               | CSS transition / `@vueuse/motion`（按需）                                               |
| react-i18next        | **已有 vue-i18n**（见 4.5，勿新建 i18n 体系）                                                  |
| react-markdown       | `markdown-it` 或 `vue-markdown-render`                                               |
| @google/genai        | 同等 REST/SDK，封装为 `composables/quality/useGenAI.ts`                                   |
| useToast             | `ElMessage` / `ElNotification`                                                      |


### 4.4 数据层（按模块 `api.ts`，不建全局 api 包）

1. **首期**：各模块目录下 `mock.ts`（或 `api.ts` 内 `// TODO: mock` 分支）承接 React 内联 state / `quality-docs/mocks/data.ts`。
2. **接口形状**：类型进同目录 `types.ts`；`api.ts` 导出 `GetList` / `GetObj` 等，风格对齐 `views/system/menu/api.ts`（`request` + `apiPrefix`）。
3. **二期**：去掉 mock 分支，对接 Django；仍走 `/@/utils/service.ts`（自动带 token）。

### 4.5 国际化（沿用现有 vue-i18n）

项目**已集成** vue-i18n（`web/src/i18n/index.ts`），通过 `import.meta.glob('./**/*.ts')` 自动合并：

- **全局文案**：`i18n/lang/zh-cn.ts`（`message.router.*`、`message.user.*` 等）
- **页面文案**：`i18n/pages/{模块名}/zh-cn.ts` | `en.ts` | `zh-tw.ts`
- **模板用法**：`$t('message.pages.menu.tree.menuList')`（与 system 模块一致）

迁移要求：

1. **不要**新建独立 i18n 实例；**i18n 目录名与 `views/system/{模块}` 文件夹名一致**（与 `menu`、`user` 相同惯例）。
2. 文案 key 示例：
   - 工作台 → `message.pages.home.*`（`i18n/pages/home/zh-cn.ts`）
   - 问题管理 → `message.pages.issues.*`（`i18n/pages/issues/zh-cn.ts`）
   - 业务侧栏九项 → `message.pages.qualityLayout.sidebar.*`（`i18n/pages/qualityLayout/zh-cn.ts`，与目录名一致）
3. 原 `i18n/pages/home/zh-cn.ts` 中演示首页 `statCards`、`chart` 等迁移时删除。
4. 切换语言继续用平台 `themeConfig.globalI18n`。

---

## 5. 分阶段实施计划

### 阶段 0：准备（0.5 天）

- 备份当前 `home/index.vue`（git 分支即可）。
- 在 `web` 安装业务依赖：`d3`（及类型）。
- 创建 `qualityLayout`、`common`、`home` 及九项模块目录骨架。
- 新增 `router/businessRoutes.ts` + `registerBusinessRoutes()`（`backEnd.ts` 在 `setAddRoute` 后调用）。
- i18n：`pages/home`、`pages/issues`、`pages/schema` 等（与模块目录同名）。
- 梳理 React 文案 key → `message.pages.*` 对照表。

### 阶段 1：业务壳 + 工作台（1–2 天）

- 清空 `home/index.vue`，迁入 Dashboard 内容。
- 实现 `qualityLayout` + `Sidebar`（九项链接：`/home`…`/audit`）。
- 注册 `businessRoutes` 九项一级路由（先打通 `/home`、`/issues` 空壳）。
- 按 §4.1.3 合并 `/home`（`menu.ts` + `frontendMenu.ts` 与 `businessRoutes` 二选一）。
- 验证：登录 → `/home`；业务侧栏切到 `/issues`；`#/issues/xxx` 刷新不 404；切换语言后 `/issues` 仍可访问。

### 阶段 2：问题管理（2–3 天）

- `system/issues/`（列表、create、detail）+ `detail/components/`。
- 顶级 `/issues` + children：`new`、`:id`。

### 阶段 3：辅助质量流程（3–4 天）

- `system/qualityTask/`、`report8d/`、`rca/`（含 Fishbone）；顶级 `/tasks`、`/rca`、`/8d-reports`。

### 阶段 4：图谱 / BOM / 知识库（4–5 天）

- `system/schema/`、`bom/`、`knowledge/`；侧栏项 `/schema`、`/bom-management`、`/knowledge`。
- `system/common/` 图组件。

### 阶段 5：其余侧栏项（2 天）

- `system/qualityDocs/`、`analytics/`、`admin/`、`audit/`。
- 辅助：`/ai-assistant`、`/notifications`（可选）。

### 阶段 6：联调与收尾（1–2 天）

- 全路由冒烟；修复 keep-alive 与嵌套路由缓存策略（业务子页按需 `meta.isKeepAlive`）。
- 统一暗色/主题变量与 Element 主题色。
- 删除或归档 `web-react` 引用说明（代码可保留作对照）。
- 更新 `readme-zh.md` 开发指引（业务路径、如何加新页）。

**预估总工期：14–18 人天**（单人串行；可并行阶段 2/4 部分组件预研）。

---

## 6. 页面与布局结构（示意）

**`qualityLayout/index.vue`**（九项共用）

```vue
<template>
  <div class="kg-root flex h-full">
    <Sidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <Header />
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
    <QueenAssistant />
  </div>
</template>
```

**`home/index.vue`**（仅工作台内容，由路由 `/home` + child `''` 载入）

```vue
<template>
  <div class="kg-dashboard"><!-- 原 Dashboard.tsx 内容 --></div>
</template>
<script setup lang="ts" name="kg-home-page">
// 路由：/home → qualityLayout → child → 本文件
</script>
```

---

## 7. 风险与对策


| 风险                                    | 对策                                                                   |
| ------------------------------------- | -------------------------------------------------------------------- |
| SchemaDesign / IssueDetails 体量大，迁移周期长 | 按 UI 区块拆 Vue 子组件；先 Mock 后交互                                          |
| d3 图在 Vue 中生命周期                       | 在 `onMounted` 初始化，`onUnmounted` 销毁 simulation；`watch` 数据用 `key` 强制重绘 |
| Tailwind 与 Element 样式冲突               | 业务区使用 BEM 前缀 `kg-`；避免全局 Tailwind preflight 污染（或仅对 `.kg-root` 启用）     |
| 嵌套路由刷新 404 | §4.1.1：`registerBusinessRoutes` 嵌套挂载，勿将 children 路由走 `formatFlatteningRoutes` |
| 切换语言后业务路由丢失 | `refreshRoutesForI18n` 末尾同样调用 `registerBusinessRoutes()` |
| 无业务侧栏 | 一级项 `component` 必须为 `qualityLayout` |
| tagsView 业务 tab 过多 | 八项 `meta.isHide: true`；仅 `/home` `isAffix` |
| `/home` 双注册 | §4.1.3：仅一处定义 `/home` |
| 平台与业务双「首页」 | 第一期接受；两入口均指向 `/home` |
| path `/admin` 语义 | 业务「后台管理」≠ 平台超管；模块内文案写清，避免与 `superadmin` 混淆 |
| 后端菜单 path 冲突 | 业务 `/issues` 等 vs 平台 `/system/user` 等，避免同名 |
| `component` 路径错误 | 壳 `/system/qualityLayout/index`；页 `/system/{模块}/index` |
| keep-alive 串页 | 子路由 `name` 唯一；`qualityLayout` 是否缓存需在阶段 6 定规则 |
| AI / GenAI 密钥 | 环境变量 `VITE_*`，勿提交仓库 |


---

## 8. 单页迁移检查清单（每个 React 页面）

1. 确认是否属 §2.1 九项之一 → 对应 `system/{模块}/`；否则归入辅助模块。
2. 建立 `index.vue` + `api.ts` + `types.ts`；子组件放 `components/`。
3. 跨模块 UI 放 `system/common/`。
4. i18n：`i18n/pages/{模块}/`，key 为 `message.pages.{模块}.*`。
5. 在 `businessRoutes.ts` 注册：九项为顶级 path；`new`/`:id` 为对应项的 `children`。
6. 侧栏仅链九项顶级 path；深链用 `router.push('/8d-reports/xxx')` 等。
7. 每项点击 + 浏览器刷新冒烟。

---

## 9. 不在本期范围

- Django 新业务 API 开发与联调（各模块 `api.ts` 预留即可）。
- 用后端菜单管理配置每一个业务子页。
- 替换 dvadmin 系统管理模块（用户/角色/菜单等保持原样）。
- `web-react` 生产部署（迁移完成后仅作参考）。

---

## 10. 建议执行顺序（第一批交付）

最小可用版本（MVP）建议只做到 **阶段 1 + 阶段 2 + KnowledgeGraph 只读页**：

1. 登录进入 `/home` 工作台，侧栏九项可切换；
2. `/issues` 列表 → 详情；
3. `/knowledge` 图谱只读 Mock（或 `/schema` 只读预览）。

便于尽早与产品确认布局与路由方案，再推进 Schema/BOM/RCA 高复杂度页面。

---

## 11. 相关文件索引


| 用途         | 路径                                                                                |
| ---------- | --------------------------------------------------------------------------------- |
| 需求说明       | `readme-zh.md`                                                                    |
| 工作台（待改）    | `web/src/views/system/home/index.vue`                                             |
| 业务布局壳      | `web/src/views/system/qualityLayout/`                                             |
| 模块目录范例     | `web/src/views/system/menu/`                                                      |
| 九项业务模块     | `home`、`issues`、`bom`、`schema`、`qualityDocs`、`knowledge`、`analytics`、`admin`、`audit` |
| 辅助模块       | `qualityTask`、`rca`、`report8d`                                                    |
| i18n 入口    | `web/src/i18n/index.ts`                                                           |
| 页面 i18n 范例 | `web/src/i18n/pages/menu/zh-cn.ts`                                                |
| 菜单注入       | `web/src/utils/menu.ts`、`web/src/stores/frontendMenu.ts`                          |
| 路由开关       | `web/src/stores/themeConfig.ts` → `isRequestRoutes`                               |
| 业务路由（待建）   | `web/src/router/businessRoutes.ts`、`registerBusinessRoutes()`（`backEnd.ts`）          |
| 业务 i18n    | `web/src/i18n/pages/{home,issues,schema,...}/`                                    |
| React 路由表  | `web-react/remix_-qconnect/src/App.tsx`                                           |
| React 导航   | `web-react/remix_-qconnect/src/components/layout/Sidebar.tsx`                     |


---

## 12. 审阅记录

| 版本 | 变更 |
|------|------|
| v1.5 | 九项与 `/home` 路由平级；`qualityLayout` |
| **v1.6** | 补充 `formatFlatteningRoutes` 漏洞、注册两步、双层布局、`/home` 合并策略 |

### 12.1 第二轮检查结论（v1.6）

| 类别 | 状态 | 说明 |
|------|------|------|
| 与 readme-zh 对齐 | 通过 | 清空 home、工作台、路由自主均已体现 |
| 九项导航与 React Sidebar | 通过 | path 与 `Sidebar.tsx` 一致（`/home` 替代 `/`） |
| React 页面覆盖 | 通过 | 辅助路由在 §2.1、§4.1 已列；quality-docs 在阶段 5 |
| 目录与模块划分 | 通过 | 九项 `system/*` + `qualityLayout` + `common` |
| **路由扁平化陷阱** | **已补** | §4.1.1，`registerBusinessRoutes` 为关键实施点 |
| **`/home` 双源** | **已补** | §4.1.3，`menu.ts` 与 `frontendMenu.ts` 须同步 |
| **i18n 路径** | **已修** | 侧栏文案归 `qualityLayout`，去掉已废弃的 `home/dashboard` 嵌套 |
| 双层布局 UX | **已记** | §4.1.2，第一期接受 |
| `/admin` 命名 | **已记** | 风险表 |
| 阶段 1 验证项 | **已加强** | 含 `#/issues/:id` 刷新、语言切换 |

### 12.2 仍须在编码时验证（未写死）

1. layout 路由 `name` 是否为 `'/'`（与 `route.ts` 一致），`router.addRoute` 才能成功。
2. `registerBusinessRoutes` 后 tagsView / `routesList` 是否需手动同步（隐藏路由通常可不同步）。
3. `qualityLayout` 高度与 `layout-main` 滚动条是否冲突（CSS 微调）。

### 12.3 Vue 实施进度（2026-05-20）

| 阶段 | 状态 |
|------|------|
| 0 准备 | 完成（d3、`businessRoutes`、`registerBusinessRoutes`） |
| 1 业务壳 + 工作台 | 完成 |
| 2 问题管理 | 完成（列表 / 新建 / 详情 / 故事线 / 8D 抽屉） |
| 3 辅助质量流程 | 完成（tasks / rca / 8d） |
| 4 图谱 BOM 知识库 | 完成（含 KnowledgeGraph d3） |
| 5 其余侧栏 + 辅助 | 完成 |
| 6 联调收尾 | 完成（缓存策略、`readme-zh.md`、`ROUTES-SMOKE.md`） |

联调清单见 [ROUTES-SMOKE.md](./ROUTES-SMOKE.md)；开发指引见 [readme-zh.md](./readme-zh.md)。

---

*文档版本：v1.7 | 日期：2026-05-20*
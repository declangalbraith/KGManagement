# 业务路由冒烟清单

登录后逐项访问（hash 模式 `#/path`），**硬刷新**仍应可打开。

## 侧栏九项

- [ ] `/home` — 工作台统计与热点
- [ ] `/issues` — 列表 → 点击行进入详情
- [ ] `/issues/new` — 创建表单
- [ ] `/issues/ISS-202604-001` — 详情（刷新不 404、切换 id 不串页）
- [ ] `/bom-management` — 列表 → `/bom-management/bom-001/extract`
- [ ] `/schema` — 画布与属性面板
- [ ] `/quality-docs` — `/quality-docs/new` — `/quality-docs/doc-001`
- [ ] `/knowledge` — 检索 Tab / 图谱 Tab
- [ ] `/analytics` — ECharts 图表渲染
- [ ] `/admin` — 平台模块入口卡片
- [ ] `/audit` — 审计日志表

## 辅助路由

- [ ] `/tasks` — 任务看板；`/tasks?issueId=ISS-202604-001` 筛选
- [ ] `/rca` — 工具箱；`/rca/ISS-202604-001` 鱼骨图
- [ ] `/8d-reports/ISS-202604-001` — 8D 表单
- [ ] `/ai-assistant` — 对话
- [ ] `/notifications` — 通知列表

## 跨能力

- [ ] 业务侧栏高亮与当前 path 一致
- [ ] 顶栏通知 / AI 图标可跳转
- [ ] 右下角 Queen → AI 助手（可带 `?q=`）
- [ ] 切换语言后 `/issues` 仍可访问（`refreshRoutesForI18n`）
- [ ] 平台菜单仅见「首页」，不出现重复 `/home`

## 构建

```bash
cd web && pnpm run build
```

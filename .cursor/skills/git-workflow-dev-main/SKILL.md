---
name: git-workflow-dev-main
description: Git branch and PR workflow for this repo—feature branches, PR to dev, deploy dev for testing, merge to main for production. Use when the user asks about 提交流程, PR 流程, dev/main 分支策略, 功能分支, 合并到主分支, code review flow, or release process.
---

# Git Workflow：功能分支 → dev → main

## 目标

在本地用**独立功能分支**开发新功能；完成后向 **`dev`** 提 **PR**；**开发环境**部署 **`dev`** 上的代码并充分验证；功能稳定后再合入 **`main`** 并部署**产线**。

## 分支角色

| 分支 | 用途 |
|------|------|
| `main` | 产线发布基线；仅在经过 dev 验证的稳定变更上更新 |
| `dev` | 集成与开发环境部署；日常功能先合入此处 |
| `feature/<name>`（或 `fix/<name>`） | 本地开发中的单功能/单修复 |

## 推荐流程（顺序执行）

### 1. 本地新建功能分支

从最新 `dev` 拉取并分支（若团队约定从 `main` 开分支，则改用 `main`）：

```bash
git fetch origin
git checkout dev
git pull origin dev
git checkout -b feature/<short-description>
```

### 2. 开发与提交

小步提交、信息清晰；推送远程并设置上游：

```bash
git push -u origin feature/<short-description>
```

### 3. 向 `dev` 开 PR

在 Git 托管平台（如 GitHub/GitLab）上：

- **Base**：`dev`
- **Compare**：当前功能分支
- 填写说明、关联需求/工单、自测要点；按需请求 Review

合并策略以团队约定为准（squash merge / merge commit 等）。

### 4. 开发环境部署与测试

- 开发/测试环境应部署 **`dev`** 分支（或 CI 在 `dev` 更新后自动部署）。
- **充分测试**：功能、回归、边界情况；确认无阻塞问题后再进入下一步。

### 5. 稳定后进入产线（合入 `main`）

仅在 dev 上验证通过后：

- 通过 **`dev` → `main` 的 PR**（推荐，便于留痕与审查），或
- 由发布负责人在约定窗口将已验证的 `dev` 合入 `main`

产线部署应基于 **`main`**（或团队约定的 release tag）。

```bash
# 本地核对 main 与远程一致后再操作（示例）
git fetch origin
git checkout main
git pull origin main
# 在平台上完成 dev → main 的 PR 合并后
git pull origin main
```

## Agent 行为约定

当用户询问「怎么提代码」「什么时候合 main」时：

1. 概括：**功能分支 → PR 到 dev → dev 部署测稳 → 再进 main 上产线**。
2. 若用户要写具体命令，按上文顺序给出；**不要**假设已配置好的 CI 细节，可提示「以你们仓库的 GitHub Actions / 部署文档为准」。
3. 若仓库实际默认分支不是 `dev`，提醒用户以远程默认分支与团队规范为准。

## 与本地开发 Skill 的配合

需要起本地前后端时，使用 **`start-local-dev`** skill；本 skill 只描述 **Git/PR/环境层级** 的流程，不替代具体部署命令（各环境可能不同）。
